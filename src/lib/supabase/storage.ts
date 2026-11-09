/**
 * Resolve a stored file path, data URL, or external link into a valid browser-loadable URL.
 * Handles:
 *  - Full URLs (http://, https://)
 *  - Data URLs (data:image/..., data:application/pdf...)
 *  - Blobs (blob:...)
 *  - Storage paths (books/xyz.pdf, gallery/xyz.jpg, public-assets/...)
 *  - Path segments with special characters or spaces
 *  - Paths that already contain /storage/v1/object/public/...
 */
export function getStorageUrl(
  path: string | null | undefined,
  bucket = 'public-assets'
): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;

  const rawBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawBase) return trimmed;
  const base = rawBase.replace(/\/+$/, '');

  const clean = trimmed.replace(/^\/+/, '');

  // If path is already a storage object URL path (e.g. storage/v1/object/public/...)
  const storageMarker = 'storage/v1/object/';
  if (clean.startsWith(storageMarker)) {
    return `${base}/${clean}`;
  }

  const within = clean.startsWith(`${bucket}/`)
    ? clean.slice(bucket.length + 1)
    : clean;

  const safeWithin = within
    .split('/')
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join('/');

  return `${base}/storage/v1/object/public/${bucket}/${safeWithin}`;
}

/**
 * Extract the relative object path inside a Supabase Storage bucket from a URL or key.
 * Returns null if the path is not a Supabase storage asset (e.g. external link or data URL).
 */
export function extractStoragePath(
  urlOrPath: string | null | undefined,
  bucket = 'public-assets'
): string | null {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;
  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return null;

  const publicMarker = `/storage/v1/object/public/${bucket}/`;
  const signMarker = `/storage/v1/object/sign/${bucket}/`;

  if (trimmed.includes(publicMarker)) {
    return decodeURIComponent(trimmed.split(publicMarker)[1].split('?')[0]);
  }
  if (trimmed.includes(signMarker)) {
    return decodeURIComponent(trimmed.split(signMarker)[1].split('?')[0]);
  }

  // If it's an external URL (http) not on this Supabase project, skip
  if (/^https?:\/\//i.test(trimmed)) {
    const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseBase || !trimmed.startsWith(supabaseBase)) {
      return null;
    }
  }

  const clean = trimmed.replace(/^\/+/, '');
  return clean.startsWith(`${bucket}/`) ? clean.slice(bucket.length + 1) : clean;
}
