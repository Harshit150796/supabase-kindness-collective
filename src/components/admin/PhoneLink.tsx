import { useQuery } from '@tanstack/react-query';
import { sb } from '@/lib/adminApi';
import { showPhone, telHref } from '@/lib/phone';
import { cn } from '@/lib/utils';

/** An account's phone number as a tap-to-call link, formatted (315) 555-0123; nothing when there is none. */
export function PhoneLink({ phone, className, empty }: { phone: string | null | undefined; className?: string; empty?: React.ReactNode }) {
  const shown = showPhone(phone);
  if (!shown || !phone) return empty ? <>{empty}</> : null;
  return <a href={telHref(phone)} onClick={(e) => e.stopPropagation()} className={cn('whitespace-nowrap text-primary underline-offset-4 hover:underline', className)}>{shown}</a>;
}

/** Phone numbers for the accounts on one page of an admin list, in one query (the team can read profiles). */
export function useProfilePhones(userIds: Array<string | null | undefined>) {
  const ids = [...new Set(userIds.filter(Boolean) as string[])].sort();
  return useQuery({
    queryKey: ['adm-phones', ids],
    enabled: ids.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await sb.from('profiles').select('user_id,phone').in('user_id', ids);
      if (error) throw error;
      return new Map(((data ?? []) as Array<{ user_id: string; phone: string | null }>).map((p) => [p.user_id, p.phone]));
    },
  });
}
