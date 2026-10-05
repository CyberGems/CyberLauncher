import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  X, Github, RefreshCw, Download, CheckCircle2, SkipForward,
  Tag, ClipboardCopy, Check, Gem, Globe, BookOpen, Bug, Heart, ExternalLink
} from 'lucide-react';
import Tooltip from './Tooltip';
import { EscKeyBadge } from './KeyBadge';
import { TranslationKey } from './locales';

const REPO_URL = 'https://github.com/CyberGems/CyberLauncher';
export const SKIPPED_UPDATE_KEY = 'cyberlauncher_skipped_update_version';

export function isSkippedUpdateVersion(
  version: string | null | undefined,
  skippedVersion: string | null | undefined
): boolean {
  if (!version || !skippedVersion) return false;
  const normalize = (v: string) => v.trim().toLowerCase().replace(/^v+/, '');
  return normalize(version) === normalize(skippedVersion);
}

export function githubReleaseUrl(version: string): string {
  const tag = version.startsWith('v') ? version : `v${version}`;
  return `${REPO_URL}/releases/tag/${tag}`;
}

/**
 * Extracts language-specific release notes section from GitHub Markdown.
 * Mirrors CyberClock update parsing standard:
 * - When language is 'es', looks for explicit comments or <details>...Español...</summary>...
 * - When language is 'en', strips Spanish <details> block so English stays clean.
 */
