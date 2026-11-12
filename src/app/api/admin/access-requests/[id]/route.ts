import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // 1. SECURITY RULE: Unauthorized person approves/rejects -> Reject operation
    const session = await getAdminSession();
    if (session.status !== 'ok' || !session.client) {
      return NextResponse.json(
        { error: 'Forbidden: Administrator privileges required to review access requests.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { action, admin_notes } = body;
    if (!action || !['approve', 'reject', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action (approve, reject, revoke) is required.' },
        { status: 400 }
      );
    }

    // Use admin client if available (to bypass RLS for profile role changes) or session client
    const adminSupabase = createAdminClient();
    const db = adminSupabase || session.client;

    const { data: { user: adminUser } } = await session.client.auth.getUser();

    // 2. Fetch the access request
    const { data: request, error: fetchErr } = await db
      .from('access_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !request) {
      return NextResponse.json({ error: 'Access request not found.' }, { status: 404 });
    }

    const targetUserId = request.user_id;
    const targetEmail = request.user_email?.toLowerCase();
    const nowIso = new Date().toISOString();

    if (action === 'approve') {
      // Admin approves -> Grant permissions
      const { error: updateReqErr } = await db
        .from('access_requests')
        .update({
          status: 'approved',
          reviewed_at: nowIso,
          reviewed_by: adminUser?.id || null,
          admin_notes: admin_notes || request.admin_notes || null,
        })
        .eq('id', id);

      if (updateReqErr) throw updateReqErr;

      // Update user profile role to 'approved_user'
      if (targetUserId) {
        await db
          .from('profiles')
          .update({ role: 'approved_user', updated_at: nowIso })
          .eq('id', targetUserId);
      } else if (targetEmail) {
        await db
          .from('profiles')
          .update({ role: 'approved_user', updated_at: nowIso })
          .eq('email', targetEmail);
      }

      // Record audit log
      try {
        await db.from('audit_logs').insert([
          {
            admin_id: adminUser?.id || null,
            action: 'approve',
            entity_type: 'access_request',
            entity_id: id,
            metadata: {
              user_id: targetUserId,
              user_email: targetEmail,
              resource_type: request.resource_type,
              resource_id: request.resource_id,
              admin_notes,
            },
            created_at: nowIso,
          },
        ]);
      } catch (logErr) {
        console.warn('Failed to record approve audit log:', logErr);
      }

      return NextResponse.json({
        success: true,
        status: 'approved',
        message: 'Access request approved and user permissions granted.',
      });
    } else if (action === 'reject') {
      // Admin rejects -> Keep permissions unchanged
      const { error: updateReqErr } = await db
        .from('access_requests')
        .update({
          status: 'rejected',
          reviewed_at: nowIso,
          reviewed_by: adminUser?.id || null,
          admin_notes: admin_notes || 'Request rejected by administrator.',
        })
        .eq('id', id);

      if (updateReqErr) throw updateReqErr;

      // Record audit log
      try {
        await db.from('audit_logs').insert([
          {
            admin_id: adminUser?.id || null,
            action: 'reject',
            entity_type: 'access_request',
            entity_id: id,
            metadata: {
              user_id: targetUserId,
              user_email: targetEmail,
              resource_type: request.resource_type,
              resource_id: request.resource_id,
              admin_notes,
            },
            created_at: nowIso,
          },
        ]);
      } catch (logErr) {
        console.warn('Failed to record reject audit log:', logErr);
      }

      return NextResponse.json({
        success: true,
        status: 'rejected',
        message: 'Access request rejected. User permissions unchanged.',
      });
    } else if (action === 'revoke') {
      // Admin revokes access -> Remove permissions
      const { error: updateReqErr } = await db
        .from('access_requests')
        .update({
          status: 'rejected',
          reviewed_at: nowIso,
          reviewed_by: adminUser?.id || null,
          admin_notes: admin_notes || 'Access revoked by administrator.',
        })
        .eq('id', id);

      if (updateReqErr) throw updateReqErr;

      // Demote user profile role back to 'user'
      if (targetUserId) {
        await db
          .from('profiles')
          .update({ role: 'user', updated_at: nowIso })
          .eq('id', targetUserId);
      } else if (targetEmail) {
        await db
          .from('profiles')
          .update({ role: 'user', updated_at: nowIso })
          .eq('email', targetEmail);
      }

      // Record audit log
      try {
        await db.from('audit_logs').insert([
          {
            admin_id: adminUser?.id || null,
            action: 'update',
            entity_type: 'access_request',
            entity_id: id,
            metadata: {
              revocation: true,
              user_id: targetUserId,
              user_email: targetEmail,
              resource_type: request.resource_type,
              resource_id: request.resource_id,
              admin_notes,
            },
            created_at: nowIso,
          },
        ]);
      } catch (logErr) {
        console.warn('Failed to record revoke audit log:', logErr);
      }

      return NextResponse.json({
        success: true,
        status: 'rejected',
        revoked: true,
        message: 'Access revoked and user permissions removed.',
      });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error occurred' },
      { status: 500 }
    );
  }
}
