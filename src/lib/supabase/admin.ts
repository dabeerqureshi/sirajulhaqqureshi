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
  // Newer Supabase projects issue SUPABASE_SECRET_KEY (sb_secret_...);
  // older ones issue SUPABASE_SERVICE_ROLE_KEY. Both are server-only secrets.
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) or NEXT_PUBLIC_SUPABASE_URL. '
      + 'Set them in .env.local / Vercel environment variables (server-side only).'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}