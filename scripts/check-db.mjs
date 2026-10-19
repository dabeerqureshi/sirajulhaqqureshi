import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

console.log('\n--- Is the "hamd" content type allowed by the check constraint? ---\n');
{
  // An invalid enum value is rejected by the CHECK constraint, so a successful
  // insert (or a constraint error mentioning content_type_check) tells us
  // whether the constraint knows about 'hamd'.
  const { error } = await sb
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
    console.log('INSERT SUCCEEDED -> the "hamd" type + file_path column exist.');
    console.log('(probe row created; delete it manually if it is visible)');
  } else if (/content_type_check|check constraint/i.test(error.message)) {
    console.log(
      'CONSTRAINT REJECTED "hamd" -> the content_type_check still lacks the ' +
        'hamd value. Run the schema.'
    );
    console.log('   ' + error.message);
  } else if (/column .* does not exist|schema cache/i.test(error.message)) {
    console.log('MISSING COLUMN / STALE CACHE -> ' + error.message);
  } else {
    console.log('OTHER ERROR -> ' + error.message);
  }
}

console.log('\n--- Storage buckets (raw storage API) ---\n');
for (const b of ['public-assets', 'private-assets']) {
  const res = await fetch(
    `${url}/storage/v1/bucket/${b}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  );
  const body = await res.text();
  console.log(
    `   ${b.padEnd(16)} HTTP ${res.status}  ${body.slice(0, 120)}`
  );
}
