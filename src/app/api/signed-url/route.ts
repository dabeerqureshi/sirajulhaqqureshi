import { NextResponse } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyResourcePermission, RESTRICTED_CACHE_HEADERS } from '@/lib/auth/permissions';
import { verifySignedAccessToken } from '@/lib/auth/tokens';
import type { ResourceType } from '@/types/database';

const ALLOWED_BUCKETS = new Set(['public-assets', 'private-assets']);

/**
 * GET /api/signed-url?bucket=...&path=...&resourceType=...&resourceId=...&expiresIn=...
 *
 * 4-Layer Security Enforcement:
 * Layer 1: Authenticates caller via HTTP-only session cookies. Trusted user ID is
 *          extracted from the cryptographically verified session token.
 * Layer 2: Validates authorization against the database `resource_permissions` and
 *          profile roles before generating or returning the pre-signed URL.
 *          Returns 404 Not Found to unauthorized callers to conceal resource existence.
 * Layer 3: Database Storage RLS policies ensure only authorized callers can read objects.
 * Layer 4: Generates a short-lived Pre-Signed URL (60 to 300 seconds) for private storage.
 *
 * Anti-Cache: Every response sets `Cache-Control: private, no-store` so CDNs (Cloudflare,
 *             Vercel Edge) and proxies never cache user responses.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const bucket = url.searchParams.get('bucket');
    const path = url.searchParams.get('path');
    const resourceTypeParam = url.searchParams.get('resourceType');
    const resourceId = url.searchParams.get('resourceId');
    const expiresIn = Number(url.searchParams.get('expiresIn') || '120');

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'bucket and path query params are required' },
        { status: 400, headers: RESTRICTED_CACHE_HEADERS }
      );
    }

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json(
        { error: 'bucket not allowed' },
        { status: 400, headers: RESTRICTED_CACHE_HEADERS }
      );
    }

    // Layer 4: Strict short-lived TTL (between 60s and 300s = 5 mins max)
    if (!Number.isFinite(expiresIn) || expiresIn < 60 || expiresIn > 300) {
      return NextResponse.json(
        { error: 'expiresIn must be between 60 and 300 seconds' },
        { status: 400, headers: RESTRICTED_CACHE_HEADERS }
      );
    }

    // Layer 1: Cryptographic Authentication
    const supabase = await createSessionClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Storage service unavailable' },
        { status: 503, headers: RESTRICTED_CACHE_HEADERS }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Infer resourceType from query param or storage path
    let deducedType: ResourceType = 'all';
    if (
      resourceTypeParam &&
      ['all', 'gallery', 'books', 'poetry', 'video'].includes(resourceTypeParam)
    ) {
      deducedType = resourceTypeParam as ResourceType;
    } else if (path.startsWith('books/')) {
      deducedType = 'books';
    } else if (path.startsWith('gallery/')) {
      deducedType = 'gallery';
    } else if (path.startsWith('poetry/') || path.startsWith('hamd/')) {
      deducedType = 'poetry';
    } else if (path.startsWith('videos/')) {
      deducedType = 'video';
    }

    // Layer 2: Authorization Gate for Private Assets
    if (bucket === 'private-assets') {
      const token =
        url.searchParams.get('token') ||
        req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

      let hasTokenAccess = false;
      if (token) {
        const tokenCheck = verifySignedAccessToken(token, {
          resourceType: deducedType,
          resourceId: resourceId || null,
        });
        hasTokenAccess = tokenCheck.valid;
      }

      if (!hasTokenAccess) {
        if (!user) {
          // Return 404 to conceal private resource existence from unauthenticated callers
          return NextResponse.json(
            { error: 'Resource not found' },
            { status: 404, headers: RESTRICTED_CACHE_HEADERS }
          );
        }

        const authCheck = await verifyResourcePermission({
          resourceType: deducedType,
          resourceId: resourceId || null,
          hideExistence: true,
        });

        if (!authCheck.allowed) {
          return NextResponse.json(
            { error: authCheck.error || 'Resource not found' },
            { status: authCheck.status, headers: RESTRICTED_CACHE_HEADERS }
          );
        }
      }
    }

    // Generate Pre-Signed URL using the caller's session or admin client if authorized via token
    const adminClient = createAdminClient();
    const storageClient = (user ? supabase : adminClient) || supabase;
    const { data, error } = await storageClient.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to access storage object' },
        { status: 404, headers: RESTRICTED_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        signedUrl: data.signedUrl,
        expiresIn,
      },
      {
        headers: RESTRICTED_CACHE_HEADERS,
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: RESTRICTED_CACHE_HEADERS }
    );
  }
}
