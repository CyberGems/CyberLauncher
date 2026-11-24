import React from 'react';
import { useCyberBotReducedMotion } from '../useCyberBotReducedMotion';
import ApprovedCyberBotAvatar from '../approved/ApprovedCyberBotAvatar';
import type { ApprovedCyberBotFace } from '../approved/CyberBotReviewContext';

export interface DesktopCyberBotState {
  face: ApprovedCyberBotFace;
  speechKey: string;
  title: string;
  detail: string;
  animateText: boolean;
}
export function DesktopCyberBotAvatar({ face, speaking = false, levitationRange }: { face: ApprovedCyberBotFace; speaking?: boolean; levitationRange?: number }) {
  const reducedMotion = useCyberBotReducedMotion();
  return <ApprovedCyberBotAvatar face={face} marqueeMode="screen"
    speaking={speaking && !reducedMotion} motion={!reducedMotion} size={84} levitationRange={levitationRange} />;
}
