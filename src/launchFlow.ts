import { isNotificationQuietTime, type NotificationDeliverySettings } from './notificationRouting';

export interface LaunchResult {
  success: boolean;
  error?: string;
  code?: 'not-found' | 'launch-failed';
  windowHidden?: boolean;
  pinned?: boolean;
}

export type LaunchSpeechChannel = 'inline' | 'floating' | 'none';

export function shouldHideLauncherAfterLaunch(pinned: boolean, keepWindowOpen: boolean): boolean {
  return !pinned && !keepWindowOpen;
}

export function shouldClearToastForRendererCleanup(source?: string): boolean {
  return source !== 'launch';
}

export const PIN_LAUNCH_HINT_COOLDOWN_MS = 45_000;
export const PIN_BLUR_REMINDER_DELAY_MS = 800;
export const PIN_BLUR_REMINDER_COOLDOWN_MS = 90_000;
export const PIN_LAUNCH_BLUR_GUARD_MS = 10_000;

export function shouldMentionPinOnLaunch(now: number, lastHintAt: number): boolean {
  return !lastHintAt || now - lastHintAt >= PIN_LAUNCH_HINT_COOLDOWN_MS;
}

export function shouldRemindPinOnBlur(now: number, lastLaunchAt: number, lastReminderAt: number): boolean {
  return (!lastLaunchAt || now - lastLaunchAt >= PIN_LAUNCH_BLUR_GUARD_MS)
    && (!lastReminderAt || now - lastReminderAt >= PIN_BLUR_REMINDER_COOLDOWN_MS);
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
