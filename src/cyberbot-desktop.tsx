import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { createRoot } from 'react-dom/client';
import {
  DESKTOP_CYBERBOT_LAYOUT,
  type DesktopCyberBotBubblePlacement,
  type DesktopCyberBotContext,
  type DesktopCyberBotDragPhase,
  type DesktopCyberBotSurface,
} from '../shared/desktopCyberBot';
import type { LaunchResult } from './launchFlow';
import { translations, type TranslationKey } from './locales';
import { CyberBotPrompt, type PromptLauncherApp } from './components/companion/CyberBotPrompt';
import { DesktopCyberBotAvatar } from './components/companion/desktop/DesktopCyberBotAvatar';
import { createCyberBotIdleCycle, createCyberBotIdleExpressionPicker, getCyberBotIdleExpressionDuration } from './components/companion/cyberBotBehavior';
import { approvedCyberBotFace } from './components/companion/approved/approvedCyberBotBehavior';
import type { CyberBotEmotion } from './components/companion/companionTypes';
import { TextFieldContextMenu } from './components/TextFieldContextMenu';
import './index.css';
import './cyberbot-desktop.css';

declare global {
  interface Window {
    desktopCyberBot?: {
      getContext: () => Promise<DesktopCyberBotSurface | null>;
      resize: (height: number) => void;
      onBubblePlacement: (callback: (placement: DesktopCyberBotBubblePlacement) => void) => () => void;
      onExpanded: (callback: (expanded: boolean) => void) => () => void;
      onActivity: (callback: () => void) => () => void;
      activity: () => void;
      avatarReady: () => void;
      toggleBubble: () => void;
      drag: (phase: DesktopCyberBotDragPhase, offset?: { x: number; y: number }) => void;
      close: () => void;
      launch: (id: number) => Promise<LaunchResult>;
    };
  }
}

const api = window.desktopCyberBot!;

function useDesktopTranslation(language: DesktopCyberBotContext['language']) {
  return useCallback((key: TranslationKey, params?: Record<string, string>) => {
    let label: string = translations[language][key];
    for (const [name, value] of Object.entries(params ?? {})) {
      label = label.replace('{' + name + '}', () => value);
    }
    return label;
  }, [language]);
}

function useCloseOnEscape() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        api.close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

function DesktopAvatarWindow({ context }: { context: Extract<DesktopCyberBotSurface, { kind: 'avatar' }> }) {
  const [expanded, setExpanded] = useState(context.expanded);
  const [sleeping, setSleeping] = useState(false);
  const [held, setHeld] = useState(false);
  const [expression, setExpression] = useState<CyberBotEmotion>('curious');
  const [expressionPicker] = useState(createCyberBotIdleExpressionPicker);
  const idle = useRef<ReturnType<typeof createCyberBotIdleCycle> | null>(null);
  const gestureRef = useRef<{ pointerId: number; x: number; y: number; grip: { x: number; y: number }; dragged: boolean } | null>(null);
  const suppressPointerClick = useRef(false);
  const t = useDesktopTranslation(context.language);
  const { avatarPadding, avatarSize } = DESKTOP_CYBERBOT_LAYOUT;
  useCloseOnEscape();

  const wake = () => idle.current?.wake();

  useLayoutEffect(() => {
    const unsubscribe = api.onExpanded(setExpanded);
    const cycle = createCyberBotIdleCycle(state => setSleeping(state === 'sleeping'));
    idle.current = cycle;
    const unsubscribeActivity = api.onActivity(() => cycle.wake());
    const frame = requestAnimationFrame(() => api.avatarReady());
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
      unsubscribeActivity();
      cycle.dispose();
      idle.current = null;
    };
  }, []);

  useEffect(() => {
    if (sleeping || held) return;
    const timer = window.setTimeout(() => setExpression(expressionPicker.next(expression, false)), getCyberBotIdleExpressionDuration(expression));
    return () => window.clearTimeout(timer);
  }, [sleeping, held, expression, expressionPicker]);

  const startGesture = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !event.isPrimary) return;
    setHeld(true);
    idle.current?.pause();
    const bounds = event.currentTarget.getBoundingClientRect();
    gestureRef.current = {
      pointerId: event.pointerId,
      x: event.screenX, y: event.screenY,
      grip: { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
      dragged: false,
    };
    suppressPointerClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveGesture = (event: PointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (!gesture.dragged) {
      if (Math.hypot(event.screenX - gesture.x, event.screenY - gesture.y) < 5) return;
      gesture.dragged = true;
      suppressPointerClick.current = true;
      api.drag('start', gesture.grip);
    }
    api.drag('move');
  };

  const finishGesture = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    setHeld(false);
    idle.current?.resume();
    if (gesture.dragged) api.drag(cancelled ? 'cancel' : 'end');
  };

  return (
    <button
      type="button"
      data-cyberbot-control
      aria-label={t(expanded ? 'cyberbot_desktop_collapse' : 'cyberbot_desktop_expand')}
      aria-expanded={expanded}
      className="desktop-cyberbot-avatar absolute rounded-2xl focus-visible:outline-2 focus-visible:outline-cyan-400"
      style={{ left: avatarPadding, top: avatarPadding, width: avatarSize, height: avatarSize }}
      onPointerDown={startGesture}
      onPointerEnter={wake}
      onFocus={wake}
      onPointerMove={moveGesture}
      onPointerUp={event => finishGesture(event)}
      onPointerCancel={event => finishGesture(event, true)}
      onLostPointerCapture={event => finishGesture(event, true)}
      onClick={event => {
        if (event.detail > 0 && suppressPointerClick.current) return;
        wake();
        api.toggleBubble();
      }}
    >
      <span className="pointer-events-none block" aria-hidden="true">
        <DesktopCyberBotAvatar face={approvedCyberBotFace(sleeping ? 'sleeping' : expression)} levitationRange={5.5} />
      </span>
    </button>
  );
}

