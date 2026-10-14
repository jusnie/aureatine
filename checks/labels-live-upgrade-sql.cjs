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
  const m = '66666666-6666-4666-8666-666666666666'
  await db.exec(sql)
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'gian@example.test',now()),($2,'member@example.test',now())", [g, m])
  // The live shape before this change: one label per user (PK on user_id) and the two-value check.
  await db.exec('drop table public.owner_labels cascade')
  await db.exec("create table public.owner_labels(user_id uuid primary key references auth.users(id) on delete cascade,label text not null check(label in ('APEX','AUREATINE')),created_at timestamptz not null default now())")
  await db.query("insert into public.owner_labels(user_id,label) values($1,'APEX')", [g])
  await db.exec(sql)
  await db.exec(sql) // rerun is idempotent
  const count = async (q, a = []) => (await db.query(q, a)).rows[0].n
  // Upgraded: composite key and five labels; a member can hold several labels.
  assert.equal(await count("select count(*)::int n from pg_constraint c where c.conrelid='public.owner_labels'::regclass and c.contype='p' and array_length(c.conkey,1)=2"), 1)
  await db.query("insert into public.owner_labels(user_id,label) values($1,'MEMBER'),($1,'STUDENT')", [m])
  await db.query("insert into public.owner_labels(user_id,label) values($1,'MEMBER')", [g]).catch(() => {})
  assert.equal(await count('select count(*)::int n from public.owner_labels where user_id=$1', [m]), 2)
  assert.equal(await count('select count(*)::int n from public.owner_labels where user_id=$1 and label=$2', [g, 'APEX']), 1, 'APEX kept')
  let rejected = false
  try { await db.query("insert into public.owner_labels(user_id,label) values($1,'OWNER')", [m]) } catch { rejected = true }
  assert.ok(rejected, 'unknown labels still rejected')
  await db.close()
  console.log('PASS live-shape upgrade (PK on user_id, two-value check) to composite key and five labels; APEX kept; multiple labels per member; unknown labels rejected; rerun idempotent. Local SQL only.')
})().catch(e => { console.error('FAIL', e.message); process.exit(1) })
