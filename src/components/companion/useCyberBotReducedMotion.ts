import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => false;

// Motion's hook captures the initial preference. CyberBot also needs live changes.
export function useCyberBotReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
