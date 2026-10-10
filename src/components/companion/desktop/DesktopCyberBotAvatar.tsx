import React from 'react';
import { useCyberBotReducedMotion } from '../useCyberBotReducedMotion';
import ApprovedCyberBotAvatar from '../approved/ApprovedCyberBotAvatar';
import type { ApprovedCyberBotFace } from '../approved/CyberBotReviewContext';

export interface DesktopCyberBotState {
  face: ApprovedCyberBotFace;
  speechKey: string;
  title: string;
  detail: string;
}
export function DesktopCyberBotAvatar({ face, speaking = false }: { face: ApprovedCyberBotFace; speaking?: boolean }) {
  const reducedMotion = useCyberBotReducedMotion();
  return <ApprovedCyberBotAvatar face={face} marqueeMode="screen"
    speaking={speaking && !reducedMotion} motion={!reducedMotion} size={84} />;
}
