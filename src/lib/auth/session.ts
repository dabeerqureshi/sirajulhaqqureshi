import { createSessionClient } from '@/lib/supabase/server';

/**
 * Returns true only for an authenticated session whose profile role is 'admin'.
 * Privileged API routes use the service-role key (which bypasses RLS), so this
 * check is the gate that keeps those operations admin-only.
 */
export async function isAuthorizedAdmin(): Promise<boolean> {
  const supabase = await createSessionClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

/**
 * Returns true when the caller has an authenticated Supabase session and their
 * profile role is 'admin' or 'approved_user' — i.e. the same visibility rules
 * the RLS policies enforce on the content tables.
 */
export async function isAuthorizedViewer(): Promise<boolean> {
  const supabase = await createSessionClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' || profile?.role === 'approved_user';
}
