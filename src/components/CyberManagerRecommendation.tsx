import React, { useState } from 'react';
import { ExternalLink, Info, X } from 'lucide-react';
import type { TranslationKey } from '../locales';

export const CYBERMANAGER_RECOMMENDATION_KEY = 'cybermanagerHudRecommendationDismissed';
export const CYBERMANAGER_SITE = 'https://cybergems.org/apps/cybermanager/';

interface CyberManagerRecommendationProps {
  t: (key: TranslationKey) => string;
  openExternalUrl: (url: string) => void;
}

export const CyberManagerRecommendation: React.FC<CyberManagerRecommendationProps> = ({ t, openExternalUrl }) => {
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== 'undefined' && window.localStorage.getItem(CYBERMANAGER_RECOMMENDATION_KEY) === 'true'
  );

  const setVisibility = (nextDismissed: boolean) => {
    setDismissed(nextDismissed);
    window.localStorage.setItem(CYBERMANAGER_RECOMMENDATION_KEY, String(nextDismissed));
  };

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setVisibility(false)}
        className="self-start inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.025] px-2.5 py-1.5 text-[11px] font-cyber text-slate-400 hover:border-cyan-500/25 hover:text-cyan-300 transition-colors cursor-pointer"
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
        {t('hud_manager_restore')}
      </button>
    );
  }

  return (
    <aside className="relative rounded-xl border border-cyan-500/10 bg-cyan-500/[0.035] p-3 pr-8 text-left">
      <button
        type="button"
        onClick={() => setVisibility(true)}
        aria-label={t('hud_manager_dismiss')}
        className="absolute right-2.5 top-2.5 rounded-md p-1 text-slate-500 hover:bg-white/[0.06] hover:text-slate-200 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <div className="flex items-start gap-2.5">
        <img src="./suite/cybermanager.png" alt="" aria-hidden="true" className="w-7 h-7 shrink-0 rounded-md" />
        <div className="min-w-0">
          <h3 className="text-[11px] font-cyber font-semibold text-slate-200">CyberManager</h3>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{t('hud_manager_description')}</p>
          <button
            type="button"
            onClick={() => openExternalUrl(CYBERMANAGER_SITE)}
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-cyber font-semibold text-cyan-400/85 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            {t('hud_manager_learn_more')}
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};
