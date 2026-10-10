import React, { useLayoutEffect, useState } from 'react';
import { useCyberBotReducedMotion } from '../useCyberBotReducedMotion';
import ApprovedCyberBotAvatar from '../approved/ApprovedCyberBotAvatar';
import type { ApprovedCyberBotFace } from '../approved/CyberBotReviewContext';

export interface DesktopCyberBotState {
  face: ApprovedCyberBotFace;
  speechKey: string;
}

export function DesktopCyberBotAvatar({ face, speechKey }: DesktopCyberBotState) {
  const reducedMotion = useCyberBotReducedMotion();
  const [speaking, setSpeaking] = useState(false);
  useLayoutEffect(() => {
    setSpeaking(true);
    const timer = window.setTimeout(() => setSpeaking(false), 1800);
    return () => window.clearTimeout(timer);
  }, [speechKey]);
  return <ApprovedCyberBotAvatar face={face} marqueeMode="screen"
    speaking={speaking && !reducedMotion} motion={!reducedMotion} size={84} />;
}
