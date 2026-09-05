import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  X, Github, Folder, RefreshCw, Download, CheckCircle2,
  CircleDot, Tag, ClipboardCopy, Check
} from 'lucide-react';
import Tooltip from './Tooltip';
import { TranslationKey } from './locales';

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
};

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string };

type Props = {
  language: 'es' | 'en';
  t: (key: TranslationKey, variables?: Record<string, string>) => string;
  autoUpdate: boolean;
  onAutoUpdateChange: (enabled: boolean) => void;
  onClose: () => void;
  isElectron: boolean;
  autoCheck?: boolean;
  onAutoCheckHandled?: () => void;
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
  autoCheck,
  onAutoCheckHandled,
}: Props) {
  const [versions, setVersions] = useState<AppVersions | null>(null);
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const [diagCopied, setDiagCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;
    window.electronAPI.getAppVersions?.().then((v) => setVersions(v as AppVersions)).catch(() => {});
    window.electronAPI.getUpdateStatus?.().then((s) => {
      if (s) setStatus(s as UpdateStatus);
    }).catch(() => {});
    const off = window.electronAPI.onUpdateStatus?.((s) => setStatus(s as UpdateStatus));
    return () => {
      off?.();
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, [isElectron]);

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

  useEffect(() => {
    if (autoCheck) {
      onAutoCheckHandled?.();
      void handleCheck();
    }
  }, [autoCheck, handleCheck, onAutoCheckHandled]);

  const handleDownload = async () => {
    await window.electronAPI?.downloadUpdate?.();
  };

  const handleInstall = () => {
    window.electronAPI?.installUpdate?.();
  };

  const handleCopyDiagnostics = useCallback(async () => {
    if (!versions) return;
    const lines = [
      `CyberLauncher ${versions.app}`,
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
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] bg-gradient-to-b from-[#0d1520] to-[#0a0f18] border border-cyan-500/25 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.12)] flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="flex justify-end px-4 pt-4 shrink-0">
          <Tooltip label={t('tooltip_close')} placement="left">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={t('tooltip_close')}
            >
              <X className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        <div className="overflow-y-auto custom-scrollbar px-7 pb-5 text-center">
          <div className="relative w-[72px] h-[72px] mx-auto mb-4 flex items-center justify-center">
            <img
              src="./icon.png"
              srcSet="./icon-16.png 16w, ./icon-24.png 24w, ./icon-32.png 32w, ./icon-256.png 256w, ./icon.png 1024w"
              sizes="72px"
              className="w-[72px] h-[72px] drop-shadow-[0_0_8px_rgba(34,211,238,0.28)]"
              alt="CyberLauncher"
            />
          </div>

          <h1 className="text-[26px] font-cyber font-bold tracking-wide text-white mb-1">
            Cyber<span className="text-cyan-400">Launcher</span>
          </h1>
          <div className="text-[11px] font-digits font-bold text-slate-500 uppercase tracking-[0.12em] mb-3.5">
            {t('about_version', { version: appVersion || '…' })}
          </div>

          <p className="text-[13px] text-slate-400 leading-relaxed mb-6">
            {t('about_desc')}
          </p>

          <div className="text-left">
            <div className="text-[11px] font-cyber font-bold uppercase text-cyan-400 mb-3 flex items-center gap-2 tracking-wider">
              <div className="h-px flex-1 bg-cyan-500/20" />
              {t('about_maintenance')}
              <div className="h-px flex-1 bg-cyan-500/20" />
            </div>

            <UpdateStatusLine status={status} t={t} />

            <div className="grid grid-cols-1 gap-2">
              {status.state === 'available' ? (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-cyber font-bold tracking-wider bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('about_download_btn')}
                </button>
              ) : status.state === 'downloaded' ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-cyber font-bold tracking-wider bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('about_install_btn')}
                </button>
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

              <button
                type="button"
                onClick={() => window.electronAPI?.openDataFolder?.()}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-cyber font-bold tracking-wider bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 transition-colors cursor-pointer"
              >
                <Folder className="w-3.5 h-3.5" />
                {t('about_open_folder')}
              </button>

              <button
                type="button"
                onClick={handleCopyDiagnostics}
                disabled={!versions}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-cyber font-bold tracking-wider border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  diagCopied
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border-white/10'
                }`}
              >
                {diagCopied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                {diagCopied ? t('about_diagnostics_copied') : t('about_copy_diagnostics')}
              </button>

              <div className="flex items-center justify-between px-1 py-2 mt-1">
                <span className="text-xs text-slate-400 font-medium">{t('about_auto_updates')}</span>
                <button
                  type="button"
                  onClick={() => onAutoUpdateChange(!autoUpdate)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
                    autoUpdate ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                  aria-pressed={autoUpdate}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow ${
                    autoUpdate ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 bg-black/20 shrink-0">
          <div className="text-[10px] font-cyber font-semibold tracking-wider text-slate-600">
            {t('about_footer')}
          </div>
          <div className="flex items-center gap-0.5">
            <Tooltip label={t('about_github_tooltip')} placement="top">
              <button
                type="button"
                onClick={() => openUrl(REPO_URL)}
                className="p-1.5 rounded-md text-slate-500 hover:text-cyan-400 hover:bg-white/5 transition-colors"
                aria-label={t('about_github_tooltip')}
              >
                <Github className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip label={t('about_issues_tooltip')} placement="top">
              <button
                type="button"
                onClick={() => openUrl(`${REPO_URL}/issues`)}
                className="p-1.5 rounded-md text-slate-500 hover:text-cyan-400 hover:bg-white/5 transition-colors"
                aria-label={t('about_issues_tooltip')}
              >
                <CircleDot className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip label={t('about_releases_tooltip')} placement="top">
              <button
                type="button"
                onClick={() => openUrl(`${REPO_URL}/releases`)}
                className="p-1.5 rounded-md text-slate-500 hover:text-cyan-400 hover:bg-white/5 transition-colors"
                aria-label={t('about_releases_tooltip')}
              >
                <Tag className="w-3.5 h-3.5" />
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
      : 'text-slate-400';

  const text =
    status.state === 'checking' ? t('about_status_checking')
      : status.state === 'not-available' ? t('about_status_latest')
      : status.state === 'available' ? t('about_status_available', { version: status.version })
      : status.state === 'downloaded' ? t('about_status_downloaded', { version: status.version })
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
