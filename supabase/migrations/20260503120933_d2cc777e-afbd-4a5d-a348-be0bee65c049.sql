
DROP TRIGGER IF EXISTS ensure_dual_roles_trigger ON public.user_roles;
CREATE TRIGGER ensure_dual_roles_trigger
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_dual_roles();
