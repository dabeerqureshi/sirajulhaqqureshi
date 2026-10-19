-- ==============================================================================
-- SIRAJ UL HAQ QURESHI DIGITAL ARCHIVE & PORTFOLIO
-- Supabase PostgreSQL Schema, Row Level Security (RLS) & Storage Policies
-- ==============================================================================
--
-- HOW TO APPLY
--   1. Supabase Dashboard -> SQL Editor -> New query
--   2. Paste this ENTIRE file and press Run.
--
-- This script is 100% IDEMPOTENT — safe on a brand-new database and safe to
-- re-run on an existing one. Every statement uses IF EXISTS / IF NOT EXISTS /
-- DROP-IF-EXISTS guards, and every object is created BEFORE it is referenced,
-- so a previously-partial run can always be repaired by running the file again.
--
-- It also creates the two Storage buckets and their RLS policies for you, so
-- there is nothing left to configure manually in the dashboard.
-- ==============================================================================


-- ==============================================================================
-- 1. USER PROFILES TABLE
-- Extends Supabase auth.users with roles and access permissions
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'approved_user', 'user')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CONTENT TABLE (Biography, Introduction, Articles, Poetry)
create table if not exists public.content (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('intro', 'biography', 'poetry', 'article', 'memory', 'hamd')),
  title_en text not null,
  title_ur text not null,
  subtitle_en text,
  subtitle_ur text,
  body_en text,
  body_ur text,
  -- For poetry: structured lines/couplets stored as JSON array [{ "ur": "...", "en": "..." }]
  verses jsonb default '[]'::jsonb,
  cover_image text,
  -- For type 'hamd': storage path of the uploaded Hamd PDF (public-assets bucket)
  file_path text,
  visibility text not null default 'public' check (visibility in ('public', 'restricted')),
  published boolean default true not null,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. BOOKS & PUBLICATIONS TABLE
create table if not exists public.books (
  id uuid default gen_random_uuid() primary key,
  title_en text not null,
  title_ur text not null,
  author_en text default 'Siraj ul Haq Qureshi',
  author_ur text default 'سراج الحق قریشی',
  description_en text,
  description_ur text,
  category text default 'Literature',
  cover_path text, -- file path in storage bucket
  file_path text,  -- PDF path in storage bucket (public-assets or private-assets)
  visibility text not null default 'public' check (visibility in ('public', 'restricted')),
  published boolean default true not null,
  pages_count integer,
  published_year text,
  download_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. GALLERY / MEDIA TABLE
create table if not exists public.gallery (
  id uuid default gen_random_uuid() primary key,
  title_en text not null,
  title_ur text not null,
  description_en text,
  description_ur text,
  category text default 'General', -- Historical, Family, Events, Literary Gatherings
  file_path text not null, -- path in public-assets or private-assets bucket
  visibility text not null default 'public' check (visibility in ('public', 'restricted')),
  sort_order integer default 0,
  taken_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ACCESS REQUESTS TABLE
-- Allows visitors/registered users to request access to restricted galleries or books
create table if not exists public.access_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_name text not null,
  user_email text not null,
  resource_type text not null check (resource_type in ('all', 'gallery', 'books', 'poetry')),
  resource_id uuid, -- optional specific resource reference
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone,
  reviewed_by uuid references public.profiles(id)
);

-- ==============================================================================
-- 6. VIDEOS TABLE
-- ==============================================================================
create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  title_en text not null,
  title_ur text not null,
  description_en text,
  description_ur text,
  video_path text not null, -- path in public-assets or private-assets bucket
  youtube_url text, -- optional YouTube URL; when set, the video plays inline via embed
  thumbnail_path text,
  duration text, -- e.g. "12:34"
  category text default 'Lectures',
  visibility text not null default 'public' check (visibility in ('public', 'restricted', 'secret')),
  is_encrypted boolean default false,
  encryption_salt text,
  published boolean default true not null,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.content enable row level security;
alter table public.books enable row level security;
alter table public.gallery enable row level security;
alter table public.access_requests enable row level security;

-- Helper function to check if current authenticated user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Helper function to check if user has approved restricted access
create or replace function public.is_approved()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'approved_user')
  );
end;
$$ language plpgsql security definer;

-- PROFILES POLICIES
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Admins can manage all profiles" on public.profiles;
create policy "Admins can manage all profiles"
  on public.profiles for all
  using (public.is_admin());

-- CONTENT POLICIES
drop policy if exists "Public can view published public content" on public.content;
create policy "Public can view published public content"
  on public.content for select
  using (
    (published = true and visibility = 'public') or
    (published = true and visibility = 'restricted' and public.is_approved()) or
    public.is_admin()
  );

drop policy if exists "Admins can do everything on content" on public.content;
create policy "Admins can do everything on content"
  on public.content for all
  using (public.is_admin());

-- BOOKS POLICIES
drop policy if exists "Public can view published public books" on public.books;
create policy "Public can view published public books"
  on public.books for select
  using (
    (published = true and visibility = 'public') or
    (published = true and visibility = 'restricted' and public.is_approved()) or
    public.is_admin()
  );

drop policy if exists "Admins can do everything on books" on public.books;
create policy "Admins can do everything on books"
  on public.books for all
  using (public.is_admin());

-- GALLERY POLICIES
drop policy if exists "Public can view public gallery photos" on public.gallery;
create policy "Public can view public gallery photos"
  on public.gallery for select
  using (
    visibility = 'public' or
    (visibility = 'restricted' and public.is_approved()) or
    public.is_admin()
  );

drop policy if exists "Admins can do everything on gallery" on public.gallery;
create policy "Admins can do everything on gallery"
  on public.gallery for all
  using (public.is_admin());

