-- Supabase Database Schema & RLS Policies Setup
-- Targets: properties, staff_profiles, guest_register, and storage.objects for private bucket "guest-identities"

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. TABLES SETUP
-- =========================================================================

-- Create properties table
create table if not exists public.properties (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    location text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create staff profiles table (links to Supabase auth.users)
create table if not exists public.staff_profiles (
    id uuid references auth.users on delete cascade primary key,
    property_id uuid references public.properties(id) on delete set null,
    role text not null check (role in ('admin', 'receptionist')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create guest register table
create table if not exists public.guest_register (
    id uuid default gen_random_uuid() primary key,
    property_id uuid references public.properties(id) on delete restrict not null,
    villa_type text not null check (villa_type in ('Full Property', 'Upper Side Villa', 'Downside Villa')),
    guest_name text not null,
    phone text not null,
    email text,
    nationality text not null default 'Indian',
    purpose_of_visit text not null check (purpose_of_visit in ('Leisure', 'Business', 'Personal', 'Other')) default 'Leisure',
    arriving_from text,
    proceeding_to text,
    check_in timestamp with time zone default timezone('utc'::text, now()) not null,
    expected_checkout timestamp with time zone,
    number_of_guests integer default 1 not null,
    id_type text not null check (id_type in ('Aadhaar', 'Passport', 'Driving License', 'PAN Card', 'Voter ID', 'Other')),
    id_number text,                         -- Document text input (e.g. Aadhaar number)
    id_storage_path text not null,          -- Storage path for the ID image (e.g., "property_id/guest_id/id_card.png")
    digital_signature_path text not null,   -- Storage path for the signature image
    consent_given boolean default false check (consent_given = true) not null, -- DPDP strict requirement
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 2. ENABLE ROW-LEVEL SECURITY (RLS)
-- =========================================================================
alter table public.properties enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.guest_register enable row level security;

-- =========================================================================
-- 3. SECURITY DEFINER HELPER FUNCTIONS
-- =========================================================================
-- These run with administrative privileges to prevent recursive policy errors

create or replace function public.get_user_role(user_id uuid)
returns text as $$
  select role from public.staff_profiles where id = user_id;
$$ language sql security definer;

create or replace function public.get_user_property(user_id uuid)
returns uuid as $$
  select property_id from public.staff_profiles where id = user_id;
$$ language sql security definer;

-- =========================================================================
-- 4. TABLE POLICIES
-- =========================================================================

-- PROPERTIES POLICIES
create policy "Allow all authenticated staff to view properties" 
on public.properties
for select 
to authenticated 
using (true);

create policy "Allow admins to perform all operations on properties" 
on public.properties
for all 
to authenticated 
using (
    public.get_user_role(auth.uid()) = 'admin'
);

-- STAFF PROFILES POLICIES
create policy "Allow users to view their own profile or admins to view all" 
on public.staff_profiles
for select 
to authenticated 
using (
    auth.uid() = id or public.get_user_role(auth.uid()) = 'admin'
);

create policy "Allow admins to manage all staff profiles" 
on public.staff_profiles
for all 
to authenticated 
using (
    public.get_user_role(auth.uid()) = 'admin'
);

-- GUEST REGISTER POLICIES
create policy "Staff can view guest records based on role and property scope" 
on public.guest_register
for select 
to authenticated 
using (
    public.get_user_role(auth.uid()) = 'admin' or
    (public.get_user_role(auth.uid()) = 'receptionist' and property_id = public.get_user_property(auth.uid()))
);

create policy "Allow anyone to insert guest records anonymously" 
on public.guest_register
for insert 
to public 
with check (true);

create policy "Only admins can update or delete guest records" 
on public.guest_register
for all 
to authenticated 
using (
    public.get_user_role(auth.uid()) = 'admin'
);

-- =========================================================================
-- 5. STORAGE BUCKET & OBJECTS SETUP
-- =========================================================================

-- Register private bucket 'guest-identities' if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'guest-identities', 
    'guest-identities', 
    false, -- STRICTLY PRIVATE
    10485760, -- 10MB limit
    '{image/jpeg,image/png,image/webp}'
)
on conflict (id) do nothing;

-- Enable RLS on storage.objects (Commented out: Supabase manages this; direct alters throw ownership errors)
-- alter table storage.objects enable row level security;

-- Create Storage Policies (Commented out: please create these visually in Storage -> Policies)
-- create policy "Allow anyone to upload guest identity files anonymously"
-- on storage.objects
-- for insert
-- to public
-- with check (
--     bucket_id = 'guest-identities'
-- );

-- create policy "Allow staff to read guest identity files based on role scope"
-- on storage.objects
-- for select
-- to authenticated
-- using (
--     bucket_id = 'guest-identities' and (
--         public.get_user_role(auth.uid()) = 'admin' or
--         (
--             public.get_user_role(auth.uid()) = 'receptionist' and
--             (storage.foldername(name))[1] = public.get_user_property(auth.uid())::text
--         )
--     )
-- );

-- create policy "Only admins can delete or update files in guest-identities"
-- on storage.objects
-- for all
-- to authenticated
-- using (
--     bucket_id = 'guest-identities' and 
--     public.get_user_role(auth.uid()) = 'admin'
-- );

-- =========================================================================
-- 6. SEED DATA (INITIAL PROPERTIES SETUP)
-- =========================================================================
-- Seeds the two resorts in Azhikode, Thrissur, Kerala
insert into public.properties (id, name, location)
values 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Pantai Retreat Villa', 'Azhikode, Thrissur, Kerala'),
  ('f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c', 'Ocean Pals Two Villas', 'Azhikode, Thrissur, Kerala')
on conflict (id) do nothing;
