export interface NotificationDeliverySettings {
  botEnabled: boolean;
  bannersEnabled: boolean;
  chatterLevel: 'full' | 'minimal';
  quietHours: { enabled: boolean; from: string; to: string };
}

export type NotificationChannel = 'bot' | 'banner' | 'none';

export function isNotificationQuietTime(settings: NotificationDeliverySettings, now = new Date()): boolean {
  if (!settings.quietHours.enabled) return false;
  const minutes = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };
  const start = minutes(settings.quietHours.from);
  const end = minutes(settings.quietHours.to);
  const current = now.getHours() * 60 + now.getMinutes();
  return start <= end ? current >= start && current < end : current >= start || current < end;
}

export function chooseNotificationChannel(
  settings: NotificationDeliverySettings,
  options: { critical: boolean; essential?: boolean; botAvailable?: boolean; now?: Date },
): NotificationChannel {
  if (settings.botEnabled) {
    // Scheduled launch countdowns remain actionable even in quiet/minimal modes.
    if (!options.critical && !options.essential && (settings.chatterLevel === 'minimal' || isNotificationQuietTime(settings, options.now))) {
      return 'none';
    }
    if (options.botAvailable !== false) return 'bot';
  }
  return settings.bannersEnabled ? 'banner' : 'none';
}