-- ACCESS REQUESTS POLICIES
drop policy if exists "Users can view their own access requests" on public.access_requests;
create policy "Users can view their own access requests"
  on public.access_requests for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Authenticated users can submit access requests" on public.access_requests;
create policy "Authenticated users can submit access requests"
  on public.access_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins can update access requests (approve/reject)" on public.access_requests;
create policy "Admins can update access requests (approve/reject)"
  on public.access_requests for update
  using (public.is_admin());

drop policy if exists "Admins can delete access requests" on public.access_requests;
create policy "Admins can delete access requests"
  on public.access_requests for delete
  using (public.is_admin());

-- ==============================================================================
-- ENCRYPTION SUPPORT ON EXISTING TABLES
-- ==============================================================================
-- is_encrypted: when true, the actual file/content is client-side encrypted
--               and can only be decrypted with a secret password known to
--               authorized users. The encryption key is NEVER stored server-side.
-- encryption_salt: random salt used in PBKDF2 key derivation (stored in plain,
--                  it is not secret — the password is the secret)
alter table public.content add column if not exists is_encrypted boolean default false;
alter table public.content add column if not exists encryption_salt text;

alter table public.books add column if not exists is_encrypted boolean default false;
alter table public.books add column if not exists encryption_salt text;

alter table public.gallery add column if not exists is_encrypted boolean default false;
alter table public.gallery add column if not exists encryption_salt text;

-- YouTube embed support on videos: the ALTER lives directly after the videos
-- table creation below — altering a table that does not exist yet fails with
-- 42P01 ("relation public.videos does not exist") on fresh databases.


alter table public.videos enable row level security;

-- VIDEOS POLICIES
drop policy if exists "Public can view published public videos" on public.videos;
create policy "Public can view published public videos"
  on public.videos for select
  using (
    (published = true and visibility = 'public') or
    (published = true and visibility = 'restricted' and public.is_approved()) or
    (published = true and visibility = 'secret' and public.is_approved()) or
    public.is_admin()
  );

drop policy if exists "Admins can do everything on videos" on public.videos;
create policy "Admins can do everything on videos"
  on public.videos for all
  using (public.is_admin());

-- Add 'video' to access_requests resource_type check
alter table public.access_requests drop constraint if exists access_requests_resource_type_check;
alter table public.access_requests add constraint access_requests_resource_type_check
  check (resource_type in ('all', 'gallery', 'books', 'poetry', 'video'));

-- ==============================================================================
-- HAMD (POETRY PDF) SUPPORT ON EXISTING TABLES
-- Idempotent — safe to run on both fresh and already-provisioned databases.
-- Run this block in the Supabase SQL Editor if your database was created
-- before the Hamd feature existed.
alter table public.content add column if not exists file_path text;

alter table public.content drop constraint if exists content_type_check;
alter table public.content add constraint content_type_check
  check (type in ('intro', 'biography', 'poetry', 'article', 'memory', 'hamd'));

-- ==============================================================================
-- AUTO-UPDATE updated_at
-- Keeps `updated_at` truthful whenever a row is edited, no matter which
-- client (admin panel, API route, SQL editor) performed the update.
-- ==============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.content;
create trigger set_updated_at before update on public.content
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.books;
create trigger set_updated_at before update on public.books
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.gallery;
create trigger set_updated_at before update on public.gallery
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.videos;
create trigger set_updated_at before update on public.videos
  for each row execute function public.set_updated_at();

-- ==============================================================================
-- STORAGE BUCKETS + STORAGE RLS POLICIES
-- Creates the buckets automatically so there is nothing left to configure by
-- hand in the dashboard. Re-running the file is safe.
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true,  104857600,
   array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
         'application/pdf','video/mp4','video/webm','video/quicktime']),
  ('private-assets', 'private-assets', false, 104857600,
   array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
         'application/pdf','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket: anyone may read; only admins may write.
drop policy if exists "Public read public-assets" on storage.objects;
create policy "Public read public-assets"
  on storage.objects for select
  using (bucket_id = 'public-assets');

drop policy if exists "Admins write public-assets" on storage.objects;
create policy "Admins write public-assets"
  on storage.objects for insert
  with check (bucket_id = 'public-assets' and public.is_admin());

drop policy if exists "Admins update public-assets" on storage.objects;
create policy "Admins update public-assets"
  on storage.objects for update
  using (bucket_id = 'public-assets' and public.is_admin());

drop policy if exists "Admins delete public-assets" on storage.objects;
create policy "Admins delete public-assets"
  on storage.objects for delete
  using (bucket_id = 'public-assets' and public.is_admin());

-- Private bucket: only admins and approved users may read; only admins write.
drop policy if exists "Approved read private-assets" on storage.objects;
create policy "Approved read private-assets"
  on storage.objects for select
  using (bucket_id = 'private-assets' and public.is_approved());

drop policy if exists "Admins write private-assets" on storage.objects;
create policy "Admins write private-assets"
  on storage.objects for insert
  with check (bucket_id = 'private-assets' and public.is_admin());

drop policy if exists "Admins update private-assets" on storage.objects;
create policy "Admins update private-assets"
  on storage.objects for update
  using (bucket_id = 'private-assets' and public.is_admin());

drop policy if exists "Admins delete private-assets" on storage.objects;
create policy "Admins delete private-assets"
  on storage.objects for delete
  using (bucket_id = 'private-assets' and public.is_admin());

-- ==============================================================================
-- MAKING AN ACCOUNT AN ADMIN
-- After creating the user in Supabase -> Authentication -> Users, run:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- The `handle_new_user` trigger above creates the profile row automatically
-- on sign-up, so the row already exists by the time you run this.
-- ==============================================================================
