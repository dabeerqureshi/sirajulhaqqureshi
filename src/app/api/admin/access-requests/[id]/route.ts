import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { RESTRICTED_CACHE_HEADERS } from '@/lib/auth/permissions';
import { generateSignedAccessToken } from '@/lib/auth/tokens';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400, headers: RESTRICTED_CACHE_HEADERS }
      );
    }

    // 1. SECURITY RULE: Unauthorized person approves/rejects -> Reject operation
    const session = await getAdminSession();
    if (session.status !== 'ok' || !session.client) {
      return NextResponse.json(
        { error: 'Forbidden: Administrator privileges required to review access requests.' },
        { status: 403, headers: RESTRICTED_CACHE_HEADERS }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400, headers: RESTRICTED_CACHE_HEADERS }
      );
    }

    const { action, admin_notes, expires_at } = body;
    if (!action || !['approve', 'reject', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action (approve, reject, revoke) is required.' },
        { status: 400, headers: RESTRICTED_CACHE_HEADERS }
      );
    }

    // Use admin client if available (to bypass RLS for profile/permission changes) or session client
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
      return NextResponse.json(
        { error: 'Access request not found.' },
        { status: 404, headers: RESTRICTED_CACHE_HEADERS }
      );
    }

    const targetEmail = request.user_email?.toLowerCase();
    const nowIso = new Date().toISOString();

    // Resolve target user_id (from request or profile)
    let resolvedUserId: string | null = request.user_id || null;
    if (!resolvedUserId && targetEmail) {
      const { data: targetProfile } = await db
        .from('profiles')
        .select('id')
        .eq('email', targetEmail)
        .maybeSingle();
      if (targetProfile) {
        resolvedUserId = targetProfile.id;
      }
    }

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

      // Populate resource_permissions table
      if (resolvedUserId) {
        await db.from('resource_permissions').insert([
          {
            user_id: resolvedUserId,
            resource_type: request.resource_type,
            resource_id: request.resource_id || null,
            granted_by: adminUser?.id || null,
            access_request_id: id,
            expires_at: expires_at || null,
            created_at: nowIso,
          },
        ]);

        // Update user profile role to 'approved_user'
        await db
          .from('profiles')
          .update({ role: 'approved_user', updated_at: nowIso })
          .eq('id', resolvedUserId);
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
              user_id: resolvedUserId,
              user_email: targetEmail,
              resource_type: request.resource_type,
              resource_id: request.resource_id,
              expires_at: expires_at || null,
              admin_notes,
            },
            created_at: nowIso,
          },
        ]);
      } catch (logErr) {
        console.warn('Failed to record approve audit log:', logErr);
      }

      // Issue a cryptographically signed, expiring access token (valid for 7 days)
      const accessToken = targetEmail
        ? generateSignedAccessToken({
            email: targetEmail,
            resourceType: request.resource_type,
            resourceId: request.resource_id,
            expiresInDays: 7,
          })
        : null;

      return NextResponse.json(
        {
          success: true,
          status: 'approved',
          accessToken,
          expiresInDays: 7,
          message: 'Access request approved and user permissions granted.',
        },
        { headers: RESTRICTED_CACHE_HEADERS }
      );
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
              user_id: resolvedUserId,
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

      return NextResponse.json(
        {
          success: true,
          status: 'rejected',
          message: 'Access request rejected. User permissions unchanged.',
        },
        { headers: RESTRICTED_CACHE_HEADERS }
      );
    } else if (action === 'revoke') {
      // Admin revokes access -> Immediately delete permission rows
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

      // Immediate Revocation: Delete corresponding rows from resource_permissions
      if (resolvedUserId) {
        await db
          .from('resource_permissions')
          .delete()
          .eq('access_request_id', id);

        if (request.resource_id) {
          await db
            .from('resource_permissions')
            .delete()
            .eq('user_id', resolvedUserId)
            .eq('resource_id', request.resource_id);
        } else if (request.resource_type === 'all') {
          await db
            .from('resource_permissions')
            .delete()
            .eq('user_id', resolvedUserId);
        }

        // Check if user has any active permissions remaining
        const { data: remaining } = await db
          .from('resource_permissions')
          .select('id')
          .eq('user_id', resolvedUserId)
          .limit(1);

        if (!remaining || remaining.length === 0) {
          await db
            .from('profiles')
            .update({ role: 'user', updated_at: nowIso })
            .eq('id', resolvedUserId);
        }
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
              user_id: resolvedUserId,
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

      return NextResponse.json(
        {
          success: true,
          status: 'rejected',
          revoked: true,
          message: 'Access revoked and user permissions removed.',
        },
        { headers: RESTRICTED_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { error: 'Unsupported action.' },
      { status: 400, headers: RESTRICTED_CACHE_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error occurred' },
      { status: 500, headers: RESTRICTED_CACHE_HEADERS }
    );
  }
}
