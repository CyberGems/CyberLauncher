import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DESKTOP_CYBERBOT_LAYOUT, type DesktopCyberBotContext } from '../shared/desktopCyberBot';
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
      close: () => void;
      launch: (id: number) => Promise<LaunchResult>;
    };
  }
}

function DesktopCyberBot({ context }: { context: DesktopCyberBotContext }) {
  const shellRef = useRef<HTMLElement>(null);
  const launchingRef = useRef(false);
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

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    let previousHeight = 0;
    const resize = () => {
      const height = Math.ceil(shell.getBoundingClientRect().height);
      if (height === previousHeight) return;
      previousHeight = height;
      api.resize(height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(shell);
    resize();
    return () => observer.disconnect();
  }, [api]);

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

  return (
    <main
      ref={shellRef}
      className="flex flex-col items-end gap-2"
      style={{
        paddingInline: DESKTOP_CYBERBOT_LAYOUT.sidePadding,
        paddingTop: DESKTOP_CYBERBOT_LAYOUT.topPadding,
        paddingBottom: DESKTOP_CYBERBOT_LAYOUT.bottomPadding,
      }}
    >
      <CyberBotPrompt
        isOpen
        onClose={api.close}
        t={t}
        apps={context.apps}
        favoriteIds={context.favoriteIds}
        recentHistory={context.recentHistory}
        onLaunchApp={shortcut => { void launch(shortcut); }}
        desktop={{ resultsHeight: context.resultsHeight, launching, feedback }}
      />
      <div data-cyberbot-control className="h-[84px] pr-[5px]" aria-hidden="true">
        <DesktopCyberBotAvatar face="curious" />
      </div>
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
