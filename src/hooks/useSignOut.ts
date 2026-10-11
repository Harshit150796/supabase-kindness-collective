import { useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { isAccountPath } from '@/components/navigation/siteLinks';

/**
 * The one sign-out action for every menu, sidebar and settings page. It always
 * signs this device out, confirms it, and leaves account-only pages for the home
 * page; on public pages people stay where they are.
 */
export function useSignOut() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const busy = useRef(false);

  return useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      await signOut();
      toast.success('Signed out', { description: 'You are signed out on this device.' });
      if (isAccountPath(location.pathname)) navigate('/', { replace: true });
    } finally {
      busy.current = false;
    }
  }, [signOut, navigate, location.pathname]);
}
