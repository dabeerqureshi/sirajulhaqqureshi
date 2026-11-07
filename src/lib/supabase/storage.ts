/**
 * Resolve a stored file path, data URL, or external link into a valid browser-loadable URL.
 * Handles:
 *  - Full URLs (http://, https://)
 *  - Data URLs (data:image/..., data:application/pdf...)
 *  - Blobs (blob:...)
 *  - Storage paths (books/xyz.pdf, gallery/xyz.jpg, public-assets/...)
 */
export function getStorageUrl(
  path: string | null | undefined,
  bucket = 'public-assets'
): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;

  const clean = path.replace(/^\/+/, '');
  const within = clean.startsWith(`${bucket}/`)
    ? clean.slice(bucket.length + 1)
    : clean;

  return `${base.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${within}`;
}
