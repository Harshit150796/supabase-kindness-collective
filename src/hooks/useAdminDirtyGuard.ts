import { useEffect } from 'react';

/** Protect unsaved admin forms on reload and link navigation without trapping focus. */
export function useAdminDirtyGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const follow = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (link && !window.confirm('Discard unsaved changes before leaving?')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', follow, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', follow, true); };
  }, [dirty]);
}