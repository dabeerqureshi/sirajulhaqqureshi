import { createClient } from '@/lib/supabase/client';
import type { ContentItem } from '@/types/database';

/** Bucket that holds publicly readable Hamd PDFs. */
export const HAMD_BUCKET = 'public-assets';

/** Folder inside the bucket where Hamd PDFs are stored. */
export const HAMD_FOLDER = 'hamd';

/**
 * Resolve a stored Hamd file path to a browser-usable URL.
 * - Absolute URLs / data: blobs pass through untouched.
 * - Bucket-prefixed and bare storage paths are converted to the public
 *   object URL of the `public-assets` bucket.
 * Returns null when the path is empty or Supabase env vars are not configured.
 */
export function hamdFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.replace(/^\/+/, '');
  const within = clean.startsWith(`${HAMD_BUCKET}/`)
    ? clean.slice(HAMD_BUCKET.length + 1)
    : clean;

  return `${base.replace(/\/+$/, '')}/storage/v1/object/public/${HAMD_BUCKET}/${within}`;
}

/**
 * Public URL that forces the browser to download the file instead of previewing
 * it (Supabase Storage honours the `download` query flag on public objects).
 */
export function hamdDownloadUrl(path: string | null | undefined): string | null {
  const url = hamdFileUrl(path);
  if (!url) return null;
  return `${url}${url.includes('?') ? '&' : '?'}download`;
}

/**
 * Fetch every published Hamd PDF from the `content` table.
 * Uses the anon (RLS-constrained) client, so it is safe to call from any page.
 * Never throws — failures are surfaced through the `error` field.
 */
export async function getHamdItems(): Promise<{
  items: ContentItem[];
  error: string | null;
}> {
  const supabase = createClient();
  if (!supabase) return { items: [], error: null };

  const { data, error } = await supabase
    .from('content')
    .select(
      'id, type, title_en, title_ur, subtitle_en, subtitle_ur, file_path, visibility, published, sort_order, created_at, updated_at'
    )
    .eq('type', 'hamd')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) return { items: [], error: error.message };
  return { items: (data ?? []) as ContentItem[], error: null };
}
