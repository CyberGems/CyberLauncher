import { useEffect, useState } from 'react';

// Native events remain authoritative after initial synchronization. A document
// visibility change alone cannot identify an intentional hide reliably on Windows.
export function useLauncherVisibility() {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const api = window.electronAPI;
    let disposed = false;
    let revision = 0;
    let nativeKnown = false;
    const nativeEvent = (next: boolean) => {
      revision += 1;
      nativeKnown = true;
      setVisible(next);
    };
    const sync = () => {
      if (!api?.isLauncherVisible) {
        if (!api?.onLauncherHidden || !nativeKnown) setVisible(!document.hidden);
        return;
      }
      const request = ++revision;
      void api.isLauncherVisible().then(next => {
        if (disposed || request !== revision) return;
        nativeKnown = true;
        setVisible(next);
      }).catch(error => {
        if (disposed || request !== revision) return;
        console.warn('[VISIBILITY] Could not read launcher visibility:', error);
        if (!nativeKnown) setVisible(!document.hidden);
      });
    };
    const shown = api?.onLauncherShown?.(() => nativeEvent(true));
    const hidden = api?.onLauncherHidden?.(() => nativeEvent(false));
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    // The window may have shown between the first render and subscribing.
    sync();
    return () => {
      disposed = true;
      revision += 1;
      shown?.();
      hidden?.();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);
  return visible;
}
