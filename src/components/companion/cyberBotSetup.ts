export const CYBERBOT_SETUP_REMIND_MS = 3 * 24 * 60 * 60 * 1000;

export function isCyberBotDefaultSetup(
  apps: readonly { id: number }[],
  categories: readonly { id: string }[],
  defaultAppIds: ReadonlySet<number>,
  defaultCategoryIds: ReadonlySet<string>,
): boolean {
  return apps.every(app => defaultAppIds.has(app.id))
    && categories.every(category => defaultCategoryIds.has(category.id));
}

export function isCyberBotSetupInviteDue(lastShownAt: number, now = Date.now()): boolean {
  return !Number.isFinite(lastShownAt) || lastShownAt <= 0
    || now - lastShownAt >= CYBERBOT_SETUP_REMIND_MS;
}
