import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal, Music, Globe, Calculator, Code, Bot, Lock,
  MonitorSmartphone, PenTool, KeyRound, MousePointer2, FileUp,
  Gamepad2, TerminalSquare, Binary, MessageCircle, Star,
  Search, Grid, List as ListIcon, Plus, Clock, History, Settings,
  Minus, Square, X, ChevronRight, LayoutGrid, Image as ImageIcon,
  Palette, Droplets, Link, Keyboard, PenBox, Trash2,
  Wifi, BatteryMedium, Volume2, Info, Monitor, Upload, Cpu,
  HardDrive, Minimize2, Download, Power, FileJson, Package, Hexagon,
  FolderOpen
} from 'lucide-react';


export const CyberLogo = ({ className = "w-6 h-6", animated = false }: { className?: string, animated?: boolean }) => (
  <img 
    src="./icon.png"
    srcSet="./icon-16.png 16w, ./icon-24.png 24w, ./icon-32.png 32w, ./icon-256.png 256w, ./icon.png 1024w"
    sizes="(max-width: 30px) 16px, (max-width: 42px) 24px, (max-width: 60px) 32px, 256px"
    className={className} 
    alt="CyberLauncher"
    style={animated ? { animation: 'spin 10s linear infinite' } : undefined}
  />
);

// --- MOCK DATA ---
const INITIAL_CATEGORIES = [
  { id: 'all', name: 'Todas', color: '#a1a1aa' },
  { id: 'ai', name: 'AI', color: '#34d399' },
  { id: 'browsers', name: 'Browsers', color: '#f97316' },
  { id: 'comm', name: 'Communication', color: '#6366f1' },
  { id: 'design', name: 'Design', color: '#ef4444' },
  { id: 'dev', name: 'Development', color: '#38bdf8' },
  { id: 'ent', name: 'Entertainment', color: '#22c55e' },
  { id: 'gaming', name: 'Gaming', color: '#d4d4d8' },
  { id: 'utils', name: 'Utilidades', color: '#60a5fa' },
];

const INITIAL_APPS = [
  { id: 1, name: 'Terminal', category: 'Utilidades', icon: Terminal, color: 'text-sky-400', isFav: true, usage: 96 },
  { id: 2, name: 'Spotify', category: 'Entertainment', icon: Music, color: 'text-green-500', isFav: false, usage: 56 },
  { id: 3, name: 'Brave Browser', category: 'Browsers', icon: Globe, color: 'text-orange-500', isFav: false, usage: 43 },
  { id: 4, name: 'Calculator', category: 'Utilidades', icon: Calculator, color: 'text-zinc-300', isFav: true, usage: 22 },
  { id: 5, name: 'Python IDLE', category: 'Development', icon: Code, color: 'text-yellow-400', isFav: false, usage: 8 },
  { id: 6, name: 'ChatGPT', category: 'AI', icon: Bot, color: 'text-emerald-400', isFav: false, usage: 2 },
  { id: 7, name: 'VeraCrypt', category: 'Utilidades', icon: Lock, color: 'text-sky-300', isFav: true, usage: 2 },
  { id: 8, name: 'AnyDesk', category: 'Utilidades', icon: MonitorSmartphone, color: 'text-red-500', isFav: true, usage: 1 },
  { id: 9, name: 'CorelDRAW 2026', category: 'Design', icon: PenTool, color: 'text-green-400', isFav: false, usage: 1 },
  { id: 10, name: '2fast', category: 'Utilidades', icon: KeyRound, color: 'text-yellow-500', isFav: true, usage: 1 },
  { id: 11, name: 'Cursor', category: 'AI', icon: MousePointer2, color: 'text-zinc-300', isFav: false, usage: 1 },
  { id: 12, name: 'Filezilla', category: 'Utilidades', icon: FileUp, color: 'text-red-600', isFav: false, usage: 0 },
  { id: 13, name: 'Steam', category: 'Gaming', icon: Gamepad2, color: 'text-sky-500', isFav: false, usage: 0 },
  { id: 14, name: 'Warp', category: 'Utilidades', icon: TerminalSquare, color: 'text-indigo-400', isFav: false, usage: 0 },
  { id: 15, name: 'Codex', category: 'Development', icon: Binary, color: 'text-blue-500', isFav: false, usage: 0 },
  { id: 16, name: 'WhatsApp', category: 'Communication', icon: MessageCircle, color: 'text-green-500', isFav: true, usage: 0 },
];

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', // Abstract
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop', // Cyberpunk
  'https://images.unsplash.com/photo-1538681105587-85640961bf8b?q=80&w=2670&auto=format&fit=crop', // Dark geom
  'https://images.unsplash.com/photo-1542487354-feaf93476caa?q=80&w=2816&auto=format&fit=crop', // Blue particles
];

const PRESET_SOLIDS = ['#0a0f18', '#1a1a2e', '#000000', '#111827', '#0f172a'];
const PRESET_GRADIENTS = [
  'linear-gradient(to bottom right, #0f2027, #203a43, #2c5364)',
  'linear-gradient(to bottom right, #000000, #434343)',
  'linear-gradient(to bottom right, #141e30, #243b55)',
  'linear-gradient(to bottom right, #0f172a, #3b82f6)',
];

const CyberIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <div className={`relative ${className} flex items-center justify-center p-0.5`} style={style}>
    <Hexagon className="absolute inset-0 w-full h-full text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" strokeWidth={1.5} />
    <div className="relative z-10 flex items-center justify-center">
      <span className="text-cyan-400 font-cyber font-bold text-[14px] leading-none -mt-0.5">&gt;_</span>
    </div>
  </div>
);

const AppIcon = ({ app, className, style, strokeWidth }: { app: any, className?: string, style?: React.CSSProperties, strokeWidth?: number }) => {
  // 1. Usar imagen personalizada (Base64 o local) si existe
  if (app.iconPath) {
    return <img src={app.iconPath} alt={app.name} className={`${className} object-contain`} style={style} />;
  }

  // 2. Usar componente de Lucide si es válido (solo para apps iniciales en la misma sesión)
  if (typeof app.icon === 'function' || typeof app.icon === 'string') {
    const IconComponent = app.icon;
    return <IconComponent className={className} style={style} strokeWidth={strokeWidth} />;
  }
  
  // 3. Fallback: El ícono global de CyberLauncher (Componente SVG Real)
  return <CyberIcon className={className} style={style} />;
};

// Tipo para la API de Electron expuesta por preload
declare global {
  interface Window {
    electronAPI?: {
      launchApp: (path: string) => Promise<{ success: boolean; error?: string }>;
      selectFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>;
      selectImage: () => Promise<string | null>;
      getMonitors: () => Promise<Array<{ id: string; label: string; isPrimary: boolean; bounds: any; size: any }>>;
      setMonitor: (monitorId: string) => Promise<void>;
      registerShortcut: (shortcut: string) => Promise<{ success: boolean; shortcut: string }>;
      windowMinimize: () => Promise<void>;
      windowMaximizeToggle: () => Promise<void>;
      windowClose: () => Promise<void>;
      windowHideToTray: () => Promise<void>;
      setAutoLaunch: (enabled: boolean) => Promise<{ success: boolean; enabled: boolean }>;
      getSystemInfo: () => Promise<{ memory: { total: number; used: number; percent: number }; cpu: { model: string; cores: number }; uptime: number }>;
      getDiskInfo: () => Promise<Array<{ drive: string; total: number; free: number; used: number; percent: number }>>;
      resolveFilePath: (filePath: string) => Promise<{ name: string; path: string; ext: string; exists: boolean; iconPath: string; debug?: any } | null>;
      getPathForFile: (file: File) => string;
      getImageData: (filePath: string) => Promise<string | null>;
      setHotspots: (corners: string[], delay: number) => Promise<{ success: boolean }>;
      openDevTools: () => Promise<{ success: boolean }>;
      exportConfig: (jsonData: string) => Promise<string | null>;
      importConfig: () => Promise<string | null>;
      saveConfig: (config: any) => Promise<boolean>;
      loadConfig: () => Promise<any | null>;
      getConfigPath: () => Promise<string>;
      openDataFolder: () => Promise<void>;
      onReloadConfig: (callback: () => void) => () => void;
      showTextContextMenu: (x: number, y: number) => Promise<void>;
    };
  }
}

const isElectron = !!window.electronAPI;

