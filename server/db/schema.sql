-- ════════════════════════════════════════════════════════════════
--  AQUA-EXPERTS — Supabase schema (auto-applied by `npm run db:setup`)
--  Safe to run multiple times (idempotent).
-- ════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ── updated_at helper ───────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles ────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null unique,
  full_name     text,
  password_hash text,
  created_at    timestamptz not null default now()
);

-- safety for pre-existing installs
alter table public.profiles add column if not exists password_hash text;
alter table public.profiles add column if not exists full_name text;
create index if not exists profiles_email_idx on public.profiles (lower(email));

-- ── items (user-owned service requests / saved enquiries) ───────
create table if not exists public.items (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  ai_summary  text,
  status      text not null default 'open',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.items add column if not exists ai_summary text;
alter table public.items add column if not exists status text not null default 'open';
alter table public.items add column if not exists updated_at timestamptz not null default now();
create index if not exists items_user_created_idx on public.items (user_id, created_at desc);

drop trigger if exists items_touch_updated_at on public.items;
create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

-- ── bookings (public "Book a Service" form, guest friendly) ─────
create table if not exists public.bookings (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references public.profiles(id) on delete set null,
  name           text not null,
  phone          text not null,
  address        text not null,
  brand          text,
  issue          text not null,
  preferred_date date,
  preferred_time text,
  notes          text,
  status         text not null default 'pending',
  created_at     timestamptz not null default now()
);

create index if not exists bookings_created_idx on public.bookings (created_at desc);
create index if not exists bookings_user_idx on public.bookings (user_id);

-- ════════════════════════════════════════════════════════════════
--  Row Level Security
--  The Express API uses the service_role key (bypasses RLS), but the
--  policies below mean the anon/public key can never read another
--  user's rows if it is ever used directly from a client.
-- ════════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.items    enable row level security;
alter table public.bookings enable row level security;

-- profiles: read + update own row only
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- items: full CRUD, own rows only
drop policy if exists "items_select_own" on public.items;
create policy "items_select_own" on public.items
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "items_insert_own" on public.items;
create policy "items_insert_own" on public.items
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "items_update_own" on public.items;
create policy "items_update_own" on public.items
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "items_delete_own" on public.items;
create policy "items_delete_own" on public.items
  for delete to authenticated using (auth.uid() = user_id);

-- bookings: user sees own bookings; guests can insert; nobody reads others'
drop policy if exists "bookings_insert_any" on public.bookings;
create policy "bookings_insert_any" on public.bookings
  for insert to anon, authenticated with check (true);

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own" on public.bookings
  for select to authenticated using (auth.uid() = user_id);

-- ── grants (RLS still filters every row) ────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.items, public.bookings to authenticated;
grant insert on public.bookings to anon;
