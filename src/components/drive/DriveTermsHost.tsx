import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DRIVE_LIVE, DRIVE_TERMS_EVENT, prefetchDriveTerms } from '@/lib/givingDrive';

const DriveTermsDialog = lazy(() => prefetchDriveTerms() as Promise<typeof import('./DriveTermsDialog')>);

/**
 * Mounted once at app level: opens the Holiday Giving Drive pop-up (prizes and terms) whenever the
 * header bar or the hero sticker asks for it (openDriveTerms). Its code loads on the first request,
 * so pages never carry it up front. A page change closes it.
 */
export function DriveTermsHost() {
  const [requested, setRequested] = useState(false);
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!DRIVE_LIVE) return;
    const show = (event: Event) => {
      const from = (event as CustomEvent<EventTarget | null>).detail ?? document.activeElement;
      opener.current = from instanceof HTMLElement ? from : null;
      setRequested(true);
      setOpen(true);
    };
    window.addEventListener(DRIVE_TERMS_EVENT, show);
    return () => window.removeEventListener(DRIVE_TERMS_EVENT, show);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);
  const returnFocus = useCallback(() => { if (opener.current?.isConnected) opener.current.focus({ preventScroll: true }); }, []);

  if (!requested) return null;
  return (
    <Suspense fallback={null}>
      <DriveTermsDialog open={open} onOpenChange={setOpen} returnFocus={returnFocus} />
    </Suspense>
  );
}
