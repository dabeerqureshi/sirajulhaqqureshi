import { createSessionClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedAdminUser } from '@/lib/auth/admin-check';
import type { ResourceType } from '@/types/database';
import type { User, SupabaseClient } from '@supabase/supabase-js';

export interface AuthorizationResult {
  allowed: boolean;
  user: User | null;
  client: SupabaseClient | null;
  status: 200 | 401 | 403 | 404;
  error?: string;
  expiresAt?: string | null;
}

/**
 * Standard anti-leak cache headers for private, restricted API responses
 * to prevent CDNs (Cloudflare, Vercel Edge) and shared proxies from caching
 * user data.
 */
export const RESTRICTED_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  'Surrogate-Control': 'no-store',
} as const;

export interface CheckPermissionParams {
  resourceType: ResourceType;
  resourceId?: string | null;
  hideExistence?: boolean; // When true (default), returns 404 instead of 403 for unauthorized users
}

/**
 * Layer 1 (Authentication) & Layer 2 (Authorization Guard):
 *
 * 1. Cryptographically validates the caller's session via HTTP-only cookies.
 *    Extracts the trusted `user.id` from the verified session token — NEVER
 *    trusting any caller-supplied `user_id` in request body or query string.
 *
 * 2. Checks `resource_permissions` and profiles table:
 *    - Admins have full access to everything.
 *    - Approved global users (`approved_user`) have access.
 *    - Active, unexpired granular permission records matching `resource_type`
 *      and `resource_id` (or wildcard permissions) grant access.
 *
 * 3. Returns 404 Not Found by default when unauthorized, concealing whether
 *    the restricted resource actually exists on the server.
 */
export async function verifyResourcePermission({
  resourceType,
  resourceId,
  hideExistence = true,
}: CheckPermissionParams): Promise<AuthorizationResult> {
  const sessionClient = await createSessionClient();
  if (!sessionClient) {
    return {
      allowed: false,
      user: null,
      client: null,
      status: 401,
      error: 'Authentication required',
    };
  }

  // Layer 1: Extract trusted identity from verified session token
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      user: null,
      client: sessionClient,
      status: 401,
      error: 'Authentication required',
    };
  }

  // Layer 2: Check profile role
  const { data: profile } = await sessionClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  // Admin bypass
  if (isAuthorizedAdminUser(user, profile)) {
    return {
      allowed: true,
      user,
      client: sessionClient,
      status: 200,
    };
  }

  // Legacy global approved_user
  if (profile?.role === 'approved_user') {
    return {
      allowed: true,
      user,
      client: sessionClient,
      status: 200,
    };
  }

  // Layer 2: Query resource_permissions table
  // Use admin client if available to ensure permission lookup is not blocked by RLS
  const adminDb = createAdminClient();
  const db = adminDb || sessionClient;

  const nowIso = new Date().toISOString();

  // Query matching permissions
  const { data: perms, error: permError } = await db
    .from('resource_permissions')
    .select('id, resource_type, resource_id, expires_at')
    .eq('user_id', user.id);

  if (permError || !perms || perms.length === 0) {
    return {
      allowed: false,
      user,
      client: sessionClient,
      status: hideExistence ? 404 : 403,
      error: hideExistence ? 'Resource not found' : 'Forbidden',
    };
  }

  const validPerm = perms.find((p) => {
    // Check expiry if set
    if (p.expires_at && new Date(p.expires_at) <= new Date(nowIso)) {
      return false;
    }
    // Wildcard archive access
    if (p.resource_type === 'all') return true;
    // Resource type match
    if (p.resource_type === resourceType) {
      // Permission for all resources of this type, or specific resource ID match
      if (!p.resource_id || !resourceId || p.resource_id === resourceId) {
        return true;
      }
    }
    return false;
  });

  if (!validPerm) {
    return {
      allowed: false,
      user,
      client: sessionClient,
      status: hideExistence ? 404 : 403,
      error: hideExistence ? 'Resource not found' : 'Forbidden',
    };
  }

  return {
    allowed: true,
    user,
    client: sessionClient,
    status: 200,
    expiresAt: validPerm.expires_at,
  };
}
