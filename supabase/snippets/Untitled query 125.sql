UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE id = '53b9e1ec-7ee0-4275-aef2-80ef25178716';