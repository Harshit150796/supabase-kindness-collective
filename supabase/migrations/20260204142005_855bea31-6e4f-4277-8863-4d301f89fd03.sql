-- Add missing donor roles to all users
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'donor'::user_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = u.id AND ur.role = 'donor'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Add missing recipient roles to all users
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'recipient'::user_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = u.id AND ur.role = 'recipient'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Add missing loyalty cards for users without one
INSERT INTO loyalty_cards (user_id, card_number)
SELECT u.id, 'LC-' || UPPER(SUBSTR(MD5(u.id::text), 1, 8))
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_cards lc
  WHERE lc.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Create function to ensure both roles exist when any role is added
CREATE OR REPLACE FUNCTION public.ensure_dual_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- When a donor role is added, ensure recipient exists
  IF NEW.role = 'donor' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'recipient')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  -- When a recipient role is added, ensure donor exists
  IF NEW.role = 'recipient' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'donor')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-add opposite role on insert
CREATE TRIGGER tr_ensure_dual_roles
AFTER INSERT ON user_roles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_dual_roles();