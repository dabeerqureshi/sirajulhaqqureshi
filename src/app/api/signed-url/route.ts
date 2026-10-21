import { NextResponse } from 'next/server';
import { getViewerSession } from '@/lib/auth/session';

const ALLOWED_BUCKETS = new Set(['public-assets', 'private-assets']);

/**
 * GET /api/signed-url?bucket=...&path=...
 * Generate a short-lived signed URL for a storage file.
 *   - "public-assets" is publicly readable, so no session is required.
 *   - "private-assets" requires an authenticated, approved (or admin) user;
 *     the profile role check mirrors the RLS policies on the content tables.
 *
 * The signed URL is created with the caller's own session so that the storage
 * RLS policies decide whether the object may be read — no service-role key is
 * used. For anonymous callers the session client simply carries the anon role.
 *
 * Query params:
 *   bucket - storage bucket name (public-assets | private-assets)
 *   path   - file path within the bucket
 *   expiresIn - seconds until expiry (default 300 = 5 min, max 3600)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const bucket = url.searchParams.get('bucket');
    const path = url.searchParams.get('path');
    const expiresIn = Number(url.searchParams.get('expiresIn') || '300');

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'bucket and path query params are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'bucket not allowed' }, { status: 400 });
    }

    if (!Number.isFinite(expiresIn) || expiresIn < 60 || expiresIn > 3600) {
      return NextResponse.json(
        { error: 'expiresIn must be between 60 and 3600 seconds' },
        { status: 400 }
      );
    }

    const session = await getViewerSession();
    if (session.status === 'not_configured' || !session.client) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      );
    }

    if (bucket === 'private-assets') {
      const authorized =
        session.status === 'ok' &&
        (session.role === 'admin' || session.role === 'approved_user');
      if (!authorized) {
        return NextResponse.json(
          { error: 'Authentication required for private assets' },
          { status: 401 }
        );
      }
    }

    const supabase = session.client;
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      expiresIn,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create signed URL' },
      { status: 500 }
    );
  }
}