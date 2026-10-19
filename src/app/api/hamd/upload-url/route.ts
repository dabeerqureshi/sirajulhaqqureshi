import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedAdmin } from '@/lib/auth/session';
import { HAMD_BUCKET, HAMD_FOLDER } from '@/lib/data/hamd';

/**
 * Reduce an arbitrary uploaded file name to a safe, URL-friendly name.
 * Returns null when nothing usable (and PDF-shaped) remains.
 */
function sanitizeFileName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const base = raw.split(/[\\/]/).pop() || '';
  const safe = base
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[.-]+/, '')
    .replace(/-+/g, '-')
    .slice(0, 80);
  if (!safe || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(safe)) return null;
  if (!safe.toLowerCase().endsWith('.pdf')) return null;
  return safe;
}

/**
 * POST /api/hamd/upload-url
 * Body: { fileName }
 * Returns a one-time signed upload URL so the admin browser can send the PDF
 * *directly* to Supabase Storage. This bypasses the Vercel serverless request
 * body limit (4.5MB on the Hobby plan), allowing large poetry/Hamd PDF scans
 * while still requiring an authenticated admin session.
 */
export async function POST(req: Request) {
  try {
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 403 }
      );
    }

    const { fileName } = await req.json().catch(() => ({ fileName: '' }));
    const safe = sanitizeFileName(fileName);
    if (!safe) {
      return NextResponse.json(
        { error: 'A valid PDF file name is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const path = `${HAMD_FOLDER}/${Date.now()}-${safe}`;

    const { data, error } = await supabase.storage
      .from(HAMD_BUCKET)
      .createSignedUploadUrl(path);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      path,
      token: data.token,
      signedUrl: data.signedUrl,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to create upload URL',
      },
      { status: 500 }
    );
  }
}
