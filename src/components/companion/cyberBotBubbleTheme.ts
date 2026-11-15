/**
 * Shared CyberBot speech/prompt bubble styling tokens.
 * Keeps CyberBotPrompt, CyberSpeechBubble, and status variants visually aligned.
 */
export const CYBERBOT_BUBBLE_SURFACE = 'bg-[#080d1a]/95 backdrop-blur-2xl';
export const CYBERBOT_BUBBLE_TAIL_SURFACE = 'bg-[#080d1a]';

export type CyberBotBubbleTone = 'default' | 'alert' | 'success';

export const CYBERBOT_BUBBLE_TONES: Record<
  CyberBotBubbleTone,
  { frame: string; tailBorder: string }
> = {
  default: {
    frame:
      'border-cyan-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_20px_rgba(34,211,238,0.12)]',
    tailBorder: 'border-cyan-500/30',
  },
  alert: {
    frame:
      'border-amber-500/35 shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_20px_rgba(245,158,11,0.15)]',
    tailBorder: 'border-amber-500/35',
  },
  success: {
    frame:
      'border-emerald-500/35 shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_20px_rgba(16,185,129,0.15)]',
    tailBorder: 'border-emerald-500/35',
  },
};

