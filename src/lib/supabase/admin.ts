import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Checks whether the server environment contains a genuine service-role key
 * rather than an unconfigured placeholder.
 */
export function isServiceRoleConfigured(): boolean {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!serviceRoleKey) return false;
  const k = serviceRoleKey.trim().toLowerCase();
  if (k.startsWith('placeholder') || k.startsWith('your-') || k.length < 20) {
    return false;
  }
  return true;
}

/**
 * Server-side Supabase admin client using the service role key.
 * Returns null if the service role key is not configured or is a placeholder.
 * NEVER expose this file to the browser.
 */
export function createAdminClient(): SupabaseClient | null {
  const supabaseUrl =
    process.env.SUPABASE_SERVICE_ROLE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey || !isServiceRoleConfigured()) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
