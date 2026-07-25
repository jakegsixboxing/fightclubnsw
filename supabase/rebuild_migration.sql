-- ============================================================================
-- Prize Fighter NSW — rebuild migration
-- Moves the app from custom scrypt auth (server-side, service_role key,
-- no RLS) to Supabase Auth + client-side supabase-js + Postgres RLS, matching
-- the "Legacy Gym" architecture.
--
-- DECISION (confirmed by product owner, 2026-07-25): "Fresh start" — existing
-- custom-auth accounts (pf_users / pf_sessions) are NOT migrated into
-- Supabase Auth. Old fighter profile rows are kept for historical record
-- (wins/losses/points already on the books) but become unowned until/unless
-- someone re-registers and an admin re-links them. Every fighter must sign up
-- again through Supabase Auth after cutover.
--
-- SEQUENCING — do not run this against the live project until the new
-- single-file app + Vercel deploy are fully built and tested. Once run, the
-- OLD server.mjs app (still pointed at the same tables) will break, because
-- pf_fighters.user_id changes meaning from "pf_users.id (bigint)" to
-- "auth.users.id (uuid)". This is an intentional one-way cutover, not an
-- incremental change.
-- ============================================================================

-- ---------- 1. Rename the legacy bigint user_id columns (kept for audit /
--               historical reference only — no longer used for auth) ----------
alter table pf_fighters rename column user_id to legacy_user_id;
alter table pf_fighters alter column legacy_user_id drop not null;
alter table pf_fighters drop constraint if exists pf_fighters_user_id_key; -- old unique constraint

alter table pf_events rename column created_by to legacy_created_by;

alter table pf_matches rename column proposed_by to legacy_proposed_by;

-- ---------- 2. Add new Supabase-Auth-based ownership columns ----------
alter table pf_fighters add column user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists pf_fighters_user_id_key on pf_fighters(user_id) where user_id is not null;

alter table pf_events add column created_by uuid references auth.users(id);

alter table pf_matches add column proposed_by uuid references auth.users(id);

-- ---------- 3. Admin allowlist (mirrors the old ADMIN_EMAILS env var) ----------
-- A tiny table instead of a hardcoded email in every policy, so admins can be
-- added without a migration. Only service_role can write to it — no client
-- insert/update/delete policy is defined below, which means only the
-- Supabase dashboard / SQL editor (as postgres/service_role) can change it.
create table if not exists pf_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table pf_admins enable row level security;
-- Seed once the admin (jakegsixboxing@gmail.com) has signed up post-cutover:
--   insert into pf_admins (user_id, email)
--   select id, email from auth.users where email = 'jakegsixboxing@gmail.com';

create or replace function pf_is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from pf_admins where user_id = auth.uid());
$$;

-- ---------- 4. Enable RLS on every pf_ table ----------
alter table pf_weight_divisions enable row level security;
alter table pf_fighters enable row level security;
alter table pf_events enable row level security;
alter table pf_nominations enable row level security;
alter table pf_matches enable row level security;
alter table pf_results enable row level security;

-- ---------- 5. Policies: pf_weight_divisions (reference data, public read) ----------
drop policy if exists "weight divisions are readable by anyone signed in" on pf_weight_divisions;
create policy "weight divisions are readable by anyone signed in"
  on pf_weight_divisions for select
  to authenticated
  using (true);

-- ---------- 6. Policies: pf_fighters ----------
drop policy if exists "fighters are readable by anyone signed in" on pf_fighters;
create policy "fighters are readable by anyone signed in"
  on pf_fighters for select
  to authenticated
  using (true);

drop policy if exists "a user can create their own fighter profile" on pf_fighters;
create policy "a user can create their own fighter profile"
  on pf_fighters for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "a user can update their own fighter profile, admin can update any" on pf_fighters;
create policy "a user can update their own fighter profile, admin can update any"
  on pf_fighters for update
  to authenticated
  using (user_id = auth.uid() or pf_is_admin())
  with check (user_id = auth.uid() or pf_is_admin());

-- No delete policy: fighter profiles are never deleted by the client, same as
-- the old app (there was no delete route). Admin can still delete via the
-- dashboard/service_role if truly needed.

-- ---------- 7. Policies: pf_events ----------
drop policy if exists "events are readable by anyone signed in" on pf_events;
create policy "events are readable by anyone signed in"
  on pf_events for select
  to authenticated
  using (true);

drop policy if exists "only admins create events" on pf_events;
create policy "only admins create events"
  on pf_events for insert
  to authenticated
  with check (pf_is_admin());

drop policy if exists "only admins update events" on pf_events;
create policy "only admins update events"
  on pf_events for update
  to authenticated
  using (pf_is_admin())
  with check (pf_is_admin());

