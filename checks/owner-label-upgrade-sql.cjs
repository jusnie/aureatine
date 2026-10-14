const { PGlite } = require('/home/user/tools/sql-check/node_modules/@electric-sql/pglite')
const assert = require('node:assert/strict')
const fs = require('fs')

// Regression: a live database that already has the earlier owner_labels table (no label column)
// must upgrade cleanly instead of failing on "column o.label does not exist".
;(async () => {
  const db = new PGlite()
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz,email text);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('app.uid',true),'')::uuid$$;grant usage on schema public,auth to authenticated,anon;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;grant usage on schema storage to authenticated;grant select,insert,update,delete on storage.objects to authenticated;`)
  const sql = fs.readFileSync('supabase/aureatine-full-setup.sql', 'utf8')
  const g = '44444444-4444-4444-8444-444444444444'
  const d = '99999999-9999-4999-8999-999999999999' // draft row from the earlier owner_labels table
  await db.exec(sql)
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'gian@example.test',now()),($2,'draft@example.test',now())", [g, d])
  await db.query("update public.member_profiles set username='gianpogi',display_name='Gian Pokling' where user_id=$1", [g])

  // Recreate the earlier live shape: owner_labels without a label column, holding a draft row.
  await db.exec('drop table public.owner_labels cascade')
  await db.exec('create table public.owner_labels(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now())')
  await db.query('insert into public.owner_labels(user_id) values($1)', [d])

  // The full file must now succeed on that database.
  await db.exec(sql)

  const count = async (q, a = []) => (await db.query(q, a)).rows[0].n
  assert.equal(await count("select count(*)::int n from information_schema.columns where table_schema='public' and table_name='owner_labels' and column_name='label'"), 1)
  assert.equal(await count('select count(*)::int n from public.owner_labels where user_id=$1', [d]), 0, 'draft row without a label is cleared')
  assert.equal((await db.query('select label from public.owner_labels where user_id=$1', [g])).rows[0].label, 'APEX')
  assert.equal(await count('select count(*)::int n from public.owner_labels'), 1)

  // The label rule is enforced after the upgrade.
  let rejected = false
  try { await db.query("insert into public.owner_labels(user_id,label) values($1,'OWNER')", [d]) } catch { rejected = true }
  assert.ok(rejected, 'only APEX or AUREATINE may be stored')

  // The upgrade is repeatable.
  await db.exec(sql)
  assert.equal(await count('select count(*)::int n from public.owner_labels'), 1)
  await db.close()
  console.log('PASS upgrade from the earlier owner_labels table (no label column) succeeds; draft rows cleared; APEX label kept; label values enforced; rerun idempotent. Local SQL only.')
})().catch(e => { console.error('FAIL', e.message); process.exit(1) })
