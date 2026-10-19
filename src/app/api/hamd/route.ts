import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedAdmin } from '@/lib/auth/session';
import { HAMD_BUCKET, HAMD_FOLDER } from '@/lib/data/hamd';

// Within-bucket path we accept for Hamd PDFs (only ever written by
// /api/hamd/upload-url, so it is always `hamd/<safe-file-name>`).
const HAMD_PATH_RE = /^hamd\/[A-Za-z0-9][A-Za-z0-9._-]*$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

/**
 * POST /api/hamd
 * Save the metadata row for an already-uploaded Hamd PDF (admin only).
 * Body: { path, title_en, title_ur, subtitle_en?, subtitle_ur? }
 *
 * `path` must point inside the "hamd/" folder of the public-assets bucket and
 * the object must already exist there (the browser uploads it through the
 * signed URL issued by POST /api/hamd/upload-url, which keeps large PDFs out
 * of the Vercel serverless request body).
 */
export async function POST(req: Request) {
  try {
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const path = typeof body.path === 'string' ? body.path : '';
    const titleEn = cleanText(body.title_en, 300);
    const titleUr = cleanText(body.title_ur, 300);

    if (!HAMD_PATH_RE.test(path)) {
      return NextResponse.json(
        { error: 'Invalid upload path' },
        { status: 400 }
      );
    }
    if (!titleEn || !titleUr) {
      return NextResponse.json(
        { error: 'title_en and title_ur are required (max 300 characters)' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify the PDF actually landed in storage before creating the record.
    const fileName = path.slice(`${HAMD_FOLDER}/`.length);
    const { data: objects, error: listError } = await supabase.storage
      .from(HAMD_BUCKET)
      .list(HAMD_FOLDER, { search: fileName, limit: 1 });

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    if (!objects?.some((obj) => obj.name === fileName)) {
      return NextResponse.json(
        { error: 'Upload the PDF file before saving the Hamd record' },
        { status: 400 }
      );
    }

    const { data: inserted, error } = await supabase
      .from('content')
      .insert({
        type: 'hamd',
        title_en: titleEn,
        title_ur: titleUr,
        subtitle_en: cleanText(body.subtitle_en, 300),
        subtitle_ur: cleanText(body.subtitle_ur, 300),
        verses: [],
        file_path: path,
        visibility: 'public',
        published: true,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) {
      const migrationHint = error.message.includes('content_type_check')
        ? " — run the HAMD migration block at the end of supabase/schema.sql in the Supabase SQL editor to add the 'hamd' content type."
        : '';
      return NextResponse.json(
        { error: error.message + migrationHint },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, item: inserted });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save Hamd record' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hamd
 * Body: { id } — removes a Hamd record together with its storage object
 * (admin only). Refuses to touch records that are not of type 'hamd'.
 */
export async function DELETE(req: Request) {
  try {
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 403 }
      );
    }

    const { id } = await req.json().catch(() => ({}));
    if (typeof id !== 'string' || !UUID_RE.test(id)) {
      return NextResponse.json(
        { error: 'A valid record id is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: row, error: fetchError } = await supabase
      .from('content')
      .select('id, type, file_path')
      .eq('id', id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json(
        { error: 'Hamd record not found' },
        { status: 404 }
      );
    }
    if (row.type !== 'hamd') {
      return NextResponse.json(
        { error: 'Refusing to delete a non-Hamd record' },
        { status: 400 }
      );
    }

    // Only ever remove files inside the hamd/ folder of the public bucket.
    if (row.file_path && HAMD_PATH_RE.test(row.file_path)) {
      await supabase.storage.from(HAMD_BUCKET).remove([row.file_path]);
    }

    const { error: deleteError } = await supabase
      .from('content')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete Hamd record' },
      { status: 500 }
    );
  }
}