export function extractLanguageSection(markdown: string, language: 'es' | 'en' = 'en'): string {
  if (!markdown) return '';

  // 1. Check for explicit comment tags: <!-- lang:es --> ... <!-- /lang:es -->
  const commentRegex = new RegExp(`<!--\\s*lang:${language}\\s*-->([\\s\\S]*?)<!--\\s*/lang:${language}\\s*-->`, 'i');
  const commentMatch = markdown.match(commentRegex);
  if (commentMatch && commentMatch[1]?.trim()) {
    return commentMatch[1].trim();
  }

  // 2. Check for details summary block or header in Spanish: <summary>...Español...</summary>
  if (language === 'es') {
    const esBlockRegex = /(?:<details>[\s\S]*?<summary>[\s\S]*?(?:español|spanish)[\s\S]*?<\/summary>([\s\S]*?)<\/details>)|(?:#{2,4}\s*(?:.*?(?:español|novedades|cambios).*?)\r?\n([\s\S]*?)(?=(?:#{2,4}\s)|<\/details>|$))/i;
    const esMatch = markdown.match(esBlockRegex);
    const content = esMatch ? (esMatch[1] || esMatch[2]) : null;
    if (content && content.trim()) {
      return content.trim();
    }
  }

  // 3. Fallback: if user is on English, or no Spanish block exists, exclude any Spanish details blocks so English remains clean
  return markdown.replace(/<details>[\s\S]*?<summary>[\s\S]*?(?:español|spanish)[\s\S]*?<\/summary>[\s\S]*?<\/details>/gi, '');
}

/** Plain-text teaser of GitHub release notes for toasts, localized to the user language. */
export function peekReleaseNotes(body: string, language: 'es' | 'en' = 'en', maxChars = 240): string {
  if (!body) return '';
  const section = extractLanguageSection(body, language);

  if (language !== 'es') {
    const summaryMatch = section.match(/<!--\s*changelog-summary:start\s*-->([\s\S]*?)<!--\s*changelog-summary:end\s*-->/i);
    if (summaryMatch && summaryMatch[1]?.trim()) {
      const summary = summaryMatch[1].replace(/[*_~`]/g, '').replace(/\s+/g, ' ').trim();
      return summary.length <= maxChars ? summary : `${summary.slice(0, maxChars).trimEnd()}…`;
    }
  }

  const lines = section
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      if (/^<!--[\s\S]*?-->$/.test(line)) return false;
      if (/^<[^>]+>$/.test(line)) return false;
      if (/^---+$/.test(line)) return false;
      if (/^#{1,6}\s+/.test(line)) return false;
      if (/^>\s+/.test(line)) return false;
      if (/^\|/.test(line)) return false;
      if (/^Release Notes/i.test(line)) return false;
      if (/^Full Changelog/i.test(line)) return false;
      return true;
    })
    .map((line) =>
      line
        .replace(/^[-*+]\s+/, '• ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[*_~]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean);

  const text = lines.slice(0, 3).join('\n');
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

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

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string; releaseNotes?: string; releaseUrl?: string }
  | { state: 'not-available'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string; releaseNotes?: string; releaseUrl?: string }
  | { state: 'skipped'; version: string; releaseNotes?: string; releaseUrl?: string }
  | { state: 'error'; message: string };

type Props = {
  language: 'es' | 'en';
  t: (key: TranslationKey, variables?: Record<string, string>) => string;
  autoUpdate: boolean;
  onAutoUpdateChange: (enabled: boolean) => void;
  onClose: () => void;
  isElectron: boolean;
  autoCheckSeq?: number;
  showSuiteRecommendations?: boolean;
  onSkipUpdateVersion?: (version: string) => void;
};

function platformLabel(platform: string): string {
  if (platform === 'win32') return 'Windows';
  if (platform === 'darwin') return 'macOS';
  if (platform === 'linux') return 'Linux';
  return platform;
}

export default function AboutModal({
  language,
  t,
  autoUpdate,
  onAutoUpdateChange,
  onClose,
  isElectron,
  autoCheckSeq,
  showSuiteRecommendations = true,
  onSkipUpdateVersion,
}: Props) {
  const [versions, setVersions] = useState<AppVersions | null>(null);
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const [diagCopied, setDiagCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHandledSeqRef = useRef(0);

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
    window.electronAPI.getUpdateStatus?.().then((s) => {
      if (s) {
        const skipped = localStorage.getItem(SKIPPED_UPDATE_KEY);
        if (s.state === 'available' && isSkippedUpdateVersion(s.version, skipped)) {
          setStatus({ state: 'skipped', version: s.version, releaseNotes: s.releaseNotes, releaseUrl: s.releaseUrl });
        } else {
          setStatus(s as UpdateStatus);
        }
      }
    }).catch(() => {});
    const off = window.electronAPI.onUpdateStatus?.((s) => {
      const skipped = localStorage.getItem(SKIPPED_UPDATE_KEY);
      if (s.state === 'available' && isSkippedUpdateVersion(s.version, skipped)) {
        setStatus({ state: 'skipped', version: s.version, releaseNotes: s.releaseNotes, releaseUrl: s.releaseUrl });
      } else {
        setStatus(s as UpdateStatus);
      }
    });
    return () => {
      off?.();
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
    if (!window.electronAPI?.checkForUpdates) {
      setStatus({ state: 'error', message: 'Updater unavailable in this environment' });
      return;
    }
    setStatus({ state: 'checking' });
    try {
      const res = await window.electronAPI.checkForUpdates();
      if (!res?.ok) {
        setStatus({ state: 'error', message: res?.error || 'Update check failed' });
        return;
      }
      setStatus((prev) =>
        prev.state === 'checking'
          ? { state: 'not-available', version: res.version || appVersion }
          : prev
      );
    } catch (e) {
      setStatus({ state: 'error', message: String((e as Error)?.message || e) });
    }
  }, [appVersion]);

  const handleSkip = useCallback(() => {
    if (status.state === 'available') {
      localStorage.setItem(SKIPPED_UPDATE_KEY, status.version);
      setStatus({ state: 'skipped', version: status.version, releaseNotes: status.releaseNotes, releaseUrl: status.releaseUrl });
      onSkipUpdateVersion?.(status.version);
    }
  }, [status, onSkipUpdateVersion]);

  useEffect(() => {
    if (autoCheckSeq && autoCheckSeq > lastHandledSeqRef.current) {
      lastHandledSeqRef.current = autoCheckSeq;
      void handleCheck();
    }
  }, [autoCheckSeq, handleCheck]);

  const handleDownload = async () => {
    await window.electronAPI?.downloadUpdate?.();
  };

  const handleInstall = () => {
    window.electronAPI?.installUpdate?.();
  };

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

        <div className="overflow-y-auto custom-scrollbar px-7 pb-4 text-center z-10">
          <div className="relative w-[72px] h-[72px] mx-auto mb-3.5 flex items-center justify-center">
            <img
              src="./icon.png"
              srcSet="./icon-16.png 16w, ./icon-24.png 24w, ./icon-32.png 32w, ./icon-48.png 48w, ./icon-256.png 256w, ./icon.png 1024w"
              sizes="72px"
              className="w-[72px] h-[72px] drop-shadow-[0_0_8px_rgba(34,211,238,0.28)]"
              alt="CyberLauncher"
            />
          </div>

          <h1 className="text-[26px] font-cyber font-bold tracking-wide text-white mb-1">
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

            <UpdateStatusLine status={status} t={t} />

            {(status.state === 'available' || status.state === 'downloaded' || (status.state === 'skipped' && Boolean(status.releaseNotes))) && (
              <ReleaseNotesPanel
                status={status as any}
                currentVersion={appVersion}
                language={language}
                t={t}
              />
            )}

            <div className="space-y-2">
              {status.state === 'available' ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => openUrl(status.releaseUrl || githubReleaseUrl(status.version))}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 px-1.5 rounded-xl text-[11px] font-cyber font-bold tracking-wide bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('about_view_release')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 px-1.5 rounded-xl text-[11px] font-cyber font-bold tracking-wide bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 hover:border-slate-500/40 transition-colors cursor-pointer"
                  >
                    <SkipForward className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{t('about_skip_btn')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 px-1.5 rounded-xl text-[11px] font-cyber font-bold tracking-wide bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{versions?.isPortable ? t('about_download_portable') : t('about_download_btn')}</span>
                  </button>
                </div>
              ) : status.state === 'skipped' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openUrl(status.releaseUrl || githubReleaseUrl(status.version))}
                      className="flex items-center justify-center gap-1.5 w-full py-2 px-2 rounded-xl text-[11px] font-cyber font-bold tracking-wide bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t('about_view_release')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex items-center justify-center gap-1.5 w-full py-2 px-2 rounded-xl text-[11px] font-cyber font-bold tracking-wide bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{versions?.isPortable ? t('about_download_portable') : t('about_download_btn')}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheck}
                    disabled={status.state === 'checking'}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-cyber font-bold tracking-wider bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${status.state === 'checking' ? 'animate-spin' : ''}`} />
                    {t('about_check_updates')}
                  </button>
                </div>
              ) : status.state === 'downloaded' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openUrl(status.releaseUrl || githubReleaseUrl(status.version))}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 px-2 rounded-xl text-[11px] font-cyber font-bold tracking-wide bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('about_view_release')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleInstall}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 px-2 rounded-xl text-[11px] font-cyber font-bold tracking-wide bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('about_install_btn')}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={status.state === 'checking' || status.state === 'downloading'}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-cyber font-bold tracking-wider bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${status.state === 'checking' ? 'animate-spin' : ''}`} />
                  {t('about_check_updates')}
                </button>
              )}

              <div className="flex items-center justify-between px-1 py-1.5 pt-1">
                <div className="flex flex-col text-left pr-3">
                  <span className="text-xs text-slate-200 font-medium leading-tight">{t('about_auto_updates')}</span>
                  <span className="text-[11px] text-slate-400 leading-snug mt-0.5">{t('about_auto_updates_desc')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onAutoUpdateChange(!autoUpdate)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer ${
                    autoUpdate ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                  aria-pressed={autoUpdate}
                  aria-label={t('about_auto_updates')}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow ${
                    autoUpdate ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
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

function UpdateStatusLine({
  status,
  t,
}: {
  status: UpdateStatus;
  t: (key: TranslationKey, variables?: Record<string, string>) => string;
}) {
  if (status.state === 'idle') return null;

  if (status.state === 'downloading') {
    return (
      <div className="text-center text-xs text-slate-400 mb-2.5 font-medium">
        {t('about_status_downloading', { percent: String(status.percent) })}
      </div>
    );
  }

  const color =
    status.state === 'error' ? 'text-red-400'
      : status.state === 'available' ? 'text-cyan-400'
      : status.state === 'downloaded' || status.state === 'not-available' ? 'text-emerald-400'
      : status.state === 'skipped' ? 'text-slate-400'
      : 'text-slate-400';

  const text =
    status.state === 'checking' ? t('about_status_checking')
      : status.state === 'not-available' ? t('about_status_latest')
      : status.state === 'available' ? t('about_status_available', { version: status.version })
      : status.state === 'downloaded' ? t('about_status_downloaded', { version: status.version })
      : status.state === 'skipped' ? t('about_status_skipped', { version: status.version })
      : status.state === 'error' ? t('about_status_error')
      : '';

  return (
    <div className={`text-center text-xs mb-2.5 font-medium ${color}`}>
      {text}
      {status.state === 'error' && status.message && (
        <div className="mt-1 text-[10px] text-slate-600 break-words font-normal">
          {status.message}
        </div>
      )}
    </div>
  );
}

function ReleaseNotesPanel({
  status,
  currentVersion,
  language,
  t,
}: {
  status: Extract<UpdateStatus, { state: 'available' } | { state: 'downloaded' } | { state: 'skipped' }>;
  currentVersion: string;
  language: 'es' | 'en';
  t: (key: TranslationKey, variables?: Record<string, string>) => string;
}) {
  return (
    <div className="mb-3 space-y-2.5 text-left">
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
        <div>
          <div className="text-[10px] font-cyber font-bold uppercase tracking-wider text-slate-500 mb-1">
            {t('about_current_version')}
          </div>
          <span className="inline-block text-[11px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded">
            v{currentVersion || '…'}
          </span>
        </div>
        <div>
          <div className="text-[10px] font-cyber font-bold uppercase tracking-wider text-cyan-400/80 mb-1">
            {t('about_latest_version')}
          </div>
          <span className="inline-block text-[11px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
            v{status.version}
          </span>
        </div>
      </div>

      {status.releaseNotes && (
        <div>
          <div className="text-[10px] font-cyber font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            {t('about_release_notes')}
          </div>
          <div className="min-h-[6.5rem] max-h-[200px] overflow-y-auto custom-scrollbar rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 text-left text-[12.5px] leading-relaxed text-slate-300">
            <ReleaseNotes body={status.releaseNotes} language={language} />
          </div>
        </div>
      )}

    </div>
  );
}

function cleanMarkdownChangelog(raw: string, language: 'es' | 'en' = 'en'): string {
  const section = extractLanguageSection(raw, language);
  const lines = section.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
  const filtered: string[] = [];
  let inTableOrDownloads = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      filtered.push('');
      continue;
    }
    // Filter out HTML noise & comments
    if (/^<!--[\s\S]*?-->$/.test(trimmed)) continue;
    if (/^<\/?(?:details|summary|p|img|div|span|b|strong)[^>]*>$/i.test(trimmed)) continue;
    // Filter out downloads and checksum sections
    if (/^#{1,4}\s*(?:📦|🔐)?\s*(?:Downloads|Paquetes|Checksums|Assets|Hashes)/i.test(trimmed)) {
      inTableOrDownloads = true;
      continue;
    }
    if (inTableOrDownloads) {
      if (/^#{1,3}\s+(?!.*(?:Downloads|Paquetes|Checksums|Assets|Hashes))/i.test(trimmed)) {
        inTableOrDownloads = false;
      } else {
        continue;
      }
    }
    if (/^\|/.test(trimmed)) continue; // Table lines
    if (/^\*Crafted with precision/i.test(trimmed)) continue;
    filtered.push(line);
  }
  return filtered.join('\n').trim();
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]*\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-white/10 px-1 py-px font-mono text-[11px] text-cyan-100/90">
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]*)\)$/);
    if (linkMatch) {
      return (
        <span key={i} className="text-cyan-300 font-medium">
          {linkMatch[1]}
        </span>
      );
    }
    return part;
  });
}

function ReleaseNotes({ body, language }: { body: string; language: 'es' | 'en' }) {
  const cleaned = cleanMarkdownChangelog(body, language);
  const lines = cleaned.split('\n');
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    const items = listItems;
    listItems = [];
    nodes.push(
      <ul key={`list-${nodes.length}`} className="my-1.5 list-disc space-y-1 pl-4 marker:text-cyan-400/70">
        {items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  };

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (heading) {
      flushList();
      nodes.push(
        <h4 key={`h-${nodes.length}`} className="mb-1 mt-2.5 first:mt-0 text-[13px] font-semibold text-slate-100">
          {renderInline(heading[1])}
        </h4>
      );
    } else if (bullet) {
      listItems.push(bullet[1]);
    } else if (!line.trim() || /^---+/.test(line.trim())) {
      flushList();
    } else {
      flushList();
      nodes.push(
        <p key={`p-${nodes.length}`} className="text-[12.5px] leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  }
  flushList();
  return <div className="space-y-0.5">{nodes}</div>;
}
