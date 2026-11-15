import type { LauncherApp } from './defaultApps';

export const DESKTOP_CYBERBOT_LAYOUT = {
  bubbleWidth: 440,
  bubbleHeight: 410,
  sidePadding: 36,
  topPadding: 32,
  bottomPadding: 20,
  avatarSize: 84,
  avatarPadding: 14,
  gap: 8,
} as const;

export interface DesktopCyberBotPlacement {
  avatarLeft: number;
  avatarTop: number;
  bubble: {
    left: number;
    top: number;
    width: number;
    maxHeight: number;
    tailLeft: number;
    side: 'above' | 'below';
  } | null;
}

export type DesktopCyberBotDragPhase = 'start' | 'move' | 'end' | 'cancel';

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
  placement: DesktopCyberBotPlacement;
}
