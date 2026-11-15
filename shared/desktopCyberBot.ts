import type { LauncherApp } from './defaultApps';

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
