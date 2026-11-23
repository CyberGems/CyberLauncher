import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  X, Github, RefreshCw,
  Tag, ClipboardCopy, Check, Gem, Globe, BookOpen, Bug, Heart
} from 'lucide-react';
import Tooltip from './Tooltip';
import { EscKeyBadge } from './KeyBadge';
import { TranslationKey } from './locales';
export { cleanMarkdownChangelog, parseReleaseBlocks } from './releaseNotes';

const REPO_URL = 'https://github.com/CyberGems/CyberLauncher';
export type AppVersions = {
  app: string;
  electron: string;
  chrome: string;
  node: string;
  platform: string;
  arch: string;
  osRelease: string;
  osType: string;
  isPortable?: boolean;
};

type CheckStatus = 'idle' | 'checking' | 'available' | 'latest' | 'error';

type Props = {
  language: 'es' | 'en';
  t: (key: TranslationKey, variables?: Record<string, string>) => string;
  onUpdateAvailable: (version: string) => void;
  onClose: () => void;
  isElectron: boolean;
  autoCheckSeq?: number;
  showSuiteRecommendations?: boolean;
};

function platformLabel(platform: string): string {
  if (platform === 'win32') return 'Windows';
  if (platform === 'darwin') return 'macOS';
  if (platform === 'linux') return 'Linux';
  return platform;
}

/** Tracks whether a scroll container is scrolled away from its top/bottom edges. */
function useEdgeFades<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [fades, setFades] = useState({ top: false, bottom: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setFades({
      top: el.scrollTop > 4,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
    });
  }, []);
  useEffect(() => {
    update();
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [update]);
  return { ref, fades, onScroll: update };
}

/** CSS mask that fades content near the scrolled edges so it does not look hard-cut. */
function edgeMaskStyle(fades: { top: boolean; bottom: boolean }): React.CSSProperties | undefined {
  if (!fades.top && !fades.bottom) return undefined;
  const topEdge = fades.top ? 'transparent 0px, black 28px' : 'black 0px';
  const bottomEdge = fades.bottom ? 'black calc(100% - 32px), transparent 100%' : 'black 100%';
  const mask = `linear-gradient(to bottom, ${topEdge}, ${bottomEdge})`;
  return { WebkitMaskImage: mask, maskImage: mask };
}

