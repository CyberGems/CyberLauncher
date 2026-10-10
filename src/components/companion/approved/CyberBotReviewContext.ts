import { createContext } from 'react';

export type ApprovedCyberBotFace = 'launcher' | 'launcher-top' | 'default' | 'marquee'
  | 'terminal' | 'curious' | 'flight' | 'sleeping' | 'alert' | 'happy' | 'delighted'
  | 'affectionate' | 'sparkle' | 'wink' | 'scared' | 'storage' | 'success' | 'speaking';

export interface CyberBotReviewState {
  face: ApprovedCyberBotFace;
  marqueeMode: 'screen' | 'paused';
  speaking: boolean;
  motion: boolean;
}

// Optional overrides for inspecting the same component used by normal launches.
export const CyberBotReviewContext = createContext<CyberBotReviewState | null>(null);
