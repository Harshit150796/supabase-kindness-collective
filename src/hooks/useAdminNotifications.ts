import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { rpc } from '@/lib/adminApi';
import { toast } from '@/hooks/use-toast';

export function useAdminNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const state = useQuery({ queryKey: ['admin-unread', user?.id], enabled: !!user,
    queryFn: () => rpc<{ unread: number }>('admin_notification_state'), refetchInterval: 60_000 });
  const mark = async (scope: 'all' | 'page', ids: string[] = []) => {
    try {
      await rpc('admin_notification_state', { _mark: scope, _ids: ids });
      await Promise.all(['admin-unread', 'adm-notifs', 'admin-notifs-bell'].map((key) => qc.invalidateQueries({ queryKey: [key] })));
      return true;
    } catch (e) { toast({ title: 'Could not mark notifications read', description: (e as Error).message, variant: 'destructive' }); return false; }
  };
  return { unread: state.data?.unread ?? 0, mark, state };
}