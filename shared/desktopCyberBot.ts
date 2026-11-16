import type { LauncherApp } from './defaultApps';

export const DESKTOP_CYBERBOT_LAYOUT = {
  bubbleWidth: 440,
  bubbleHeight: 410,
  sidePadding: 36,
  bottomPadding: 20,
  avatarSize: 84,
  avatarPadding: 14,
  gap: 18,
} as const;

export interface DesktopCyberBotBubblePlacement {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  tailLeft: number;
  side: 'above' | 'below';
}

export interface DesktopCyberBotPosition {
  displayId: number;
  x: number;
  y: number;
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
  rememberPosition: boolean;
}

export interface DesktopCyberBotContext extends DesktopCyberBotCatalog {
  recentHistory: Array<Pick<DesktopCyberBotShortcut, 'name' | 'path'>>;
}

export type DesktopCyberBotSurface =
  | { kind: 'avatar'; language: DesktopCyberBotCatalog['language']; expanded: boolean }
  | { kind: 'bubble'; catalog: DesktopCyberBotContext; placement: DesktopCyberBotBubblePlacement };
