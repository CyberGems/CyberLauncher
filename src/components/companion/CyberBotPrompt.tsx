import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  Bot,
  Cpu,
  HardDrive,
  Terminal,
  Clock,
  Archive,
  Command,
  Volume2,
  VolumeX,
  Plus,
  Power,
  ArrowRight,
  FolderPlus,
  CornerDownLeft,
  Sparkles,
} from 'lucide-react';
import type { TranslationKey } from '../../locales';
import type { CyberBotQuietHoursConfig } from './companionTypes';

export interface PromptLauncherApp {
  id: number;
  name: string;
  category: string;
  color?: string;
  usage?: number;
  icon?: any;
  iconPath?: string;
  path?: string;
  isFav?: boolean;
  isAdmin?: boolean;
  shortcut?: string;
}

export interface CyberBotPromptProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right';
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  apps: PromptLauncherApp[];
  favoriteIds?: (string | number)[];
  onLaunchApp: (app: PromptLauncherApp) => void;
  renderAppIcon?: (app: PromptLauncherApp, className?: string) => React.ReactNode;
  onOpenSystemHUD: () => void;
  onOpenStorageHUD: () => void;
  onOpenClockHUD: () => void;
  onOpenTerminal: () => void;
  onOpenCommandPalette: () => void;
  onBackupNow: () => void;
  onAddNewApp: (prefillName?: string) => void;
  onAddNewCategory?: () => void;
  onOpenPowerMenu?: () => void;
  quietHours?: CyberBotQuietHoursConfig;
  onToggleQuietHours?: () => void;
  playBeep?: () => void;
  onActionExecuted?: (messageText?: string) => void;
}

interface PromptActionItem {
  id: string;
  type: 'action';
  label: string;
  description?: string;
  keywords: string;
  shortcut?: string;
  icon: React.ReactNode;
  color?: string;
  run: () => void;
}

interface PromptAppItem {
  id: string;
  type: 'app';
  app: PromptLauncherApp;
  label: string;
  description?: string;
  run: () => void;
}

type SelectableItem = PromptActionItem | PromptAppItem;

