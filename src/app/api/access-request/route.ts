import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSessionClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`access_req_${ip}`, {
      maxRequests: 5,
      windowMs: 60_000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before submitting again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.reset),
          },
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, email, resource_type, reason, resource_id } = body;

    if (!email || typeof email !== 'string' || !reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Valid email and research purpose/reason are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    const cleanName = (typeof name === 'string' && name.trim()) || cleanEmail.split('@')[0];
    const validResourceType = ['all', 'gallery', 'books', 'poetry', 'video'].includes(
      String(resource_type).toLowerCase()
    )
      ? String(resource_type).toLowerCase()
      : 'all';

    const cleanResourceId =
      typeof resource_id === 'string' && resource_id.trim() ? resource_id.trim() : null;

    // UUID regex check if resource_id provided
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (cleanResourceId && !uuidRegex.test(cleanResourceId)) {
      return NextResponse.json(
        { error: 'Invalid resource ID format.' },
        { status: 400 }
      );
    }

    let userId: string | null = null;

    // Use admin client if available, else fallback to session client
    const adminSupabase = createAdminClient();
    const sessionClient = await createSessionClient();
    const client = adminSupabase || sessionClient;

    if (!client) {
      return NextResponse.json(
        { error: 'Database service is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // 1. BUSINESS RULE: Check if user already has access
    // Look up profile by email to verify if already approved or admin
    const { data: existingProfile } = await client
      .from('profiles')
      .select('id, role')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      if (existingProfile.role === 'admin' || existingProfile.role === 'approved_user') {
        return NextResponse.json(
          { error: 'You already have approved access to restricted resources.' },
          { status: 400 }
        );
      }
    }

    // 2. BUSINESS RULE: Check for duplicate pending requests
    // Prevent duplicate submission if a request is already PENDING for this user & resource
    const pendingQuery = client
      .from('access_requests')
      .select('id, resource_type, resource_id')
      .eq('user_email', cleanEmail)
      .eq('status', 'pending');

    const { data: existingPendingRequests } = await pendingQuery;

    if (existingPendingRequests && existingPendingRequests.length > 0) {
      const isDuplicate = existingPendingRequests.some((p) => {
        // If they already requested 'all', everything is covered
        if (p.resource_type === 'all') return true;
        // If this request is for 'all' and they have a pending request
        if (validResourceType === 'all') return true;
        // Same resource type match
        if (p.resource_type === validResourceType) {
          // If specific resource_id matches or either request covers the entire category
          if (!cleanResourceId || !p.resource_id) return true;
          return p.resource_id === cleanResourceId;
        }
        return false;
      });

      if (isDuplicate) {
        return NextResponse.json(
          { error: 'A request for this resource is already pending review by an administrator.' },
          { status: 409 }
        );
      }
    }

    // 3. BUSINESS RULE: Validate requested resource existence if resource_id provided
    if (cleanResourceId) {
      let resourceFound = false;
      if (validResourceType === 'video') {
        const { data } = await client.from('videos').select('id').eq('id', cleanResourceId).maybeSingle();
        resourceFound = Boolean(data);
      } else if (validResourceType === 'books') {
        const { data } = await client.from('books').select('id').eq('id', cleanResourceId).maybeSingle();
        resourceFound = Boolean(data);
      } else if (validResourceType === 'gallery') {
        const { data } = await client.from('gallery').select('id').eq('id', cleanResourceId).maybeSingle();
        resourceFound = Boolean(data);
      } else if (validResourceType === 'poetry') {
        const { data } = await client.from('content').select('id').eq('id', cleanResourceId).eq('type', 'poetry').maybeSingle();
        resourceFound = Boolean(data);
      }

      if (!resourceFound) {
        return NextResponse.json(
          { error: 'The requested resource could not be found.' },
          { status: 404 }
        );
      }
    }

    // 4. Provision user account if admin client is available and user doesn't exist
    if (!userId && adminSupabase) {
      try {
        const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );

        if (existing) {
          userId = existing.id;
        } else {
          const { data: newUser, error: createError } =
            await adminSupabase.auth.admin.createUser({
              email: cleanEmail,
              email_confirm: true,
              user_metadata: { full_name: cleanName },
            });

          if (!createError && newUser?.user) {
            userId = newUser.user.id;
          }
        }
      } catch (provisionErr) {
        console.warn('Could not provision auth user during request:', provisionErr);
      }
    }

    // If still no userId, check if current session matches
    if (!userId && sessionClient) {
      try {
        const { data: { user } } = await sessionClient.auth.getUser();
        if (user && user.email?.toLowerCase() === cleanEmail) {
          userId = user.id;
        }
      } catch {
        // guest
      }
    }

    const insertPayload = {
      user_id: userId,
      user_name: cleanName,
      user_email: cleanEmail,
      resource_type: validResourceType,
      resource_id: cleanResourceId,
      reason: reason.trim(),
      status: 'pending' as const,
      requested_at: new Date().toISOString(),
    };

    // 5. Insert access request
    const { data: inserted, error: insertError } = await client
      .from('access_requests')
      .insert([insertPayload])
      .select('id')
      .single();

    if (insertError) {
      // If select failed due to RLS, try plain insert
      const { error: plainInsertError } = await client
        .from('access_requests')
        .insert([insertPayload]);

      if (plainInsertError) {
        throw plainInsertError;
      }
    }

    // Record audit log entry for the new access request
    try {
      await client.from('audit_logs').insert([
        {
          action: 'create',
          entity_type: 'access_request',
          entity_id: inserted?.id || null,
          metadata: {
            user_email: cleanEmail,
            resource_type: validResourceType,
            resource_id: cleanResourceId,
          },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (auditErr) {
      console.warn('Could not record access request audit log:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Access request submitted successfully.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error occurred' },
      { status: 500 }
    );
  }
}
