UPDATE auth.users
SET
  email_change = '',
  phone = '',
  phone_change = '',
  phone_change_token = '',
  email_change_token_new = '',
  email_change_token_current = '',
  reauthentication_token = '',
  email_change_confirm_status = 0,
  is_sso_user = false
WHERE email = 'admin@coupondonation.com';