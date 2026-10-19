import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSessionClient } from '@/lib/supabase/server';

const ALLOWED_BUCKETS = new Set(['public-assets', 'private-assets']);

/**
 * Returns true when the caller has an authenticated Supabase session and their
 * profile role is 'admin' or 'approved_user' — i.e. the same visibility rules
 * the RLS policies enforce on the content tables.
 */
async function isAuthorizedViewer(): Promise<boolean> {
  const supabase = await createSessionClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' || profile?.role === 'approved_user';
}

/**
 * GET /api/signed-url?bucket=...&path=...
 * Generate a short-lived signed URL for a storage file.
 *   - "public-assets" is publicly readable, so no session is required.
 *   - "private-assets" requires an authenticated, approved (or admin) user;
 *     the profile role check mirrors the RLS policies on the content tables.
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

    if (bucket === 'private-assets' && !(await isAuthorizedViewer())) {
      return NextResponse.json(
        { error: 'Authentication required for private assets' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
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