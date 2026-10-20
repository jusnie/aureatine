-- Friends (follow + friend requests) and owner-only admin grants.
-- Run once in the Supabase SQL Editor, after aureatine-full-setup.sql and aureatine-coupons-inbox-keychains.sql.
-- Admin = app_admins row + APEX and AUREATINE staff roles (same pattern the owner grant already uses).
-- Only the owner accounts can grant or remove admin. Admins cannot grant admin.

-- 1. Owner accounts. Add or change usernames here only.
create or replace function public.is_site_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.member_profiles p
    where p.user_id = auth.uid() and lower(trim(p.username)) in ('yasuda.dnz', 'gianpogi')
  )
$$;
revoke all on function public.is_site_owner() from public, anon;
grant execute on function public.is_site_owner() to authenticated;

-- 2. Follows (one way, no approval needed).
create table if not exists public.member_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
alter table public.member_follows enable row level security;
revoke all on public.member_follows from public, anon, authenticated;
grant all on public.member_follows to service_role;

-- 3. Friend requests. 'pending' waits for the addressee. 'accepted' means friends. Declined requests are deleted.
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);
alter table public.friend_requests enable row level security;
revoke all on public.friend_requests from public, anon, authenticated;
grant all on public.friend_requests to service_role;

-- 4. Friend notifications use the existing member_notifications inbox table.
alter table public.member_notifications drop constraint if exists member_notifications_kind_check;
alter table public.member_notifications add constraint member_notifications_kind_check check (kind in ('coupon', 'friend'));

-- 5. Follow or unfollow a member.
create or replace function public.follow_member(p_member uuid, p_follow boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'SIGN_IN'); end if;
  if p_member is null or p_member = me or not exists(select 1 from public.member_profiles where user_id = p_member) then
    return jsonb_build_object('ok', false, 'code', 'INVALID_MEMBER');
  end if;
  if p_follow then
    insert into public.member_follows(follower_id, followee_id) values(me, p_member) on conflict do nothing;
  else
    delete from public.member_follows where follower_id = me and followee_id = p_member;
  end if;
  return jsonb_build_object('ok', true, 'following', p_follow);
end $$;
revoke all on function public.follow_member(uuid, boolean) from public, anon;
grant execute on function public.follow_member(uuid, boolean) to authenticated;

-- 6. Send a friend request. The addressee gets a notification.
create or replace function public.send_friend_request(p_member uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); me_name text; req_id uuid;
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'SIGN_IN'); end if;
  if p_member is null or p_member = me or not exists(select 1 from public.member_profiles where user_id = p_member) then
    return jsonb_build_object('ok', false, 'code', 'INVALID_MEMBER');
  end if;
  if exists(select 1 from public.friend_requests where status = 'accepted'
            and ((requester_id = me and addressee_id = p_member) or (requester_id = p_member and addressee_id = me))) then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_FRIENDS');
  end if;
  if exists(select 1 from public.friend_requests where requester_id = p_member and addressee_id = me and status = 'pending') then
    return jsonb_build_object('ok', false, 'code', 'ACCEPT_INSTEAD');
  end if;
  if exists(select 1 from public.friend_requests where requester_id = me and addressee_id = p_member) then
    return jsonb_build_object('ok', true, 'status', 'pending');
  end if;
  insert into public.friend_requests(requester_id, addressee_id) values(me, p_member) returning id into req_id;
  select display_name into me_name from public.member_profiles where user_id = me;
  insert into public.member_notifications(user_id, kind, title, body)
    values(p_member, 'friend', 'New friend request', coalesce(me_name, 'A member') || ' sent you a friend request. Open Friends to accept.');
  return jsonb_build_object('ok', true, 'status', 'pending', 'request_id', req_id);
end $$;
revoke all on function public.send_friend_request(uuid) from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;

-- 7. Accept or decline a request you received.
create or replace function public.respond_friend_request(p_request uuid, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); r public.friend_requests%rowtype; me_name text;
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'SIGN_IN'); end if;
  select * into r from public.friend_requests where id = p_request and addressee_id = me and status = 'pending' for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'NOT_FOUND'); end if;
  if p_accept then
    update public.friend_requests set status = 'accepted', responded_at = now() where id = r.id;
    select display_name into me_name from public.member_profiles where user_id = me;
    insert into public.member_notifications(user_id, kind, title, body)
      values(r.requester_id, 'friend', 'Friend request accepted', coalesce(me_name, 'A member') || ' accepted your friend request.');
    return jsonb_build_object('ok', true, 'status', 'accepted');
  end if;
  delete from public.friend_requests where id = r.id;
  return jsonb_build_object('ok', true, 'status', 'declined');
end $$;
revoke all on function public.respond_friend_request(uuid, boolean) from public, anon;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;