const SystemMonitor = React.memo(() => {
  const [memPercent, setMemPercent] = useState<number>(0);
  const [memUsed, setMemUsed] = useState<number>(0);
  const [uptime, setUptime] = useState<number>(0);

  useEffect(() => {
    const fetchMem = async () => {
      try {
        if (isElectron) {
          const info = await window.electronAPI!.getSystemInfo();
          setMemPercent(info.memory.percent);
          setMemUsed(info.memory.used);
          setUptime(info.uptime);
        } else {
          console.warn('Electron API not found, using fallback monitor');
          if ((performance as any).memory) {
            const used = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
            setMemUsed(Math.round(used) / 1000);
            setMemPercent(Math.round(used / 100));
          } else {
            setMemPercent(prev => prev === 0 ? 42 : Math.max(20, Math.min(90, prev + (Math.random() * 6 - 3))));
            setMemUsed(prev => prev === 0 ? 8.2 : prev);
          }
        }
      } catch (err) {
        console.error('Error fetching RAM info:', err);
      }
    };
    fetchMem();
    const interval = setInterval(fetchMem, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-400/90 shadow-[0_0_10px_rgba(34,211,238,0.2)] rounded-lg border border-transparent cursor-help hover:bg-cyan-400 transition-colors group"
      title={`RAM: ${memUsed.toFixed(1)} GB (${Math.round(memPercent)}%)`}
    >
      <Cpu className="w-4 h-4 text-slate-900" />
      <span className="text-xs font-mono text-slate-900 font-bold tracking-wider w-11 text-right">
        {Math.round(memPercent)}%
      </span>
    </div>
  );
});

const DiskMonitor = React.memo(() => {
  const [disks, setDisks] = useState<Array<{ drive: string; total: number; free: number; used: number; percent: number }>>([]);

  useEffect(() => {
    const fetchDisks = async () => {
      if (isElectron) {
        const info = await window.electronAPI!.getDiskInfo();
        setDisks(info);
      } else {
        // Fallback para navegador
        setDisks([
          { drive: 'C:', total: 500, free: 275, used: 225, percent: 45 },
          { drive: 'D:', total: 1000, free: 180, used: 820, percent: 82 },
        ]);
      }
    };
    fetchDisks();
    const interval = setInterval(fetchDisks, 30000);
    return () => clearInterval(interval);
  }, []);

  const mainDisk = disks[0];

  return (
    <div className="relative group/disk">
      <div 
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-400/90 shadow-[0_0_10px_rgba(34,211,238,0.2)] rounded-lg border border-transparent cursor-pointer hover:bg-cyan-400 transition-colors"
        title="Uso de Discos"
      >
        <HardDrive className="w-4 h-4 text-slate-900" />
        <span className="text-xs font-mono text-slate-900 font-bold tracking-wider w-7 text-right">
          {mainDisk ? `${mainDisk.percent}%` : '--'}
        </span>
      </div>
      
      {/* Dropdown in tooltip style */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-black/90 border border-white/10 rounded-xl p-4 opacity-0 invisible group-hover/disk:opacity-100 group-hover/disk:visible transition-all translate-y-2 group-hover/disk:translate-y-0 backdrop-blur-xl shadow-2xl z-50 pointer-events-none group-hover/disk:pointer-events-auto">
        <div className="text-[11px] font-cyber font-bold text-slate-400 mb-3 tracking-widest border-b border-white/10 pb-1">ALMACENAMIENTO</div>
        <div className="space-y-3">
          {disks.map((disk, i) => (
            <div key={disk.drive}>
              <div className="flex justify-between text-[10px] font-mono mb-1">
                <span className="text-slate-300">{disk.drive}</span>
                <span className={i === 0 ? 'text-cyan-400' : 'text-emerald-400'}>{disk.percent}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 border border-white/5 overflow-hidden">
                <div className={`${i === 0 ? 'bg-cyan-500' : 'bg-emerald-500'} h-full rounded-full`} style={{ width: `${disk.percent}%` }}></div>
              </div>
              <div className="text-[9px] text-slate-500 mt-1 text-right font-mono">{disk.used.toFixed(1)}GB / {disk.total.toFixed(1)}GB</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const UptimeMonitor = React.memo(() => {
  const [uptime, setUptime] = useState<number>(0);

  useEffect(() => {
    const fetchUptime = async () => {
      if (isElectron) {
        const info = await window.electronAPI!.getSystemInfo();
        setUptime(info.uptime);
      }
    };
    fetchUptime();
    const interval = setInterval(fetchUptime, 30000);
    return () => clearInterval(interval);
  }, []);

  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);

  return (
    <span className="text-sm font-mono text-slate-400 tracking-wide">
      {h > 0 ? `${h}h ${m}m` : `${m}m`}
    </span>
  );
});

export default function App() {
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });
  const [apps, setApps] = useState(() => {
    const saved = localStorage.getItem('apps');
    return saved ? JSON.parse(saved) : INITIAL_APPS;
  });
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('favoriteIds');
    return saved ? JSON.parse(saved) : INITIAL_APPS.filter(app => app.isFav).map(app => app.id);
  });
  const [draggedFavId, setDraggedFavId] = useState<number | null>(null);
  const [favDropTarget, setFavDropTarget] = useState<number | null>(null);

  // Taskbar State
  const [taskbarAppIds, setTaskbarAppIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('taskbarAppIds');
    return saved ? JSON.parse(saved) : INITIAL_APPS.slice(0, 4).map(app => app.id);
  });
  const [draggedTaskbarId, setDraggedTaskbarId] = useState<number | null>(null);
  const [taskbarDropTarget, setTaskbarDropTarget] = useState<number | null>(null);

  // Bandera para evitar guardar antes de que la carga inicial desde disco termine
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  const [selectedMonitor, setSelectedMonitor] = useState('');
  const [monitors, setMonitors] = useState<Array<{ id: string; label: string; isPrimary: boolean }>>([]);
  const [cardScale, setCardScale] = useState(100);
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('app_launcher_view_mode');
    return (saved === 'list' || saved === 'grid') ? saved : 'grid';
  });
  
  useEffect(() => {
    localStorage.setItem('app_launcher_view_mode', viewMode);
  }, [viewMode]);

  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, app: typeof INITIAL_APPS[0] | null } | null>(null);

  // Launcher Activity State
  const [activationShortcut, setActivationShortcut] = useState(() => localStorage.getItem('activationShortcut') || 'Alt+Space');
  const [hotspotCorners, setHotspotCorners] = useState<string[]>(() => {
    const saved = localStorage.getItem('hotspotCorners');
    return saved ? JSON.parse(saved) : [];
  });
  const [hotspotDelay, setHotspotDelay] = useState<number>(() => {
    const saved = localStorage.getItem('hotspotDelay');
    return saved ? parseInt(saved, 10) : 300;
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Customization State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'appearance' | 'system'>('general');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<typeof INITIAL_APPS[0] | null>(null);
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', path: '', iconPath: '', category: '' });
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);
  const [isAppActive, setIsAppActive] = useState(true);
  const [bgType, setBgType] = useState<'image' | 'solid' | 'gradient'>(() => {
    return (localStorage.getItem('bgType') as any) || 'image';
  });
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('bgImage') || PRESET_IMAGES[1]);
  const [customImageUrl, setCustomImageUrl] = useState(() => localStorage.getItem('customImageUrl') || '');
  const [startWithWindows, setStartWithWindows] = useState(() => localStorage.getItem('startWithWindows') === 'true');
  const [hideOnClickDeadSpot, setHideOnClickDeadSpot] = useState(() => localStorage.getItem('hideOnClickDeadSpot') === 'true');
  const [bgColor, setBgColor] = useState(() => localStorage.getItem('bgColor') || PRESET_SOLIDS[0]);
  const [bgGradient, setBgGradient] = useState(() => localStorage.getItem('bgGradient') || PRESET_GRADIENTS[0]);
  const [glassIntensity, setGlassIntensity] = useState(() => {
    const saved = localStorage.getItem('glassIntensity');
    return saved ? parseInt(saved, 10) : 60;
  });
  const [bgOpacity, setBgOpacity] = useState(() => {
    const saved = localStorage.getItem('bgOpacity');
    return saved ? parseInt(saved, 10) : 40;
  });

  useEffect(() => { localStorage.setItem('bgType', bgType); }, [bgType]);
  useEffect(() => { localStorage.setItem('bgImage', bgImage); }, [bgImage]);
  useEffect(() => { localStorage.setItem('customImageUrl', customImageUrl); }, [customImageUrl]);
  useEffect(() => { localStorage.setItem('bgColor', bgColor); }, [bgColor]);
  useEffect(() => { localStorage.setItem('startWithWindows', startWithWindows.toString()); }, [startWithWindows]);
  useEffect(() => { localStorage.setItem('hideOnClickDeadSpot', hideOnClickDeadSpot.toString()); }, [hideOnClickDeadSpot]);
  useEffect(() => { localStorage.setItem('bgGradient', bgGradient); }, [bgGradient]);
  useEffect(() => { localStorage.setItem('glassIntensity', glassIntensity.toString()); }, [glassIntensity]);
  useEffect(() => { localStorage.setItem('bgOpacity', bgOpacity.toString()); }, [bgOpacity]);
  useEffect(() => { localStorage.setItem('activationShortcut', activationShortcut); }, [activationShortcut]);
  useEffect(() => { 
    localStorage.setItem('hotspotCorners', JSON.stringify(hotspotCorners)); 
    if (isElectron) window.electronAPI!.setHotspots(hotspotCorners, hotspotDelay);
  }, [hotspotCorners, hotspotDelay]);
  useEffect(() => { localStorage.setItem('hotspotDelay', hotspotDelay.toString()); }, [hotspotDelay]);

  // Layout Resizing State
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('leftSidebarWidth');
    return saved ? parseInt(saved, 10) : 280;
  });
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('rightSidebarWidth');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  useEffect(() => {
    localStorage.setItem('leftSidebarWidth', leftSidebarWidth.toString());
  }, [leftSidebarWidth]);

  useEffect(() => {
    localStorage.setItem('rightSidebarWidth', rightSidebarWidth.toString());
  }, [rightSidebarWidth]);

  // Carga de imagen de fondo desde el disco
  const [bgDataUrl, setBgDataUrl] = useState('');

  useEffect(() => {
    const loadBg = async () => {
      if (bgType === 'image' && bgImage) {
        if (bgImage.startsWith('http') || bgImage.startsWith('data:')) {
          setBgDataUrl(bgImage);
        } else if (isElectron) {
          // Es una ruta local, pedir a Electron el Base64
          const dataUrl = await window.electronAPI!.getImageData(bgImage);
          if (dataUrl) setBgDataUrl(dataUrl);
        }
      }
    };
    loadBg();
  }, [bgImage, bgType]);

  // Persistencia de Apps y Categorías
  useEffect(() => {
    localStorage.setItem('apps', JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('favoriteIds', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    localStorage.setItem('taskbarAppIds', JSON.stringify(taskbarAppIds));
  }, [taskbarAppIds]);

  // --- PERSISTENCIA CENTRALIZADA ---
  // Intentamos cargar la configuracion inicial desde el archivo de Electron
  // Siempre preferimos la fuente con mas datos (evita perdida por race condition)
  useEffect(() => {
    const initConfig = async () => {
      if (isElectron) {
        const configPath = await window.electronAPI!.getConfigPath();
        console.log('[CONFIG] Ruta:', configPath);
        const config = await window.electronAPI!.loadConfig();
        // Recuperar backup de beforeunload si existe (fallback de emergencia)
        const pendingJson = localStorage.getItem('__pending_config__');
        const pending = pendingJson ? JSON.parse(pendingJson) : null;
        localStorage.removeItem('__pending_config__');

        // El archivo de disco es la fuente unica de verdad compartida entre
        // dev e instalada. localStorage (incluido __pending_config__) es
        // diferente por origen (localhost vs file://), por eso NUNCA debe
        // tener prioridad sobre el archivo.
        const source = config || pending;
        if (source) {
          console.log('CONFIGURACIÓN CENTRALIZADA CARGADA - apps:', source.apps?.length, 'favs:', source.favoriteIds?.length, 'taskbar:', source.taskbarAppIds?.length);
          if (source.apps) { console.log('  apps names:', source.apps.map((a: any) => a.name).join(', ')); setApps(source.apps); }
          if (source.categories) setCategories(source.categories);
          if (source.favoriteIds) setFavoriteIds(source.favoriteIds);
          if (source.taskbarAppIds) setTaskbarAppIds(source.taskbarAppIds);
          // Datos de UI pueden variar entre versiones sin problema
          if (source.bgType) setBgType(source.bgType);
          if (source.bgImage) setBgImage(source.bgImage);
          if (source.customImageUrl !== undefined) setCustomImageUrl(source.customImageUrl);
          if (source.bgColor) setBgColor(source.bgColor);
          if (source.bgGradient) setBgGradient(source.bgGradient);
          if (source.glassIntensity !== undefined) setGlassIntensity(source.glassIntensity);
          if (source.bgOpacity !== undefined) setBgOpacity(source.bgOpacity);
          if (source.startWithWindows !== undefined) setStartWithWindows(source.startWithWindows);
          if (source.hideOnClickDeadSpot !== undefined) setHideOnClickDeadSpot(source.hideOnClickDeadSpot);
          if (source.activationShortcut) setActivationShortcut(source.activationShortcut);
          if (source.hotspotCorners) setHotspotCorners(source.hotspotCorners);
          if (source.hotspotDelay !== undefined) setHotspotDelay(source.hotspotDelay);
          if (source.leftSidebarWidth !== undefined) setLeftSidebarWidth(source.leftSidebarWidth);
          if (source.rightSidebarWidth !== undefined) setRightSidebarWidth(source.rightSidebarWidth);
        }
        setIsConfigLoaded(true);
        console.log('[CONFIG] Carga inicial completada, guardado habilitado');
      } else {
        // En navegador siempre marcar como cargado
        setIsConfigLoaded(true);
      }
    };
    initConfig();
  }, []);

  // Guardar automáticamente cada vez que algo cambie
  const configRef = useRef({ apps, categories, favoriteIds, taskbarAppIds, bgType, bgImage, customImageUrl, bgColor, bgGradient, glassIntensity, bgOpacity, startWithWindows, activationShortcut, hotspotCorners, hotspotDelay, leftSidebarWidth, rightSidebarWidth, hideOnClickDeadSpot });
  configRef.current = { apps: apps.map(({ icon, ...r }: any) => r), categories, favoriteIds, taskbarAppIds, bgType, bgImage, customImageUrl, bgColor, bgGradient, glassIntensity, bgOpacity, startWithWindows, activationShortcut, hotspotCorners, hotspotDelay, leftSidebarWidth, rightSidebarWidth, hideOnClickDeadSpot };

  const forceSaveConfig = useCallback(async () => {
    if (!isElectron || !isConfigLoaded) return;
    try {
      const clean = JSON.parse(JSON.stringify(configRef.current));
      await window.electronAPI!.saveConfig(clean);
    } catch (e) {
      console.error('[SAVE] Error en forceSave:', e);
    }
  }, [isConfigLoaded]);

  useEffect(() => {
    const saveAll = async () => {
      if (!isElectron || !isConfigLoaded) return;
      // Sanitizar: JSON.stringify elimina funciones/undefined, luego reconstruye objeto limpio
      let cleanConfig;
      try {
        const appsClean = apps.map(({ icon, ...rest }: any) => rest);
        cleanConfig = JSON.parse(JSON.stringify({
          apps: appsClean, categories, favoriteIds, taskbarAppIds,
          bgType, bgImage, customImageUrl, bgColor,
          bgGradient, glassIntensity, bgOpacity,
          startWithWindows, activationShortcut,
          hotspotCorners, hotspotDelay,
          leftSidebarWidth, rightSidebarWidth,
          hideOnClickDeadSpot
        }));
      } catch (e) {
        console.error('[SAVE] Error sanitizando config:', e);
        return;
      }
      console.log('[SAVE] Guardando', cleanConfig.apps?.length, 'apps al archivo...');
      try {
        const ok = await window.electronAPI!.saveConfig(cleanConfig);
        console.log('[SAVE] Resultado:', ok ? 'OK' : 'FALLÓ', '- apps:', cleanConfig.apps?.length);
      } catch (e) {
        console.error('[SAVE] Error guardando config:', e);
      }
    };
    const timer = setTimeout(saveAll, 200);
    return () => clearTimeout(timer);
  }, [
    apps, categories, favoriteIds, taskbarAppIds,
    bgType, bgImage, customImageUrl, bgColor,
    bgGradient, glassIntensity, bgOpacity,
    startWithWindows, activationShortcut,
    hotspotCorners, hotspotDelay,
    leftSidebarWidth, rightSidebarWidth,
    hideOnClickDeadSpot,
    isConfigLoaded
  ]);

  // Guardar inmediatamente al cerrar la ventana (beforeunload)
  useEffect(() => {
    const onBeforeUnload = () => {
      if (!isElectron || !isConfigLoaded) return;
      try {
        const config = configRef.current;
        // Solo guardamos en localStorage como fallback de emergencia.
        // El archivo es la fuente unica de verdad.
        localStorage.setItem('__pending_config__', JSON.stringify(config));
        if (window.electronAPI) {
          window.electronAPI.saveConfig(JSON.parse(JSON.stringify(config)));
        }
      } catch (e) {
        console.error('[SAVE] Error en beforeunload:', e);
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isConfigLoaded]);

  // Recargar config cuando la ventana se restaura del tray o cuando cambia en disco
  useEffect(() => {
    if (!isElectron) return;

    const stateKeys = [
      'apps', 'categories', 'favoriteIds', 'taskbarAppIds',
      'bgType', 'bgImage', 'customImageUrl', 'bgColor',
      'bgGradient', 'glassIntensity', 'bgOpacity',
      'startWithWindows', 'activationShortcut',
      'hotspotCorners', 'hotspotDelay',
      'leftSidebarWidth', 'rightSidebarWidth',
      'hideOnClickDeadSpot'
    ] as const;

    const cleanup = window.electronAPI!.onReloadConfig(async () => {
      console.log('[CONFIG] Recargando desde disco...');
      // Resetear vista al estado inicial para que los favoritos siempre sean visibles
      setActiveCategory('all');
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      let config: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          config = await window.electronAPI!.loadConfig();
          if (config && config.apps) {
            console.log('[CONFIG] Cargado en intento', attempt, '- apps:', config.apps.length);
            break;
          }
        } catch (e) {
          console.warn('[CONFIG] Error leyendo config en intento', attempt, e);
        }
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 100));
        }
      }

      if (!config) {
        console.warn('[CONFIG] No se pudo recargar config tras 3 intentos');
        return;
      }

      // Comparar con estado actual para evitar bucles y renders innecesarios
      const current = configRef.current;
      let hasChanges = false;
      for (const key of stateKeys) {
        if (JSON.stringify(current[key]) !== JSON.stringify(config[key])) {
          hasChanges = true;
          break;
        }
      }

      if (!hasChanges) {
        console.log('[CONFIG] Datos en disco identicos al estado actual, ignorando recarga');
        return;
      }

      if (config.apps) {
        setApps(config.apps);
        localStorage.setItem('apps', JSON.stringify(config.apps));
      }
      if (config.categories) {
        setCategories(config.categories);
        localStorage.setItem('categories', JSON.stringify(config.categories));
      }
      if (config.favoriteIds) {
        setFavoriteIds(config.favoriteIds);
        localStorage.setItem('favoriteIds', JSON.stringify(config.favoriteIds));
      }
      if (config.taskbarAppIds) {
        setTaskbarAppIds(config.taskbarAppIds);
        localStorage.setItem('taskbarAppIds', JSON.stringify(config.taskbarAppIds));
      }
      if (config.bgType) {
        setBgType(config.bgType);
        localStorage.setItem('bgType', config.bgType);
      }
      if (config.bgImage) {
        setBgImage(config.bgImage);
        localStorage.setItem('bgImage', config.bgImage);
      }
      if (config.customImageUrl !== undefined) {
        setCustomImageUrl(config.customImageUrl);
        localStorage.setItem('customImageUrl', config.customImageUrl);
      }
      if (config.bgColor) {
        setBgColor(config.bgColor);
        localStorage.setItem('bgColor', config.bgColor);
      }
      if (config.bgGradient) {
        setBgGradient(config.bgGradient);
        localStorage.setItem('bgGradient', config.bgGradient);
      }
      if (config.glassIntensity !== undefined) {
        setGlassIntensity(config.glassIntensity);
        localStorage.setItem('glassIntensity', config.glassIntensity.toString());
      }
      if (config.bgOpacity !== undefined) {
        setBgOpacity(config.bgOpacity);
        localStorage.setItem('bgOpacity', config.bgOpacity.toString());
      }
      if (config.startWithWindows !== undefined) {
        setStartWithWindows(config.startWithWindows);
        localStorage.setItem('startWithWindows', config.startWithWindows.toString());
      }
      if (config.hideOnClickDeadSpot !== undefined) {
        setHideOnClickDeadSpot(config.hideOnClickDeadSpot);
        localStorage.setItem('hideOnClickDeadSpot', config.hideOnClickDeadSpot.toString());
      }
      if (config.activationShortcut) {
        setActivationShortcut(config.activationShortcut);
        localStorage.setItem('activationShortcut', config.activationShortcut);
      }
      if (config.hotspotCorners) {
        setHotspotCorners(config.hotspotCorners);
        localStorage.setItem('hotspotCorners', JSON.stringify(config.hotspotCorners));
      }
      if (config.hotspotDelay !== undefined) {
        setHotspotDelay(config.hotspotDelay);
        localStorage.setItem('hotspotDelay', config.hotspotDelay.toString());
      }
      if (config.leftSidebarWidth !== undefined) {
        setLeftSidebarWidth(config.leftSidebarWidth);
        localStorage.setItem('leftSidebarWidth', config.leftSidebarWidth.toString());
      }
      if (config.rightSidebarWidth !== undefined) {
        setRightSidebarWidth(config.rightSidebarWidth);
        localStorage.setItem('rightSidebarWidth', config.rightSidebarWidth.toString());
      }
      console.log('[CONFIG] Estado actualizado desde disco');
    });
    return cleanup;
  }, []);

  const startResizingLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setLeftSidebarWidth(Math.max(200, Math.min(500, moveEvent.clientX)));
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const startResizingRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setRightSidebarWidth(Math.max(240, Math.min(600, window.innerWidth - moveEvent.clientX)));
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-hide scrollbar: show on any mouse move + on scroll, hide on cursor stop
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let mouseTimer: number;
    const onMouseMove = () => {
      root.classList.add('mouse-active');
      clearTimeout(mouseTimer);
      mouseTimer = window.setTimeout(() => root.classList.remove('mouse-active'), 400);
    };
    root.addEventListener('mousemove', onMouseMove);
    const scrollTimeouts = new Map<HTMLElement, number>();
    const onScroll = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      el.classList.add('scrolling');
      const existing = scrollTimeouts.get(el);
      if (existing) clearTimeout(existing);
      scrollTimeouts.set(el, window.setTimeout(() => {
        el.classList.remove('scrolling');
        scrollTimeouts.delete(el);
      }, 300));
    };
    const scrollEls = document.querySelectorAll<HTMLElement>('.custom-scrollbar');
    scrollEls.forEach(el => el.addEventListener('scroll', onScroll));
    return () => {
      root.removeEventListener('mousemove', onMouseMove);
      clearTimeout(mouseTimer);
      scrollEls.forEach(el => el.removeEventListener('scroll', onScroll));
      scrollTimeouts.forEach(t => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu) setContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isRecordingShortcut) return;

      if (e.code === 'KeyF' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      } else if (e.code === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isAboutOpen) {
          setIsAboutOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSettingsOpen, isRecordingShortcut, isAboutOpen]);

  const handleLaunchApp = async (app: typeof INITIAL_APPS[0]) => {
    // Incrementar contador de uso
    setApps(prevApps => prevApps.map(a => a.id === app.id ? { ...a, usage: (a.usage || 0) + 1 } : a));

    // Si hay ruta definida y estamos en Electron, lanzar la aplicación
    const appPath = (app as any).path;
    if (appPath && isElectron) {
      const result = await window.electronAPI!.launchApp(appPath);
      if (result.success) {
        // Esconder a la bandeja tras lanzar con éxito
        window.electronAPI!.windowHideToTray();
      } else {
        console.warn(`Error al lanzar ${app.name}:`, result.error);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, app: typeof INITIAL_APPS[0]) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, app });
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedFavId(id);
    document.body.setAttribute('data-cl-drag', '1');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFavDragOver = (e: React.DragEvent, targetId: number) => {
    handleDragOver(e);
    if (draggedFavId !== null && draggedFavId !== targetId) {
      setFavDropTarget(targetId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setFavDropTarget(null);
    if (draggedFavId === null || draggedFavId === targetId) return;

    setFavoriteIds(prev => {
      const newIds = [...prev];
      const draggedIdx = newIds.indexOf(draggedFavId);
      const targetIdx = newIds.indexOf(targetId);
      newIds.splice(draggedIdx, 1);
      newIds.splice(targetIdx, 0, draggedFavId);
      return newIds;
    });
    setDraggedFavId(null);
  };

  const handleTaskbarDragStart = (e: React.DragEvent, id: number) => {
    setDraggedTaskbarId(id);
    document.body.setAttribute('data-cl-drag', '1');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id.toString());
    const ghost = document.createElement('div');
    ghost.style.opacity = '0';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleTaskbarDragOver = (e: React.DragEvent, targetId: number) => {
    handleDragOver(e);
    if (draggedTaskbarId !== null && draggedTaskbarId !== targetId) {
      setTaskbarDropTarget(targetId);
    }
  };

  const handleTaskbarDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setTaskbarDropTarget(null);
    if (draggedTaskbarId === null || draggedTaskbarId === targetId) return;

    setTaskbarAppIds(prev => {
      const newIds = [...prev];
      const draggedIdx = newIds.indexOf(draggedTaskbarId);
      const targetIdx = newIds.indexOf(targetId);

      newIds.splice(draggedIdx, 1);
      newIds.splice(targetIdx, 0, draggedTaskbarId);

      return newIds;
    });
    setDraggedTaskbarId(null);
  };

  const handleExport = async () => {
    const data = {
      version: 1,
      apps,
      categories,
      favoriteIds,
      taskbarAppIds,
      viewMode,
      cardScale,
      settings: {
        bgType,
        bgImage,
        customImageUrl,
        bgColor,
        bgGradient,
        glassIntensity,
        bgOpacity,
        startWithWindows,
        leftSidebarWidth,
        rightSidebarWidth,
        activationShortcut,
        hotspotCorners,
        hotspotDelay
      }
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    
    if (isElectron) {
      // Usar diálogo nativo de guardar archivo
      await window.electronAPI!.exportConfig(jsonString);
    } else {
      // Fallback para navegador
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyber-launcher-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const applyImportData = (content: string) => {
    try {
      const data = JSON.parse(content);
      
      if (data.apps) setApps(data.apps);
      if (data.categories) setCategories(data.categories);
      if (data.favoriteIds) setFavoriteIds(data.favoriteIds);
      if (data.taskbarAppIds) setTaskbarAppIds(data.taskbarAppIds);
      if (data.viewMode) setViewMode(data.viewMode);
      if (data.cardScale !== undefined) setCardScale(data.cardScale);
      
      if (data.settings) {
        if (data.settings.bgType !== undefined) setBgType(data.settings.bgType);
        if (data.settings.bgImage !== undefined) setBgImage(data.settings.bgImage);
        if (data.settings.customImageUrl !== undefined) setCustomImageUrl(data.settings.customImageUrl);
        if (data.settings.bgColor !== undefined) setBgColor(data.settings.bgColor);
        if (data.settings.bgGradient !== undefined) setBgGradient(data.settings.bgGradient);
        if (data.settings.glassIntensity !== undefined) setGlassIntensity(data.settings.glassIntensity);
        if (data.settings.bgOpacity !== undefined) setBgOpacity(data.settings.bgOpacity);
        if (data.settings.startWithWindows !== undefined) setStartWithWindows(data.settings.startWithWindows);
        if (data.settings.leftSidebarWidth !== undefined) setLeftSidebarWidth(data.settings.leftSidebarWidth);
        if (data.settings.rightSidebarWidth !== undefined) setRightSidebarWidth(data.settings.rightSidebarWidth);
        if (data.settings.activationShortcut !== undefined) setActivationShortcut(data.settings.activationShortcut);
        if (data.settings.hotspotCorners !== undefined) setHotspotCorners(data.settings.hotspotCorners);
        if (data.settings.hotspotCorner !== undefined && data.settings.hotspotCorner !== 'none') {
           setHotspotCorners([data.settings.hotspotCorner]);
        }
        if (data.settings.hotspotDelay !== undefined) setHotspotDelay(data.settings.hotspotDelay);
      }
      
    } catch (error) {
      console.error('Error al importar:', error);
    }
  };

  const handleImportNative = async () => {
    if (isElectron) {
      const content = await window.electronAPI!.importConfig();
      if (content) applyImportData(content);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      applyImportData(content);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset the input
  };

  useEffect(() => {
    setSearchQuery('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    // Fetch monitors
    const fetchMonitors = async () => {
      if (isElectron) {
        const mons = await window.electronAPI!.getMonitors();
        setMonitors(mons);
        const primary = mons.find(m => m.isPrimary);
        if (primary) setSelectedMonitor(primary.id);
        
        // Registrar el atajo guardado al iniciar
        window.electronAPI!.registerShortcut(activationShortcut);
        // Registrar hotspots al iniciar
        window.electronAPI!.setHotspots(hotspotCorners, hotspotDelay);
      } else {
        setMonitors([
          { id: '1', label: '1 (Primario)', isPrimary: true },
          { id: '2', label: 'Monitor 2', isPrimary: false },
          { id: '3', label: 'Monitor 3', isPrimary: false },
        ]);
        setSelectedMonitor('1');
      }
    };
    fetchMonitors();
  }, []);

  const categoriesWithCount = categories.map(cat => ({
    ...cat,
    count: cat.id === 'all' ? apps.length : apps.filter(app => app.category === cat.name).length
  })).sort((a, b) => {
    if (a.id === 'all') return -1;
    if (b.id === 'all') return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredApps = apps.filter(app => {
    const matchesCategory = activeCategory === 'all' || categories.find(c => c.id === activeCategory)?.name === app.category;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const favorites = favoriteIds.map(id => apps.find(a => a.id === id)).filter(Boolean) as typeof INITIAL_APPS;
  const mostUsed = [...apps].sort((a, b) => b.usage - a.usage).slice(0, 15);

  const getBackgroundStyle = () => {
    if (bgType === 'image') {
      return { 
        backgroundImage: `url("${bgDataUrl || bgImage}")`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      };
    }
    if (bgType === 'solid') return { backgroundColor: bgColor };
    return { backgroundImage: bgGradient };
  };

  const getGlassStyle = (baseAlpha: number, isBlurry: boolean = true) => {
    // Adjust opacity based on 'glassIntensity' slider when an image is used, 
    // or keep it more solid if solid/gradient is used to maintain contrast.
    const alpha = bgType === 'image' 
      ? Math.max(0.1, baseAlpha * (glassIntensity / 100)) 
      : baseAlpha * 1.5; // Make more solid if no image
    
    return {
      backgroundColor: `rgba(10, 15, 24, ${alpha})`,
      ...(isBlurry && bgType === 'image' ? { backdropFilter: `blur(${Math.max(4, 20 * (100 - glassIntensity)/100)}px)` } : {})
    };
  };

  const handleInputContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isElectron) {
      window.electronAPI!.showTextContextMenu(e.clientX, e.clientY);
    }
  }, []);

  const [isDraggingFromOS, setIsDraggingFromOS] = useState(false);

  // --- Handlers para Drag & Drop desde Windows/OS ---
  const handleSystemDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (document.body.hasAttribute('data-cl-drag')) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsDraggingFromOS(true);
    }
  };

  const handleSystemDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Prevenir cerrar el overlay si entramos a un nodo hijo
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFromOS(false);
  };


  useEffect(() => {
    if (!isElectron) return;

    const handleGlobalDragOver = (e: DragEvent) => {
      if (document.body.hasAttribute('data-cl-drag')) return;
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFromOS(true);
      }
    };

    const handleGlobalDrop = (e: DragEvent) => {
      if (document.body.hasAttribute('data-cl-drag')) return;
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFromOS(false);
        handleSystemDrop(e as any);
      }
    };

    // Usar 'capture' (true) para asegurarnos de que atrapamos el evento antes que nadie
    window.addEventListener('dragover', handleGlobalDragOver, true);
    window.addEventListener('drop', handleGlobalDrop, true);
    
    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver, true);
      window.removeEventListener('drop', handleGlobalDrop, true);
    };
  }, [isElectron]); // Añadido isElectron como dependencia

  const handleSystemDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFromOS(false);
    if (document.body.hasAttribute('data-cl-drag')) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      let filePath = '';
      if (isElectron && window.electronAPI?.getPathForFile) {
        try {
          filePath = window.electronAPI.getPathForFile(file);
        } catch (err) {
          filePath = (file as any).path;
        }
      } else {
        filePath = (file as any).path;
      }
      
      if (filePath && isElectron) {
        const resolved = await window.electronAPI!.resolveFilePath(filePath);
        if (resolved) {
          console.log('[ICON] Resuelto:', resolved.name, '| iconSize:', resolved.iconPath?.length || 0, '| debug:', JSON.stringify(resolved.debug));
          setEditForm({
            name: resolved.name,
            path: resolved.path,
            iconPath: resolved.iconPath || '',
            category: ''
          });
          setIsAddingApp(true);
        } else {
          console.error('La API de resolución devolvió null para:', filePath);
        }
      } else {
        // Fallback para navegador
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setEditForm({
          name: fileName,
          path: filePath || `C:\\Program Files\\${fileName}\\${file.name}`,
          iconPath: '',
          category: ''
        });
        setIsAddingApp(true);
      }
    }
  };

  return (
    <div 
      ref={rootRef}
      className="flex h-screen w-full text-slate-300 font-sans overflow-hidden selection:bg-blue-500/30 relative transition-all duration-500"
      style={getBackgroundStyle()}
      onDragOver={handleSystemDragOver}
      onDragLeave={handleSystemDragLeave}
      onDrop={handleSystemDrop}
      onClick={(e) => {
        if (!hideOnClickDeadSpot || !isElectron) return;
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, select, textarea, [role="button"], [role="tab"], [contenteditable], [data-no-hide]')) return;
        window.electronAPI!.windowHideToTray();
      }}
    >
      {/* --- OVERLAYS FOR IMAGE BACKGROUND --- */}
      {bgType === 'image' && (
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-500" 
          style={{ backgroundColor: `rgba(0, 0, 0, ${bgOpacity / 100})` }}
        />
      )}

      {/* --- OS DRAG OVERLAY --- */}
      <AnimatePresence>
        {isDraggingFromOS && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-blue-900/40 backdrop-blur-sm border-4 border-blue-500 border-dashed rounded-xl m-4 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="bg-black/50 p-6 rounded-2xl flex flex-col items-center shadow-2xl backdrop-blur-md border border-white/10">
              <Upload className="w-16 h-16 text-blue-400 mb-4" />
              <h2 className="text-2xl font-cyber font-bold text-white tracking-widest drop-shadow-md">
                SOLTAR PARA AÑADIR APP
              </h2>
              <p className="text-slate-300 mt-2 text-sm text-center max-w-xs">
                Arrastra ejecutables (.exe) o accesos directos (.lnk) para extraer su información.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex flex-col w-full h-full relative z-10"
      >
        <div className="flex-1 flex overflow-hidden">
            {/* --- LEFT SIDEBAR (Categories) --- */}
            <aside 
              className={`flex-shrink-0 flex flex-col border-r border-white/5 z-10 ${!isDraggingLeft && 'transition-all duration-300'}`}
              style={{ ...getGlassStyle(0.8), width: leftSidebarWidth }}
            >
        <div className="p-6 flex items-center gap-3">
          <button 
            onClick={() => setIsAboutOpen(true)}
            className="group w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex flex-shrink-0 items-center justify-center border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            title="Acerca de Cyber Launcher"
          >
            <CyberLogo className="w-9 h-9 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all group-hover:drop-shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
          </button>
          <div>
            <h1 className="font-cyber font-bold text-white tracking-wider text-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">CYBER</h1>
            <h2 className="text-xs text-cyan-400 font-cyber tracking-widest font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">LAUNCHER</h2>
          </div>
        </div>

        <div className="px-6 pb-2 flex items-center justify-between">
          <span className="text-[11px] font-cyber font-semibold text-slate-400/80 tracking-wider">
            CATEGORÍAS
          </span>
          <button 
            onClick={() => {
              const newId = 'cat-' + Date.now();
              setCategories([...categories, { id: newId, name: 'Nueva', color: '#60a5fa' }]);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Agregar categoría"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5 custom-scrollbar">
          {categoriesWithCount.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all duration-200 group border border-transparent ${
                activeCategory === cat.id 
                  ? 'bg-blue-500/20 text-white border-blue-500/20 shadow-[inset_2px_0_0_0_#3b82f6]' 
                  : 'hover:bg-white/5 hover:text-white hover:border-white/5 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ 
                    backgroundColor: cat.color,
                    boxShadow: `0 0 8px ${cat.color}`
                  }} 
                />
                <span className="text-sm font-medium drop-shadow-sm">{cat.name}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full backdrop-blur-md ${
                activeCategory === cat.id ? 'bg-blue-500/30 text-blue-200' : 'bg-black/40 group-hover:bg-black/60'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6 pt-4">
          <div className="flex items-center justify-center gap-2 mb-6 opacity-30">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent flex-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <div className="h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent flex-1" />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" style={{ boxShadow: '0 0 8px #3b82f6' }} />
                APPS
              </div>
              <span className="text-blue-400 font-mono">{apps.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
               <div className="flex items-center gap-2 text-slate-400">
                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" style={{ boxShadow: '0 0 8px #eab308' }} />
                CATEGORÍAS
              </div>
              <span className="text-yellow-400 font-mono">{categories.length - 1}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" style={{ boxShadow: '0 0 8px #10b981' }} />
                LANZAMIENTOS
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-sm rounded-full"></div>
                <span className="relative text-emerald-400 font-cyber font-bold tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">{apps.reduce((acc, app) => acc + (app.usage || 0), 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Resize Handle Left */}
      <div 
        className="w-[2px] cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500 z-50 transition-colors shrink-0"
        onMouseDown={startResizingLeft}
      />

      {/* --- CENTER MAIN CONTENT --- */}
      <main 
        className="flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300"
        style={getGlassStyle(0.4)}
      >
        {/* Decorative background element (only visible if not using image) */}
        {bgType !== 'image' && (
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
        )}

        {/* Top Bar */}
        <header className="h-20 flex items-center px-8 justify-between shrink-0 relative z-20 border-b border-transparent gap-8">
          <div className="relative w-full max-w-[400px] group shrink">
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 backdrop-blur-md text-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)] border border-white/10 transition-all placeholder:text-slate-500 block shadow-inner"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors drop-shadow-sm" />
            </div>
          </div>
          
          <div className="flex items-center gap-6 ml-auto">
            <div className="flex items-center gap-3">
              <SystemMonitor />
              <DiskMonitor />
            </div>
            
            <div className="flex items-center gap-2 text-cyan-400 font-cyber font-bold text-[20px] tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] tabular-nums w-[150px] shrink-0 justify-start pl-6 border-l border-white/10">
              <Clock className="w-5 h-5 mb-0.5 shrink-0" />
              <span>{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
            </div>
          </div>
        </header>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar relative z-10">
          
          {/* Favorites Section */}
          {!searchQuery && activeCategory === 'all' && (
            <section className="mb-10 pt-4">
              <h3 className="text-[11px] font-cyber font-bold text-slate-400 tracking-widest flex items-center gap-2 mb-4 drop-shadow-sm">
                <Star className="w-4 h-4 fill-slate-400" />
                FAVORITOS
              </h3>
              <div className="flex flex-wrap gap-3">
                {favorites.map((app) => (
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    key={`fav-${app.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    onDragOver={(e) => handleFavDragOver(e, app.id)}
                    onDrop={(e) => handleDrop(e, app.id)}
                    onDragEnd={() => { setDraggedFavId(null); setFavDropTarget(null); document.body.removeAttribute('data-cl-drag'); }}
                    onDragLeave={() => setFavDropTarget(prev => prev === app.id ? null : prev)}
                    onContextMenu={(e: any) => handleContextMenu(e, app)}
                    onClick={() => handleLaunchApp(app)}
                    className={`group relative flex items-center justify-center w-[52px] h-[52px] bg-black/40 backdrop-blur-md border rounded-2xl transition-all shadow-lg cursor-grab active:cursor-grabbing ${app.color} ${
                      draggedFavId === app.id ? 'opacity-50 border-cyan-500/50 scale-95' : ''
                    } ${favDropTarget === app.id ? 'border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-110' : 'border-white/10 hover:bg-white/10 hover:border-current hover:shadow-[0_0_15px_currentColor]'}`}
                  >
                    <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-[0.15] blur-md rounded-2xl transition-opacity pointer-events-none" />
                    <AppIcon app={app} className="w-6 h-6 z-10" />
                    
                    {/* Tooltip */}
                    <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 p-2 bg-[#0f172a]/95 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-200 z-50 flex flex-col items-center gap-0.5">
                       <span className="text-xs font-semibold text-slate-100 whitespace-nowrap">{app.name}</span>
                       <span className="text-[10px] text-slate-500 font-normal whitespace-nowrap">{app.category}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* All Apps Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm">
                {activeCategory === 'all' ? 'TODAS LAS APPS' : categories.find(c => c.id === activeCategory)?.name.toUpperCase()}
              </h3>
              
              <div className="flex items-center bg-black/30 backdrop-blur-md rounded-lg p-1 border border-white/5">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-500/80 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-500/80 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/10 mx-2" />
                <button 
                  onClick={() => {
                    setEditForm({ name: '', path: '', iconPath: '', category: '' });
                    setIsAddingApp(true);
                  }}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors" 
                  title="Agregar app"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div 
              className={viewMode === 'grid' ? "grid" : "grid items-start content-start"}
              style={{
                gridTemplateColumns: viewMode === 'grid' 
                  ? `repeat(auto-fill, minmax(${100 * (cardScale / 100)}px, 1fr))`
                  : `repeat(auto-fill, minmax(${180 * (Math.max(cardScale, 50) / 100)}px, 1fr))`,
                gap: viewMode === 'grid' 
                  ? `${12 * (cardScale / 100)}px`
                  : `${8 * (cardScale / 100)}px`
              }}
            >
              {filteredApps.flatMap((app, index) => {
                const elements = [];
                
                if (viewMode === 'list') {
                  const firstLetter = app.name.charAt(0).toUpperCase();
                  const pLetter = firstLetter.match(/[A-Z0-9]/i) ? firstLetter : '#';
                  const prevApp = index > 0 ? filteredApps[index - 1] : null;
                  let showHeader = false;
                  
                  if (prevApp) {
                    const prevFirstLetter = prevApp.name.charAt(0).toUpperCase();
                    const prevPLetter = prevFirstLetter.match(/[A-Z0-9]/i) ? prevFirstLetter : '#';
                    showHeader = pLetter !== prevPLetter;
                  } else {
                    showHeader = true;
                  }

                  if (showHeader) {
                    elements.push(
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.015 }}
                        key={`header-${viewMode}-${activeCategory}-${pLetter}`}
                        className="col-span-full mt-2 mb-1 flex items-center gap-4 opacity-70" 
                        style={{ gridColumn: '1 / -1' }}
                      >
                        <span className="text-base font-bold font-cyber text-slate-400 w-8 pl-1">{pLetter}</span>
                        <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-1" />
                      </motion.div>
                    );
                  }
                }

                elements.push(
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.01, ease: "easeOut" }}
                    whileHover={{ scale: 1.03 }}
                    key={`app-${viewMode}-${activeCategory}-${app.id}`}
                    onContextMenu={(e) => handleContextMenu(e, app)}
                    onClick={() => handleLaunchApp(app)}
                    style={{
                      padding: viewMode === 'grid' 
                        ? `${12 * (cardScale / 100)}px` 
                        : `${8 * (cardScale / 100)}px ${12 * (cardScale / 100)}px`,
                      borderRadius: viewMode === 'grid'
                        ? `${16 * (cardScale / 100)}px`
                        : `${12 * (cardScale / 100)}px`
                    }}
                    className={viewMode === 'grid'
                      ? "relative group bg-black/20 backdrop-blur-xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-colors shadow-xl shadow-black/30 focus-within:ring-2 focus-within:ring-blue-500/50 cursor-pointer overflow-hidden"
                      : "flex items-center justify-between bg-black/20 backdrop-blur-xl border border-white/5 hover:bg-white/10 hover:border-white/20 group cursor-pointer transition-colors shadow-md overflow-hidden"
                    }
                  >
                    {viewMode === 'grid' ? (
                      <>
                        {favoriteIds.includes(app.id) && (
                          <Star 
                            className="absolute top-[8px] right-[8px] text-blue-400 fill-blue-500/30 drop-shadow-md" 
                            style={{ width: `${12 * (cardScale / 100)}px`, height: `${12 * (cardScale / 100)}px` }}
                          />
                        )}
                        <div 
                          className="flex flex-col items-center justify-center text-center h-full"
                          style={{ gap: `${8 * (cardScale / 100)}px` }}
                        >
                          <AppIcon app={app}
                            className={`group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_currentColor] drop-shadow-lg transition-all duration-300 ${app.color}`}
                            style={{ width: `${36 * (cardScale / 100)}px`, height: `${36 * (cardScale / 100)}px` }}
                            strokeWidth={1.5} 
                          />
                          <div className="w-full">
                            <h4 
                              className="font-semibold text-slate-100 leading-tight mb-0.5 drop-shadow-sm truncate w-full"
                              style={{ fontSize: `${12 * (cardScale / 100)}px` }}
                            >
                              {app.name}
                            </h4>
                            <p 
                              className="text-slate-400 truncate w-full"
                              style={{ fontSize: `${10 * (cardScale / 100)}px` }}
                            >
                              {app.category}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center" style={{ gap: `${16 * (cardScale / 100)}px` }}>
                          <AppIcon app={app}
                            className={`flex-shrink-0 drop-shadow-lg ${app.color}`}
                            style={{ width: `${28 * (cardScale / 100)}px`, height: `${28 * (cardScale / 100)}px` }} 
                            strokeWidth={1.5}
                          />
                          <div className="flex flex-col justify-center min-w-0 pr-2">
                            <h4 
                              className="font-medium text-slate-100 truncate"
                              style={{ fontSize: `${14 * (cardScale / 100)}px` }}
                            >
                              {app.name}
                            </h4>
                            <p 
                              className="text-slate-400 truncate"
                              style={{ fontSize: `${12 * (cardScale / 100)}px` }}
                            >
                              {app.category}
                            </p>
                          </div>
                        </div>
                        {favoriteIds.includes(app.id) && (
                          <Star 
                            className="text-blue-400 fill-blue-500/30 group-hover:text-blue-300 flex-shrink-0" 
                            style={{ width: `${16 * (cardScale / 100)}px`, height: `${16 * (cardScale / 100)}px` }}
                          />
                        )}
                      </>
                    )}
                  </motion.div>
                );

                return elements;
              })}
            </div>
            
            {filteredApps.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No se encontraron aplicaciones</p>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* Resize Handle Right */}
      <div 
        className="w-[2px] cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500 z-50 transition-colors shrink-0"
        onMouseDown={startResizingRight}
      />

      {/* --- RIGHT SIDEBAR (Most Used) --- */}
      <aside 
        className={`flex-shrink-0 flex flex-col border-l border-white/5 shadow-2xl relative z-20 ${!isDraggingRight && 'transition-all duration-300'}`}
        style={{ ...getGlassStyle(0.85), width: rightSidebarWidth }}
      >
        <div className="p-6 pb-2 flex items-center justify-between">
          <h3 className="text-[11px] font-cyber font-bold text-slate-400 tracking-widest mt-2 px-2 drop-shadow-sm">
            MÁS USADAS
          </h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsAboutOpen(true)}
              title="Acerca de CyberLauncher" 
              className="flex items-center justify-center w-7 h-7 hover:bg-white/10 rounded-md transition-colors group"
            >
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              title="Configuración" 
              className="flex items-center justify-center w-7 h-7 hover:bg-white/10 rounded-md transition-colors group"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </button>
            <button 
              onClick={() => {
                if (isElectron) {
                  window.electronAPI!.windowHideToTray();
                } else {
                  setIsAppActive(false);
                }
              }}
              title="Minimizar a la bandeja del sistema" 
              className="flex items-center justify-center w-7 h-7 hover:bg-white/10 rounded-md transition-colors group"
            >
              <Minimize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-4 py-2 pb-4 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col justify-between">
            {mostUsed.map((app, index) => (
              <button 
                key={`recent-${app.id}`}
                onContextMenu={(e) => handleContextMenu(e, app)}
                onClick={() => handleLaunchApp(app)}
                className="w-full flex-1 min-h-0 flex items-center justify-between px-2 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/10 group transition-all"
              >
                <div className="flex items-center gap-2 lg:gap-3 overflow-hidden">
                  <span className="text-[10px] md:text-xs text-slate-500 font-mono w-3 lg:w-4 text-right group-hover:text-slate-300 shrink-0">
                    {index + 1}.
                  </span>
                  <AppIcon app={app} className={`w-4 h-4 lg:w-5 lg:h-5 drop-shadow-md shrink-0 ${app.color}`} strokeWidth={1.5} />
                  <span className="text-xs lg:text-sm font-medium text-slate-300 group-hover:text-white transition-colors truncate text-left drop-shadow-sm min-w-0">
                    {app.name}
                  </span>
                </div>
                <span className="text-[10px] lg:text-xs font-mono text-cyan-400/80 group-hover:text-cyan-300 transition-colors shrink-0 ml-2 bg-cyan-500/5 group-hover:bg-cyan-500/10 px-2 py-0.5 rounded-md border border-transparent group-hover:border-cyan-500/20">
                  {app.usage > 0 ? app.usage : '-'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>
      </div> {/* Cierra el contenedor de sidebars y contenido principal */}

      {/* --- TASKBAR DE ESCRITORIO --- */}
      <div className="flex-shrink-0 flex items-center justify-between w-full bg-black/60 backdrop-blur-3xl border-t border-white/10 px-6 py-2 z-40 relative">
        {/* Lado izquierdo: Inicio y Favoritos */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAboutOpen(!isAboutOpen)} 
            className="hover:scale-110 transition-transform flex-shrink-0"
            title="Menú Inicio / Acerca de"
          >
            <CyberLogo className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <div className="flex gap-2 relative">
            {taskbarAppIds.map(id => {
              const app = apps.find(a => a.id === id);
              if (!app) return null;
              return (
                <button 
                  key={`taskbar-${app.id}`} 
                  draggable
                  onDragStart={(e) => handleTaskbarDragStart(e, app.id)}
                  onDragOver={(e) => handleTaskbarDragOver(e, app.id)}
                  onDrop={(e) => handleTaskbarDrop(e, app.id)}
                  onDragEnd={() => { setDraggedTaskbarId(null); setTaskbarDropTarget(null); document.body.removeAttribute('data-cl-drag'); }}
                  onDragLeave={() => setTaskbarDropTarget(prev => prev === app.id ? null : prev)}
                  onContextMenu={(e) => handleContextMenu(e, app)}
                  onClick={() => handleLaunchApp(app)}
                  className={`group relative focus:outline-none p-1 cursor-grab active:cursor-grabbing ${
                    draggedTaskbarId === app.id ? 'opacity-50 scale-95' : ''
                  } ${taskbarDropTarget === app.id ? 'bg-cyan-500/20 rounded-lg shadow-[0_0_12px_rgba(34,211,238,0.6)] scale-110' : ''}`} 
                  title={app.name}
                >
                  <div className={`w-8 h-8 rounded-lg bg-transparent border border-transparent flex items-center justify-center ${app.color} group-hover:bg-white/10 transition-all`}>
                    <AppIcon app={app} className="w-5 h-5 drop-shadow-md" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="w-4 h-1 rounded-t-sm bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                  </div>
                </button>
              );
            })}
            
            {/* Botón "+" para agregar app */}
            <div className="relative">
              <button 
                onClick={() => {
                  setEditForm({ name: '', path: '', iconPath: '', category: '' });
                  setIsAddingApp(true);
                }}
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/5 border-dashed"
                title="Añadir nueva aplicación"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Lado derecho: Info del sistema */}
        <div className="flex items-center gap-4 text-slate-400">
          {/* Uptime */}
          <div className="flex items-center gap-1.5 cursor-default" title="Tiempo encendido del sistema (Uptime)">
            <Power className="w-4 h-4 text-emerald-500" />
            <UptimeMonitor />
          </div>
          <div className="w-px h-4 bg-white/10" />
          {/* Launches today */}
          <div className="flex items-center gap-1.5 cursor-default" title="Lanzamientos de hoy">
            <ChevronRight className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-mono text-slate-400">{apps.reduce((acc: number, app: any) => acc + (app.usage || 0), 0)}</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          {/* Date */}
          <div className="flex items-center gap-1.5 cursor-default text-slate-400" title="Fecha actual">
            <span className="text-sm font-mono tracking-wide">
              {currentTime.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase().replace(/ DE (\d{4})$/, ', $1')}
            </span>
          </div>
        </div>
      </div>

    </motion.div>

      {/* --- ABOUT MODAL --- */}
      <AnimatePresence>
        {isAboutOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsAboutOpen(false)}
          >
             <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-[#0a0f18] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh]"
            >
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-2xl m-2 pointer-events-none z-10" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-2xl m-2 pointer-events-none z-10" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-2xl m-2 pointer-events-none z-10" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50 rounded-br-2xl m-2 pointer-events-none z-10" />
              
              <button 
                onClick={() => setIsAboutOpen(false)} 
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-20"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto custom-scrollbar flex flex-col items-center p-8 text-center w-full">
                <CyberLogo className="w-24 h-24 text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] shrink-0" />
                
                <h1 className="text-[26px] font-cyber font-bold tracking-widest text-white mb-1 drop-shadow-md shrink-0">CYBER LAUNCHER</h1>
                <div className="text-xs font-mono text-cyan-400 mb-6 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)] shrink-0">
                  v1.0.0-beta.neo
                </div>

                <div className="w-full flex flex-col gap-4 font-mono text-xs text-slate-500 text-left bg-black/40 p-5 rounded-xl border border-white/5 relative overflow-hidden group/tech shadow-inner shrink-0">
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/tech:opacity-100 transition-opacity pointer-events-none" />
                  
                  <h4 className="text-cyan-400 text-[10px] tracking-[0.2em] border-b border-white/5 pb-2 drop-shadow-sm flex items-center justify-between">
                    <span>ESPECIFICACIONES DEL NÚCLEO</span>
                    <span className="text-emerald-400">ESTABLE</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex justify-between items-center bg-white/5 px-2.5 py-2 rounded-md border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/10 transition-colors shadow-sm">
                      <span className="text-slate-300">React</span>
                      <span className="text-blue-400 drop-shadow-sm">v19.0.1</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-2.5 py-2 rounded-md border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-colors shadow-sm">
                      <span className="text-slate-300">Tailwind</span>
                      <span className="text-cyan-400 drop-shadow-sm">v4.1.14</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-2.5 py-2 rounded-md border border-white/5 hover:border-yellow-500/30 hover:bg-yellow-500/10 transition-colors shadow-sm">
                      <span className="text-slate-300">Vite</span>
                      <span className="text-yellow-400 drop-shadow-sm">v6.2.3</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-2.5 py-2 rounded-md border border-white/5 hover:border-fuchsia-500/30 hover:bg-fuchsia-500/10 transition-colors shadow-sm">
                      <span className="text-slate-300">Motion</span>
                      <span className="text-fuchsia-400 drop-shadow-sm">v12.38</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-2.5 py-2 rounded-md border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-colors shadow-sm">
                      <span className="text-slate-300">Lucide</span>
                      <span className="text-emerald-400 drop-shadow-sm">v0.546</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-2.5 py-2 rounded-md border border-white/5 hover:border-blue-600/30 hover:bg-blue-600/10 transition-colors shadow-sm">
                      <span className="text-slate-300">TypeScript</span>
                      <span className="text-blue-500 drop-shadow-sm">v5.8.2</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-[10px] tracking-[0.2em] text-slate-600 hover:text-cyan-400 transition-colors cursor-default shrink-0">
                  &copy; 2026 Carlos@CiberCR.com
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ADD/EDIT APP MODAL --- */}
      <AnimatePresence>
        {(editingApp || isAddingApp) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setEditingApp(null); setIsAddingApp(false); }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0d131f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/20">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <PenBox className="w-5 h-5 text-blue-400" />
                  {isAddingApp ? 'Añadir App' : 'Editar App'}
                </h2>
                <button 
                  onClick={() => { setEditingApp(null); setIsAddingApp(false); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div className="space-y-4">
                  {/* Name field */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 tracking-wider mb-2 block min-w-[max-content]">NOMBRE</label>
                    <input 
                      type="text"
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      onContextMenu={handleInputContextMenu}
                      placeholder="Ej. Visual Studio Code"
                    />
                  </div>

                  {/* Icon path field */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 tracking-wider mb-2 block min-w-[max-content]">RUTA LOCAL DEL ÍCONO (OPCIONAL)</label>
                    <div className="flex gap-3 items-center">
                      <div className="w-11 h-11 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner group">
                         {editForm.iconPath ? (
                           <img src={editForm.iconPath} alt="Preview" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                         ) : (
                           <Package className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                         )}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editForm.iconPath.startsWith('data:image') ? 'Ícono extraído del sistema' : editForm.iconPath}
                          onChange={(e) => setEditForm({ ...editForm, iconPath: e.target.value })}
                          onContextMenu={handleInputContextMenu}
                          placeholder="Ej. C:\Icons\vscode.png"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                        {isElectron ? (
                          <button 
                            onClick={async () => {
                              const filePath = await window.electronAPI!.selectImage();
                              if (filePath) {
                                // Convertir la ruta del ícono a Base64 para que se guarde en apps y sea visible
                                const dataUrl = await window.electronAPI!.getImageData(filePath);
                                if (dataUrl) setEditForm(prev => ({ ...prev, iconPath: dataUrl }));
                              }
                            }}
                            className="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors border border-white/5 shrink-0"
                          >
                            <Upload className="w-4 h-4 mr-2" /> PC
                          </button>
                        ) : (
                          <label className="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors border border-white/5 shrink-0">
                            <Upload className="w-4 h-4 mr-2" /> PC
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const objectUrl = URL.createObjectURL(file);
                                  setEditForm(prev => ({ ...prev, iconPath: objectUrl }));
                                }
                              }} 
                            />
                          </label>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Si se deja vacío, utilizará el ícono por defecto.</p>
                  </div>

                  {/* Shortcut path field */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 tracking-wider mb-2 block min-w-[max-content]">RUTA DEL ACCESO O URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                        value={editForm.path}
                        onChange={(e) => setEditForm(prev => ({ ...prev, path: e.target.value }))}
                        onContextMenu={handleInputContextMenu}
                        placeholder="Ej. C:\Program Files\App\app.exe"
                      />
                      {isElectron ? (
                        <button 
                          onClick={async () => {
                            const fileInfo = await window.electronAPI!.selectFile();
                            if (fileInfo && typeof fileInfo === 'object') {
                              setEditForm(prev => ({ 
                                ...prev, 
                                path: fileInfo.path,
                                name: prev.name || fileInfo.name,
                                iconPath: prev.iconPath || fileInfo.iconPath
                              }));
                            }
                          }}
                          className="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors border border-white/5 shrink-0"
                        >
                          <Upload className="w-4 h-4 mr-2" /> PC
                        </button>
                      ) : (
                        <label className="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors border border-white/5 shrink-0">
                          <Upload className="w-4 h-4 mr-2" /> PC
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setEditForm(prev => ({ ...prev, path: `C:\\Local\\${file.name}` }));
                              }
                            }} 
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Category Field */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 tracking-wider mb-2 block min-w-[max-content]">CATEGORÍA <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <select 
                        value={editForm.category}
                        onChange={(e) => setEditForm(prev => ({...prev, category: e.target.value}))}
                        className={`w-full bg-black/30 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none ${editForm.category ? 'text-white border-white/10' : 'text-slate-500 border-white/10'}`}
                      >
                        <option value="" disabled className="bg-[#0f172a] text-sm text-slate-500">Seleccionar...</option>
                        {categories.filter(c => c.id !== 'all').sort((a,b) => a.name.localeCompare(b.name)).map(cat => (
                          <option key={cat.id} value={cat.name} className="bg-[#0f172a] text-sm">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                    </div>
                    {!editForm.category && (
                      <p className="text-[10px] text-red-400/80 mt-1">Debes seleccionar una categoría</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
                <button 
                  onClick={() => { setEditingApp(null); setIsAddingApp(false); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (isAddingApp) {
                      const newApp = {
                        id: Date.now(),
                        name: editForm.name || 'Nueva App',
                        path: editForm.path,
                        iconPath: editForm.iconPath,
                        icon: Package, // Fallback icon component
                        category: editForm.category,
                        color: 'text-cyan-400',
                        isFav: false,
                        usage: 0
                      };
                      // @ts-ignore
                      setApps(prev => [...prev, newApp]);
                      setIsAddingApp(false);
                    } else if (editingApp) {
                      setApps(prev => prev.map(a => {
                        if (a.id === editingApp.id) {
                          return {
                            ...a,
                            name: editForm.name,
                            // @ts-ignore
                            path: editForm.path,
                            // @ts-ignore
                            iconPath: editForm.iconPath,
                            category: editForm.category
                          };
                        }
                        return a;
                      }));
                      setEditingApp(null);
                    }
                  }}
                  disabled={!editForm.category}
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-lg ${
                    !editForm.category
                      ? 'bg-blue-600/40 cursor-not-allowed shadow-blue-500/10'
                      : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  {isAddingApp ? 'Añadir App' : 'Guardar Cambios'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SETTINGS MODAL --- */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0d131f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/20">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Personalización
                </h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-white/10 px-4 shrink-0 bg-black/10">
                {([['general','General','⌨'],['appearance','Apariencia','🎨'],['system','Sistema','⚙']] as const).map(([id,label,icon]) => (
                  <button key={id} onClick={() => setSettingsTab(id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${settingsTab === id ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'}`}>
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">

                {settingsTab === 'general' && (<>
                {/* Keyboard Shortcut Config */}
                <div className="space-y-3">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-slate-500" />
                    ATAJO PARA ACTIVAR / OCULTAR
                  </label>
                  <button
                    onClick={() => setIsRecordingShortcut(true)}
                    onKeyDown={(e) => {
                      if (isRecordingShortcut) {
                        e.preventDefault();
                        const keys = [];
                        if (e.ctrlKey) keys.push('Ctrl');
                        if (e.altKey) keys.push('Alt');
                        if (e.shiftKey) keys.push('Shift');
                        if (e.metaKey) keys.push('Meta');
                        
                        if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
                            const keyName = e.code === 'Space' ? 'Space' : e.key.toUpperCase();
                            keys.push(keyName);
                            const newShortcut = keys.join('+');
                            setActivationShortcut(newShortcut);
                            setIsRecordingShortcut(false);
                            // Registrar el atajo global en Electron
                            if (isElectron) {
                              window.electronAPI!.registerShortcut(newShortcut);
                            }
                        }
                      }
                    }}
                    onBlur={() => setIsRecordingShortcut(false)}
                    className={`w-full text-center px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all ${
                      isRecordingShortcut 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                        : 'bg-black/40 text-slate-300 hover:bg-white/5 border border-white/10 shadow-inner'
                    }`}
                  >
                    {isRecordingShortcut ? 'Presiona la combinación de teclas...' : activationShortcut}
                  </button>
                  <p className="text-xs text-slate-500">Haz clic en el botón de arriba y presiona la combinación de teclas (ej. Ctrl+Shift+P).</p>
                </div>

                {/* Scale Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-slate-500" />
                    TAMAÑO DE LAS CARDS
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="50" max="150" 
                      value={cardScale}
                      onChange={(e) => setCardScale(Number(e.target.value))}
                      className="flex-1 h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-sm text-blue-400 font-mono w-[30px] text-right">{cardScale}%</span>
                  </div>
                  <p className="text-xs text-slate-500">Ajusta el tamaño de la cuadrícula para ver más o menos apps, sin hacer scroll.</p>
                </div>

                {/* Monitor Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-slate-500" />
                    MONITOR DE DESPLIEGUE
                  </label>
                  <div className="flex gap-2">
                    {monitors.map(mon => (
                      <button
                        key={mon.id}
                        onClick={() => {
                          setSelectedMonitor(mon.id);
                          if (isElectron) {
                            window.electronAPI!.setMonitor(mon.id);
                          }
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selectedMonitor === mon.id 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm' 
                            : 'bg-black/40 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-white/5 shadow-inner'
                        }`}
                      >
                        {mon.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Selecciona en cuál monitor aparecerá Cyber Launcher.</p>
                </div>
                
                </>)}

                {settingsTab === 'appearance' && (<>
                {/* Background Type Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">TIPO DE FONDO</label>
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    {[
                      { id: 'image', icon: ImageIcon, label: 'Imagen' },
                      { id: 'gradient', icon: Palette, label: 'Gradiente' },
                      { id: 'solid', icon: Droplets, label: 'Sólido' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setBgType(type.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                          bgType === type.id 
                            ? 'bg-blue-500/20 text-blue-300 shadow-sm border border-blue-500/30' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Settings based on Type */}
                <div className="space-y-4">
                  {bgType === 'image' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">IMÁGENES PREDETERMINADAS</label>
                        <div className="grid grid-cols-2 gap-3">
                          {PRESET_IMAGES.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => setBgImage(img)}
                              className={`h-24 rounded-xl bg-cover bg-center border-2 transition-all overflow-hidden relative ${
                                bgImage === img ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-transparent hover:border-white/20'
                              }`}
                              style={{ backgroundImage: `url(${img})` }}
                            >
                               {bgImage === img && <div className="absolute inset-0 bg-blue-500/20" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                           <Link className="w-3 h-3" /> IMAGEN PERSONALIZADA (URL O ARCHIVO LOCAL)
                         </label>
                         <div className="flex gap-2">
                           <input 
                             type="text" 
                             placeholder="https://..."
                             value={customImageUrl}
                             onChange={(e) => setCustomImageUrl(e.target.value)}
                             className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                           />
                           <button 
                             onClick={() => {
                               if(customImageUrl) {
                                 setBgImage(customImageUrl);
                                 setCustomImageUrl('');
                               }
                             }}
                             className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                           >
                             Aplicar
                           </button>
                            <button 
                              onClick={async () => {
                                if (isElectron) {
                                  const path = await window.electronAPI!.selectImage();
                                  if (path) {
                                    setBgImage(path);
                                  }
                                }
                              }}
                              className="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors border border-white/5"
                            >
                              <Upload className="w-4 h-4 mr-2" /> PC
                            </button>
                         </div>
                      </div>
                      
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">INTENSIDAD DE CRISTAL (GLASS)</label>
                          <span className="text-xs text-blue-400 font-mono">{glassIntensity}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={glassIntensity}
                          onChange={(e) => setGlassIntensity(Number(e.target.value))}
                          className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <p className="text-xs text-slate-500">Mueve a la izquierda para un efecto más transparente, a la derecha para oscurecer la interfaz.</p>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">OPACIDAD DEL FONDO</label>
                          <span className="text-xs text-blue-400 font-mono">{bgOpacity}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={bgOpacity}
                          onChange={(e) => setBgOpacity(Number(e.target.value))}
                          className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <p className="text-xs text-slate-500">Ajusta qué tan oscuro se ve la imagen de fondo antes de aplicar el efecto de cristal.</p>
                      </div>
                    </div>
                  )}

                  {bgType === 'gradient' && (
                    <div className="space-y-3">
                      <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">GRADIENTES</label>
                      <div className="grid grid-cols-2 gap-3">
                        {PRESET_GRADIENTS.map((grad, i) => (
                          <button
                            key={i}
                            onClick={() => setBgGradient(grad)}
                            className={`h-20 rounded-xl border-2 transition-all ${
                              bgGradient === grad ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-transparent hover:border-white/20'
                            }`}
                            style={{ backgroundImage: grad }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {bgType === 'solid' && (
                    <div className="space-y-3">
                      <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">COLORES SÓLIDOS</label>
              <div className="flex flex-wrap gap-3">
                        {PRESET_SOLIDS.map((color, i) => (
                          <button
                            key={i}
                            onClick={() => setBgColor(color)}
                            className={`w-14 h-14 rounded-xl border-2 transition-all ${
                              bgColor === color ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-transparent hover:border-white/20 shadow-inner'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/20 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer ring-offset-[#0d131f] focus-within:ring-2 focus-within:ring-blue-500">
                          <input 
                            type="color" 
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="absolute inset-[-10px] w-20 h-20 opacity-0 cursor-pointer"
                          />
                          <Palette className="w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                </>)}

                {settingsTab === 'general' && (<>
                {/* Manage Categories Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">ADMINISTRAR CATEGORÍAS</label>
                    <button 
                      onClick={() => {
                        const newId = 'cat-' + Date.now();
                        setCategories([...categories, { id: newId, name: 'Nueva', color: '#60a5fa' }]);
                      }} 
                      className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Agregar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {categories.filter(c => c.id !== 'all').sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                      <div key={cat.id} className="flex items-center gap-3 bg-black/20 p-2.5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <label className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 cursor-pointer shadow-sm ring-1 ring-white/10">
                           <input 
                              type="color" 
                              value={cat.color}
                              onChange={(e) => setCategories(cats => cats.map(c => c.id === cat.id ? { ...c, color: e.target.value } : c))}
                              className="absolute inset-[-10px] w-10 h-10 cursor-pointer"
                           />
                        </label>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => {
                             const newName = e.target.value;
                             setCategories(cats => cats.map(c => c.id === cat.id ? { ...c, name: newName } : c));
                             setApps(apps => apps.map(app => app.category === cat.name ? { ...app, category: newName } : app));
                          }}
                          className="flex-1 bg-transparent text-sm font-medium text-slate-200 focus:outline-none focus:text-white placeholder:text-slate-600"
                        />
                        <button 
                          onClick={() => {
                             setCategories(cats => cats.filter(c => c.id !== cat.id));
                             if (activeCategory === cat.id) setActiveCategory('all');
                             // Optional: Re-assign orphaned apps to some category or keep label but won't be filterable
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hotspots Section */}
                <div className="space-y-4">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-cyan-500" />
                    ACTIVACIÓN POR HOTSPOTS
                  </label>
                  
                  <div className="flex flex-col gap-4 bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      
                      {/* Interactive Screen Preview */}
                      <div className="relative w-48 h-32 bg-black/40 border-2 border-white/10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        <Monitor className="absolute text-slate-700 w-16 h-16 opacity-50" />
                        
                        {/* Corners */}
                        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => (
                          <button
                            key={corner}
                            onClick={() => {
                              if (hotspotCorners.includes(corner)) {
                                setHotspotCorners(hotspotCorners.filter(c => c !== corner));
                              } else {
                                setHotspotCorners([...hotspotCorners, corner]);
                              }
                            }}
                            className={`absolute w-10 h-10 flex items-center justify-center transition-all focus:outline-none ${
                              hotspotCorners.includes(corner) 
                                ? 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] z-10' 
                                : 'bg-white/5 border-white/20 hover:bg-white/10'
                            } ${
                              corner === 'top-left' ? 'top-0 left-0 rounded-br-2xl border-b border-r' :
                              corner === 'top-right' ? 'top-0 right-0 rounded-bl-2xl border-b border-l' :
                              corner === 'bottom-left' ? 'bottom-0 left-0 rounded-tr-2xl border-t border-r' :
                              'bottom-0 right-0 rounded-tl-2xl border-t border-l'
                            }`}
                          >
                            <div className={`w-2.5 h-2.5 rounded-full ${hotspotCorners.includes(corner) ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-500'}`} />
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 space-y-4 w-full">
                        <div>
                          <h4 className="text-sm font-medium text-slate-200 mb-1">Esquinas activas</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">Selecciona una o más esquinas para activar el launcher al llevar el cursor allí.</p>
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-300">Retraso de activación</span>
                            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{hotspotDelay}ms</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="1000" 
                            step="50"
                            value={hotspotDelay}
                            onChange={(e) => setHotspotDelay(parseInt(e.target.value))}
                            className="w-full accent-cyan-500 h-1 bg-white/10 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.5)] cursor-pointer mt-3"
                          />
                          <p className="text-[10px] text-slate-500 text-right mt-1">Previene activaciones accidentales</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                </>)}

                {settingsTab === 'system' && (<>
                {/* Sistema Section */}
                <div className="space-y-3 pb-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">SISTEMA & RESPALDO</label>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <Power className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-200 leading-tight mb-1">Iniciar con Windows</h4>
                          <p className="text-xs text-slate-500">Abre Cyber Launcher automáticamente al encender tu PC.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const newVal = !startWithWindows;
                          setStartWithWindows(newVal);
                          if (isElectron) {
                            window.electronAPI!.setAutoLaunch(newVal);
                          }
                        }}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${startWithWindows ? 'bg-blue-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow flex items-center justify-center ${startWithWindows ? 'translate-x-5' : 'translate-x-0'}`}>
                          <div className={`w-2 h-2 rounded-full ${startWithWindows ? 'bg-blue-500 shadow-[0_0_5px_currentColor]' : 'bg-slate-400'}`} />
                        </div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <MousePointer2 className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-200 leading-tight mb-1">Ocultar al hacer clic en espacio vacío</h4>
                          <p className="text-xs text-slate-500">Al hacer clic en el fondo del launcher, se oculta al tray.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setHideOnClickDeadSpot(!hideOnClickDeadSpot)}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${hideOnClickDeadSpot ? 'bg-amber-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow flex items-center justify-center ${hideOnClickDeadSpot ? 'translate-x-5' : 'translate-x-0'}`}>
                          <div className={`w-2 h-2 rounded-full ${hideOnClickDeadSpot ? 'bg-amber-500 shadow-[0_0_5px_currentColor]' : 'bg-slate-400'}`} />
                        </div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <FileJson className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-200 leading-tight mb-1">Exportar Configuración</h4>
                          <p className="text-xs text-slate-500">Guarda tus apps y configuraciones en un archivo JSON.</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors text-sm font-medium border border-emerald-500/30 flex-shrink-0"
                      >
                        <Download className="w-4 h-4" /> Exportar
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <Upload className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-200 leading-tight mb-1">Importar Configuración</h4>
                          <p className="text-xs text-slate-500">Restaura un backup previo de configuración (.json).</p>
                        </div>
                      </div>
                      {isElectron ? (
                        <button 
                          onClick={handleImportNative}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors text-sm font-medium border border-purple-500/30 cursor-pointer flex-shrink-0"
                        >
                          <Upload className="w-4 h-4" /> Importar
                        </button>
                      ) : (
                        <label className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors text-sm font-medium border border-purple-500/30 cursor-pointer flex-shrink-0">
                          <Upload className="w-4 h-4" /> Importar
                          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Nueva sección de Diagnóstico */}
                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors mt-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-500/10 rounded-lg border border-slate-500/20">
                          <Terminal className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-200 leading-tight mb-1">Diagnóstico del Sistema</h4>
                          <p className="text-xs text-slate-500">Abre la consola para ver logs de resolución de archivos y errores.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => window.electronAPI!.openDevTools()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-medium border border-slate-700 flex-shrink-0"
                      >
                        <Terminal className="w-4 h-4" /> Abrir Consola
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                          <FolderOpen className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-200 leading-tight mb-1">Carpeta de Datos</h4>
                          <p className="text-xs text-slate-500">Abre la carpeta donde se guardan las configuraciones.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => window.electronAPI!.openDataFolder()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-800 hover:bg-cyan-700 text-cyan-200 rounded-lg transition-colors text-sm font-medium border border-cyan-700 flex-shrink-0"
                      >
                        <FolderOpen className="w-4 h-4" /> Open Data Folder
                      </button>
                    </div>
                  </div>
                </div>

                </>)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CONTEXT MENU --- */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[100] bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl py-1.5 min-w-[200px] text-sm"
            style={{ 
              left: Math.min(contextMenu.x, window.innerWidth - 220), 
              top: Math.min(contextMenu.y, window.innerHeight - 250) 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {taskbarAppIds.includes(contextMenu.app!.id) ? (
              <button 
                onClick={() => {
                  setTaskbarAppIds(prev => prev.filter(id => id !== contextMenu.app!.id));
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200"
              >
                Desanclar de la barra <Minus className="w-4 h-4 ml-2 text-slate-400" />
              </button>
            ) : (
              <button 
                onClick={() => {
                  setTaskbarAppIds([...taskbarAppIds, contextMenu.app!.id]);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200"
              >
                Anclar a la barra <Plus className="w-4 h-4 ml-2 text-blue-400" />
              </button>
            )}

            {favoriteIds.includes(contextMenu.app!.id) ? (
              <button 
                onClick={() => {
                  setFavoriteIds(prev => prev.filter(id => id !== contextMenu.app!.id));
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200"
              >
                Quitar de favoritos <Star className="w-4 h-4 ml-2 fill-slate-500 text-slate-500" />
              </button>
            ) : (
              <button 
                onClick={() => {
                  setFavoriteIds([...favoriteIds, contextMenu.app!.id]);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200"
              >
                Agregar a favoritos <Star className="w-4 h-4 ml-2 fill-blue-500 text-blue-400" />
              </button>
            )}

            <div className="h-px bg-white/10 my-1 mx-2" />
            
            <button
               onClick={() => {
                 setEditingApp(contextMenu.app!);
                 setEditForm({
                   name: contextMenu.app!.name,
                   // @ts-ignore (Assuming path/iconPath might exist dynamically, or just empty)
                   path: contextMenu.app!.path || '',
                   // @ts-ignore
                   iconPath: contextMenu.app!.iconPath || '',
                   category: contextMenu.app!.category
                 });
                 setContextMenu(null);
               }}
               className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200"
            >
              Editar <PenBox className="w-4 h-4 ml-2 text-slate-400" />
            </button>
            
            <button
               onClick={() => {
                 setApps(prev => prev.filter(app => app.id !== contextMenu.app!.id));
                 setFavoriteIds(prev => prev.filter(id => id !== contextMenu.app!.id));
                 setTaskbarAppIds(prev => prev.filter(id => id !== contextMenu.app!.id));
                 setContextMenu(null);
               }}
               className="w-full text-left px-4 py-2 hover:bg-red-500/20 truncate transition-colors flex items-center justify-between text-red-400"
            >
              Eliminar <Trash2 className="w-4 h-4 ml-2 text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
          transition: scrollbar-color 0.15s;
        }
        .mouse-active .custom-scrollbar,
        .custom-scrollbar.scrolling {
          scrollbar-color: rgba(34, 211, 238, 0.5) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #22d3ee, #818cf8);
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .mouse-active .custom-scrollbar::-webkit-scrollbar-thumb,
        .custom-scrollbar.scrolling::-webkit-scrollbar-thumb {
          opacity: 1;
          box-shadow: 0 0 6px rgba(34, 211, 238, 0.5), 0 0 14px rgba(34, 211, 238, 0.2);
        }
      `}</style>
    </div>
  );
}

