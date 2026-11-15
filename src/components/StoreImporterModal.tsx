import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownAZ, ArrowUpZA, LoaderCircle, PackagePlus, RefreshCw, Search, X } from 'lucide-react';
import type { TranslationKey } from '../locales';
import type { StoreAppDiscoveryProgress } from '../../shared/storeApps';
import Tooltip from '../Tooltip';
import type { CustomSelectOption } from './CustomSelect';
import { MODAL_SHADOW_CYAN } from './modalTheme';
import { OverflowMarquee } from './OverflowMarquee';
import { UwpImportConfirmModal, type UwpImportAppPreview } from './UwpImportConfirmModal';

const PREVIEW_APPS: UwpImportAppPreview[] = [
  { name: 'WhatsApp', aumid: '5319275A.WhatsAppDesktop_cv1g1gvanyjgm!App', icon: '' },
  { name: 'Spotify', aumid: 'SpotifyAB.SpotifyMusic_zpdnekdrzrea0!App', icon: '' },
];

type Discovery =
  | { status: 'idle' | 'error' }
  | { status: 'loading'; progress: StoreAppDiscoveryProgress }
  | { status: 'ready'; apps: UwpImportAppPreview[] };

interface StoreImporterModalProps {
  open: boolean;
  onClose: () => void;
  addedPaths: ReadonlySet<string>;
  category: string;
  categoryOptions: CustomSelectOption[];
  onCategoryChange: (category: string) => void;
  onImport: (app: UwpImportAppPreview) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

function StoreDiscoveryStatus({ progress, t }: {
  progress: StoreAppDiscoveryProgress;
  t: StoreImporterModalProps['t'];
}) {
  const percent = progress.stage === 'preparing'
    ? 100
    : progress.stage === 'icons' && progress.total > 0
      ? 100 * progress.processed / progress.total
      : undefined;
  let message = t('uwp_loading');
  if (progress.stage === 'icons') {
    message = progress.total > 0
      ? t('uwp_loading_icons', { processed: progress.processed, total: progress.total })
      : t('uwp_loading_preparing');
  } else if (progress.stage === 'preparing') {
    message = t('uwp_loading_preparing');
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <LoaderCircle className="size-4 shrink-0 text-cyan-300 motion-safe:animate-spin" aria-hidden="true" />
        <span id="store-discovery-status">{message}</span>
      </div>
      <div
        role="progressbar"
        aria-labelledby="store-discovery-status"
        aria-valuenow={percent === undefined ? undefined : Math.floor(percent)}
        className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10"
      >
        {percent === undefined ? (
          <div className="h-full w-1/3 rounded-full bg-cyan-400/60 motion-safe:animate-pulse" />
        ) : (
          <div className="h-full rounded-full bg-cyan-400 motion-safe:transition-[width] motion-safe:duration-150" style={{ width: `${percent}%` }} />
        )}
      </div>
    </div>
  );
}

export function StoreImporterModal({
  open, onClose, addedPaths, category, categoryOptions, onCategoryChange, onImport, t,
}: StoreImporterModalProps) {
  const [discovery, setDiscovery] = useState<Discovery>({ status: 'idle' });
  const [query, setQuery] = useState('');
  const [ascending, setAscending] = useState(true);
  const [selectedApp, setSelectedApp] = useState<UwpImportAppPreview | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const importTriggerRef = useRef<HTMLButtonElement>(null);
  const discoveringRef = useRef(false);
  const isPreview = !window.electronAPI;

  const visibleApps = useMemo(() => {
    if (discovery.status !== 'ready') return [];
    const filter = query.trim().toLocaleLowerCase();
    return discovery.apps
      .filter(app => app.name.toLocaleLowerCase().includes(filter))
      .sort((a, b) => {
        const order = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        return ascending ? order : -order;
      });
  }, [discovery, query, ascending]);

  useLayoutEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || selectedApp || !importTriggerRef.current) return;
    const trigger = importTriggerRef.current;
    importTriggerRef.current = null;
    (trigger.isConnected ? trigger : searchRef.current)?.focus();
  }, [open, selectedApp]);

  useLayoutEffect(() => {
    if (open && discovery.status === 'ready' && document.activeElement === dialogRef.current) {
      searchRef.current?.focus();
    }
  }, [open, discovery]);

  const discoverApps = async () => {
    if (discoveringRef.current) return;
    discoveringRef.current = true;
    dialogRef.current?.focus();
    setDiscovery({ status: 'loading', progress: { stage: 'listing' } });
    try {
      const apps = window.electronAPI
        ? await window.electronAPI.getUwpApps(progress => {
            setDiscovery(current => current.status === 'loading' ? { status: 'loading', progress } : current);
          })
        : PREVIEW_APPS;
      setDiscovery({ status: 'ready', apps });
    } catch (error) {
      console.error('Could not load installed Microsoft Store apps:', error);
      setDiscovery({ status: 'error' });
    } finally {
      discoveringRef.current = false;
    }
  };

  const close = useCallback(() => {
    setSelectedApp(null);
    importTriggerRef.current = null;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog || event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (selectedApp) setSelectedApp(null);
        else close();
      }
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')]
        .filter(control => !control.closest('[inert]'));
      const first = controls[0];
      const last = controls.at(-1);
      const active = document.activeElement;
      const focusOutsideControls = !controls.some(control => control === active);
      if (focusOutsideControls || (event.shiftKey ? active === first : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedApp, close]);

  if (!open) return null;

  return createPortal(
    <div data-no-hide className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" onClick={close}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-importer-title"
        data-cyberbot-obstacle="center"
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
        className={`relative flex h-[34rem] max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#0b1220] outline-none ${MODAL_SHADOW_CYAN}`}
      >
        <div inert={Boolean(selectedApp)} className="flex min-h-0 flex-1 flex-col">
          <header className="flex shrink-0 items-start gap-3 border-b border-white/10 px-5 py-4">
            <span className="shrink-0 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
              <PackagePlus className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="store-importer-title" className="font-cyber text-base font-bold leading-snug text-slate-100">{t('uwp_header_title')}</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{t('uwp_header_desc')}</p>
            </div>
            <Tooltip label={t('tooltip_close')} placement="left">
              <button type="button" onClick={close} aria-label={t('tooltip_close')} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400/60">
                <X className="size-4" aria-hidden="true" />
              </button>
            </Tooltip>
          </header>

          {discovery.status === 'loading' ? (
            <StoreDiscoveryStatus progress={discovery.progress} t={t} />
          ) : discovery.status === 'ready' && discovery.apps.length > 0 ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
              {isPreview && <p className="text-xs text-slate-400">{t('uwp_preview')}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex min-w-36 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 focus-within:border-cyan-500/50">
                  <Search className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    aria-label={t('uwp_search_placeholder')}
                    placeholder={t('uwp_search_placeholder')}
                    className="w-full min-w-0 bg-transparent py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
                  />
                </label>
                <Tooltip label={t(ascending ? 'tooltip_sort_order_desc' : 'tooltip_sort_order_asc')} placement="top">
                  <button type="button" onClick={() => setAscending(value => !value)} aria-label={t(ascending ? 'tooltip_sort_order_desc' : 'tooltip_sort_order_asc')} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10">
                    {ascending ? <ArrowDownAZ className="size-4" aria-hidden="true" /> : <ArrowUpZA className="size-4" aria-hidden="true" />}
                  </button>
                </Tooltip>
                <button type="button" onClick={discoverApps} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10">
                  <RefreshCw className="size-4" aria-hidden="true" /> {t('uwp_refresh')}
                </button>
              </div>
              <div className="custom-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
                {visibleApps.length === 0 && <p role="status" className="p-5 text-center text-sm text-slate-400">{t('uwp_no_matches')}</p>}
                {visibleApps.map(app => (
                  <div key={app.aumid} data-access-marquee-card="true" className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 p-2.5 hover:border-cyan-500/20">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-300">
                      {app.icon ? <img src={app.icon} alt="" className="size-6 object-contain" /> : <PackagePlus className="size-4" aria-hidden="true" />}
                    </span>
                    <OverflowMarquee className="flex-1 text-sm font-medium text-slate-100">{app.name}</OverflowMarquee>
                    {addedPaths.has(app.aumid.toLowerCase()) ? (
                      <span className="shrink-0 px-2 text-xs font-medium text-emerald-400">{t('uwp_added_label')}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={event => {
                          importTriggerRef.current = event.currentTarget;
                          setSelectedApp(app);
                        }}
                        aria-label={`${t('uwp_import_btn')} ${app.name}`}
                        className="shrink-0 rounded-md border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
                      >
                        {t('uwp_import_btn')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="custom-scrollbar flex min-h-0 flex-1 flex-col items-center justify-safe-center gap-4 overflow-y-auto p-5 text-center">
              <p role={discovery.status === 'error' ? 'alert' : 'status'} className="max-w-xs text-sm leading-relaxed text-slate-300">
                {t(discovery.status === 'error' ? 'uwp_load_error' : discovery.status === 'ready' ? 'uwp_no_apps' : 'uwp_req_desc')}
              </p>
              <button type="button" onClick={discoverApps} className="rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20">
                {t(discovery.status === 'error' ? 'uwp_try_again' : discovery.status === 'ready' ? 'uwp_refresh' : 'uwp_req_btn')}
              </button>
            </div>
          )}
        </div>

        {selectedApp && (
          <UwpImportConfirmModal
            app={selectedApp}
            category={category}
            categoryOptions={categoryOptions}
            onChangeCategory={onCategoryChange}
            onCancel={() => setSelectedApp(null)}
            onConfirm={() => {
              onImport(selectedApp);
              setSelectedApp(null);
            }}
            t={t}
          />
        )}
      </section>
    </div>,
    document.body,
  );
}