export const CyberBotPrompt: React.FC<CyberBotPromptProps> = ({
  isOpen,
  onClose,
  position = 'bottom-right',
  t,
  apps,
  favoriteIds = [],
  onLaunchApp,
  renderAppIcon,
  onOpenSystemHUD,
  onOpenStorageHUD,
  onOpenClockHUD,
  onOpenTerminal,
  onOpenCommandPalette,
  onBackupNow,
  onAddNewApp,
  onAddNewCategory,
  onOpenPowerMenu,
  quietHours,
  onToggleQuietHours,
  playBeep,
  onActionExecuted,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isQuietHoursActive = !!quietHours?.enabled;

  // Sound and feedback execution helper
  const executeItem = useCallback((item: SelectableItem) => {
    playBeep?.();
    onClose();
    item.run();
    onActionExecuted?.(item.label);
  }, [playBeep, onClose, onActionExecuted]);

  // System actions list
  const systemActions = useMemo<PromptActionItem[]>(() => [
    {
      id: 'action-system',
      type: 'action',
      label: t('cyberbot_prompt_action_system'),
      description: t('cyberbot_prompt_action_system_desc'),
      keywords: 'system sistema monitor cpu ram memoria hardware recursos monitoreo performance',
      shortcut: 'Ctrl+H',
      icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" />,
      color: 'border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/15',
      run: onOpenSystemHUD,
    },
    {
      id: 'action-storage',
      type: 'action',
      label: t('cyberbot_prompt_action_storage'),
      description: t('cyberbot_prompt_action_storage_desc'),
      keywords: 'storage almacenamiento disco hard drive disk space espacio discos',
      shortcut: 'Ctrl+D',
      icon: <HardDrive className="w-3.5 h-3.5 text-sky-400" />,
      color: 'border-sky-500/30 text-sky-300 hover:border-sky-400 hover:bg-sky-500/15',
      run: onOpenStorageHUD,
    },
    {
      id: 'action-terminal',
      type: 'action',
      label: t('cyberbot_prompt_action_terminal'),
      description: t('cyberbot_prompt_action_terminal_desc'),
      keywords: 'terminal consola cmd powershell cli shell bash',
      shortcut: 'Ctrl+J',
      icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'border-emerald-500/30 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/15',
      run: onOpenTerminal,
    },
    {
      id: 'action-clock',
      type: 'action',
      label: t('cyberbot_prompt_action_clock'),
      description: t('cyberbot_prompt_action_clock_desc'),
      keywords: 'reloj alarma temporizador timer cron scheduler programador tareas clock',
      shortcut: 'Ctrl+T',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
      color: 'border-amber-500/30 text-amber-300 hover:border-amber-400 hover:bg-amber-500/15',
      run: onOpenClockHUD,
    },
    {
      id: 'action-backup',
      type: 'action',
      label: t('cyberbot_prompt_action_backup'),
      description: t('cyberbot_prompt_action_backup_desc'),
      keywords: 'backup respaldo copia seguridad snapshot guardar exportar',
      icon: <Archive className="w-3.5 h-3.5 text-teal-400" />,
      color: 'border-teal-500/30 text-teal-300 hover:border-teal-400 hover:bg-teal-500/15',
      run: onBackupNow,
    },
    {
      id: 'action-palette',
      type: 'action',
      label: t('cyberbot_prompt_action_palette'),
      description: t('cyberbot_prompt_action_palette_desc'),
      keywords: 'paleta palette comandos commands ctrl+k buscar acciones',
      shortcut: 'Ctrl+K',
      icon: <Command className="w-3.5 h-3.5 text-purple-400" />,
      color: 'border-purple-500/30 text-purple-300 hover:border-purple-400 hover:bg-purple-500/15',
      run: onOpenCommandPalette,
    },
    {
      id: 'action-add-app',
      type: 'action',
      label: t('cyberbot_prompt_action_add_app'),
      description: t('cyberbot_prompt_action_add_app_desc'),
      keywords: 'nueva nuevo shortcut add agregar acceso directo app executable exe link crear',
      shortcut: 'Ctrl+N',
      icon: <Plus className="w-3.5 h-3.5 text-blue-400" />,
      color: 'border-blue-500/30 text-blue-300 hover:border-blue-400 hover:bg-blue-500/15',
      run: () => onAddNewApp(),
    },
    ...(onAddNewCategory ? [{
      id: 'action-add-cat',
      type: 'action' as const,
      label: t('cmd_palette_action_add_cat'),
      description: t('cmd_palette_action_add_cat_desc'),
      keywords: 'category categoria new nueva folder carpeta group grupo crear',
      shortcut: 'Ctrl+Shift+N',
      icon: <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />,
      color: 'border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/15',
      run: onAddNewCategory,
    }] : []),
    ...(onToggleQuietHours ? [{
      id: 'action-quiet',
      type: 'action' as const,
      label: isQuietHoursActive ? t('cyberbot_prompt_action_quiet_disable') : t('cyberbot_prompt_action_quiet_enable'),
      description: t('cyberbot_prompt_action_quiet_desc'),
      keywords: 'silencio quiet mute callar modo horas silenciosas sonido notificaciones',
      icon: isQuietHoursActive ? <Volume2 className="w-3.5 h-3.5 text-rose-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />,
      color: isQuietHoursActive
        ? 'border-rose-500/30 text-rose-300 hover:border-rose-400 hover:bg-rose-500/15'
        : 'border-slate-500/30 text-slate-300 hover:border-slate-400 hover:bg-slate-500/15',
      run: onToggleQuietHours,
    }] : []),
    ...(onOpenPowerMenu ? [{
      id: 'action-power',
      type: 'action' as const,
      label: t('cyberbot_prompt_action_power'),
      description: t('cyberbot_prompt_action_power_desc'),
      keywords: 'power energia apagar reiniciar suspender bloquear shutdown restart sleep lock signout',
      icon: <Power className="w-3.5 h-3.5 text-rose-400" />,
      color: 'border-rose-500/30 text-rose-300 hover:border-rose-400 hover:bg-rose-500/15',
      run: onOpenPowerMenu,
    }] : []),
  ], [
    t, isQuietHoursActive, onOpenSystemHUD, onOpenStorageHUD, onOpenTerminal, onOpenClockHUD,
    onBackupNow, onOpenCommandPalette, onAddNewApp, onAddNewCategory, onToggleQuietHours, onOpenPowerMenu,
  ]);

  // Frequent / Favorite apps
  const frequentApps = useMemo<PromptAppItem[]>(() => {
    const favSet = new Set(favoriteIds.map(String));
    const sorted = [...apps].sort((a, b) => {
      const aFav = favSet.has(String(a.id)) || !!a.isFav;
      const bFav = favSet.has(String(b.id)) || !!b.isFav;
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return (b.usage || 0) - (a.usage || 0);
    });

    return sorted.slice(0, 4).map(app => ({
      id: `frequent-app-${app.id}`,
      type: 'app' as const,
      app,
      label: app.name,
      description: app.category,
      run: () => onLaunchApp(app),
    }));
  }, [apps, favoriteIds, onLaunchApp]);

  // Filtered lists based on search query
  const trimmed = query.trim().toLocaleLowerCase();

  const matchingActions = useMemo<PromptActionItem[]>(() => {
    if (!trimmed) return [];
    return systemActions.filter(action => {
      const haystack = `${action.label} ${action.description || ''} ${action.keywords} ${action.shortcut || ''}`.toLocaleLowerCase();
      return haystack.includes(trimmed);
    });
  }, [trimmed, systemActions]);

  const matchingApps = useMemo<PromptAppItem[]>(() => {
    if (!trimmed) return [];
    return apps
      .filter(app => {
        const haystack = `${app.name} ${app.category || ''} ${app.path || ''}`.toLocaleLowerCase();
        return haystack.includes(trimmed);
      })
      .slice(0, 6)
      .map(app => ({
        id: `search-app-${app.id}`,
        type: 'app' as const,
        app,
        label: app.name,
        description: app.category,
        run: () => onLaunchApp(app),
      }));
  }, [trimmed, apps, onLaunchApp]);

  // Combined selectable items for keyboard navigation
  const selectableItems = useMemo<SelectableItem[]>(() => {
    if (!trimmed) {
      // When empty: quick chips (first 6) + frequent apps
      return [...systemActions.slice(0, 6), ...frequentApps];
    }
    return [...matchingActions, ...matchingApps];
  }, [trimmed, systemActions, frequentApps, matchingActions, matchingApps]);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Outside click listener
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore clicks inside this prompt
      if (containerRef.current?.contains(target)) return;

      // Ignore clicks on CyberBot avatar (handled by its own click toggle)
      const botControl = document.querySelector('[data-cyberbot-control]');
      if (botControl?.contains(target)) return;

      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onClose]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectableItems.length === 0) return;
      setActiveIndex(prev => (prev + 1) % selectableItems.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectableItems.length === 0) return;
      setActiveIndex(prev => (prev - 1 + selectableItems.length) % selectableItems.length);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectableItems.length > 0 && activeIndex >= 0 && activeIndex < selectableItems.length) {
        executeItem(selectableItems[activeIndex]);
      } else if (trimmed) {
        // If no results, pressing enter creates the app
        playBeep?.();
        onClose();
        onAddNewApp(query.trim());
      }
    }
  };

  const tailPositionClass = position === 'bottom-left' ? 'left-[40px]' : 'right-[40px]';

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('cyberbot_prompt_tag')}
      data-no-hide
      onKeyDown={handleKeyDown}
      className="relative w-full max-w-[340px] rounded-2xl bg-[#070d1d]/95 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_0_30px_rgba(34,211,238,0.22)] p-3 text-slate-200 select-none z-50 flex flex-col gap-2.5 max-h-[440px]"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
          </div>
          <span className="text-[10px] font-cyber font-bold tracking-widest text-cyan-300 uppercase truncate">
            {t('cyberbot_prompt_tag')}
          </span>
        </div>

        <button
          type="button"
          aria-label={t('cyberbot_prompt_esc_hint')}
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer flex items-center gap-1 text-[10px] font-cyber"
        >
          <span className="text-[9px] text-slate-500 hidden sm:inline">ESC</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Command & Search Input */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-cyan-400/80 absolute left-2.5 pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('cyberbot_prompt_placeholder')}
          className="w-full rounded-xl border border-cyan-500/30 bg-slate-950/70 pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 select-text outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 font-cyber transition-all"
        />
        {query && (
          <button
            type="button"
            aria-label={t('clear_search')}
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div ref={listRef} className="overflow-y-auto custom-scrollbar flex-1 pr-0.5 space-y-3 max-h-[300px]">
        {/* VIEW A: Empty Query (Quick Chips & Frequent Apps) */}
        {!trimmed && (
          <>
            {/* Quick Actions Grid */}
            <div>
              <div className="text-[10px] font-cyber font-semibold tracking-wider text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>{t('cyberbot_prompt_quick_actions')}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {systemActions.slice(0, 6).map((action, idx) => {
                  const isSelected = activeIndex === idx;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => executeItem(action)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border text-left text-xs font-cyber transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500/25 text-white shadow-[0_0_12px_rgba(34,211,238,0.3)] scale-[1.02]'
                          : action.color || 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="shrink-0">{action.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold truncate leading-tight">{action.label}</div>
                      </div>
                      {action.shortcut && (
                        <span className="text-[9px] text-slate-400 font-mono shrink-0 hidden sm:inline">
                          {action.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequent / Favorite Shortcuts */}
            {frequentApps.length > 0 && (
              <div>
                <div className="text-[10px] font-cyber font-semibold tracking-wider text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                  <CornerDownLeft className="w-3 h-3 text-cyan-400" />
                  <span>{t('cyberbot_prompt_quick_apps')}</span>
                </div>
                <div className="space-y-1">
                  {frequentApps.map((item, idx) => {
                    const itemIndex = 6 + idx;
                    const isSelected = activeIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                            : 'border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="w-6 h-6 shrink-0 rounded flex items-center justify-center overflow-hidden bg-black/40 border border-white/10">
                          {renderAppIcon ? (
                            renderAppIcon(item.app, 'w-4 h-4 object-contain')
                          ) : item.app.iconPath ? (
                            <img src={item.app.iconPath} alt="" className="w-4 h-4 object-contain" />
                          ) : (
                            <Bot className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-cyber font-bold truncate text-slate-100">{item.label}</div>
                          {item.description && (
                            <div className="text-[10px] text-slate-400 truncate font-cyber">{item.description}</div>
                          )}
                        </div>
                        <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 text-cyan-300' : 'text-slate-500'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* VIEW B: Filtered Search Results */}
        {trimmed && (
          <>
            {/* Matching System Commands */}
            {matchingActions.length > 0 && (
              <div>
                <div className="text-[10px] font-cyber font-semibold tracking-wider text-cyan-400 uppercase mb-1">
                  {t('cyberbot_prompt_commands_matches')}
                </div>
                <div className="space-y-1">
                  {matchingActions.map((action, idx) => {
                    const isSelected = activeIndex === idx;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => executeItem(action)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                            : 'border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="shrink-0">{action.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-cyber font-bold truncate text-white">{action.label}</div>
                          {action.description && (
                            <div className="text-[10px] text-slate-400 truncate font-cyber">{action.description}</div>
                          )}
                        </div>
                        {action.shortcut && (
                          <span className="text-[9px] text-slate-400 font-mono shrink-0 px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                            {action.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Matching Applications */}
            {matchingApps.length > 0 && (
              <div>
                <div className="text-[10px] font-cyber font-semibold tracking-wider text-cyan-400 uppercase mb-1">
                  {t('cyberbot_prompt_apps_matches')}
                </div>
                <div className="space-y-1">
                  {matchingApps.map((item, idx) => {
                    const itemIndex = matchingActions.length + idx;
                    const isSelected = activeIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                            : 'border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="w-6 h-6 shrink-0 rounded flex items-center justify-center overflow-hidden bg-black/40 border border-white/10">
                          {renderAppIcon ? (
                            renderAppIcon(item.app, 'w-4 h-4 object-contain')
                          ) : item.app.iconPath ? (
                            <img src={item.app.iconPath} alt="" className="w-4 h-4 object-contain" />
                          ) : (
                            <Bot className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-cyber font-bold truncate text-slate-100">{item.label}</div>
                          {item.description && (
                            <div className="text-[10px] text-slate-400 truncate font-cyber">{item.description}</div>
                          )}
                        </div>
                        <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 text-cyan-300' : 'text-slate-500'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty Search Matches State */}
            {matchingActions.length === 0 && matchingApps.length === 0 && (
              <div className="text-center py-4 px-2 space-y-2.5">
                <p className="text-xs text-slate-400 font-cyber">
                  {t('cyberbot_prompt_no_results', { query })}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    playBeep?.();
                    onClose();
                    onAddNewApp(query.trim());
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-cyber font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('cyberbot_prompt_create_app', { name: query.trim() })}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Speech Bubble Tail Pointing Down To CyberBot */}
      <div
        className={`absolute -bottom-[7px] ${tailPositionClass} w-3.5 h-3.5 bg-[#070d1d] border-r border-b border-cyan-500/40 transform rotate-45 pointer-events-none`}
      />
    </div>
  );
};

export default CyberBotPrompt;
