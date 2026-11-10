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

    let userId: string | null = null;

    const insertPayload: {
      user_id: string | null;
      user_name: string;
      user_email: string;
      resource_type: string;
      resource_id: string | null;
      reason: string;
      status: 'pending';
      requested_at: string;
    } = {
      user_id: null,
      user_name: cleanName,
      user_email: cleanEmail,
      resource_type: validResourceType,
      resource_id: typeof resource_id === 'string' ? resource_id : null,
      reason: reason.trim(),
      status: 'pending',
      requested_at: new Date().toISOString(),
    };

    // Attempt admin user provisioning if service role is configured
    try {
      const adminSupabase = createAdminClient();

      // 1. Check if user already exists
      const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );

      if (existing) {
        userId = existing.id;
      } else {
        // 2. Create the user profile account
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

      if (!userId) {
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (profile) userId = profile.id;
      }

      insertPayload.user_id = userId;

      // 3. Insert access request via admin client (omit .select() so PostgreSQL
      // does not evaluate SELECT RLS policies on the returned row)
      const { error } = await adminSupabase
        .from('access_requests')
        .insert([insertPayload]);

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true });
    } catch (adminErr) {
      // If service role key is not configured or failed, fall back to session client
      console.warn('Admin client unavailable for access request provisioning:', adminErr);

      const sessionClient = await createSessionClient();
      if (!sessionClient) {
        return NextResponse.json(
          { error: 'Database service is temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }

      // If user is currently signed in, link their auth user id
      if (!insertPayload.user_id) {
        try {
          const { data: { user } } = await sessionClient.auth.getUser();
          if (user) {
            insertPayload.user_id = user.id;
          }
        } catch {
          // guest user without session
        }
      }

      // Omit .select() so PostgreSQL does not trigger SELECT RLS on the returning row
      const { error } = await sessionClient
        .from('access_requests')
        .insert([insertPayload]);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error occurred' },
      { status: 500 }
    );
  }
}
