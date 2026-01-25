import { ReactNode } from 'react';
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { IdleWarningModal } from './IdleWarningModal';

interface SessionSecurityProviderProps {
  children: ReactNode;
}

export function SessionSecurityProvider({ children }: SessionSecurityProviderProps) {
  const { showWarning, remainingTime, stayActive } = useSessionSecurity();

  return (
    <>
      {children}
      <IdleWarningModal
        open={showWarning}
        remainingTime={remainingTime}
        onStayActive={stayActive}
      />
    </>
  );
}
