import { createContext } from 'react';

export type ApprovedCyberBotFace = 'launcher' | 'launcher-top' | 'default' | 'marquee'
  | 'terminal' | 'curious' | 'flight' | 'sleeping' | 'alert';

export interface CyberBotReviewState {
  face: ApprovedCyberBotFace;
  marqueeMode: 'screen' | 'paused';
  speaking: boolean;
  motion: boolean;
}

// Supplied only by the review entry point. Normal launches retain their current bot.
export const CyberBotReviewContext = createContext<CyberBotReviewState | null>(null);
