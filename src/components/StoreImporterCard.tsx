import { ChevronRight, PackagePlus } from 'lucide-react';
import type { TranslationKey } from '../locales';

interface StoreImporterCardProps {
  t: (key: TranslationKey) => string;
  onOpen: () => void;
}

export function StoreImporterCard({ t, onOpen }: StoreImporterCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/5 focus-visible:ring-2 focus-visible:ring-cyan-400/60"
    >
      <span className="shrink-0 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
        <PackagePlus className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold leading-snug text-slate-100">{t('uwp_header_title')}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-400">{t('app_add_uwp_banner_desc')}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-slate-400 transition-colors group-hover:text-cyan-300" aria-hidden="true" />
    </button>
  );
}
