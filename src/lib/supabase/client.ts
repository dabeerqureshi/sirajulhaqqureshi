import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client.
 * Both NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy projects) and
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (newer projects, `sb_publishable_...`)
 * are client-safe and interchangeable here.
 * Returns null when neither is configured so callers can degrade gracefully.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
