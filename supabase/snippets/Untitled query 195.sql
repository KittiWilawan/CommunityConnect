UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE id = '0f29049f-2600-4199-9a31-712a54febb77' ;