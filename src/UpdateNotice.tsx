import { useMemo, useState } from 'react';
import { ExternalLink, RefreshCw, Rocket, Sparkles, X } from 'lucide-react';
import type { TranslationKey } from './locales';
import Tooltip from './Tooltip';
import { peekReleaseNotes } from './releaseNotes';
import type { PendingUpdate } from './updateState';

interface UpdateNoticeProps {
  status: PendingUpdate;
  noticeRef: (element: HTMLDivElement | null) => void;
  onDismiss: () => void;
  onSkip: (version: string) => void;
  onDownload: (version: string) => Promise<void>;
  language: 'en' | 'es';
  t: (key: TranslationKey, variables?: Record<string, string>) => string;
}

const BUTTON = 'inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const SECONDARY = `${BUTTON} text-slate-300 hover:bg-white/10 hover:text-white`;
const PRIMARY = `${BUTTON} update-notice-primary`;

export default function UpdateNotice({
  status, noticeRef, onDismiss, onSkip, onDownload, language: locale, t,
}: UpdateNoticeProps) {
  const { version, releaseUrl, releaseNotes, notesLoading, portableUrl } = status.release;
  const [actionError, setActionError] = useState<{ version: string; state: PendingUpdate['state']; message: string } | null>(null);
  const notes = useMemo(() => peekReleaseNotes(releaseNotes, locale), [releaseNotes, locale]);
  const installing = status.state === 'installing';
  const downloading = status.state === 'downloading';
  const title = {
    available: t('update_available'),
    downloading: t(status.state === 'downloading' && status.cancelling ? 'update_cancelling' : 'update_downloading'),
    downloaded: t('update_ready'),
    installing: t('update_installing'),
  }[status.state];
  const closeLabel = t(downloading ? 'update_background' : 'update_dismiss');
  const failure = (actionError?.version === version && actionError.state === status.state && actionError.message)
    || (status.state === 'available' && status.downloadFailed && t('update_download_failed'))
    || (status.state === 'downloaded' && status.installFailed && t('update_install_failed'));

  const runAction = async (action: () => Promise<void>, message: string) => {
    setActionError(null);
    try {
      await action();
    } catch (error) {
      console.error('[Updater] Could not complete the requested action:', error);
      setActionError({ version, state: status.state, message });
    }
  };

  const openExternal = async (url: string) => {
    const result = await window.electronAPI?.openExternal(url);
    if (!result?.success) throw new Error(result?.error || 'Could not open the update URL');
  };

  const formatSize = (bytes: number) => new Intl.NumberFormat(locale, {
    style: 'unit', unit: 'megabyte', maximumFractionDigits: 1,
  }).format(bytes / 1_000_000);

  return (
    <div
      ref={noticeRef}
      tabIndex={-1}
      role="dialog"
      aria-labelledby="update-notice-heading update-notice-version"
      data-no-hide
      data-cyberbot-obstacle="bounds"
      className="update-notice custom-scrollbar fixed bottom-5 right-5 z-[70] flex max-h-[calc(100%-2.5rem)] w-[510px] max-w-[calc(100%-2.5rem)] flex-col gap-3 overflow-auto rounded-xl border border-cyan-400/30 bg-slate-950 px-4 py-3.5 text-slate-200 shadow-2xl"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          if (!installing) onDismiss();
        }
      }}
    >
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
          {downloading || installing ? <RefreshCw size={16} className="motion-safe:animate-spin" />
            : status.state === 'downloaded' ? <Rocket size={16} /> : <Sparkles size={16} />}
        </span>
        <div className="flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 id="update-notice-heading" className="font-cyber text-sm font-bold text-slate-100">{title}</h2>
          <span id="update-notice-version" className="update-notice-version rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[11px] font-bold [overflow-wrap:anywhere]">
            v{version}
          </span>
        </div>
        <Tooltip label={closeLabel} placement="left">
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onDismiss}
            disabled={installing}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      <section className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
        <h3 className="font-cyber text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('about_release_notes')}</h3>
        {notes.length > 0 ? (
          <>
            <ul className="selectable-text custom-scrollbar mt-1 max-h-28 list-disc space-y-1 overflow-auto pl-4 text-xs leading-relaxed text-slate-200 [overflow-wrap:anywhere] marker:text-cyan-300">
              {notes.slice(0, 4).map((note, index) => <li key={index}>{note.text}{note.children.length > 0 && (
                <ul className="mt-1 list-[circle] space-y-0.5 pl-4 text-slate-400">
                  {note.children.map((child, childIndex) => <li key={childIndex}>{child}</li>)}
                </ul>
              )}</li>)}
            </ul>
            {notes.length > 4 && (
              <p className="mt-1 text-[11px] text-slate-400">
                {t('update_more_notes', { count: String(notes.length - 4) })}
              </p>
            )}
          </>
        ) : (
          <p className="mt-1 text-xs text-slate-400">
            {t(notesLoading ? 'update_notes_loading' : 'update_notes_unavailable')}
          </p>
        )}
      </section>

      {downloading && (
        <div className="space-y-1 text-xs text-slate-300">
          <div className="flex flex-wrap justify-between gap-x-2">
            <span id="update-progress-label">{t('update_progress')}</span>
            <span>
              {status.transferred !== undefined && status.total
                ? `${formatSize(status.transferred)} / ${formatSize(status.total)}`
                : `${status.percent}%`}
            </span>
          </div>
          <progress className="update-progress" max={100} value={status.percent} aria-labelledby="update-progress-label" />
        </div>
      )}

      {portableUrl && <p className="text-xs text-slate-400">{t('update_portable_hint')}</p>}
      {failure && <p role="alert" className="text-xs text-slate-200">{failure}</p>}

      <div className="update-notice-actions flex flex-wrap justify-end gap-1.5">
        {status.state === 'available' && (
          <>
            <button type="button" className={SECONDARY} onClick={() => {
              void runAction(() => openExternal(releaseUrl), t('update_open_failed'));
            }}>
              <ExternalLink size={13} aria-hidden="true" />
              {t('update_github')}
            </button>
            <button type="button" className={SECONDARY} onClick={() => onSkip(version)}>
              {t('update_skip')}
            </button>
            <button type="button" className={SECONDARY} onClick={onDismiss}>
              {t('update_later')}
            </button>
            <button type="button" className={PRIMARY} onClick={() => {
              if (portableUrl) {
                void runAction(() => openExternal(portableUrl), t('update_open_failed'));
              } else {
                void runAction(() => onDownload(version), t('update_download_failed'));
              }
            }}>
              {t(portableUrl ? 'update_download_portable' : 'update_now')}
            </button>
          </>
        )}
        {downloading && (
          <>
            <button type="button" className={SECONDARY} onClick={onDismiss}>{t('update_background')}</button>
            <button type="button" className={SECONDARY} disabled={status.cancelling} onClick={() => {
              void runAction(async () => { await window.electronAPI?.cancelUpdateDownload(version); }, t('update_cancel_failed'));
            }}>
              {t('update_cancel')}
            </button>
          </>
        )}
        {status.state === 'downloaded' && (
          <>
            <button type="button" className={SECONDARY} onClick={onDismiss}>{t('update_later')}</button>
            <button type="button" className={PRIMARY} onClick={() => {
              void runAction(async () => { await window.electronAPI?.installUpdate(version); }, t('update_install_failed'));
            }}>
              {t('update_restart')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
