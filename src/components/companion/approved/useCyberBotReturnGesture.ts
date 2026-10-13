import { useLayoutEffect, useState, type RefObject } from 'react';
import type { CyberBotReturnGesture, CyberBotReturnKind } from '../cyberBotReturn';

export function useCyberBotReturnGesture(
  root: RefObject<HTMLDivElement | null>, signal: CyberBotReturnGesture | undefined,
  ready: boolean, blocked: boolean, reducedMotion: boolean,
) {
  const [pending, setPending] = useState<CyberBotReturnGesture | null>(null);
  const [reaction, setReaction] = useState<CyberBotReturnKind | null>(null);
  // Each signal has one short opportunity. Never replay after a drag, alert or hidden window.
  useLayoutEffect(() => {
    setPending(signal ?? null);
    setReaction(null);
    if (!signal) return;
    const timer = window.setTimeout(() => setPending(null), 2200);
    return () => window.clearTimeout(timer);
  }, [signal?.id]);

  useLayoutEffect(() => {
    if (!pending || blocked || reducedMotion) {
      setReaction(null);
      if (blocked || reducedMotion) setPending(null);
      return;
    }
    if (!ready || !root.current) { setReaction(null); return; }
    setReaction(pending.kind);
    const timer = window.setTimeout(() => { setReaction(null); setPending(null); }, 800);
    return () => window.clearTimeout(timer);
  }, [pending, ready, blocked, reducedMotion, root]);
  return reaction;
}
