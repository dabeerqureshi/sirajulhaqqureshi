import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, resource_type, reason, resource_id } = body;

    if (!email || !reason) {
      return NextResponse.json(
        { error: 'Email and reason are required' },
        { status: 400 }
      );
    }

    const cleanName = (name || email.split('@')[0]).trim();
    const cleanEmail = email.trim().toLowerCase();
    const validResourceType = ['all', 'gallery', 'books', 'poetry', 'video'].includes(
      resource_type?.toLowerCase()
    )
      ? resource_type.toLowerCase()
      : 'all';

    const supabase = createAdminClient();

    // 1. Check if user already exists in auth.users
    let userId: string | null = null;
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (existing) {
      userId = existing.id;
    } else {
      // 2. Create the user profile account
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          user_metadata: { full_name: cleanName },
        });

      if (!createError && newUser?.user) {
        userId = newUser.user.id;
      }
    }

    if (!userId) {
      // Fallback: check public.profiles directly
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (profile) userId = profile.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Could not register user record for this request' },
        { status: 500 }
      );
    }

    // 3. Insert access request
    const { data, error } = await supabase
      .from('access_requests')
      .insert([
        {
          user_id: userId,
          user_name: cleanName,
          user_email: cleanEmail,
          resource_type: validResourceType,
          resource_id: resource_id || null,
          reason: reason.trim(),
          status: 'pending',
          requested_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}

