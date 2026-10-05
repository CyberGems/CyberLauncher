import type { CyberBotEmotion } from './companionTypes';

export function cyberBotNotificationEmotion(notification: {
  type: 'success' | 'info' | 'error' | 'warning';
  action?: string;
}): CyberBotEmotion {
  if (notification.action === 'open-hud-storage') return 'storage';
  if (notification.type === 'error' || notification.type === 'warning') return 'alert';
  return notification.type === 'success' ? 'success' : 'speaking';
}