-- ---------- 8. Policies: pf_nominations ----------
drop policy if exists "nominations are readable by anyone signed in" on pf_nominations;
create policy "nominations are readable by anyone signed in"
  on pf_nominations for select
  to authenticated
  using (true);

drop policy if exists "a fighter can nominate themselves" on pf_nominations;
create policy "a fighter can nominate themselves"
  on pf_nominations for insert
  to authenticated
  with check (
    exists (select 1 from pf_fighters f where f.id = fighter_id and f.user_id = auth.uid())
  );

drop policy if exists "a fighter can withdraw their own nomination" on pf_nominations;
create policy "a fighter can withdraw their own nomination"
  on pf_nominations for delete
  to authenticated
  using (
    exists (select 1 from pf_fighters f where f.id = fighter_id and f.user_id = auth.uid())
    or pf_is_admin()
  );

-- ---------- 9. Policies: pf_matches ----------
-- Visible to: admins, either fighter in the match, or anyone (once confirmed —
-- confirmed cards are shown on /confirmed to any signed-in member, same as today).
drop policy if exists "matches visible to admin, either fighter, or once confirmed" on pf_matches;
create policy "matches visible to admin, either fighter, or once confirmed"
  on pf_matches for select
  to authenticated
  using (
    pf_is_admin()
    or status = 'confirmed'
    or exists (select 1 from pf_fighters f where f.user_id = auth.uid() and f.id in (fighter_a_id, fighter_b_id))
  );

-- Direct insert/update of pf_matches is intentionally NOT exposed to
-- ordinary authenticated users — creating offers, confirming, cancelling,
-- and recording results all carry business rules (mutual-agreement gating,
-- admin-only confirm, points calculation) that are enforced in the RPC
-- functions below (SECURITY DEFINER), not via blanket table policies.
-- Only admins get a direct policy, for the matchmaking screen's simpler paths.
drop policy if exists "only admins insert matches" on pf_matches;
create policy "only admins insert matches"
  on pf_matches for insert
  to authenticated
  with check (pf_is_admin());

drop policy if exists "only admins update matches directly" on pf_matches;
create policy "only admins update matches directly"
  on pf_matches for update
  to authenticated
  using (pf_is_admin())
  with check (pf_is_admin());

-- ---------- 10. Policies: pf_results ----------
drop policy if exists "results are readable by anyone signed in" on pf_results;
create policy "results are readable by anyone signed in"
  on pf_results for select
  to authenticated
  using (true);
-- No client insert/update/delete — results are only ever written by the
-- pf_record_match_result() RPC below (admin-gated, SECURITY DEFINER).

-- ============================================================================
-- RPC functions — business rules that RLS alone can't express safely.
-- These run as SECURITY DEFINER (bypassing RLS internally) but each one
-- checks auth.uid()/pf_is_admin() itself, so they're exactly as safe as the
-- old server-side route handlers were, just living in Postgres instead of
-- server.mjs.
-- ============================================================================

-- A fighter accepts or declines a proposed match. Mirrors respondToMatch().
create or replace function pf_respond_to_match(p_match_id bigint, p_response text)
returns void
language plpgsql
security definer
as $$
declare
  m pf_matches%rowtype;
  my_fighter_id bigint;
  is_a boolean;
  is_b boolean;
begin
  if p_response not in ('accepted', 'declined') then
    raise exception 'invalid response';
  end if;

  select id into my_fighter_id from pf_fighters where user_id = auth.uid();
  if my_fighter_id is null then
    raise exception 'no fighter profile for this user';
  end if;

  select * into m from pf_matches where id = p_match_id;
  if not found or m.status <> 'proposed' then
    raise exception 'match not open for a response';
  end if;

  is_a := m.fighter_a_id = my_fighter_id;
  is_b := m.fighter_b_id = my_fighter_id;
  if not (is_a or is_b) then
    raise exception 'not your match';
  end if;

  if is_a then
    update pf_matches set a_response = p_response, updated_at = now() where id = p_match_id;
  else
    update pf_matches set b_response = p_response, updated_at = now() where id = p_match_id;
  end if;

  select * into m from pf_matches where id = p_match_id;
  if m.a_response = 'declined' or m.b_response = 'declined' then
    update pf_matches set status = 'declined', updated_at = now() where id = p_match_id;
  elsif m.a_response = 'accepted' and m.b_response = 'accepted' then
    update pf_matches set status = 'agreed', updated_at = now() where id = p_match_id;
  end if;
end;
$$;

-- Admin confirms an agreed match onto an event. Mirrors confirmMatch().
create or replace function pf_confirm_match(p_match_id bigint, p_event_id bigint default null)
returns void
language plpgsql
security definer
as $$
declare
  m pf_matches%rowtype;