function DesktopBubbleWindow({ context }: { context: Extract<DesktopCyberBotSurface, { kind: 'bubble' }> }) {
  const { catalog } = context;
  const [bubble, setBubble] = useState(context.placement);
  const [expanded, setExpanded] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const launchingRef = useRef(false);
  const [feedback, setFeedback] = useState('');
  const [launching, setLaunching] = useState(false);
  const t = useDesktopTranslation(catalog.language);
  useCloseOnEscape();

  useLayoutEffect(() => {
    document.body.dataset.cyberbotBubble = expanded ? 'open' : 'folded';
    document.body.inert = !expanded;
    if (expanded) {
      bubbleRef.current?.querySelector('input')?.focus({ preventScroll: true });
      api.activity();
    } else {
      window.dispatchEvent(new Event('cyber-hide-tooltips'));
    }
  }, [expanded]);

  useLayoutEffect(() => {
    const element = bubbleRef.current;
    if (!element) return;
    const unsubscribePlacement = api.onBubblePlacement(setBubble);
    const unsubscribeExpanded = api.onExpanded(setExpanded);
    let previousHeight = 0;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height = Math.ceil(element.getBoundingClientRect().height);
        if (height === previousHeight) return;
        const report = () => {
          previousHeight = height;
          api.resize(height);
        };
        // On open, allow the hidden window to paint the new prompt before revealing it.
        if (previousHeight === 0) frame = requestAnimationFrame(report);
        else report();
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => {
      observer.disconnect();
      unsubscribePlacement();
      unsubscribeExpanded();
      cancelAnimationFrame(frame);
    };
  }, []);

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
      setFeedback(detail ? error + ' ' + detail : error);
    } catch (error) {
      console.error('[CYBERBOT] Could not launch shortcut:', error);
      setFeedback(t('launch_failed_message', { name: shortcut.name }));
    } finally {
      launchingRef.current = false;
      setLaunching(false);
    }
  };

  return (
    <div ref={bubbleRef} className="absolute" data-bubble-side={bubble.side} style={{ left: bubble.left, top: bubble.top, width: bubble.width }}
      onPointerEnter={api.activity} onPointerDown={api.activity} onKeyDown={api.activity} onWheel={api.activity}>
      <CyberBotPrompt
        isOpen
        onClose={api.close}
        t={t}
        apps={catalog.apps}
        favoriteIds={catalog.favoriteIds}
        recentHistory={catalog.recentHistory}
        onLaunchApp={shortcut => { void launch(shortcut); }}
        desktop={{ maxHeight: bubble.maxHeight, tailLeft: bubble.tailLeft, side: bubble.side, launching, feedback }}
      />
      <TextFieldContextMenu t={t} />
    </div>
  );
}

if (api) {
  void api.getContext().then(context => {
    if (!context) return;
    document.documentElement.lang = context.kind === 'avatar' ? context.language : context.catalog.language;
    if (context.kind === 'bubble') {
      document.body.setAttribute('data-tooltips-enabled', String(context.catalog.enableTooltips));
      document.body.dataset.cyberbotBubble = 'folded';
    }
    createRoot(document.getElementById('root')!).render(context.kind === 'avatar'
      ? <DesktopAvatarWindow context={context} />
      : <DesktopBubbleWindow context={context} />);
  }).catch(error => {
    console.error('[CYBERBOT] Could not prepare desktop view:', error);
    api.close();
  });
}
