const { PGlite } = require('/home/user/tools/sql-check/node_modules/@electric-sql/pglite')
const assert = require('node:assert/strict')
const fs = require('fs')

;(async () => {
  const db = new PGlite()
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz,email text);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('app.uid',true),'')::uuid$$;grant usage on schema public,auth to authenticated,anon;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;grant usage on schema storage to authenticated;grant select,insert,update,delete on storage.objects to authenticated;`)
  const sql = fs.readFileSync('supabase/aureatine-full-setup.sql', 'utf8')
  const g = '44444444-4444-4444-8444-444444444444' // @gianpogi: ADMIN + APEX label
  const y = '88888888-8888-4888-8888-888888888888' // @yasuda.dnz: ADMIN + AUREATINE label
  const m = '66666666-6666-4666-8666-666666666666' // ordinary member
  await db.exec(sql)
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'gian@example.test',now()),($2,'yasuda@example.test',now()),($3,'member@example.test',now())", [g, y, m])
  await db.query("update public.member_profiles set username='gianpogi',display_name='Gian Pokling' where user_id=$1", [g])
  await db.query("update public.member_profiles set username='yasuda.dnz',display_name='HALIMAW MAG YEARN' where user_id=$1", [y])
  await db.query("update public.member_profiles set username='member.one',display_name='Member One' where user_id=$1", [m])
  await db.exec(sql)

  const count = async (q, a = []) => (await db.query(q, a)).rows[0].n
  async function as(id) { await db.exec('reset role'); await db.query("select set_config('app.uid',$1,false)", [id]); await db.exec('set role authenticated') }
  async function denied(q, args = []) { let nope = false; try { await db.query(q, args) } catch { nope = true } assert.ok(nope, q) }

  // Admin + staff: Gian and yasuda only.
  assert.equal(await count('select count(*)::int n from public.app_admins where user_id in ($1,$2)', [g, y]), 2)
  assert.equal(await count('select count(*)::int n from public.staff_members where user_id=$1', [g]), 2)
  assert.equal(await count('select count(*)::int n from public.staff_members where user_id=$1', [y]), 2)
  assert.equal(await count('select count(*)::int n from public.app_admins where user_id=$1', [m]), 0)

  // Labels: Gian = APEX, yasuda = AUREATINE, nothing else accepted.
  assert.equal((await db.query('select label from public.owner_labels where user_id=$1', [g])).rows[0].label, 'APEX')
  assert.equal((await db.query('select label from public.owner_labels where user_id=$1', [y])).rows[0].label, 'AUREATINE')
  assert.equal(await count('select count(*)::int n from public.owner_labels'), 2)
  await db.exec('reset role')
  await denied("insert into public.owner_labels(user_id,label) values($1,'OWNER')", [m])

  // Members cannot read or write labels.
  await as(m)
  await denied('select * from public.owner_labels')
  await denied("insert into public.owner_labels(user_id,label) values($1,'APEX')", [m])
  assert.equal((await db.query('select public.get_my_owner_label() a')).rows[0].a, null)

  // Each owner sees their own label; both opt into the leaderboard.
  await as(g)
  assert.equal((await db.query('select public.get_my_owner_label() a')).rows[0].a, 'APEX')
  await db.query('select public.set_leaderboard_participation(true)')
  await as(y)
  assert.equal((await db.query('select public.get_my_owner_label() a')).rows[0].a, 'AUREATINE')
  await db.query('select public.set_leaderboard_participation(true)')

  // Leaderboard shows the label text next to the existing admin badge.
  const entries = (await db.query('select * from public.get_leaderboard_entries()')).rows
  assert.equal(entries.find(r => r.display_name === 'Gian Pokling').owner_label, 'APEX')
  assert.equal(entries.find(r => r.display_name === 'HALIMAW MAG YEARN').owner_label, 'AUREATINE')
  assert.equal(entries.find(r => r.display_name === 'Gian Pokling').is_admin, true)

  // Admin list shows the same labels.
  await as(g)
  const search = (await db.query("select public.admin_search_members('',0) a")).rows[0].a
  assert.equal(search.find(x => x.username === 'gianpogi').owner_label, 'APEX')
  assert.equal(search.find(x => x.username === 'yasuda.dnz').owner_label, 'AUREATINE')

  // Public profile shows the label; ordinary members cannot open the admin list.
  await db.exec('reset role')
  const gianCommunity = (await db.query('select community_id from public.member_profiles where user_id=$1', [g])).rows[0].community_id
  await as(m)
  const profile = (await db.query('select public.get_leaderboard_member_profile($1) a', [gianCommunity])).rows[0].a
  assert.equal(profile.profile.owner_label, 'APEX')
  assert.equal(profile.profile.is_admin, true)
  await denied("select public.admin_search_members('',0)")

  // A reused username never inherits a label or admin role, including the APEX social handle.
  await as(g)
  await db.query("update public.member_profiles set username='renamed.gian' where user_id=$1", [g])
  await as(m)
  await db.query("update public.member_profiles set username='gianpogi' where user_id=$1", [m])
  await db.exec('reset role')
  await db.exec(sql)
  assert.equal(await count('select count(*)::int n from public.owner_labels where user_id=$1', [m]), 0)
  assert.equal(await count('select count(*)::int n from public.app_admins where user_id=$1', [m]), 0)
  assert.equal(await count('select count(*)::int n from public.owner_labels'), 2)

  await db.close()
  console.log('PASS Gian ADMIN + APEX label; yasuda ADMIN + AUREATINE label; @apex.fg not seeded; labels restricted and read-only to members; leaderboard/profile/admin list show label text; reused username inherits nothing; idempotent rerun. Local SQL only.')
})().catch(e => { console.error('FAIL', e.message); process.exit(1) })
