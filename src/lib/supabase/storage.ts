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

/**
 * Extract the relative object path inside a Supabase Storage bucket from a URL or key.
 * Returns null if the path is not a Supabase storage asset (e.g. external link or data URL).
 */
export function extractStoragePath(
  urlOrPath: string | null | undefined,
  bucket = 'public-assets'
): string | null {
  if (!urlOrPath) return null;
  if (urlOrPath.startsWith('data:') || urlOrPath.startsWith('blob:')) return null;

  const publicMarker = `/storage/v1/object/public/${bucket}/`;
  const signMarker = `/storage/v1/object/sign/${bucket}/`;

  if (urlOrPath.includes(publicMarker)) {
    return decodeURIComponent(urlOrPath.split(publicMarker)[1].split('?')[0]);
  }
  if (urlOrPath.includes(signMarker)) {
    return decodeURIComponent(urlOrPath.split(signMarker)[1].split('?')[0]);
  }

  // If it's an external URL (http) not on this Supabase project, skip
  if (/^https?:\/\//i.test(urlOrPath)) {
    const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseBase || !urlOrPath.startsWith(supabaseBase)) {
      return null;
    }
  }

  const clean = urlOrPath.replace(/^\/+/, '');
  return clean.startsWith(`${bucket}/`) ? clean.slice(bucket.length + 1) : clean;
}

