-- Update handle_new_user trigger to capture display_name and avatar_url from OAuth provider metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone, role, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(
      nullif(new.raw_user_meta_data->>'role', 'normaluser'),
      'member'
    ),
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
$$;
