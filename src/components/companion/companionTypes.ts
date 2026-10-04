export type CyberBotEmotion = 
  | 'idle' 
  | 'happy' 
  | 'alert' 
  | 'scared' 
  | 'speaking' 
  | 'sleeping' 
  | 'wink' 
  | 'success';

export type CyberBotPosition = 'bottom-right' | 'bottom-left' | 'top-right';

export type CyberBotChatterLevel = 'full' | 'minimal';

export interface CyberBotQuietHoursConfig {
  enabled: boolean;
  from: string; // e.g. "22:00"
  to: string;   // e.g. "07:00"
}

export interface CyberBotMessage {
  id: string;
  text: string;
  detail?: string;
  emotion?: CyberBotEmotion;
  tag?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  durationMs?: number; // 0 or undefined for persistent until dismissed
  timestamp: number;
  priority?: 'low' | 'normal' | 'high';
}
