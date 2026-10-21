import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';

/**
 * POST /api/upload
 * Server-side file upload to Supabase Storage using the caller's admin session.
 * Requires an authenticated admin session (verified via session cookies).
 * Expects multipart/form-data with fields:
 *   - file: the file to upload
 *   - bucket: target bucket ("public-assets" or "private-assets")
 *   - path: destination path within the bucket
 *
 * Only authenticated admins should call this. The upload runs with the admin's
 * own JWT, so the storage RLS policies decide whether the write is allowed.
 */
export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (session.status !== 'ok') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 403 }
      );
    }
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'public-assets';
    const path = (formData.get('path') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'bucket and path are required' },
        { status: 400 }
      );
    }

    const supabase = session.client;
    const arrayBuffer = await file.arrayBuffer();
    const contentType = file.type || 'application/octet-stream';

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      path: data.path,
      fullPath: data.fullPath,
      bucket,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload
 * Delete a file from Supabase Storage.
 * Expects JSON body: { bucket, path }
 */
export async function DELETE(req: Request) {
  try {
    const session = await getAdminSession();
    if (session.status !== 'ok') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 403 }
      );
    }
    const { bucket, path } = await req.json();

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'bucket and path are required' },
        { status: 400 }
      );
    }

    const supabase = session.client;
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    );
  }
}