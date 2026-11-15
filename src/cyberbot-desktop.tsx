import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { DESKTOP_CYBERBOT_LAYOUT, type DesktopCyberBotContext, type DesktopCyberBotDragPhase, type DesktopCyberBotPlacement } from '../shared/desktopCyberBot';
import type { LaunchResult } from './launchFlow';
import { translations, type TranslationKey } from './locales';
import { CyberBotPrompt, type PromptLauncherApp } from './components/companion/CyberBotPrompt';
import { DesktopCyberBotAvatar } from './components/companion/desktop/DesktopCyberBotAvatar';
import { TextFieldContextMenu } from './components/TextFieldContextMenu';
import './index.css';
import './cyberbot-desktop.css';

declare global {
  interface Window {
    desktopCyberBot?: {
      getContext: () => Promise<DesktopCyberBotContext | null>;
      resize: (height: number) => void;
      onPlacement: (callback: (placement: DesktopCyberBotPlacement) => void) => () => void;
      toggleBubble: () => void;
      drag: (phase: DesktopCyberBotDragPhase, offset?: { x: number; y: number }) => void;
      close: () => void;
      launch: (id: number) => Promise<LaunchResult>;
    };
  }
}

function DesktopCyberBot({ context }: { context: DesktopCyberBotContext }) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<{ pointerId: number; x: number; y: number; dragged: boolean } | null>(null);
  const suppressPointerClick = useRef(false);
  const launchingRef = useRef(false);
  const [placement, setPlacement] = useState(context.placement);
  const [feedback, setFeedback] = useState('');
  const [launching, setLaunching] = useState(false);
  const api = window.desktopCyberBot!;
  const t = useCallback((key: TranslationKey, params?: Record<string, string>) => {
    let label: string = translations[context.language][key];
    for (const [name, value] of Object.entries(params ?? {})) {
      label = label.replace(`{${name}}`, () => value);
    }
    return label;
  }, [context.language]);

  const expanded = placement.bubble !== null;
  useLayoutEffect(() => api.onPlacement(setPlacement), [api]);

  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    let previousHeight = 0;
    const resize = () => {
      const height = Math.ceil(bubble.getBoundingClientRect().height);
      if (height === previousHeight) return;
      previousHeight = height;
      api.resize(height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(bubble);
    resize();
    return () => observer.disconnect();
  }, [api, expanded]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        api.close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [api]);

  const launch = async (shortcut: PromptLauncherApp) => {
    if (launchingRef.current) return;
    launchingRef.current = true;
    setLaunching(true);
    setFeedback(t('launch_starting'));
    try {
      const result = await api.launch(shortcut.id);
      if (result.success) {
        api.close();
        return;
      }
      const error = t('launch_failed_message', { name: shortcut.name });
      const detail = result.code === 'not-found' ? t('launch_missing_path_detail')
        : result.code === 'uwp-not-found' ? t('launch_missing_uwp_detail')
        : '';
      setFeedback(detail ? `${error} ${detail}` : error);
    } catch (error) {
      console.error('[CYBERBOT] Could not launch shortcut:', error);
      setFeedback(t('launch_failed_message', { name: shortcut.name }));
    } finally {
      launchingRef.current = false;
      setLaunching(false);
    }
  };

  const startGesture = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !event.isPrimary) return;
    gestureRef.current = { pointerId: event.pointerId, x: event.screenX, y: event.screenY, dragged: false };
    suppressPointerClick.current = false;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    api.drag('start', { x: event.clientX - bounds.left, y: event.clientY - bounds.top });
  };

  const moveGesture = (event: PointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (!gesture.dragged && Math.hypot(event.screenX - gesture.x, event.screenY - gesture.y) < 5) return;
    gesture.dragged = true;
    suppressPointerClick.current = true;
    api.drag('move');
  };

  const finishGesture = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    api.drag(!cancelled && gesture.dragged ? 'end' : 'cancel');
  };

  const bubble = placement.bubble;
  return (
    <main className="relative h-full w-full">
      <button
        type="button"
        data-cyberbot-control
        aria-label={t(expanded ? 'cyberbot_desktop_collapse' : 'cyberbot_desktop_expand')}
        aria-expanded={expanded}
        aria-controls={expanded ? 'desktop-cyberbot-search' : undefined}
        className="desktop-cyberbot-avatar absolute rounded-2xl focus-visible:outline-2 focus-visible:outline-cyan-400"
        style={{
          left: placement.avatarLeft,
          top: placement.avatarTop,
          width: DESKTOP_CYBERBOT_LAYOUT.avatarSize,
          height: DESKTOP_CYBERBOT_LAYOUT.avatarSize,
        }}
        onPointerDown={startGesture}
        onPointerMove={moveGesture}
        onPointerUp={event => finishGesture(event)}
        onPointerCancel={event => finishGesture(event, true)}
        onLostPointerCapture={event => finishGesture(event, true)}
        onClick={event => {
          if (event.detail > 0 && suppressPointerClick.current) return;
          api.toggleBubble();
        }}
      >
        <span className="pointer-events-none block" aria-hidden="true">
          <DesktopCyberBotAvatar face="curious" />
        </span>
      </button>
      {bubble && (
        <div
          id="desktop-cyberbot-search"
          ref={bubbleRef}
          className="absolute"
          style={{ left: bubble.left, top: bubble.top, width: bubble.width }}
        >
          <CyberBotPrompt
            isOpen
            onClose={api.close}
            t={t}
            apps={context.apps}
            favoriteIds={context.favoriteIds}
            recentHistory={context.recentHistory}
            onLaunchApp={shortcut => { void launch(shortcut); }}
            desktop={{ maxHeight: bubble.maxHeight, tailLeft: bubble.tailLeft, side: bubble.side, launching, feedback }}
          />
        </div>
      )}
      <TextFieldContextMenu t={t} />
    </main>
  );
}

const api = window.desktopCyberBot;
if (api) {
  void api.getContext().then(context => {
    if (!context) return;
    document.documentElement.lang = context.language;
    document.body.setAttribute('data-tooltips-enabled', String(context.enableTooltips));
    createRoot(document.getElementById('root')!).render(<DesktopCyberBot context={context} />);
  }).catch(error => {
    console.error('[CYBERBOT] Could not prepare desktop prompt:', error);
    api.close();
  });
}
