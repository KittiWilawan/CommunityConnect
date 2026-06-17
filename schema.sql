-- 1. Create Profiles Table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  phone text,
  role text default 'member' check (role in ('member', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow individual insert of profiles" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Allow individual update of profiles" on public.profiles
  for update using (auth.uid() = id);


-- 2. Create Trigger to Auto-create Profile on auth.users Sign Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone, role, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(nullif(new.raw_user_meta_data->>'role', 'normaluser'), 'member'),
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      new.raw_user_meta_data->>'picture_url'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Remove the trigger if it already exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. Create Categories Table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text,
  description text,
  icon_name text not null,
  color text not null,
  enabled boolean default true,
  subcategories text[] default '{}'::text[]
);

-- Enable RLS on categories
alter table public.categories enable row level security;

-- Policies for categories
create policy "Allow public read access to categories" on public.categories
  for select using (true);

create policy "Allow admin write/update access to categories" on public.categories
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Populate initial categories
insert into public.categories (id, title, subtitle, description, icon_name, color, enabled, subcategories)
values 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Electricity', 'ไฟฟ้า', 'แจ้งเหตุไฟฟ้าขัดข้อง ไฟทางดับ หรือหม้อแปลงมีปัญหา', 'Zap', '#F59E0B', true, array['ไฟดับ', 'หม้อแปลงระเบิด', 'ไฟทางดับ', 'สายไฟขาด', 'ไฟฟ้าลัดวงจร']),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Water', 'น้ำประปา', 'แจ้งเหตุท่อประปาแตก คุณภาพน้ำประปา หรือปัญหาด้านการกระจายน้ำต่างๆ', 'Droplet', '#3B82F6', true, array['น้ำไม่ไหล', 'น้ำมีสี', 'ท่อแตก', 'คุณภาพน้ำ', 'น้ำรั่ว']),
  ('7c55615d-7630-4982-88e1-b8b08be2c14a', 'Weather', 'สภาพอากาศ', 'แจ้งเหตุสภาพอากาศ', 'Cloud', '#66a1ff', true, array['ฝนตกหนัก', 'ฟ้าผ่า'])
on conflict (id) do nothing;


-- 4. Create Reports Table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  category_id text,
  category_title text,
  category_color text,
  subcategory text,
  description text not null,
  contact text,
  image text, -- Store base64 or storage url
  latitude double precision,
  longitude double precision,
  location_address text,
  completion_image text, -- Admin evidence when marking as complete
  -- Optional working-time tracking fields (for timeline / SLA display)
  in_progress_at timestamp with time zone,
  completed_at timestamp with time zone,
  rejection_reason text,
  rejected_at timestamp with time zone,
  status text default 'รอดำเนินการ' check (status in ('รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น', 'ขอข้อมูลเพิ่ม', 'ปฏิเสธ')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on reports
alter table public.reports enable row level security;

-- Policies for reports
create policy "Allow read access to reports based on owner or admin role" on public.reports
  for select using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Allow users to insert their own reports" on public.reports
  for insert with check (auth.uid() = user_id);

create policy "Allow owners to delete their own reports or admins to delete any" on public.reports
  for delete using (
    auth.uid() = user_id or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Allow admins to update reports" on public.reports
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Allow owners to update their own reports" on public.reports
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 5. Grant table-level permissions to Supabase roles
-- (RLS policies alone are not enough — the role must also have GRANT access)

grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;

grant select, insert, update, delete on public.categories to authenticated;
grant select on public.categories to anon;

grant select, insert, update, delete on public.reports to authenticated;
grant select on public.reports to anon;


-- 6. Add optional profile fields
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists dark_mode boolean default false;
alter table public.profiles add column if not exists large_text boolean default false;
alter table public.profiles add column if not exists language text default 'th';


-- 7. Create Notifications Table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  content text,
  report_id uuid,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on notifications
alter table public.notifications enable row level security;

-- Policies for notifications
create policy "Users can read their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Authenticated users can insert notifications" on public.notifications
  for insert with check (true);

create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);

create policy "Users can delete their own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.notifications to authenticated;
grant select on public.notifications to anon;


-- 8. Add GPS location columns to reports (Bangkok map pin)
alter table public.reports add column if not exists latitude double precision;
alter table public.reports add column if not exists longitude double precision;
alter table public.reports add column if not exists location_address text;


-- 9. Migrate legacy normaluser role to member
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'member' where role = 'normaluser' or role is null;
alter table public.profiles alter column role set default 'member';
alter table public.profiles add constraint profiles_role_check check (role in ('member', 'admin'));
