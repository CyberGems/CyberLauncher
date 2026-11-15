import type { LauncherApp } from './defaultApps';

export const DESKTOP_CYBERBOT_LAYOUT = {
  bubbleWidth: 440,
  sidePadding: 36,
  topPadding: 32,
  bottomPadding: 20,
} as const;

export type DesktopCyberBotShortcut = Pick<LauncherApp, 'id' | 'name' | 'category' | 'usage' | 'iconPath' | 'isAdmin'> & {
  path: string;
};

export interface DesktopCyberBotCatalog {
  language: 'es' | 'en';
  apps: DesktopCyberBotShortcut[];
  favoriteIds: number[];
  enableTooltips: boolean;
}

export interface DesktopCyberBotContext extends DesktopCyberBotCatalog {
  recentHistory: Array<Pick<DesktopCyberBotShortcut, 'name' | 'path'>>;
  resultsHeight: number;
}
