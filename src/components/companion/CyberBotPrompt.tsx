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
  Sparkles,
  Settings,
  ScanSearch,
  RefreshCw,
  Info,
  Pin,
  Flame,
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
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'left' | 'right';
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  apps: PromptLauncherApp[];
  recentHistory?: Array<{ id?: string; name: string; path?: string; icon?: string; timestamp?: number; type?: string }>;
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
  onOpenSettings?: (tab?: 'general' | 'cyberbot' | 'backup' | 'uwp') => void;
  onOpenAbout?: () => void;
  onRefreshIcons?: () => void;
  onTogglePin?: () => void;
  isPinned?: boolean;
  quietHours?: CyberBotQuietHoursConfig;
  onToggleQuietHours?: () => void;
  playBeep?: () => void;
  onActionExecuted?: (messageText?: string) => void;
}

interface PromptActionItem {
  id: string;
  type: 'action';
  label: string;
  shortLabel?: string;
  description?: string;
  keywords: string;
  shortcut?: string;
  icon: React.ReactNode;
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

// Normalize accents/diacritics and case for resilient search
function normalizeSearch(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export const CyberBotPrompt: React.FC<CyberBotPromptProps> = ({
  isOpen,
  onClose,
  position = 'bottom-right',
  t,
  apps,
  recentHistory = [],
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
  onOpenSettings,
  onOpenAbout,
  onRefreshIcons,
  onTogglePin,
  isPinned = false,
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

  // Complete system actions list with extensive multilingual keywords
  const systemActions = useMemo<PromptActionItem[]>(() => [
    // 1. Configuración General (Ajustes / Settings)
    ...(onOpenSettings ? [{
      id: 'action-settings',
      type: 'action' as const,
      label: t('cyberbot_prompt_action_settings'),
      shortLabel: t('cyberbot_prompt_action_settings'),
      description: t('cyberbot_prompt_action_settings_desc'),
      keywords: 'settings configuracion configuracion ajustes config opciones preferences preferencias tema general hotkeys atajos teclado idioma language personalizacion',
      shortcut: 'Ctrl+,',
      icon: <Settings className="w-3.5 h-3.5" />,
      run: () => onOpenSettings('general'),
    }] : []),

    // 2. Monitor de Sistema
    {
      id: 'action-system',
      type: 'action',
      label: t('cyberbot_prompt_action_system'),
      shortLabel: 'Monitor Sistema',
      description: t('cyberbot_prompt_action_system_desc'),
      keywords: 'system sistema monitor cpu ram memoria hardware recursos monitoreo performance rendimiento procesador diagnostico',
      shortcut: 'Ctrl+H',
      icon: <Cpu className="w-3.5 h-3.5" />,
      run: onOpenSystemHUD,
    },

    // 3. Cyber Terminal
    {
      id: 'action-terminal',
      type: 'action',
      label: t('cyberbot_prompt_action_terminal'),
      shortLabel: t('cyberbot_prompt_action_terminal'),
      description: t('cyberbot_prompt_action_terminal_desc'),
      keywords: 'terminal consola cmd powershell cli shell bash consola comandos powershell',
      shortcut: 'Ctrl+J',
      icon: <Terminal className="w-3.5 h-3.5" />,
      run: onOpenTerminal,
    },

    // 4. Reloj y Tareas
    {
      id: 'action-clock',
      type: 'action',
      label: t('cyberbot_prompt_action_clock'),
      shortLabel: t('cyberbot_prompt_action_clock'),
      description: t('cyberbot_prompt_action_clock_desc'),
      keywords: 'reloj alarma alarmas temporizador timer cron scheduler programador tareas clock programar cronometro lanzamientos',
      shortcut: 'Ctrl+T',
      icon: <Clock className="w-3.5 h-3.5" />,
      run: onOpenClockHUD,
    },

    // 5. Respaldar Ahora
    {
      id: 'action-backup',
      type: 'action',
      label: t('cyberbot_prompt_action_backup'),
      shortLabel: t('cyberbot_prompt_action_backup'),
      description: t('cyberbot_prompt_action_backup_desc'),
      keywords: 'backup respaldo respaldos copia copias seguridad snapshot guardar exportar restaurar snapshot backup',
      icon: <Archive className="w-3.5 h-3.5" />,
      run: onBackupNow,
    },

    // 6. Paleta de Comandos
    {
      id: 'action-palette',
      type: 'action',
      label: t('cyberbot_prompt_action_palette'),
      shortLabel: t('cyberbot_prompt_action_palette_short') || 'Paleta',
      description: t('cyberbot_prompt_action_palette_desc'),
      keywords: 'paleta palette comandos commands ctrl+k buscar acciones todo atajos menu',
      shortcut: 'Ctrl+K',
      icon: <Command className="w-3.5 h-3.5" />,
      run: onOpenCommandPalette,
    },

    // 7. Almacenamiento
    {
      id: 'action-storage',
      type: 'action',
      label: t('cyberbot_prompt_action_storage'),
      shortLabel: t('cyberbot_prompt_action_storage'),
      description: t('cyberbot_prompt_action_storage_desc'),
      keywords: 'storage almacenamiento disco discos hard drive disk space espacio unidades c d disco duro particiones',
      shortcut: 'Ctrl+D',
      icon: <HardDrive className="w-3.5 h-3.5" />,
      run: onOpenStorageHUD,
    },

    // 8. Ajustes de CyberBot
    ...(onOpenSettings ? [{
      id: 'action-cyberbot-settings',
      type: 'action' as const,
      label: t('cyberbot_prompt_action_cyberbot_settings'),
      shortLabel: 'Ajustes CyberBot',
      description: t('cyberbot_prompt_action_cyberbot_settings_desc'),
      keywords: 'cyberbot bot ajustes config asistente companion avatar nombre name silencio quiet horas silenciosas chatter comportamiento',
      icon: <Bot className="w-3.5 h-3.5" />,
      run: () => onOpenSettings('cyberbot'),
    }] : []),

    // 9. Nuevo Acceso Directo
    {
      id: 'action-add-app',
      type: 'action',
      label: t('cyberbot_prompt_action_add_app'),
      shortLabel: t('cyberbot_prompt_action_add_app'),
      description: t('cyberbot_prompt_action_add_app_desc'),
      keywords: 'nueva nuevo shortcut add agregar acceso directo app executable exe link crear programa link url',
      shortcut: 'Ctrl+N',
      icon: <Plus className="w-3.5 h-3.5" />,
      run: () => onAddNewApp(),
    },

    // 10. Nueva Categoría
    ...(onAddNewCategory ? [{
      id: 'action-add-cat',
      type: 'action' as const,
      label: t('cmd_palette_action_add_cat'),
      description: t('cmd_palette_action_add_cat_desc'),
      keywords: 'category categoria new nueva folder carpeta group grupo crear organizar clasificar',
      shortcut: 'Ctrl+Shift+N',
      icon: <FolderPlus className="w-3.5 h-3.5" />,
      run: onAddNewCategory,
    }] : []),

    // 11. Escanear Apps UWP
    ...(onOpenSettings ? [{
      id: 'action-uwp',
      type: 'action' as const,
      label: t('cyberbot_prompt_action_uwp'),
      description: t('cyberbot_prompt_action_uwp_desc'),
      keywords: 'uwp store windows microsoft games scan escanear tienda juegos apps microsoft store import importar',
      icon: <ScanSearch className="w-3.5 h-3.5" />,
      run: () => onOpenSettings('uwp'),
    }] : []),

    // 12. Refrescar Iconos
    ...(onRefreshIcons ? [{
      id: 'action-refresh-icons',
      type: 'action' as const,
      label: t('cyberbot_prompt_action_refresh_icons'),
      description: t('cyberbot_prompt_action_refresh_icons_desc'),
      keywords: 'icons iconos refresh refrescar actualizar reload cache extraer recargar cache',
      icon: <RefreshCw className="w-3.5 h-3.5" />,
      run: onRefreshIcons,
    }] : []),

    // 13. Acerca de CyberLauncher
    ...(onOpenAbout ? [{
      id: 'action-about',
      type: 'action' as const,
      label: t('cyberbot_prompt_action_about'),
      description: t('cyberbot_prompt_action_about_desc'),
      keywords: 'about acerca version updates novedades creditos ayuda docs wiki informacion info f1 creditos version changelog',
      shortcut: 'F1',
      icon: <Info className="w-3.5 h-3.5" />,
      run: onOpenAbout,
    }] : []),

    // 14. Anclar / Desanclar Ventana (PIN)
    ...(onTogglePin ? [{
      id: 'action-pin',
      type: 'action' as const,
      label: isPinned ? t('cyberbot_prompt_action_pin_off') : t('cyberbot_prompt_action_pin_on'),
      description: t('cyberbot_prompt_action_pin_desc'),
      keywords: 'pin anclar desanclar fijar ventana al frente topmost siempre visible toggle pin',
      shortcut: 'Ctrl+P',
      icon: <Pin className="w-3.5 h-3.5" />,
      run: onTogglePin,
    }] : []),

    // 15. Alternar Modo Silencio
    ...(onToggleQuietHours ? [{
      id: 'action-quiet',
      type: 'action' as const,
      label: isQuietHoursActive ? t('cyberbot_prompt_action_quiet_disable') : t('cyberbot_prompt_action_quiet_enable'),
      shortLabel: isQuietHoursActive ? 'Activar Sonido' : 'Modo Silencio',
      description: t('cyberbot_prompt_action_quiet_desc'),
      keywords: 'silencio quiet mute callar modo horas silenciosas sonido notificaciones dormir no molestar',
      icon: isQuietHoursActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />,
      run: onToggleQuietHours,
    }] : []),

    // 16. Opciones de Energía
    ...(onOpenPowerMenu ? [{
      id: 'action-power',
      type: 'action' as const,
      label: t('cyberbot_prompt_action_power'),
      description: t('cyberbot_prompt_action_power_desc'),
      keywords: 'power energia apagar reiniciar suspender bloquear shutdown restart sleep lock signout pc equipo cerrar sesion',
      icon: <Power className="w-3.5 h-3.5" />,
      run: onOpenPowerMenu,
    }] : []),
  ], [
    t, isQuietHoursActive, isPinned, onOpenSettings, onOpenSystemHUD, onOpenStorageHUD, onOpenTerminal,
    onOpenClockHUD, onBackupNow, onOpenCommandPalette, onAddNewApp, onAddNewCategory,
    onRefreshIcons, onOpenAbout, onTogglePin, onToggleQuietHours, onOpenPowerMenu,
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

    return sorted.slice(0, 3).map(app => ({
      id: `frequent-app-${app.id}`,
      type: 'app' as const,
      app,
      label: app.name,
      description: app.category,
      run: () => onLaunchApp(app),
    }));
  }, [apps, favoriteIds, onLaunchApp]);

  // Recent apps (up to 3 from launch history or user library)
  const recentApps = useMemo<PromptAppItem[]>(() => {
    const frequentAppIds = new Set(frequentApps.map(f => String(f.app.id)));
    const seen = new Set<string>();
    const list: PromptAppItem[] = [];

    if (recentHistory && recentHistory.length > 0) {
      for (const item of recentHistory) {
        const itemKey = (item.path || item.name).toLowerCase();
        if (seen.has(itemKey)) continue;
        seen.add(itemKey);

        const matchedApp = apps.find(a =>
          (a.path && item.path && a.path.toLowerCase() === item.path.toLowerCase()) ||
          a.name.toLowerCase() === item.name.toLowerCase()
        );

        if (matchedApp) {
          list.push({
            id: `recent-app-${matchedApp.id}`,
            type: 'app' as const,
            app: matchedApp,
            label: matchedApp.name,
            description: matchedApp.category,
            run: () => onLaunchApp(matchedApp),
          });
        } else if (item.path || item.name) {
          const adHocApp: PromptLauncherApp = {
            id: Math.abs(item.name.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0)),
            name: item.name,
            category: t('cyberbot_prompt_recent_apps'),
            path: item.path,
            iconPath: item.icon,
          };
          list.push({
            id: `recent-adhoc-${list.length}`,
            type: 'app' as const,
            app: adHocApp,
            label: adHocApp.name,
            description: adHocApp.category,
            run: () => onLaunchApp(adHocApp),
          });
        }

        if (list.length >= 3) break;
      }
    }

    if (list.length < 3) {
      for (const app of apps) {
        if (!frequentAppIds.has(String(app.id)) && !seen.has(app.name.toLowerCase())) {
          seen.add(app.name.toLowerCase());
          list.push({
            id: `recent-fallback-${app.id}`,
            type: 'app' as const,
            app,
            label: app.name,
            description: app.category,
            run: () => onLaunchApp(app),
          });
          if (list.length >= 3) break;
        }
      }
    }

    return list;
  }, [recentHistory, apps, frequentApps, onLaunchApp, t]);

  // Normalized search query
  const normalizedQuery = normalizeSearch(query);

  // Filtered action results with accent-insensitive matching
  const matchingActions = useMemo<PromptActionItem[]>(() => {
    if (!normalizedQuery) return [];
    return systemActions.filter(action => {
      const haystack = normalizeSearch(`${action.label} ${action.shortLabel || ''} ${action.description || ''} ${action.keywords} ${action.shortcut || ''}`);
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, systemActions]);

  // Filtered app results with accent-insensitive matching
  const matchingApps = useMemo<PromptAppItem[]>(() => {
    if (!normalizedQuery) return [];
    return apps
      .filter(app => {
        const haystack = normalizeSearch(`${app.name} ${app.category || ''} ${app.path || ''}`);
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 5)
      .map(app => ({
        id: `search-app-${app.id}`,
        type: 'app' as const,
        app,
        label: app.name,
        description: app.category,
        run: () => onLaunchApp(app),
      }));
  }, [normalizedQuery, apps, onLaunchApp]);

  // Initial curated grid actions (6 top actions that fit perfectly)
  const initialGridActions = useMemo<PromptActionItem[]>(() => {
    return systemActions.slice(0, 6);
  }, [systemActions]);

  // Combined selectable items for keyboard navigation
  const selectableItems = useMemo<SelectableItem[]>(() => {
    if (!normalizedQuery) {
      return [...initialGridActions, ...frequentApps, ...recentApps];
    }
    return [...matchingActions, ...matchingApps];
  }, [normalizedQuery, initialGridActions, frequentApps, recentApps, matchingActions, matchingApps]);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
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
      } else if (normalizedQuery) {
        // If no results, pressing enter creates the app
        playBeep?.();
        onClose();
        onAddNewApp(query.trim());
      }
    }
  };

  const isLeft = position === 'bottom-left' || position === 'left';
  const tailPositionClass = isLeft ? 'left-[40px]' : 'right-[40px]';

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('cyberbot_prompt_tag')}
      data-no-hide
      onKeyDown={handleKeyDown}
      className="relative w-[440px] max-w-[calc(100vw-32px)] rounded-2xl bg-[#080d1a]/95 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_20px_rgba(34,211,238,0.12)] p-3 text-slate-200 select-none z-50 flex flex-col gap-2.5"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.3)]">
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
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer flex items-center gap-1.5 text-[10px] font-cyber"
        >
          <kbd className="tooltip-shortcut">Esc</kbd>
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
          className="w-full rounded-xl border border-cyan-500/35 bg-slate-950/75 pl-8 pr-7 py-2 text-xs text-white placeholder:text-slate-500 select-text outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 font-cyber transition-all"
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
      <div
        ref={listRef}
        className="overflow-y-auto custom-scrollbar flex-1 px-1.5 space-y-2.5 max-h-[min(480px,68vh)]"
      >
        {/* VIEW A: Empty Query (Quick Chips & Frequent Apps) */}
        {!normalizedQuery && (
          <>
            {/* Quick Actions Grid */}
            <div>
              <div className="text-[10px] font-cyber font-medium tracking-wider text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-slate-400" />
                <span>{t('cyberbot_prompt_quick_actions')}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {initialGridActions.map((action, idx) => {
                  const isSelected = activeIndex === idx;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => executeItem(action)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`group flex items-center gap-1.5 px-2 py-2 rounded-xl border text-left font-cyber transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400/80 bg-cyan-500/20 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)] ring-1 ring-cyan-400/40'
                          : 'border-white/10 bg-slate-900/60 text-slate-200 hover:border-cyan-500/40 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className={`shrink-0 transition-colors ${isSelected ? 'text-cyan-300' : 'text-slate-400 group-hover:text-cyan-300'}`}>
                        {action.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium tracking-tight truncate leading-snug">
                          {action.shortLabel || action.label}
                        </div>
                      </div>
                      {action.shortcut && (
                        <kbd className={`tooltip-shortcut shrink-0 self-center text-[9.5px] px-1.5 py-0.5 rounded font-cyber border transition-colors ${
                          isSelected
                            ? 'border-cyan-400/40 bg-cyan-950/60 text-cyan-200'
                            : 'border-white/10 bg-black/40 text-slate-400 group-hover:border-cyan-500/30 group-hover:text-slate-300'
                        }`}>
                          {action.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Apps: 2 Columns (Frequent & Recent) */}
            {(frequentApps.length > 0 || recentApps.length > 0) && (
              <div className="grid grid-cols-2 gap-2">
                {/* Column 1: Más Usadas */}
                <div className="min-w-0">
                  <div className="text-[10px] font-cyber font-medium tracking-wider text-slate-400 uppercase mb-1.5 flex items-center gap-1.5 truncate">
                    <Flame className="w-3 h-3 text-amber-400/80 shrink-0" />
                    <span className="truncate">{t('cyberbot_prompt_frequent_apps')}</span>
                  </div>
                  <div className="space-y-1">
                    {frequentApps.map((item, idx) => {
                      const itemIndex = initialGridActions.length + idx;
                      const isSelected = activeIndex === itemIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => executeItem(item)}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-cyan-400/80 bg-cyan-500/20 text-white shadow-[0_0_10px_rgba(34,211,238,0.18)] ring-1 ring-cyan-400/35'
                              : 'border-white/5 bg-slate-900/40 text-slate-200 hover:border-white/15 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <div className="w-6 h-6 shrink-0 rounded flex items-center justify-center overflow-hidden bg-black/40 border border-white/10">
                            {renderAppIcon ? (
                              renderAppIcon(item.app, 'w-4 h-4 object-contain')
                            ) : item.app.iconPath ? (
                              <img src={item.app.iconPath} alt="" className="w-4 h-4 object-contain" />
                            ) : (
                              <Bot className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-cyber font-medium truncate text-slate-200 group-hover:text-white leading-tight">
                              {item.label}
                            </div>
                            {item.description && (
                              <div className="text-[9.5px] text-slate-400 truncate font-cyber leading-tight">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <kbd className={`tooltip-shortcut shrink-0 self-center text-[9px] px-1.5 py-0.5 rounded font-cyber border transition-all ${
                            isSelected
                              ? 'border-cyan-400/50 bg-cyan-950/70 text-cyan-200 shadow-[0_0_6px_rgba(34,211,238,0.25)]'
                              : 'border-white/10 bg-black/40 text-slate-500 group-hover:text-slate-300'
                          }`}>
                            ↵
                          </kbd>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Recientes */}
                <div className="min-w-0">
                  <div className="text-[10px] font-cyber font-medium tracking-wider text-slate-400 uppercase mb-1.5 flex items-center gap-1.5 truncate">
                    <Clock className="w-3 h-3 text-cyan-400/80 shrink-0" />
                    <span className="truncate">{t('cyberbot_prompt_recent_apps')}</span>
                  </div>
                  <div className="space-y-1">
                    {recentApps.map((item, idx) => {
                      const itemIndex = initialGridActions.length + frequentApps.length + idx;
                      const isSelected = activeIndex === itemIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => executeItem(item)}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-cyan-400/80 bg-cyan-500/20 text-white shadow-[0_0_10px_rgba(34,211,238,0.18)] ring-1 ring-cyan-400/35'
                              : 'border-white/5 bg-slate-900/40 text-slate-200 hover:border-white/15 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <div className="w-6 h-6 shrink-0 rounded flex items-center justify-center overflow-hidden bg-black/40 border border-white/10">
                            {renderAppIcon ? (
                              renderAppIcon(item.app, 'w-4 h-4 object-contain')
                            ) : item.app.iconPath ? (
                              <img src={item.app.iconPath} alt="" className="w-4 h-4 object-contain" />
                            ) : (
                              <Bot className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-cyber font-medium truncate text-slate-200 group-hover:text-white leading-tight">
                              {item.label}
                            </div>
                            {item.description && (
                              <div className="text-[9.5px] text-slate-400 truncate font-cyber leading-tight">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <kbd className={`tooltip-shortcut shrink-0 self-center text-[9px] px-1.5 py-0.5 rounded font-cyber border transition-all ${
                            isSelected
                              ? 'border-cyan-400/50 bg-cyan-950/70 text-cyan-200 shadow-[0_0_6px_rgba(34,211,238,0.25)]'
                              : 'border-white/10 bg-black/40 text-slate-500 group-hover:text-slate-300'
                          }`}>
                            ↵
                          </kbd>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* VIEW B: Filtered Search Results */}
        {normalizedQuery && (
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
                        className={`group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-400/80 bg-cyan-500/20 text-white shadow-[0_0_10px_rgba(34,211,238,0.18)] ring-1 ring-cyan-400/35'
                            : 'border-white/5 bg-slate-900/40 text-slate-200 hover:border-white/15 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <div className={`shrink-0 p-1 rounded-lg bg-black/40 border border-white/10 transition-colors ${
                          isSelected ? 'text-cyan-300 border-cyan-400/40' : 'text-slate-400 group-hover:text-cyan-300'
                        }`}>
                          {action.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-cyber font-semibold truncate text-white">{action.label}</div>
                          {action.description && (
                            <div className="text-[10px] text-slate-400 truncate font-cyber">{action.description}</div>
                          )}
                        </div>
                        {action.shortcut && (
                          <kbd className="tooltip-shortcut shrink-0 self-center text-[10px] px-1.5 py-0.5 rounded font-cyber border border-white/10 bg-black/40 text-slate-400">
                            {action.shortcut}
                          </kbd>
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
                            ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[inset_0_0_10px_rgba(34,211,238,0.18),0_0_8px_rgba(34,211,238,0.22)] ring-1 ring-cyan-400/35'
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
                        <kbd className={`tooltip-shortcut shrink-0 self-center text-[9px] px-1.5 py-0.5 rounded font-cyber border transition-all ${
                          isSelected
                            ? 'border-cyan-400/50 bg-cyan-950/70 text-cyan-200 shadow-[0_0_6px_rgba(34,211,238,0.25)]'
                            : 'border-white/10 bg-black/40 text-slate-500 group-hover:text-slate-300'
                        }`}>
                          ↵
                        </kbd>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-cyber font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.2)]"
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
        className={`absolute -bottom-[7px] ${tailPositionClass} w-3.5 h-3.5 bg-[#080d1a] border-r border-b border-cyan-500/30 transform rotate-45 pointer-events-none z-10`}
      />
    </div>
  );
};

export default CyberBotPrompt;
