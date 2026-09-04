INSERT INTO public.cms_content (content_key, content_value, content_type, section)
VALUES
  ('spotlight_goal_vouchers', '1000', 'text', 'spotlight'),
  ('spotlight_fundraiser_slug', '', 'text', 'spotlight')
ON CONFLICT DO NOTHING;