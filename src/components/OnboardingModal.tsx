import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Sparkles, Bot, BotOff, Layers } from 'lucide-react';
import { BASIC_CATEGORY_PRESETS, type CategoryLang } from '../../shared/categories';
import { CYBERBOT_NAME_MAX_LENGTH, normalizeCyberBotName } from './companion/cyberBotName';
import { EnterKeyBadge, EscKeyBadge } from '../KeyBadge';
import type { TranslationKey } from '../locales';

interface OnboardingModalProps {
  isOpen: boolean;
  language: CategoryLang;
  initialName: string;
  initialCyberBotEnabled?: boolean;
  logo: React.ReactNode;
  t: (key: TranslationKey, variables?: Record<string, string>) => string;
  onSelectLanguage: (lang: CategoryLang) => void;
  onComplete: (result: {
    language: CategoryLang;
    cyberBotEnabled: boolean;
    preferredName: string;
    skipped: boolean;
  }) => void;
}

/**
 * First-run and full-reset welcome dialog to choose language, localize starter categories,
 * optionally enable CyberBot Assistant, and set an optional preferred name.
 */
export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  language,
  initialName,
  initialCyberBotEnabled = true,
  logo,
  t,
  onSelectLanguage,
  onComplete,
}) => {
  const [assistantEnabled, setAssistantEnabled] = useState(initialCyberBotEnabled);
  const [nameDraft, setNameDraft] = useState(initialName);

  useEffect(() => {
    if (isOpen) {
      setAssistantEnabled(initialCyberBotEnabled);
      setNameDraft(initialName);
    }
  }, [isOpen, initialName, initialCyberBotEnabled]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onComplete({
          language,
          cyberBotEnabled: assistantEnabled,
          preferredName: '',
          skipped: true,
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, language, assistantEnabled, onComplete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      language,
      cyberBotEnabled: assistantEnabled,
      preferredName: assistantEnabled ? normalizeCyberBotName(nameDraft) : '',
      skipped: false,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          data-no-hide
          className="fixed inset-0 z-[170] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.form
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#090e17]/95 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_25px_rgba(34,211,238,0.14)] overflow-hidden select-none"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-white/10 flex items-center gap-4 bg-gradient-to-br from-cyan-500/10 via-transparent to-indigo-500/5">
              <div className="shrink-0">{logo}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[10px] font-cyber font-bold tracking-widest uppercase text-cyan-300/90">
                    {t('onboarding_badge')}
                  </span>
                </div>
                <h2 id="onboarding-title" className="text-lg font-cyber font-bold text-white tracking-wide">
                  {t('onboarding_title')}
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t('onboarding_subtitle')}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Language picker */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-cyber font-bold tracking-wider uppercase text-slate-200">
                    {t('onboarding_lang_label')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { code: 'es' as const, title: 'Español', sub: 'Interfaz y categorías en español' },
                    { code: 'en' as const, title: 'English', sub: 'English UI & starter categories' },
                  ]).map((opt) => {
                    const active = language === opt.code;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => onSelectLanguage(opt.code)}
                        aria-pressed={active}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_16px_rgba(34,211,238,0.16)]'
                            : 'bg-black/30 border-white/10 hover:border-white/25 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-cyber font-bold ${active ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {opt.title}
                          </span>
                          <span
                            className={`w-2.5 h-2.5 rounded-full border ${
                              active
                                ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                                : 'bg-transparent border-slate-600'
                            }`}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{opt.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Starter Categories Preview */}
              <div className="rounded-xl border border-white/10 bg-black/25 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-cyber font-semibold tracking-wider uppercase text-slate-300">
                      {t('onboarding_preview_title')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{t('onboarding_preview_summary')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BASIC_CATEGORY_PRESETS.map((preset) => (
                    <span
                      key={preset.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-200 bg-white/[0.04] border border-white/10"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: preset.color, boxShadow: `0 0 6px ${preset.color}` }}
                      />
                      <span>{preset.names[language]}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Optional CyberBot Assistant card & preferred name */}
              <div className="rounded-xl border border-white/10 bg-black/25 p-3.5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`mt-0.5 p-1.5 rounded-lg border shrink-0 ${
                      assistantEnabled
                        ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                        : 'bg-white/[0.04] border-white/10 text-slate-500'
                    }`}>
                      {assistantEnabled ? <Bot className="w-4 h-4" /> : <BotOff className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-cyber font-bold tracking-wider uppercase text-slate-200">
                          {t('onboarding_assistant_label')}
                        </span>
                        <span className="text-[10px] font-sans font-normal text-slate-400">
                          ({t('onboarding_optional')})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {t('onboarding_assistant_desc')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={assistantEnabled}
                    aria-label={t('onboarding_assistant_label')}
                    onClick={() => setAssistantEnabled((prev) => !prev)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer ${
                      assistantEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow flex items-center justify-center ${
                        assistantEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          assistantEnabled ? 'bg-cyan-500 shadow-[0_0_5px_currentColor]' : 'bg-slate-400'
                        }`}
                      />
                    </span>
                  </button>
                </div>

                {assistantEnabled && (
                  <div className="pt-2.5 border-t border-white/[0.07] space-y-2">
                    <label
                      htmlFor="onboarding-cyberbot-name"
                      className="block text-[11px] font-medium text-slate-300"
                    >
                      {t('onboarding_name_label')}{' '}
                      <span className="text-[10px] text-slate-500">({t('onboarding_optional')})</span>
                    </label>
                    <input
                      id="onboarding-cyberbot-name"
                      type="text"
                      value={nameDraft}
                      maxLength={CYBERBOT_NAME_MAX_LENGTH}
                      onChange={(e) => setNameDraft(e.target.value)}
                      placeholder={t('onboarding_name_placeholder')}
                      className="w-full rounded-xl bg-black/35 border border-white/15 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 transition-all"
                    />
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('onboarding_name_desc')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/30 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  onComplete({
                    language,
                    cyberBotEnabled: assistantEnabled,
                    preferredName: '',
                    skipped: true,
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <span>{t('onboarding_skip')}</span>
                <EscKeyBadge />
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-cyan-400/50 bg-cyan-500/20 hover:bg-cyan-500/30 text-xs font-cyber font-bold tracking-wider text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)] transition-all cursor-pointer"
              >
                <span>{t('onboarding_start')}</span>
                <EnterKeyBadge variant="primary" />
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
