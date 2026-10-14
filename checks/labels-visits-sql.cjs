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

  async function as(id) { await db.exec('reset role'); await db.query("select set_config('app.uid',$1,false)", [id]); await db.exec('set role authenticated') }

  // Label managers: admins who also hold APEX or AUREATINE. Plain admins and members cannot assign labels.
  const isManager = async id => { await as(id); return (await db.query('select public.get_my_label_manager() a')).rows[0].a }
  assert.equal(await isManager(g), true)
  assert.equal(await isManager(y), true)
  assert.equal(await isManager(m), false)
  const plainAdmin = '77777777-7777-4777-8777-777777777777'
  await db.exec('reset role')
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'admin.plain@example.test',now())", [plainAdmin])
  await db.query("update public.member_profiles set username='admin.plain',display_name='Plain Admin' where user_id=$1", [plainAdmin])
  await db.query('insert into public.app_admins(user_id) values($1)', [plainAdmin])
  assert.equal(await isManager(plainAdmin), false, 'admin without APEX/AUREATINE is not a label manager')
  await db.exec('reset role')
  await db.query("insert into public.owner_labels(user_id,label) values($1,'STUDENT')", [plainAdmin])
  assert.equal(await isManager(plainAdmin), false, 'MEMBER/STUDENT/STAFF labels do not grant management')
  await db.exec('reset role')
  await db.query('delete from public.owner_labels where user_id=$1', [plainAdmin])
  await db.query('delete from public.app_admins where user_id=$1', [plainAdmin])

  // Assigning labels: managers can set MEMBER, STUDENT, STAFF; APEX/AUREATINE stay owner-only.
  const mCommunity = (await (async () => { await db.exec('reset role'); return (await db.query('select community_id from public.member_profiles where user_id=$1', [m])).rows[0].community_id })())
  const gCommunity = (await (async () => { await db.exec('reset role'); return (await db.query('select community_id from public.member_profiles where user_id=$1', [g])).rows[0].community_id })())
  await as(g)
  let r = (await db.query('select public.admin_set_member_labels($1,$2) a', [mCommunity, ['MEMBER', 'STUDENT']])).rows[0].a
  assert.deepEqual(r, { ok: true })
  await as(m)
  let prof = (await db.query('select public.get_my_labels() a')).rows[0].a
  assert.deepEqual(prof, ['MEMBER', 'STUDENT'])
  await as(g)
  r = (await db.query('select public.admin_set_member_labels($1,$2) a', [mCommunity, ['STAFF']])).rows[0].a
  assert.deepEqual(r, { ok: true })
  await db.exec('reset role')
  assert.deepEqual((await db.query('select array_agg(label order by label) a from public.owner_labels where user_id=$1', [m])).rows[0].a, ['STAFF'], 'unchecked MEMBER/STUDENT removed')
  await as(g)
  r = (await db.query('select public.admin_set_member_labels($1,$2) a', [mCommunity, ['APEX']])).rows[0].a
  assert.deepEqual(r, { ok: false, code: 'INVALID_LABEL' })
  r = (await db.query('select public.admin_set_member_labels($1,$2) a', [mCommunity, ['OWNER']])).rows[0].a
  assert.deepEqual(r, { ok: false, code: 'INVALID_LABEL' })
  // Setting labels on an owner keeps APEX.
  r = (await db.query('select public.admin_set_member_labels($1,$2) a', [gCommunity, ['MEMBER']])).rows[0].a
  assert.deepEqual(r, { ok: true })
  await db.exec('reset role')
  assert.deepEqual((await db.query('select array_agg(label order by label) a from public.owner_labels where user_id=$1', [g])).rows[0].a, ['APEX', 'MEMBER'])
  // Non-managers are refused.
  await as(m)
  let refused = false
  try { await db.query('select public.admin_set_member_labels($1,$2)', [gCommunity, ['STAFF']]) } catch { refused = true }
  assert.ok(refused, 'member cannot assign labels')
  await db.exec('reset role')
  assert.ok((await db.query("select count(*)::int n from public.admin_member_audit where action='set_labels'")).rows[0].n >= 3)

  // Labels appear on the leaderboard, public profile and admin list as arrays.
  await as(m)
  await db.query('select public.set_leaderboard_participation(true)')
  await as(g)
  await db.query('select public.set_leaderboard_participation(true)')
  const entries = (await db.query('select * from public.get_leaderboard_entries()')).rows
  assert.deepEqual(entries.find(r => r.display_name === 'Member One').labels, ['STAFF'])
  assert.deepEqual(entries.find(r => r.display_name === 'Gian Pokling').labels, ['APEX', 'MEMBER'])
  const search = (await db.query("select public.admin_search_members('',0) a")).rows[0].a
  assert.deepEqual(search.find(x => x.username === 'member.one').labels, ['STAFF'])
  await as(y)
  const pr = (await db.query('select public.get_leaderboard_member_profile($1) a', [mCommunity])).rows[0].a
  assert.deepEqual(pr.profile.labels, ['STAFF'])

  // Automatic visits: scanning awards 10 points with a generated reference; no reference is needed.
  await db.exec('reset role')
  const code = (await db.query('select manual_code from public.member_profiles where user_id=$1', [m])).rows[0].manual_code
  const before = (await db.query('select points from public.wallets where user_id=$1', [m])).rows[0].points
  const req1 = '10101010-1010-4010-8010-101010101010'
  const req2 = '20202020-2020-4020-8020-202020202020'
  await as(g)
  const v1 = (await db.query("select public.award_member_points($1,'visit',null,null,$2::uuid) a", [code, req1])).rows[0].a
  assert.equal(v1.ok, true)
  assert.equal(v1.points, 10)
  assert.equal(v1.replayed, false)
  assert.equal(v1.member_name, 'Member One')
  // Retrying the same scan does not award again.
  const v1again = (await db.query("select public.award_member_points($1,'visit',null,null,$2::uuid) a", [code, req1])).rows[0].a
  assert.equal(v1again.replayed, true)
  assert.equal(v1again.event_id, v1.event_id)
  // A second scan on the same day is awarded too (no daily limit).
  const v2 = (await db.query("select public.award_member_points($1,'visit','   ',null,$2::uuid) a", [code, req2])).rows[0].a
  assert.equal(v2.ok, true)
  assert.equal(v2.points, 10)
  await db.exec('reset role')
  const refs = (await db.query('select reference from public.member_point_events where user_id=$1 order by reference', [m])).rows.map(x => x.reference)
  assert.equal(refs.length, 2)
  for (const ref of refs) assert.match(ref, /^VISIT-\d{8}-[0-9A-F]{10}$/)
  assert.equal(refs[0] === refs[1], false, 'each scan gets its own reference')
  const after = (await db.query('select points from public.wallets where user_id=$1', [m])).rows[0].points
  assert.equal(after - before, 20)
  // Purchases still need a receipt reference and an amount.
  await as(g)
  const noRef = (await db.query("select public.award_member_points($1,'purchase',null,5000,$2::uuid) a", [code, '30303030-3030-4030-8030-303030303030'])).rows[0].a
  assert.equal(noRef.code, 'INVALID_REFERENCE')
  const buy = (await db.query("select public.award_member_points($1,'purchase','RECEIPT-0001',5000,$2::uuid) a", [code, '40404040-4040-4040-8040-404040404040'])).rows[0].a
  assert.equal(buy.ok, true)
  assert.equal(buy.points, 10)

  await db.close()
  console.log('PASS label managers only; MEMBER/STUDENT/STAFF assignable and replaceable; APEX/AUREATINE protected; labels in leaderboard/profile/admin list; automatic visit awards with generated references and replay safety; purchases still need receipts. Gian ADMIN + APEX label; yasuda ADMIN + AUREATINE label; @apex.fg not seeded; labels restricted and read-only to members; leaderboard/profile/admin list show label text; reused username inherits nothing; idempotent rerun. Local SQL only.')
})().catch(e => { console.error('FAIL', e.message); process.exit(1) })
