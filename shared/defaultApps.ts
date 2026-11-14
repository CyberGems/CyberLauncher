import { getPresetCategoryName, type CategoryLang } from './categories';

export type LauncherApp = {
  id: number;
  name: string;
  category: string;
  color: string;
  usage: number;
  icon?: any;
  iconPath?: string;
  path?: string;
  isFav?: boolean;
  isAdmin?: boolean;
  shortcut?: string;
};

export const DEFAULT_TASKBAR_APP_IDS = [1004, 1003, 1006, 1008, 1001];
export const DEFAULT_FAVORITE_APP_IDS = [1004, 1003, 1006, 1008, 1001];

/**
 * Builds the default Windows starter shortcuts in the requested language.
 */
export const getDefaultWindowsApps = (lang: CategoryLang = 'es'): LauncherApp[] => {
  const catUtils = getPresetCategoryName('utils', lang);
  const catDesign = getPresetCategoryName('design', lang);
  const catDev = getPresetCategoryName('dev', lang);
  const catOffice = getPresetCategoryName('office', lang);
  return [
    {
      id: 1001,
      name: lang === 'es' ? 'Calculadora' : 'Calculator',
      path: 'calc.exe',
      category: catUtils,
      icon: 'Calculator',
      color: 'text-amber-400',
      usage: 0,
      isFav: true,
    },
    {
      id: 1002,
      name: 'Paint',
      path: 'mspaint.exe',
      category: catDesign,
      icon: 'Palette',
      color: 'text-pink-400',
      usage: 0,
      isFav: false,
    },
    {
      id: 1003,
      name: lang === 'es' ? 'Configuración de Windows' : 'Windows Settings',
      path: 'ms-settings:',
      category: catUtils,
      icon: 'Settings',
      color: 'text-indigo-400',
      usage: 0,
      isFav: true,
    },
    {
      id: 1004,
      name: lang === 'es' ? 'Explorador de archivos' : 'File Explorer',
      path: 'explorer.exe',
      category: catUtils,
      icon: 'Folder',
      color: 'text-yellow-400',
      usage: 0,
      isFav: true,
    },
    {
      id: 1005,
      name: lang === 'es' ? 'Información del Sistema' : 'System Info',
      path: 'ms-settings:about',
      category: catUtils,
      icon: 'Cpu',
      color: 'text-teal-400',
      usage: 0,
      isFav: false,
    },
    {
      id: 1006,
      name: lang === 'es' ? 'Administrador de tareas' : 'Task Manager',
      path: 'taskmgr.exe',
      category: catUtils,
      icon: 'Activity',
      color: 'text-emerald-400',
      usage: 0,
      isFav: true,
    },
    {
      id: 1007,
      name: lang === 'es' ? 'Aplicaciones instaladas' : 'Installed Apps',
      path: 'ms-settings:appsfeatures',
      category: catUtils,
      icon: 'Package',
      color: 'text-purple-400',
      usage: 0,
      isFav: false,
    },
    {
      id: 1008,
      name: 'PowerShell (Admin)',
      path: 'powershell.exe',
      isAdmin: true,
      category: catDev,
      icon: 'Terminal',
      color: 'text-cyan-400',
      usage: 0,
      isFav: true,
    },
    {
      id: 1009,
      name: lang === 'es' ? 'Símbolo del sistema (Admin)' : 'Command Prompt (Admin)',
      path: 'cmd.exe',
      isAdmin: true,
      category: catDev,
      icon: 'TerminalSquare',
      color: 'text-sky-400',
      usage: 0,
      isFav: false,
    },
    {
      id: 1010,
      name: lang === 'es' ? 'Configuración de Red' : 'Network Settings',
      path: 'ms-settings:network',
      category: catUtils,
      icon: 'Wifi',
      color: 'text-teal-400',
      usage: 0,
      isFav: false,
    },
    {
      id: 1011,
      name: lang === 'es' ? 'Bloc de notas' : 'Notepad',
      path: 'notepad.exe',
      category: catOffice,
      icon: 'FileText',
      color: 'text-blue-400',
      usage: 0,
      isFav: false,
    },
  ];
};

/**
 * Updates untouched stock starter app names (IDs 1001..1011) to the target language,
 * leaving custom or user-renamed apps intact.
 */
export function localizeStockAppNames<T extends { id: number; name: string }>(
  appsList: T[],
  lang: CategoryLang
): T[] {
  const esById = new Map(getDefaultWindowsApps('es').map((app) => [app.id, app.name]));
  const enById = new Map(getDefaultWindowsApps('en').map((app) => [app.id, app.name]));
  return appsList.map((app) => {
    const esName = esById.get(app.id);
    const enName = enById.get(app.id);
    if (!esName || !enName) return app;
    if (app.name === esName || app.name === enName) {
      const targetName = lang === 'en' ? enName : esName;
      return app.name === targetName ? app : { ...app, name: targetName };
    }
    return app;
  });
}

