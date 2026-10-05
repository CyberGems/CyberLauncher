import { isNotificationQuietTime, type NotificationDeliverySettings } from './notificationRouting';

export interface LaunchResult {
  success: boolean;
  error?: string;
  code?: 'not-found' | 'launch-failed';
  windowHidden?: boolean;
}

export type LaunchSpeechChannel = 'inline' | 'floating' | 'none';

export function shouldHideLauncherAfterLaunch(pinned: boolean, keepWindowOpen: boolean): boolean {
  return !pinned && !keepWindowOpen;
}

export function shouldClearToastForRendererCleanup(source?: string): boolean {
  return source !== 'launch';
}

export function chooseLaunchSpeechChannel(
  settings: NotificationDeliverySettings,
  windowHidden: boolean,
  inlineAvailable: boolean,
  floatingAvailable: boolean,
  now = new Date(),
): LaunchSpeechChannel {
  if (!settings.botEnabled || settings.chatterLevel === 'minimal' || isNotificationQuietTime(settings, now)) return 'none';
  if (windowHidden) return floatingAvailable ? 'floating' : 'none';
  return inlineAvailable ? 'inline' : 'none';
}