export default function AboutModal({
  language,
  t,
  onUpdateAvailable,
  onClose,
  isElectron,
  autoCheckSeq,
  showSuiteRecommendations = true,
}: Props) {
  const [versions, setVersions] = useState<AppVersions | null>(null);
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [diagCopied, setDiagCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHandledSeqRef = useRef(0);
  const mainFade = useEdgeFades<HTMLDivElement>();

  const suitePool = [
    { slug: 'cyberclock', name: 'CyberClock', pitch: t('about_suite_clock') },
    { slug: 'cyberfeeds', name: 'CyberFeeds', pitch: t('about_suite_feeds') },
    { slug: 'cybermanager', name: 'CyberManager', pitch: t('about_suite_manager') },
    { slug: 'cybernotes', name: 'CyberNotes', pitch: t('about_suite_notes') },
    { slug: 'cyberpaste', name: 'CyberPaste', pitch: t('about_suite_paste') },
    { slug: 'cybersnap', name: 'CyberSnap', pitch: t('about_suite_snap') },
    { slug: 'cybertray', name: 'CyberTray', pitch: t('about_suite_tray') },
    { slug: 'cyberviewer', name: 'CyberViewer', pitch: t('about_suite_viewer') },
    { slug: 'cyberwall', name: 'CyberWall', pitch: t('about_suite_wall') },
  ];

  const [suitePick] = useState<string[]>(() => {
    const pool = ['cyberclock', 'cyberfeeds', 'cybermanager', 'cybernotes', 'cyberpaste', 'cybersnap', 'cybertray', 'cyberviewer', 'cyberwall'];
    const picks: string[] = [];
    while (picks.length < 4 && pool.length > 0) {
      const [slug] = pool.splice(Math.floor(Math.random() * pool.length), 1);
      if (slug) picks.push(slug);
    }
    return picks;
  });

  const suiteApps = suitePick.flatMap((slug) => suitePool.filter((a) => a.slug === slug));

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;
    window.electronAPI.getAppVersions?.().then((v) => setVersions(v as AppVersions)).catch(() => {});
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const appVersion = versions?.app || '';

  const handleCheck = useCallback(async () => {
    if (!window.electronAPI) {
      setStatus('error');
      return;
    }
    setStatus('checking');
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (!result.ok) {
        setStatus('error');
      } else if (result.available) {
        setStatus('available');
        onUpdateAvailable(result.version);
      } else {
        setStatus('latest');
      }
    } catch (error) {
      console.warn('[Updater] Could not check for updates:', error);
      setStatus('error');
    }
  }, [onUpdateAvailable]);

  useEffect(() => {
    if (autoCheckSeq && autoCheckSeq > lastHandledSeqRef.current) {
      lastHandledSeqRef.current = autoCheckSeq;
      void handleCheck();
    }
  }, [autoCheckSeq, handleCheck]);

  const handleCopyDiagnostics = useCallback(async () => {
    if (!versions) return;
    const lines = [
      `CyberLauncher ${versions.app}${versions.isPortable ? ' (Portable)' : ''}`,
      `Portable: ${versions.isPortable ? 'Yes' : 'No'}`,
      `Electron: ${versions.electron}`,
      `Chrome: ${versions.chrome}`,
      `Node: ${versions.node}`,
      `OS: ${platformLabel(versions.platform)} ${versions.osRelease} (${versions.arch})`,
      `Locale: ${language}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setDiagCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setDiagCopied(false), 1800);
    } catch { /* ignore */ }
  }, [versions, language]);

  const openUrl = (url: string) => {
    if (isElectron && window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        data-cyberbot-obstacle="center"
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] bg-gradient-to-b from-[#0d1520] to-[#0a0f18] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Glass decorativo sutil interno */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
        >
          <div className="absolute -top-20 -left-16 w-52 h-52 rounded-full bg-cyan-500/[0.08] blur-3xl pointer-events-none" />
          <div className="absolute -top-12 -right-20 w-44 h-44 rounded-full bg-purple-500/[0.06] blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        <div className="flex justify-end px-4 pt-4 shrink-0 z-10">
          <Tooltip label={t('tooltip_close')} placement="left">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 px-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              aria-label={t('tooltip_close')}
            >
              <EscKeyBadge />
              <X className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        <div
          ref={mainFade.ref}
          onScroll={mainFade.onScroll}
          className="overflow-y-auto custom-scrollbar px-7 pb-4 text-center z-10"
          style={edgeMaskStyle(mainFade.fades)}
        >
          <div className="relative w-[72px] h-[72px] mx-auto mb-3.5 flex items-center justify-center">
            <img
              src="./icon.png"
              srcSet="./icon-16.png 16w, ./icon-24.png 24w, ./icon-32.png 32w, ./icon-48.png 48w, ./icon-256.png 256w, ./icon.png 1024w"
              sizes="72px"
              className="w-[72px] h-[72px] drop-shadow-[0_0_8px_rgba(34,211,238,0.28)]"
              alt="CyberLauncher"
            />
          </div>

          <h1 className="text-[26px] font-brand font-bold tracking-wide text-white mb-1">
            Cyber<span className="text-cyan-400">Launcher</span>
          </h1>
          <div className="text-xs font-cyber font-semibold text-slate-300 uppercase tracking-wider mb-3 inline-flex items-center justify-center gap-2">
            <span>{t('about_version', { version: appVersion || '…' })}</span>
            {versions?.isPortable && (
              <span className="text-[10px] font-cyber font-bold tracking-wide px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 leading-normal">
                {t('about_portable_badge')}
              </span>
            )}
          </div>

          <p className="text-[13px] text-slate-400 leading-relaxed mb-5">
            {t('about_desc')}
          </p>

          <div className="text-left mb-4">
            <div className="text-[11px] font-cyber font-bold uppercase text-cyan-400 mb-3 flex items-center gap-2 tracking-wider">
              <div className="h-px flex-1 bg-cyan-500/20" />
              <span>{t('about_section_updates')}</span>
              <div className="h-px flex-1 bg-cyan-500/20" />
            </div>

            {status !== 'idle' && (
              <div className={`mb-3 text-center text-xs ${status === 'available' ? 'text-cyan-300' : status === 'latest' ? 'text-emerald-400' : 'text-slate-400'}`} role="status">
                {t(status === 'checking' ? 'about_status_checking'
                  : status === 'available' ? 'about_status_available'
                  : status === 'latest' ? 'about_status_latest'
                  : 'about_status_error')}
              </div>
            )}
            <button
              type="button"
              onClick={handleCheck}
              disabled={status === 'checking'}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-cyber font-bold tracking-wider bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} aria-hidden="true" />
              {t('about_check_updates')}
            </button>
          </div>

          {showSuiteRecommendations && (
            <div className="text-left mb-1">
              <div className="text-[11px] font-cyber font-bold uppercase text-cyan-400 mb-2.5 flex items-center gap-2 tracking-wider">
                <div className="h-px flex-1 bg-cyan-500/20" />
                <span>{t('about_suite_title')}</span>
                <div className="h-px flex-1 bg-cyan-500/20" />
              </div>

              <div className="flex items-center justify-center gap-3 py-1">
                {suiteApps.map((app) => (
                  <Tooltip key={app.slug} label={app.pitch} placement="top">
                    <button
                      type="button"
                      onClick={() => openUrl(`https://cybergems.org/apps/${app.slug}/`)}
                      className="group p-1 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-transparent hover:border-white/10 opacity-50 hover:opacity-100 transition-all duration-200 hover:scale-105 cursor-pointer"
                      aria-label={app.pitch}
                    >
                      <img
                        src={`./suite/${app.slug}.png`}
                        alt={app.name}
                        className="w-8 h-8 rounded-lg drop-shadow-sm transition-transform group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                      />
                    </button>
                  </Tooltip>
                ))}
              </div>

              <div className="flex justify-center mt-1.5">
                <button
                  type="button"
                  onClick={() => openUrl('https://cybergems.org/#apps')}
                  className="text-[11px] font-medium text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer select-none inline-flex items-center gap-1 hover:underline"
                >
                  <span>{t('about_suite_all')}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 bg-black/30 shrink-0 z-10">
          <Tooltip label={t('about_website_tooltip')} placement="top">
            <button
              type="button"
              onClick={() => openUrl('https://cybergems.org')}
              className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer select-none"
            >
              {t('about_footer')}
            </button>
          </Tooltip>
          <div className="flex items-center gap-1">
            <Tooltip label={t('about_website_tooltip')} placement="top">
              <button
                type="button"
                onClick={() => openUrl('https://cybergems.org')}
                className="group flex items-center justify-center w-[30px] h-[30px] rounded-md hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                aria-label={t('about_website_tooltip')}
              >
                <Gem className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('about_docs_tooltip')} placement="top">
              <button
                type="button"
                onClick={() => openUrl(`${REPO_URL}/wiki`)}
                className="group flex items-center justify-center w-[30px] h-[30px] rounded-md hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                aria-label={t('about_docs_tooltip')}
              >
                <BookOpen className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('about_github_tooltip')} placement="top">
              <button
                type="button"
                onClick={() => openUrl(REPO_URL)}
                className="group flex items-center justify-center w-[30px] h-[30px] rounded-md hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                aria-label={t('about_github_tooltip')}
              >
                <Github className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('about_issues_tooltip')} placement="top">
              <button
                type="button"
                onClick={() => openUrl(`${REPO_URL}/issues`)}
                className="group flex items-center justify-center w-[30px] h-[30px] rounded-md hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                aria-label={t('about_issues_tooltip')}
              >
                <Bug className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip label={diagCopied ? t('about_diagnostics_copied') : t('about_copy_diagnostics')} placement="top">
              <button
                type="button"
                onClick={handleCopyDiagnostics}
                disabled={!versions}
                className="group flex items-center justify-center w-[30px] h-[30px] rounded-md hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer disabled:opacity-40"
                aria-label={diagCopied ? t('about_diagnostics_copied') : t('about_copy_diagnostics')}
              >
                {diagCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <ClipboardCopy className="w-4 h-4" />}
              </button>
            </Tooltip>
            <Tooltip label={t('about_releases_tooltip')} placement="top">
              <button
                type="button"
                onClick={() => openUrl(`${REPO_URL}/releases`)}
                className="group flex items-center justify-center w-[30px] h-[30px] rounded-md hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                aria-label={t('about_releases_tooltip')}
              >
                <Tag className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('about_donate_tooltip')} placement="top">
              <button
                type="button"
                onClick={() => openUrl(`${REPO_URL}#%EF%B8%8F-donate`)}
                className="group flex items-center justify-center w-[30px] h-[30px] rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                aria-label={t('about_donate_tooltip')}
              >
                <Heart className="w-4 h-4 fill-[#F43F5E] text-[#F43F5E] transition-transform group-hover:scale-110" />
              </button>
            </Tooltip>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