-- 8. Remove a friend (either side).
create or replace function public.remove_friend(p_member uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then return jsonb_build_object('ok', false, 'code', 'SIGN_IN'); end if;
  delete from public.friend_requests where status = 'accepted'
    and ((requester_id = me and addressee_id = p_member) or (requester_id = p_member and addressee_id = me));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.remove_friend(uuid) from public, anon;
grant execute on function public.remove_friend(uuid) to authenticated;

-- 9. How the signed-in member relates to another member.
create or replace function public.get_member_relationship(p_member uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := auth.uid(); incoming_id uuid; friendship text := 'none';
begin
  if me is null or p_member is null or p_member = me then return jsonb_build_object('ok', true, 'self', p_member = me); end if;
  if exists(select 1 from public.friend_requests where status = 'accepted'
            and ((requester_id = me and addressee_id = p_member) or (requester_id = p_member and addressee_id = me))) then
    friendship := 'friends';
  elsif exists(select 1 from public.friend_requests where requester_id = me and addressee_id = p_member and status = 'pending') then
    friendship := 'outgoing';
  elsif exists(select 1 from public.friend_requests where requester_id = p_member and addressee_id = me and status = 'pending') then
    friendship := 'incoming';
    select id into incoming_id from public.friend_requests where requester_id = p_member and addressee_id = me and status = 'pending';
  end if;
  return jsonb_build_object('ok', true, 'self', false,
    'following', exists(select 1 from public.member_follows where follower_id = me and followee_id = p_member),
    'followed_by', exists(select 1 from public.member_follows where follower_id = p_member and followee_id = me),
    'friendship', friendship, 'request_id', incoming_id);
end $$;
revoke all on function public.get_member_relationship(uuid) from public, anon;
grant execute on function public.get_member_relationship(uuid) to authenticated;

-- 10. Lists for a member: followers, following, or friends. Signed-in members only.
create or replace function public.get_member_connections(p_member uuid, p_kind text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'SIGN_IN'); end if;
  if p_kind not in ('followers', 'following', 'friends') then return jsonb_build_object('ok', false, 'code', 'INVALID_KIND'); end if;
  select coalesce(jsonb_agg(row_to_json(x) order by x.display_name), '[]'::jsonb) into result from (
    select p.user_id, p.display_name, p.username
    from public.member_profiles p
    where (p_kind = 'followers' and p.user_id in (select f.follower_id from public.member_follows f where f.followee_id = p_member))
       or (p_kind = 'following' and p.user_id in (select f.followee_id from public.member_follows f where f.follower_id = p_member))
       or (p_kind = 'friends' and p.user_id in (
            select case when r.requester_id = p_member then r.addressee_id else r.requester_id end
            from public.friend_requests r
            where r.status = 'accepted' and p_member in (r.requester_id, r.addressee_id)))
    limit 200
  ) x;
  return jsonb_build_object('ok', true, 'members', result);
end $$;
revoke all on function public.get_member_connections(uuid, text) from public, anon;
grant execute on function public.get_member_connections(uuid, text) to authenticated;

-- 11. Incoming friend requests waiting for the signed-in member.
create or replace function public.get_my_friend_requests() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'SIGN_IN'); end if;
  select coalesce(jsonb_agg(row_to_json(x) order by x.created_at desc), '[]'::jsonb) into result from (
    select r.id as request_id, p.user_id, p.display_name, p.username, r.created_at
    from public.friend_requests r
    join public.member_profiles p on p.user_id = r.requester_id
    where r.addressee_id = auth.uid() and r.status = 'pending'
  ) x;
  return jsonb_build_object('ok', true, 'requests', result);
end $$;
revoke all on function public.get_my_friend_requests() from public, anon;
grant execute on function public.get_my_friend_requests() to authenticated;

-- 12. Owner-only: grant or remove admin. Admins get the APEX and AUREATINE staff roles, same as the owner grant.
-- Owner accounts cannot be changed here. Admins cannot call this function.
create or replace function public.set_app_admin(p_member uuid, p_grant boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); target_name text;
begin
  if me is null or not public.is_site_owner() then return jsonb_build_object('ok', false, 'code', 'OWNER_ONLY'); end if;
  select lower(trim(username)) into target_name from public.member_profiles where user_id = p_member;
  if target_name is null then return jsonb_build_object('ok', false, 'code', 'INVALID_MEMBER'); end if;
  if target_name in ('yasuda.dnz', 'gianpogi') then return jsonb_build_object('ok', false, 'code', 'OWNER_ACCOUNT'); end if;
  if p_grant then
    insert into public.app_admins(user_id) values(p_member) on conflict do nothing;
    insert into public.staff_members(user_id, role) values(p_member, 'apex'), (p_member, 'aureatine') on conflict do nothing;
  else
    delete from public.app_admins where user_id = p_member;
    delete from public.staff_members where user_id = p_member and role in ('apex', 'aureatine');
  end if;
  insert into public.admin_member_audit(actor, member_id, action, details)
    values(me, p_member, case when p_grant then 'owner_admin_add' else 'owner_admin_remove' end, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'admin', p_grant);
end $$;
revoke all on function public.set_app_admin(uuid, boolean) from public, anon;
grant execute on function public.set_app_admin(uuid, boolean) to authenticated;
