import { createSessionClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminSession =
  | { status: 'ok'; client: SupabaseClient }
  | { status: 'unauthenticated' }
  | { status: 'not_admin' }
  | { status: 'not_configured' };

export type Role = 'admin' | 'approved_user' | 'user' | null;

export type ViewerSession =
  | { status: 'ok'; client: SupabaseClient; role: Role }
  | { status: 'unauthenticated'; client: SupabaseClient | null }
  | { status: 'not_configured'; client: null };

/**
 * Resolve the caller's session and their profile role.
 *
 * The returned client carries the *user's own* JWT, so every request it makes
 * is evaluated by Row Level Security exactly as the policies in
 * supabase/schema.sql describe. The admin policies ("Admins can ...", "Admins
 * write ...") are what grant access, so a verified admin session is enough —
 * no service-role key required.
 *
 * When the caller is not signed in the client is still returned (role null) so
 * that routes which serve public content can rely on the anonymous role.
 */
export async function getViewerSession(): Promise<ViewerSession> {
  const supabase = await createSessionClient();
  if (!supabase) return { status: 'not_configured', client: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'unauthenticated', client: supabase };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (profile?.role ?? null) as Role;
  return { status: 'ok', client: supabase, role };
}

/**
 * Resolve the caller's session and verify that the profile role is 'admin'.
 */
export async function getAdminSession(): Promise<AdminSession> {
  const session = await getViewerSession();
  if (session.status === 'not_configured') return { status: 'not_configured' };
  if (session.status === 'unauthenticated') return { status: 'unauthenticated' };
  if (session.role !== 'admin') return { status: 'not_admin' };
  return { status: 'ok', client: session.client };
}

/**
 * Returns true only for an authenticated session whose profile role is 'admin'.
 * Privileged API routes use the caller's own session (RLS applies), so this
 * check is the gate that keeps those operations admin-only.
 */
export async function isAuthorizedAdmin(): Promise<boolean> {
  return (await getAdminSession()).status === 'ok';
}

/**
 * Returns true when the caller has an authenticated Supabase session and their
 * profile role is 'admin' or 'approved_user' — i.e. the same visibility rules
 * the RLS policies enforce on the content tables.
 */
export async function isAuthorizedViewer(): Promise<boolean> {
  const session = await getViewerSession();
  if (session.status !== 'ok') return false;
  return session.role === 'admin' || session.role === 'approved_user';
}