begin
  if not pf_is_admin() then raise exception 'admin only'; end if;
  select * into m from pf_matches where id = p_match_id;
  if not found or m.status <> 'agreed' then raise exception 'match not agreed'; end if;
  update pf_matches
    set status = 'confirmed', event_id = coalesce(p_event_id, m.event_id), updated_at = now()
    where id = p_match_id;
end;
$$;

-- Admin records a confirmed match's result and awards points. Mirrors
-- recordMatchResult() + pointsFor() exactly (same scoring: +1 competed,
-- +2 win, +3 extra for TKO/KO win, +5 Fighter of the Night).
create or replace function pf_record_match_result(
  p_match_id bigint,
  p_winner_fighter_id bigint,
  p_method text,
  p_fotn_fighter_id bigint
)
returns void
language plpgsql
security definer
as $$
declare
  m pf_matches%rowtype;
  event_date text;
  season text;
  tko_ko boolean;
  fid bigint;
  is_winner boolean;
  is_draw boolean;
  fotn boolean;
  outcome text;
  points integer;
begin
  if not pf_is_admin() then raise exception 'admin only'; end if;
  select * into m from pf_matches where id = p_match_id;
  if not found or m.status <> 'confirmed' then raise exception 'match not confirmed'; end if;

  if m.result_recorded then
    delete from pf_results where match_id = p_match_id;
  end if;

  season := '2026';
  if m.event_id is not null then
    select e.event_date into event_date from pf_events e where e.id = m.event_id;
    if event_date is not null and event_date ~ '^\d{4}' then
      season := substring(event_date from 1 for 4);
    end if;
  end if;

  tko_ko := p_method = 'TKO/KO';
  is_draw := p_winner_fighter_id is null;

  foreach fid in array array[m.fighter_a_id, m.fighter_b_id] loop
    is_winner := p_winner_fighter_id is not null and fid = p_winner_fighter_id;
    fotn := p_fotn_fighter_id is not null and fid = p_fotn_fighter_id;
    outcome := case when is_draw then 'draw' when is_winner then 'win' else 'loss' end;
    points := 1
      + case when is_winner then 2 else 0 end
      + case when is_winner and tko_ko then 3 else 0 end
      + case when fotn then 5 else 0 end;

    insert into pf_results (fighter_id, match_id, event_id, outcome, method, fighter_of_night, points, season)
    values (fid, p_match_id, m.event_id, outcome, p_method, fotn, points, season);
  end loop;

  update pf_matches
    set result_recorded = true, winner_fighter_id = p_winner_fighter_id, method = p_method, updated_at = now()
    where id = p_match_id;
end;
$$;

-- Admin cancels a match — trivial, but kept as an RPC for symmetry / audit.
create or replace function pf_cancel_match(p_match_id bigint)
returns void
language plpgsql
security definer
as $$
begin
  if not pf_is_admin() then raise exception 'admin only'; end if;
  update pf_matches set status = 'cancelled', updated_at = now() where id = p_match_id;
end;
$$;

-- ============================================================================
-- Storage: fighter/event photos move from server-side sharp processing to
-- client-side canvas resize (see rebuild/index.html). The existing public
-- "pf-photos" bucket (used by the current server, see lib/photo.mjs) is
-- reused as-is — same object paths (fighters/fighter-{id}.jpg,
-- events/event-{id}.jpg, events/event-{id}-video.{ext}), so historical photos
-- already uploaded keep working with no data move required.
-- ============================================================================
drop policy if exists "anyone signed in can read pf-photos" on storage.objects;
create policy "anyone signed in can read pf-photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'pf-photos');

drop policy if exists "a fighter can upload/replace their own photo" on storage.objects;
create policy "a fighter can upload/replace their own photo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pf-photos'
    and (
      -- fighters/fighter-{id}.jpg, where {id} is a fighter row owned by this user
      (name ~ '^fighters/fighter-\d+\.jpg$'
        and exists (
          select 1 from pf_fighters f
          where f.user_id = auth.uid()
            and name = 'fighters/fighter-' || f.id || '.jpg'
        ))
      -- events/... — admin only
      or (name ~ '^events/' and pf_is_admin())
    )
  );

drop policy if exists "a fighter can update their own photo object" on storage.objects;
create policy "a fighter can update their own photo object"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'pf-photos'
    and (
      (name ~ '^fighters/fighter-\d+\.jpg$'
        and exists (
          select 1 from pf_fighters f
          where f.user_id = auth.uid()
            and name = 'fighters/fighter-' || f.id || '.jpg'
        ))
      or (name ~ '^events/' and pf_is_admin())
    )
  );
