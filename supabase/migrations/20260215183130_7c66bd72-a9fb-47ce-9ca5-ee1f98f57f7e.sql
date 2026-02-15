
-- Create admin account directly in auth.users
-- Password: Admin@123 (bcrypt hashed)
DO $$
DECLARE
  admin_uid uuid := gen_random_uuid();
BEGIN
  -- Only create if admin doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@coupondonation.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'admin@coupondonation.com',
      crypt('Admin@123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"CMS Admin"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now(),
      '',
      ''
    );

    -- Create identity for the user
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      admin_uid,
      'admin@coupondonation.com',
      jsonb_build_object('sub', admin_uid::text, 'email', 'admin@coupondonation.com'),
      'email',
      now(),
      now(),
      now()
    );

    -- Create profile (the handle_new_user trigger may do this, but let's be safe)
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (admin_uid, 'admin@coupondonation.com', 'CMS Admin')
    ON CONFLICT (user_id) DO NOTHING;

    -- Assign all three roles
    INSERT INTO public.user_roles (user_id, role) VALUES
      (admin_uid, 'admin'),
      (admin_uid, 'donor'),
      (admin_uid, 'recipient')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Create loyalty card for recipient role
    INSERT INTO public.loyalty_cards (user_id, card_number)
    VALUES (admin_uid, 'LC-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;
