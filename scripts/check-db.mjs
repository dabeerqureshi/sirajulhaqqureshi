import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// npm scripts do not load .env.local automatically, so read it here.
for (const file of ['.env.local', '.env']) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) continue;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const name = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[name] === undefined) process.env[name] = value;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.\n' +
      'Copy .env.example to .env.local and fill in the values.'
  );
  process.exit(1);
}

const H = { apikey: key, Authorization: `Bearer ${key}` };

const probe = async (label, path) => {
  const res = await fetch(`${url}${path}`, { headers: H });
  const body = await res.text();
  console.log(`   ${label.padEnd(34)} HTTP ${res.status}  ${body.slice(0, 150)}`);
};

console.log('--- bucket existence probes (publishable key) ---');
// NOTE: `GET /storage/v1/bucket/:id` answers "Bucket not found" for EVERY
// bucket when the caller only has the anon key, so it cannot prove absence.
// The upload probe below is the reliable one: the error shape differs between
// "bucket missing" (404 NoSuchBucket) and "bucket present, write denied"
// (403 AccessDenied / RLS violation).
await probe('GET /bucket (list all)', '/storage/v1/bucket');
await probe(
  'GET object public/public-assets',
  '/storage/v1/object/public/public-assets/__probe__.pdf'
);

const sb = createClient(url, key);

// PostgREST keeps a schema cache; "count: exact, head: true" can return a
// misleading result, so do a real select for every table.
const TABLES = [
  'content',
  'videos',
  'books',
  'gallery',
  'profiles',
  'access_requests',
];

console.log('--- Real SELECT against every table ---\n');
for (const t of TABLES) {
  const { error, data } = await sb.from(t).select('*').limit(1);
  console.log(
    (error ? 'MISSING  ' : 'EXISTS   ') +
      'public.' +
      t.padEnd(16) +
      (error ? '-> ' + error.message : `(readable, sample rows=${data.length})`)
  );
}

console.log('\n--- Does content.file_path exist? (Hamd column) ---\n');
{
  const { error, data } = await sb
    .from('content')
    .select('id,type,title_en,title_ur,file_path,visibility,published')
    .limit(5);
  if (error) {
    console.log('FAILED -> ' + error.message);
  } else {
    console.log('OK. sample rows:');
    for (const r of data) {
      console.log(
        '   type=' + r.type + ' | file_path=' + JSON.stringify(r.file_path) +
          ' | title=' + r.title_en
      );
    }
  }
}

console.log('\n--- Is the "hamd" content type allowed by the check constraint? ---');
{
  // The anon key cannot answer this: RLS rejects the INSERT before Postgres
  // evaluates the CHECK constraint (the control insert with a bogus type also
  // fails with the same RLS message). It is checked with the service-role
  // key further down, which bypasses RLS.
  const { error } = await sb
    .from('content')
    .select('id,type,title_en,file_path')
    .eq('type', 'hamd')
    .limit(1);
  console.log(
    error
      ? '   Read failed -> ' + error.message
      : '   SELECT works and the column set resolves (type + file_path exist).'
  );
  console.log('   NOTE: the constraint value itself needs the service-role key.');
}

console.log('\n--- Upload probe: missing bucket vs RLS-denied upload ---');
// Control: the error shape differs. A missing bucket -> "Bucket not found".
// An existing bucket + anon key -> the storage.objects RLS policy rejects it.
const uploadProbe = async (label, bucket) => {
  const res = await fetch(`${url}/storage/v1/object/${bucket}/__probe__.pdf`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/pdf' },
    body: '%PDF-1.4 probe',
  });
  const body = await res.text();
  console.log(`   ${label.padEnd(34)} HTTP ${res.status}  ${body.slice(0, 170)}`);
};
await uploadProbe('UPLOAD public-assets', 'public-assets');
await uploadProbe('UPLOAD private-assets', 'private-assets');
await uploadProbe('UPLOAD zz-no-such-bucket-zz', 'zz-no-such-bucket-zz');

console.log('\n--- Do the schema functions exist? (PostgREST resolves RPC names) ---');
for (const fn of ['is_admin', 'is_approved']) {
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const body = await res.text();
  const missing = /Could not find the function|PGRST202/i.test(body);
  console.log(
    `   ${fn.padEnd(16)} ` +
      (missing ? 'MISSING (not in schema cache)' : `EXISTS   ${body.slice(0, 60)}`)
  );
}

// ---------------------------------------------------------------------------
// Service-role checks (optional). The publishable/anon key cannot verify the
// CHECK constraint because RLS rejects the insert before Postgres evaluates
// the constraint, and `GET /storage/v1/bucket/:id` answers "Bucket not found"
// for every bucket when the caller lacks storage read access. Only the
// service-role key bypasses RLS and can settle both questions.
// ---------------------------------------------------------------------------
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

console.log('\n--- Service-role key available? ---\n');
if (!serviceKey) {
  console.log('   NO -> set SUPABASE_SERVICE_ROLE_KEY in .env.local to run admin checks');
  console.log('   Skipping the CHECK-constraint and bucket-metadata checks.');
} else {
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('\n--- CHECK constraint on content.type (service role) ---');
  {
    const { error } = await admin
      .from('content')
      .insert({
        type: 'hamd',
        title_en: '__schema_probe__',
        title_ur: '__schema_probe__',
        file_path: 'hamd/__schema_probe__.pdf',
        visibility: 'public',
        published: false,
      })
      .select();

    if (!error) {
      console.log('   INSERT SUCCEEDED -> "hamd" type + file_path column exist.');
      const { error: delErr } = await admin
        .from('content')
        .delete()
        .eq('title_en', '__schema_probe__')
        .eq('type', 'hamd');
      console.log(
        delErr
          ? '   WARNING: could not delete probe row -> ' + delErr.message
          : '   (probe row removed)'
      );
    } else if (/content_type_check|check constraint/i.test(error.message)) {
      console.log('   CONSTRAINT REJECTED "hamd" -> the constraint lacks the hamd value.');
      console.log('   ' + error.message);
    } else if (/column .* does not exist|schema cache/i.test(error.message)) {
      console.log('   MISSING COLUMN / STALE CACHE -> ' + error.message);
    } else {
      console.log('   OTHER ERROR -> ' + error.message);
    }
  }

  console.log('\n--- Storage buckets (service role) ---');
  for (const b of ['public-assets', 'private-assets']) {
    const { error, data } = await admin.storage.from(b).list('', { limit: 1 });
    console.log(
      `   ${b.padEnd(16)} ` +
        (error
          ? 'MISSING  -> ' + error.message
          : `EXISTS   (${data.length} object(s) at the bucket root)`)
    );
  }
}

