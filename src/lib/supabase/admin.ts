import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase admin client using the service role key.
 * NEVER expose this file to the browser. Only import it in server components
 * or API routes (Next.js route handlers / server actions).
 *
 * The service role key bypasses Row Level Security (RLS). It must be kept secret
 * and used only by trusted admin operations (upload, delete, approve/reject).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_SERVICE_ROLE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. '
      + 'Set them in .env.local (server-side only).'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}