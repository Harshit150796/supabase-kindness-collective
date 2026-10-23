import { useQuery } from '@tanstack/react-query';
import { sb } from '@/lib/adminApi';

/** Unanswered contact form messages, for the admin menu and the Contact messages filter. */
export function useNewContactCount(enabled = true) {
  return useQuery({
    queryKey: ['adm-contact-new'],
    enabled,
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const { count, error } = await sb.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new');
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });
}
