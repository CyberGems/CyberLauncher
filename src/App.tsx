import React, { useState, useEffect, useRef, useCallback } from 'react';
import { translations, TranslationKey } from './locales';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal, Music, Globe, Calculator, Code, Bot, Lock,
  MonitorSmartphone, PenTool, KeyRound, MousePointer2, FileUp,
  Gamepad2, TerminalSquare, Binary, MessageCircle, Star,
  Search, Grid, List as ListIcon, Plus, Clock, History, Settings,
  Minus, Square, X, ChevronRight, LayoutGrid, Image as ImageIcon,
  Palette, Droplets, Link, Keyboard, PenBox, Pencil, Trash2,
  Wifi, BatteryMedium, Volume2, Info, Monitor, Upload, Cpu,
  HardDrive, Minimize2, Download, Power, FileJson, Package, Hexagon,
  FolderOpen, Eye, Pin, Play, Pause, Timer,
  Folder, File, Shield, ExternalLink
} from 'lucide-react';

// (CyberTray import removed)

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
  'C:\\CyberGems\\CyberLauncher\\default_background.jpg',
  'bg_abstract.jpg',
  'bg_cyberpunk.jpg',
  'bg_geom.jpg',
];

const PRESET_SOLIDS = ['#0a0f18', '#1a1a2e', '#000000', '#111827', '#0f172a'];

const toThumbnailUrl = (path: string) => {
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  if (!path.includes(':') && !path.includes('\\')) {
    // Es un asset empaquetado relativo, resolver directo de la raíz del build (dist)
    return path;
  }
  return `local-resource:///${path.replace(/\\/g, '/')}`;
};
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
      launchApp: (path: string, isAdmin?: boolean) => Promise<{ success: boolean; error?: string }>;
      getUwpApps: () => Promise<Array<{ name: string; aumid: string; icon: string }>>;
      selectFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => Promise<{ name: string; path: string; iconPath?: string } | null>;
      selectImage: () => Promise<string | null>;
      getMonitors: () => Promise<Array<{ id: string; label: string; isPrimary: boolean; bounds: any; size: any }>>;
      setMonitor: (monitorId: string) => Promise<void>;
      registerShortcut: (shortcut: string) => Promise<{ success: boolean; shortcut: string }>;
      windowMinimize: () => Promise<void>;
      windowMaximizeToggle: () => Promise<void>;
      windowClose: () => Promise<void>;
      windowHideToTray: () => Promise<void>;
      setAutoLaunch: (enabled: boolean) => Promise<{ success: boolean; enabled: boolean }>;
      setHideOnBlur: (enabled: boolean) => Promise<{ success: boolean; enabled: boolean }>;
      setShowTaskbarIcon: (enabled: boolean) => Promise<{ success: boolean; enabled: boolean }>;
      getSystemInfo: () => Promise<{ memory: { total: number; used: number; percent: number }; cpu: { model: string; cores: number }; uptime: number }>;
      getDiskInfo: () => Promise<Array<{ drive: string; total: number; free: number; used: number; percent: number }>>;
      resolveFilePath: (filePath: string) => Promise<{ name: string; path: string; ext: string; exists: boolean; iconPath: string; debug?: any } | null>;
      openFileLocation: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      searchSystemFiles: (query: string) => Promise<Array<{ name: string; path: string; ext: string; type: 'app' | 'file' | 'folder'; icon?: string }>>;
      getIndexerSettings: () => Promise<{ enabled: boolean; maxDepth: number; paths: string[] }>;
      saveIndexerSettings: (settings: { enabled: boolean; maxDepth: number; paths: string[] }) => Promise<boolean>;
      getIndexerStats: () => Promise<{ status: 'ONLINE' | 'OFFLINE' | 'INDEXING'; totalFiles: number }>;
      selectIndexerFolder: () => Promise<string | null>;
      getSystemDrives: () => Promise<string[]>;
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
      setAlwaysOnTop: (enabled: boolean) => Promise<{ success: boolean }>;
      registerAppShortcuts: (shortcuts: Array<{ id: number; path: string; shortcut: string; isAdmin: boolean }>) => Promise<{ success: boolean }>;
      runShellCommand: (command: string) => Promise<{ success: boolean; cmdId?: string; error?: string }>;
      onShellOutput: (callback: (data: { id: string; type: 'stdout' | 'stderr'; text: string }) => void) => () => void;
      onShellExit: (callback: (data: { id: string; exitCode: number }) => void) => () => void;
      onAlwaysOnTopBlurAttempt: (callback: () => void) => () => void;
      onOpenSettings: (callback: () => void) => () => void;
    };
  }
}

const isElectron = !!window.electronAPI;

const playCyberBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch (e) {
    console.error('Audio synthesis failed:', e);
  }
};

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
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-400/85 hover:bg-cyan-300 text-slate-900 shadow-[0_0_8px_rgba(34,211,238,0.3)] hover:shadow-[0_0_18px_rgba(34,211,238,0.7)] rounded-lg border border-transparent hover:border-cyan-200/50 cursor-help transition-all duration-300 hover:scale-105 active:scale-95 group"
      title={`RAM: ${memUsed.toFixed(1)} GB (${Math.round(memPercent)}%)`}
    >
      <Cpu className="w-4 h-4 text-slate-900 transition-transform duration-300 group-hover:scale-115 group-hover:rotate-12" />
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
    <div 
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-400/85 hover:bg-cyan-300 text-slate-900 shadow-[0_0_8px_rgba(34,211,238,0.3)] hover:shadow-[0_0_18px_rgba(34,211,238,0.7)] rounded-lg border border-transparent hover:border-cyan-200/50 cursor-help transition-all duration-300 hover:scale-105 active:scale-95 group"
      title={mainDisk ? `Disco principal: ${mainDisk.percent}% usado` : 'Uso de Discos'}
    >
      <HardDrive className="w-4 h-4 text-slate-900 transition-transform duration-300 group-hover:scale-115 group-hover:rotate-12" />
      <span className="text-xs font-mono text-slate-900 font-bold tracking-wider w-7 text-right">
        {mainDisk ? `${mainDisk.percent}%` : '--'}
      </span>
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

const CyberAnalogClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hrs = time.getHours();
  const mins = time.getMinutes();
  const secs = time.getSeconds();

  const hrDeg = ((hrs % 12) * 30) + (mins * 0.5);
  const minDeg = (mins * 6) + (secs * 0.1);
  const secDeg = secs * 6;

  return (
    <div className="flex flex-col items-center justify-center my-5 relative">
      <div className="w-40 h-40 rounded-full border-2 border-cyan-500/25 bg-black/45 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.12)] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#22d3ee_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute w-[92%] h-[92%] rounded-full border border-dashed border-cyan-500/10 pointer-events-none" />
        
        {/* Ticks */}
        {[...Array(12)].map((_, i) => {
          const rotation = i * 30;
          const isQuarter = i % 3 === 0;
          return (
            <div 
              key={i} 
              className="absolute w-full h-full pointer-events-none" 
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div 
                className={`mx-auto w-[1.5px] rounded-full ${
                  isQuarter ? 'h-2.5 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]' : 'h-1.5 bg-slate-500/30'
                }`} 
                style={{ marginTop: '3px' }}
              />
            </div>
          );
        })}

        <div className="absolute bottom-8 text-[9px] font-mono text-cyan-400/30 tracking-widest uppercase select-none">
          CyberGems
        </div>

        {/* Hour hand */}
        <div 
          className="absolute w-full h-full pointer-events-none"
          style={{ transform: `rotate(${hrDeg}deg)` }}
        >
          <div className="mx-auto w-1 h-11 bg-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.7)] rounded-full" style={{ marginTop: '32px' }} />
        </div>

        {/* Minute hand */}
        <div 
          className="absolute w-full h-full pointer-events-none"
          style={{ transform: `rotate(${minDeg}deg)` }}
        >
          <div className="mx-auto w-[2px] h-14 bg-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.7)] rounded-full" style={{ marginTop: '20px' }} />
        </div>

        {/* Second hand */}
        <div 
          className="absolute w-full h-full pointer-events-none"
          style={{ transform: `rotate(${secDeg}deg)` }}
        >
          <div className="mx-auto w-[1px] h-16 bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]" style={{ marginTop: '14px' }} />
          <div className="mx-auto w-[1px] h-3 bg-emerald-500/40" style={{ marginTop: '0px' }} />
        </div>

        {/* Spindle */}
        <div className="w-2 h-2 rounded-full bg-slate-900 border border-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)] z-10" />
      </div>
    </div>
  );
};

interface ScheduledTask {
  id: string;
  name: string;
  totalSeconds: number;
  remainingSeconds: number;
  targetPath?: string;
  isAdmin?: boolean;
  command?: string;
  type: 'app' | 'command';
}

const ClockHUD = ({ 
  isOpen, 
  onClose, 
  apps, 
  scheduledTasks, 
  setScheduledTasks 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  apps: Array<any>; 
  scheduledTasks: Array<ScheduledTask>; 
  setScheduledTasks: React.Dispatch<React.SetStateAction<Array<ScheduledTask>>>;
}) => {
  const [selectedType, setSelectedType] = useState<'app' | 'command'>('app');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [customCommand, setCustomCommand] = useState('');
  
  const [timerMinutes, setTimerMinutes] = useState<number>(5);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  // Set default app selection when apps list loads
  useEffect(() => {
    if (apps && apps.length > 0 && !selectedAppId) {
      setSelectedAppId(apps[0].id.toString());
    }
  }, [apps, selectedAppId]);

  const handleAddTask = () => {
    const totalSecs = (timerMinutes * 60) + timerSeconds;
    if (totalSecs <= 0) return;

    let taskName = '';
    let targetPath = '';
    let isAdmin = false;
    let command = '';

    if (selectedType === 'app') {
      const appObj = apps.find(a => a.id.toString() === selectedAppId);
      if (!appObj) return;
      taskName = `Lanzar ${appObj.name}`;
      targetPath = appObj.path;
      isAdmin = !!appObj.isAdmin;
    } else {
      if (!customCommand.trim()) return;
      taskName = `Consola: "${customCommand.trim().substring(0, 15)}${customCommand.trim().length > 15 ? '...' : ''}"`;
      command = customCommand.trim();
    }

    const newTask: ScheduledTask = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: taskName,
      totalSeconds: totalSecs,
      remainingSeconds: totalSecs,
      targetPath,
      isAdmin,
      command,
      type: selectedType
    };

    setScheduledTasks(prev => [...prev, newTask]);
    setCustomCommand('');
  };

  const handleRemoveTask = (taskId: string) => {
    setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const formatRemaining = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%', opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] z-50 bg-[#070b13]/90 backdrop-blur-2xl border-l border-cyan-500/20 shadow-2xl flex flex-col p-6 overflow-hidden select-none"
          >
            {/* Tech grid bg overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_95%,rgba(34,211,238,0.04)_95%),linear-gradient(90deg,rgba(18,18,18,0)_95%,rgba(34,211,238,0.04)_95%)] bg-[size:20px_20px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-cyan-400 animate-pulse" />
                <div>
                  <h2 className="text-sm font-cyber font-bold text-white tracking-widest text-left">PROGRAMADOR NEURAL</h2>
                  <p className="text-[10px] text-cyan-500/80 font-mono tracking-wider text-left">EXECUTION TIMERS v1.5</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-cyan-500/10 hover:border-cyan-500/40 text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all flex items-center justify-center focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="relative z-10 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {/* Cyber Analog Clock Face */}
              <CyberAnalogClock />

              {/* Form container */}
              <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-4.5 mb-6 text-left">
                <h3 className="text-xs font-cyber font-bold text-cyan-400 mb-3 tracking-widest">NUEVA PROGRAMACIÓN</h3>
                
                {/* Type Selection */}
                <div className="flex gap-2 mb-3.5">
                  <button
                    onClick={() => setSelectedType('app')}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold font-cyber tracking-wider transition-all text-center ${
                      selectedType === 'app' 
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.25)]' 
                        : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                    }`}
                  >
                    LANZAR APP
                  </button>
                  <button
                    onClick={() => setSelectedType('command')}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold font-cyber tracking-wider transition-all text-center ${
                      selectedType === 'command' 
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.25)]' 
                        : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                    }`}
                  >
                    CONSOLA CMD
                  </button>
                </div>

                {/* Form Fields */}
                {selectedType === 'app' ? (
                  <div className="mb-4">
                    <label className="block text-[10px] font-cyber font-bold text-slate-400 mb-1.5 tracking-wider">SELECCIONAR ACCESO</label>
                    <select
                      value={selectedAppId}
                      onChange={(e) => setSelectedAppId(e.target.value)}
                      className="w-full bg-slate-950/80 border border-cyan-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                    >
                      {apps.map(app => (
                        <option key={app.id} value={app.id} className="bg-slate-900 text-white">
                          {app.name} ({app.category})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-[10px] font-cyber font-bold text-slate-400 mb-1.5 tracking-wider">COMANDO DE CONSOLA</label>
                    <input
                      type="text"
                      placeholder="Ej. shutdown /s /t 0"
                      value={customCommand}
                      onChange={(e) => setCustomCommand(e.target.value)}
                      className="w-full bg-slate-950/80 border border-cyan-500/20 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                    />
                  </div>
                )}

                {/* Time Picker */}
                <div className="mb-4.5">
                  <label className="block text-[10px] font-cyber font-bold text-slate-400 mb-2 tracking-wider">TIEMPO DE ESPERA</label>
                  <div className="flex items-center gap-3 bg-slate-950/60 border border-cyan-500/10 rounded-lg px-3 py-2">
                    <div className="flex-1 flex flex-col items-center">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Minutos</span>
                      <input 
                        type="number" 
                        min="0" 
                        max="999" 
                        value={timerMinutes} 
                        onChange={(e) => setTimerMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="bg-transparent text-center text-white font-cyber font-bold text-[18px] w-full focus:outline-none"
                      />
                    </div>
                    <div className="text-cyan-500/40 font-bold text-[20px] mb-2">:</div>
                    <div className="flex-1 flex flex-col items-center">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Segundos</span>
                      <input 
                        type="number" 
                        min="0" 
                        max="59" 
                        value={timerSeconds} 
                        onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                        className="bg-transparent text-center text-white font-cyber font-bold text-[18px] w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex gap-1.5 mt-2.5">
                    {[
                      { l: '+30s', v: () => { setTimerSeconds(s => (s + 30) % 60); if (timerSeconds >= 30) setTimerMinutes(m => m + 1); } },
                      { l: '+1m', v: () => setTimerMinutes(m => m + 1) },
                      { l: '+5m', v: () => setTimerMinutes(m => m + 5) },
                      { l: '+15m', v: () => setTimerMinutes(m => m + 15) }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={preset.v}
                        className="flex-1 py-1 rounded bg-slate-900 border border-cyan-500/10 text-[9px] text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all font-mono cursor-pointer"
                      >
                        {preset.l}
                      </button>
                    ))}
                  </div>

                  {/* Subtract Preset Buttons */}
                  <div className="flex gap-1.5 mt-1.5">
                    {[
                      { l: '-30s', v: () => { 
                        if (timerSeconds >= 30) {
                          setTimerSeconds(s => s - 30);
                        } else if (timerMinutes > 0) {
                          setTimerMinutes(m => m - 1);
                          setTimerSeconds(s => s + 30);
                        } else {
                          setTimerSeconds(0);
                        }
                      } },
                      { l: '-1m', v: () => setTimerMinutes(m => Math.max(0, m - 1)) },
                      { l: '-5m', v: () => setTimerMinutes(m => Math.max(0, m - 5)) },
                      { l: '-15m', v: () => setTimerMinutes(m => Math.max(0, m - 15)) }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={preset.v}
                        className="flex-1 py-1 rounded bg-slate-900 border border-red-500/10 text-[9px] text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all font-mono cursor-pointer"
                      >
                        {preset.l}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddTask}
                  className="w-full py-2.5 bg-cyan-400/90 hover:bg-cyan-300 text-slate-950 font-cyber font-bold text-xs tracking-widest rounded-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  PROGRAMAR EJECUCIÓN
                </button>
              </div>

              {/* Tasks List */}
              <div className="text-left">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-cyber font-bold text-slate-300 tracking-widest uppercase">TAREAS EN EJECUCIÓN</h3>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    {scheduledTasks.length} ACTIVAS
                  </span>
                </div>

                {scheduledTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 border border-dashed border-cyan-500/10 rounded-xl bg-cyan-500/2 opacity-60">
                    <Timer className="w-8 h-8 text-cyan-500/30 mb-2" />
                    <p className="text-[10px] font-mono text-slate-400 tracking-wide">Ninguna ejecución en espera</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {scheduledTasks.map((task) => {
                      const percent = (task.remainingSeconds / task.totalSeconds) * 100;
                      return (
                        <div 
                          key={task.id} 
                          className="relative overflow-hidden bg-slate-950/80 border border-cyan-500/15 rounded-xl p-3.5 flex items-center justify-between shadow-lg"
                        >
                          {/* Progress bar background slider */}
                          <div 
                            className="absolute bottom-0 left-0 top-0 bg-cyan-500/5 transition-all duration-1000 ease-linear pointer-events-none"
                            style={{ width: `${percent}%` }}
                          />

                          <div className="relative z-10 flex-1 min-w-0 pr-4 text-left">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${task.type === 'app' ? 'bg-cyan-400' : 'bg-orange-400 animate-pulse'}`} />
                              <h4 className="text-xs font-cyber font-cyber font-bold text-white truncate uppercase tracking-wider">{task.name}</h4>
                            </div>
                            <p className="text-[9px] font-mono text-slate-500 truncate">
                              {task.type === 'app' ? 'Ejecutable local' : `Comando: ${task.command}`}
                            </p>
                          </div>

                          <div className="relative z-10 flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="block text-[15px] font-cyber font-bold text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)] tracking-widest font-mono tabular-nums leading-none">
                                {formatRemaining(task.remainingSeconds)}
                              </span>
                              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                                Countdown
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveTask(task.id)}
                              className="w-7 h-7 rounded-lg border border-red-500/10 hover:border-red-500/40 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center focus:outline-none cursor-pointer"
                              title="Cancelar ejecución"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const SystemHUD = ({ isOpen, onClose, activationShortcut, dailyLaunchCount }: { isOpen: boolean, onClose: () => void, activationShortcut: string, dailyLaunchCount: number }) => {
  const [memPercent, setMemPercent] = useState<number>(0);
  const [memUsed, setMemUsed] = useState<number>(0);
  const [cpuInfo, setCpuInfo] = useState<{ model: string; cores: number } | null>(null);
  const [uptime, setUptime] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const fetchStats = async () => {
      try {
        if (isElectron) {
          const info = await window.electronAPI!.getSystemInfo();
          setMemPercent(info.memory.percent);
          setMemUsed(info.memory.used);
          setCpuInfo(info.cpu);
          setUptime(info.uptime);
        } else {
          setMemPercent(prev => prev === 0 ? 42 : Math.max(20, Math.min(90, prev + (Math.random() * 6 - 3))));
          setMemUsed(prev => prev === 0 ? 8.2 : prev);
          setCpuInfo({ model: 'AMD Ryzen 9 7950X3D 16-Core Processor', cores: 16 });
          setUptime(3600 * 2.5);
        }
      } catch (err) {
        console.error('Error fetching neural metrics:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatUptime = (seconds: number) => {
    if (seconds <= 0) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%', opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] z-50 bg-[#070b13]/90 backdrop-blur-2xl border-l border-cyan-500/20 shadow-2xl flex flex-col p-6 overflow-hidden select-none"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_95%,rgba(6,182,212,0.05)_95%),linear-gradient(90deg,rgba(18,18,18,0)_95%,rgba(6,182,212,0.05)_95%)] bg-[size:20px_20px] pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
                <div>
                  <h2 className="text-sm font-cyber font-bold text-white tracking-widest text-left">TELEMETRÍA DE RECURSOS</h2>
                  <p className="text-[10px] text-cyan-500/80 font-mono tracking-wider text-left">NEURAL COCKPIT SYSTEM v1.4</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 rounded-lg text-slate-400 hover:text-cyan-400 transition-all focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1 text-left">
              <div className="bg-cyan-950/10 border border-cyan-500/15 rounded-xl p-4 space-y-4 shadow-lg shadow-black/40">
                <h3 className="text-xs font-cyber font-bold text-cyan-400 tracking-wider flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5" /> RENDIMIENTO GENERAL
                </h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">CARGA DE MEMORIA (RAM)</span>
                      <span className="text-cyan-400 font-bold">{Math.round(memPercent)}%</span>
                    </div>
                    <div className="h-2 bg-slate-950/80 rounded-full border border-cyan-500/10 overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${memPercent}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>USED: {memUsed.toFixed(1)} GB</span>
                      <span>TOTAL: {Math.round(memUsed / (memPercent || 1) * 100)} GB</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-cyan-500/5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">CPU ESTRUCTURA</span>
                      <span className="text-purple-400 font-bold">{cpuInfo?.cores || 8} CORES</span>
                    </div>
                    <p className="text-[10px] font-mono text-purple-300/80 truncate bg-slate-950/60 p-2 rounded-lg border border-purple-500/10">
                      {cpuInfo?.model || 'Intel Core / AMD Ryzen Processor'}
                    </p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-cyan-500/5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">TIEMPO ACTIVO (UPTIME)</span>
                      <span className="text-emerald-400 font-bold">{formatUptime(uptime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 space-y-3 shadow-inner">
                <h3 className="text-xs font-cyber font-bold text-slate-400 tracking-wider flex items-center gap-2">
                  <TerminalSquare className="w-3.5 h-3.5 text-slate-500" /> PARÁMETROS DEL SISTEMA
                </h3>
                <div className="font-mono text-[10px] space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                  <div className="text-emerald-400/90">&gt; NEURAL_LINK_STABLE: OK</div>
                  <div className="text-slate-400">&gt; LAUNCH_COUNT_TODAY: {dailyLaunchCount} APPS</div>
                  <div className="text-slate-400">&gt; CURRENT_SHORTCUT: {activationShortcut}</div>
                  <div className="text-slate-400">&gt; SYSTEM_PLATFORM: WINDOWS_NT_x64</div>
                </div>
              </div>
            </div>

            <div className="relative z-10 border-t border-cyan-500/20 pt-4 mt-6 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  window.electronAPI?.openDevTools();
                  onClose();
                }}
                className="flex-1 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 rounded-xl transition-all font-mono text-[10px] font-bold tracking-widest text-center"
              >
                DEVTOOLS
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const StorageHUD = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [disksList, setDisksList] = useState<Array<{ drive: string; total: number; free: number; used: number; percent: number }>>([]);
  const [configPath, setConfigPath] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchStats = async () => {
      try {
        if (isElectron) {
          const disks = await window.electronAPI!.getDiskInfo();
          setDisksList(disks);
        } else {
          setDisksList([
            { drive: 'C:', total: 500, free: 230, used: 270, percent: 54 },
            { drive: 'D:', total: 1000, free: 620, used: 380, percent: 38 },
          ]);
        }
      } catch (err) {
        console.error('Error fetching storage neural metrics:', err);
      }
    };

    const fetchStatic = async () => {
      try {
        if (isElectron) {
          const path = await window.electronAPI!.getConfigPath();
          setConfigPath(path);
        } else {
          setConfigPath('C:\\Users\\Mock\\AppData\\Roaming\\CyberLauncher\\config.json');
        }
      } catch (err) {
        console.error('Error fetching static config path:', err);
      }
    };

    fetchStats();
    fetchStatic();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%', opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] z-50 bg-[#070b13]/90 backdrop-blur-2xl border-l border-purple-500/20 shadow-2xl flex flex-col p-6 overflow-hidden select-none"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_95%,rgba(168,85,247,0.05)_95%),linear-gradient(90deg,rgba(18,18,18,0)_95%,rgba(168,85,247,0.05)_95%)] bg-[size:20px_20px] pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between border-b border-purple-500/20 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-purple-400 animate-pulse" />
                <div>
                  <h2 className="text-sm font-cyber font-bold text-white tracking-widest text-left">TELEMETRÍA DE ALMACENAMIENTO</h2>
                  <p className="text-[10px] text-purple-500/80 font-mono tracking-wider text-left">STORAGE NEURAL SYSTEM v1.4</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 rounded-lg text-slate-400 hover:text-purple-400 transition-all focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1 text-left">
              <div className="bg-purple-950/10 border border-purple-500/15 rounded-xl p-4 space-y-4 shadow-lg shadow-black/40">
                <h3 className="text-xs font-cyber font-bold text-purple-400 tracking-wider flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5" /> UNIDADES DE ALMACENAMIENTO
                </h3>
                
                <div className="space-y-4">
                  {disksList.map((disk) => (
                    <div key={disk.drive} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-300 font-bold">UNIDAD {disk.drive}</span>
                        <span className="text-purple-400 font-bold">{Math.round(disk.percent)}%</span>
                      </div>
                      <div className="h-2 bg-slate-950/80 rounded-full border border-purple-500/10 overflow-hidden p-0.5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${disk.percent}%` }}
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                        <span>LIBRE: {disk.free.toFixed(1)} GB</span>
                        <span>TOTAL: {disk.total.toFixed(1)} GB</span>
                      </div>
                    </div>
                  ))}
                  {disksList.length === 0 && (
                    <p className="text-xs text-slate-500 font-mono italic">Escaneando unidades de disco...</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 space-y-3 shadow-inner">
                <h3 className="text-xs font-cyber font-bold text-slate-400 tracking-wider flex items-center gap-2">
                  <TerminalSquare className="w-3.5 h-3.5 text-slate-500" /> PARÁMETROS DE CONFIGURACIÓN
                </h3>
                <div className="font-mono text-[10px] space-y-1.5">
                  <div className="text-slate-400">&gt; CONFIG_FILE_PATH:</div>
                  <div className="text-slate-500 break-all select-all bg-black/40 p-2.5 rounded-lg border border-white/5">{configPath || 'C:\\CyberGems\\...'}</div>
                </div>
              </div>
            </div>

            <div className="relative z-10 border-t border-purple-500/20 pt-4 mt-6 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  window.electronAPI?.openDataFolder();
                  onClose();
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-all font-mono text-[10px] font-bold tracking-widest text-center"
              >
                CONFIG DIR
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

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

  const [dailyLaunchCount, setDailyLaunchCount] = useState(() => {
    const saved = localStorage.getItem('dailyLaunchCount');
    const savedDate = localStorage.getItem('dailyLaunchDate');
    return savedDate === new Date().toDateString() ? (saved ? parseInt(saved, 10) : 0) : 0;
  });
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'cyber' | 'system'>('cyber');
  const [systemSearchResults, setSystemSearchResults] = useState<Array<{ name: string; path: string; ext: string; type: 'app' | 'file' | 'folder'; icon?: string }>>([]);
  const [isSearchingSystem, setIsSearchingSystem] = useState(false);

  useEffect(() => {
    if (searchScope !== 'system' || !searchQuery.trim() || searchQuery.trim().startsWith('>')) {
      setSystemSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingSystem(true);
      try {
        if (isElectron) {
          const results = await window.electronAPI!.searchSystemFiles(searchQuery);
          setSystemSearchResults(results || []);
        } else {
          setSystemSearchResults([
            { name: `Documento_${searchQuery}.pdf`, path: `C:\\Users\\Mock\\Documents\\Documento_${searchQuery}.pdf`, ext: '.pdf', type: 'file' },
            { name: `Carpeta_${searchQuery}`, path: `C:\\Users\\Mock\\Downloads\\Carpeta_${searchQuery}`, ext: '', type: 'folder' },
            { name: `Aplicacion_${searchQuery}.exe`, path: `C:\\Program Files\\Aplicacion_${searchQuery}.exe`, ext: '.exe', type: 'app' },
          ]);
        }
      } catch (err) {
        console.error('System search failed:', err);
      } finally {
        setIsSearchingSystem(false);
      }
    }, 150);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchScope]);



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
  const [language, setLanguage] = useState<'es' | 'en'>(() => {
    const sysLang = navigator.language.startsWith('en') ? 'en' : 'es';
    return (localStorage.getItem('cyber_lang') as 'es' | 'en') || sysLang;
  });

  const t = useCallback((key: TranslationKey, variables?: Record<string, string>) => {
    let text = translations[language]?.[key] || translations['es']?.[key] || String(key);
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [language]);
  const [settingsTab, setSettingsTab] = useState<'general' | 'appearance' | 'system' | 'cybertray' | 'uwp' | 'indexer'>('general');

  const [systemContextMenu, setSystemContextMenu] = useState<{ x: number; y: number; item: any } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [indexerSettings, setIndexerSettings] = useState<{ enabled: boolean; maxDepth: number; paths: string[] }>({
    enabled: true,
    maxDepth: 2,
    paths: []
  });
  const [indexerStats, setIndexerStats] = useState<{ status: 'ONLINE' | 'OFFLINE' | 'INDEXING'; totalFiles: number }>({
    status: 'OFFLINE',
    totalFiles: 0
  });
  const [systemDrives, setSystemDrives] = useState<string[]>([]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    const fetchIndexerData = async () => {
      try {
        if (isElectron) {
          const settings = await window.electronAPI!.getIndexerSettings();
          setIndexerSettings(settings || { enabled: true, maxDepth: 2, paths: [] });
          const stats = await window.electronAPI!.getIndexerStats();
          setIndexerStats(stats || { status: 'OFFLINE', totalFiles: 0 });
          const drives = await window.electronAPI!.getSystemDrives();
          setSystemDrives(drives || []);
        }
      } catch (err) {
        console.error('Error fetching indexer settings:', err);
      }
    };
    fetchIndexerData();
  }, []);

  useEffect(() => {
    if (!isSettingsOpen) return;
    const interval = setInterval(async () => {
      try {
        if (isElectron) {
          const stats = await window.electronAPI!.getIndexerStats();
          setIndexerStats(stats || { status: 'OFFLINE', totalFiles: 0 });
        }
      } catch (err) {
        console.error('Error fetching indexer stats:', err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isSettingsOpen]);

  const handleAddFolder = async () => {
    try {
      if (isElectron) {
        const selected = await window.electronAPI!.selectIndexerFolder();
        if (selected && !indexerSettings.paths.includes(selected)) {
          const updated = {
            ...indexerSettings,
            paths: [...indexerSettings.paths, selected]
          };
          setIndexerSettings(updated);
          await window.electronAPI!.saveIndexerSettings(updated);
          setNotification({ message: 'Carpeta agregada e indexando...', type: 'success' });
        }
      }
    } catch (err) {
      console.error('Error selecting indexer folder:', err);
    }
  };

  const handleRemoveFolder = async (pathToRemove: string) => {
    try {
      const updated = {
        ...indexerSettings,
        paths: indexerSettings.paths.filter(p => p !== pathToRemove)
      };
      setIndexerSettings(updated);
      if (isElectron) {
        await window.electronAPI!.saveIndexerSettings(updated);
      }
      setNotification({ message: 'Carpeta eliminada', type: 'info' });
    } catch (err) {
      console.error('Error removing indexer folder:', err);
    }
  };

  const handleToggleIndexer = async (enabled: boolean) => {
    try {
      const updated = { ...indexerSettings, enabled };
      setIndexerSettings(updated);
      if (isElectron) {
        await window.electronAPI!.saveIndexerSettings(updated);
      }
      setNotification({ 
        message: enabled ? 'Buscador activado' : 'Buscador desactivado', 
        type: enabled ? 'success' : 'info' 
      });
    } catch (err) {
      console.error('Error toggling indexer:', err);
    }
  };

  const handleDepthChange = async (maxDepth: number) => {
    try {
      const updated = { ...indexerSettings, maxDepth };
      setIndexerSettings(updated);
      if (isElectron) {
        await window.electronAPI!.saveIndexerSettings(updated);
      }
    } catch (err) {
      console.error('Error changing indexer depth:', err);
    }
  };
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<typeof INITIAL_APPS[0] | null>(null);
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', path: '', iconPath: '', category: '', isAdmin: false, shortcut: '' });
  const [isRecordingAppShortcut, setIsRecordingAppShortcut] = useState(false);
  const [editingCategory, setEditingCategory] = useState<typeof INITIAL_CATEGORIES[0] | null>(null);
  const [editCategoryForm, setEditCategoryForm] = useState({ name: '', color: '' });
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);
  const [isAppActive, setIsAppActive] = useState(true);

  // Windows Store UWP states
  const [uwpAppsList, setUwpAppsList] = useState<Array<{ name: string; aumid: string; icon: string }>>([]);
  const [isScanningUwp, setIsScanningUwp] = useState(false);
  const [uwpSearchQuery, setUwpSearchQuery] = useState('');
  const [uwpScanLogs, setUwpScanLogs] = useState<string[]>([]);
  const [importingUwpApp, setImportingUwpApp] = useState<{ name: string; aumid: string; icon: string } | null>(null);
  const [uwpImportCategory, setUwpImportCategory] = useState('');

  const CYBER_LOGS_PRESETS = [
    "> INICIANDO SCANNER NEURONAL DE WINDOWS STORE...",
    "> CONECTANDO CON EL PROTOCOLO VIRTUAL shell:AppsFolder...",
    "> DESENCRIPTANDO BASE DE DATOS AppxManifest.xml...",
    "> CARGANDO IDENTIFICADORES DE MODELO DE APLICACIÓN (AUMID)...",
    "> EXTRAPOLANDO ACCESOS NTFS PROTEGIDOS...",
    "> EXTRAYENDO ICONOS BASE64 SIN PRIVILEGIOS DE ADMINISTRADOR...",
    "> PROCESANDO HASHES DE INTEGRIDAD DE WINDOWS STORE...",
    "> SCAN COMPLETO. ESTRUCTURA DE APLICACIONES DEVELADA CON ÉXITO."
  ];

  const handleScanUwpApps = async () => {
    if (isScanningUwp) return;
    setIsScanningUwp(true);
    setUwpScanLogs([]);
    setUwpAppsList([]);
    setUwpSearchQuery('');

    // Simulate cyber log scrolling
    let logIndex = 0;
    const logsInterval = setInterval(() => {
      if (logIndex < CYBER_LOGS_PRESETS.length) {
        setUwpScanLogs(prev => [...prev, CYBER_LOGS_PRESETS[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logsInterval);
      }
    }, 350);

    try {
      if (isElectron) {
        const apps = await window.electronAPI!.getUwpApps();
        clearInterval(logsInterval);
        setUwpScanLogs([
          ...CYBER_LOGS_PRESETS.slice(0, CYBER_LOGS_PRESETS.length - 1),
          `> CONEXIÓN ESTABLECIDA. SE DETECTARON ${apps.length} APLICACIONES VIRTUALES.`,
          "> ESTRUCTURA DISPONIBLE EN EL PANEL DE IMPORTACIÓN."
        ]);
        setUwpAppsList(apps);
      } else {
        // Mock data for browser testing
        await new Promise(r => setTimeout(r, 2800));
        clearInterval(logsInterval);
        setUwpScanLogs([
          ...CYBER_LOGS_PRESETS.slice(0, CYBER_LOGS_PRESETS.length - 1),
          "> CONEXIÓN MOCK (NAVEGADOR). SE DETECTARON 4 APLICACIONES VIRTUALES.",
          "> MODO DE PRUEBA ACTIVO."
        ]);
        setUwpAppsList([
          { name: 'Windows Terminal', aumid: 'Microsoft.WindowsTerminal_8wekyb3d8bbwe!App', icon: '' },
          { name: 'Xbox App', aumid: 'Microsoft.XboxApp_8wekyb3d8bbwe!App', icon: '' },
          { name: 'Calculadora UWP', aumid: 'Microsoft.WindowsCalculator_8wekyb3d8bbwe!App', icon: '' },
          { name: 'WhatsApp Store', aumid: '5319275A.WhatsAppDesktop_cv1g1gvanyjgm!App', icon: '' }
        ]);
      }
    } catch (e) {
      console.error(e);
      clearInterval(logsInterval);
      setUwpScanLogs(prev => [...prev, "> ERROR CRÍTICO AL LEER EL SUBNIVEL shell:AppsFolder.", "> ACCESO ABORTADO."]);
    } finally {
      setIsScanningUwp(false);
    }
  };

  const handleSaveCategory = () => {
    if (!editingCategory) return;
    const oldName = editingCategory.name;
    setCategories(cats => cats.map(c => c.id === editingCategory.id ? { ...c, name: editCategoryForm.name, color: editCategoryForm.color } : c));
    if (editCategoryForm.name !== oldName) {
      setApps(apps => apps.map(app => app.category === oldName ? { ...app, category: editCategoryForm.name } : app));
    }
    setEditingCategory(null);
  };

  const handleDeleteCategory = () => {
    if (!editingCategory) return;
    setCategories(cats => cats.filter(c => c.id !== editingCategory.id));
    if (activeCategory === editingCategory.id) setActiveCategory('all');
    setEditingCategory(null);
  };

  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(() => localStorage.getItem('isAlwaysOnTop') === 'true');
  const [isSystemHUDOpen, setIsSystemHUDOpen] = useState(false);
  const [isStorageHUDOpen, setIsStorageHUDOpen] = useState(false);
  const [isClockHUDOpen, setIsClockHUDOpen] = useState(false);
  const [scheduledTasks, setScheduledTasks] = useState<Array<ScheduledTask>>([]);
  const [isPinFlashing, setIsPinFlashing] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Background Scheduler Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setScheduledTasks(prev => {
        if (prev.length === 0) return prev;
        
        const updated = prev.map(task => {
          if (task.remainingSeconds <= 1) {
            // Executing scheduled action!
            if (task.type === 'app' && task.targetPath) {
              if (isElectron) {
                window.electronAPI!.launchApp(task.targetPath, task.isAdmin);
              } else {
                console.log(`[WEB SIMULATOR] Launching scheduled app: ${task.name} path: ${task.targetPath}`);
              }
            } else if (task.type === 'command' && task.command) {
              if (isElectron) {
                window.electronAPI!.runShellCommand(task.command);
              } else {
                console.log(`[WEB SIMULATOR] Running scheduled command: ${task.command}`);
              }
            }
            
            // Play our retro cyber sci-fi synthesized beep sound!
            playCyberBeep();
            return null; // Remove task
          }
          return { ...task, remainingSeconds: task.remainingSeconds - 1 };
        }).filter(Boolean) as Array<ScheduledTask>;

        return updated;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev === 0 ? 1 : 0));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerPinFlash = useCallback(() => {
    setIsPinFlashing(true);
    setTimeout(() => setIsPinFlashing(false), 1200);
  }, []);

  useEffect(() => {
    localStorage.setItem('isAlwaysOnTop', isAlwaysOnTop.toString());
    if (isElectron) {
      window.electronAPI!.setAlwaysOnTop(isAlwaysOnTop);
    }
  }, [isAlwaysOnTop]);

  // Listen to always-on-top blur attempts
  useEffect(() => {
    if (isElectron && window.electronAPI.onAlwaysOnTopBlurAttempt) {
      const unsub = window.electronAPI.onAlwaysOnTopBlurAttempt(() => {
        triggerPinFlash();
      });
      return unsub;
    }
  }, [triggerPinFlash]);

  // Listen to tray Configuración button click
  useEffect(() => {
    if (isElectron && window.electronAPI.onOpenSettings) {
      const unsub = window.electronAPI.onOpenSettings(() => {
        setIsSettingsOpen(true);
      });
      return unsub;
    }
  }, []);

  // Synchronize dynamic custom app shortcuts with Electron main process
  useEffect(() => {
    if (isConfigLoaded && isElectron && window.electronAPI) {
      const shortcutList = apps
        .filter(app => (app as any).path && (app as any).shortcut)
        .map(app => ({
          path: (app as any).path,
          shortcut: (app as any).shortcut,
          isAdmin: !!(app as any).isAdmin
        }));
      window.electronAPI.registerAppShortcuts(shortcutList);
    }
  }, [apps, isConfigLoaded]);

  // Mini Console Command Runner States
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'input' | 'stdout' | 'stderr' | 'system'; text: string; id: string }>>([]);
  const [activeCmdId, setActiveCmdId] = useState<string | null>(null);
  const [isCommandRunning, setIsCommandRunning] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of console logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // IPC listeners for running shell commands in real time
  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    const unsubOutput = window.electronAPI.onShellOutput((data) => {
      setConsoleLogs(prev => [
        ...prev, 
        { 
          type: data.type === 'stdout' ? 'stdout' : 'stderr', 
          text: data.text, 
          id: `${data.id}-${Date.now()}-${Math.random()}` 
        }
      ]);
    });

    const unsubExit = window.electronAPI.onShellExit((data) => {
      setConsoleLogs(prev => [
        ...prev,
        { 
          type: 'system', 
          text: `\n[SISTEMA] El proceso terminó con el código de salida ${data.exitCode}\n`, 
          id: `${data.id}-exit-${Date.now()}` 
        }
      ]);
      setIsCommandRunning(false);
      setActiveCmdId(null);
    });

    return () => {
      unsubOutput();
      unsubExit();
    };
  }, []);

  const [bgType, setBgType] = useState<'image' | 'solid' | 'gradient'>(() => {
    return (localStorage.getItem('bgType') as any) || 'image';
  });
  const [bgImage, setBgImage] = useState(() => {
    const saved = localStorage.getItem('bgImage');
    if (saved && saved.includes('antigravity_projects')) {
      return 'C:\\CyberGems\\CyberLauncher\\default_background.jpg';
    }
    return saved || 'C:\\CyberGems\\CyberLauncher\\default_background.jpg';
  });
  const [customImageUrl, setCustomImageUrl] = useState(() => localStorage.getItem('customImageUrl') || '');
  const [startWithWindows, setStartWithWindows] = useState(() => localStorage.getItem('startWithWindows') === 'true');
  const [hideOnClickDeadSpot, setHideOnClickDeadSpot] = useState(() => localStorage.getItem('hideOnClickDeadSpot') === 'true');
  const [hideOnBlur, setHideOnBlur] = useState(() => localStorage.getItem('hideOnBlur') !== 'false');
  const [showTaskbarIcon, setShowTaskbarIcon] = useState(() => localStorage.getItem('showTaskbarIcon') === 'true');
  const [bgColor, setBgColor] = useState(() => localStorage.getItem('bgColor') || PRESET_SOLIDS[0]);
  const [bgGradient, setBgGradient] = useState(() => localStorage.getItem('bgGradient') || PRESET_GRADIENTS[0]);
  const [glassIntensity, setGlassIntensity] = useState(() => {
    const saved = localStorage.getItem('glassIntensity');
    return saved ? parseInt(saved, 10) : 80;
  });
  const [bgOpacity, setBgOpacity] = useState(() => {
    const saved = localStorage.getItem('bgOpacity');
    return saved ? parseInt(saved, 10) : 80;
  });
  // (CyberTray state removed)

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
        } else if (!bgImage.includes(':') && !bgImage.includes('\\')) {
          // Es un asset empaquetado relativo, se carga directo desde la raíz de la app
          setBgDataUrl(bgImage);
        } else if (isElectron) {
          // Es una ruta física absoluta, pedir a Electron el Base64
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

  useEffect(() => {
    localStorage.setItem('dailyLaunchCount', dailyLaunchCount.toString());
    localStorage.setItem('dailyLaunchDate', new Date().toDateString());
  }, [dailyLaunchCount]);

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
          if (source.hideOnBlur !== undefined) { setHideOnBlur(source.hideOnBlur); if (isElectron) window.electronAPI!.setHideOnBlur(source.hideOnBlur); }
          if (source.activationShortcut) setActivationShortcut(source.activationShortcut);
          if (source.hotspotCorners) setHotspotCorners(source.hotspotCorners);
          if (source.hotspotDelay !== undefined) setHotspotDelay(source.hotspotDelay);
          if (source.leftSidebarWidth !== undefined) setLeftSidebarWidth(source.leftSidebarWidth);
          if (source.rightSidebarWidth !== undefined) setRightSidebarWidth(source.rightSidebarWidth);
          if (source.showTaskbarIcon !== undefined) { setShowTaskbarIcon(source.showTaskbarIcon); if (isElectron) window.electronAPI!.setShowTaskbarIcon(source.showTaskbarIcon); }
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
  const configRef = useRef({ apps, categories, favoriteIds, taskbarAppIds, bgType, bgImage, customImageUrl, bgColor, bgGradient, glassIntensity, bgOpacity, startWithWindows, activationShortcut, hotspotCorners, hotspotDelay, leftSidebarWidth, rightSidebarWidth, hideOnClickDeadSpot, hideOnBlur, showTaskbarIcon });
  configRef.current = { apps: apps.map(({ icon, ...r }: any) => r), categories, favoriteIds, taskbarAppIds, bgType, bgImage, customImageUrl, bgColor, bgGradient, glassIntensity, bgOpacity, startWithWindows, activationShortcut, hotspotCorners, hotspotDelay, leftSidebarWidth, rightSidebarWidth, hideOnClickDeadSpot, hideOnBlur, showTaskbarIcon };

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
          hideOnClickDeadSpot, hideOnBlur, showTaskbarIcon
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
    hideOnClickDeadSpot, hideOnBlur, showTaskbarIcon,
    isConfigLoaded
  ]);

  // Sincronizar hideOnBlur con el proceso principal de Electron
  useEffect(() => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.setHideOnBlur(hideOnBlur);
    }
    localStorage.setItem('hideOnBlur', hideOnBlur.toString());
  }, [hideOnBlur]);

  // Sincronizar showTaskbarIcon con el proceso principal de Electron
  useEffect(() => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.setShowTaskbarIcon(showTaskbarIcon);
    }
    localStorage.setItem('showTaskbarIcon', showTaskbarIcon.toString());
  }, [showTaskbarIcon]);

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
      'hideOnClickDeadSpot', 'hideOnBlur', 'showTaskbarIcon', 'cyberTray'
    ] as const;

    const cleanup = window.electronAPI!.onReloadConfig(async () => {
      console.log('[CONFIG] Recargando desde disco...');
      // Resetear vista y modales al estado inicial
      setActiveCategory('all');
      setEditingCategory(null);
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
        let cleanBgImage = config.bgImage;
        if (cleanBgImage.includes('antigravity_projects')) {
          cleanBgImage = 'C:\\CyberGems\\CyberLauncher\\default_background.jpg';
        }
        setBgImage(cleanBgImage);
        localStorage.setItem('bgImage', cleanBgImage);
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
      if (config.hideOnBlur !== undefined) {
        setHideOnBlur(config.hideOnBlur);
        localStorage.setItem('hideOnBlur', config.hideOnBlur.toString());
        if (isElectron) window.electronAPI!.setHideOnBlur(config.hideOnBlur);
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
      if (config.showTaskbarIcon !== undefined) {
        setShowTaskbarIcon(config.showTaskbarIcon);
        localStorage.setItem('showTaskbarIcon', config.showTaskbarIcon.toString());
        if (isElectron) window.electronAPI!.setShowTaskbarIcon(config.showTaskbarIcon);
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
      mouseTimer = window.setTimeout(() => root.classList.remove('mouse-active'), 900);
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
      }, 800));
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
      if (systemContextMenu) setSystemContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu, systemContextMenu]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isRecordingShortcut) return;

      // Category speed dialing: Alt + number (1 to 9)
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        if (index < categories.length) {
          e.preventDefault();
          setActiveCategory(categories[index].id);
        }
      }

      if (e.code === 'KeyF' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      } else if (e.code === 'Escape') {
        if (isRecordingAppShortcut) {
          setIsRecordingAppShortcut(false);
        } else if (isSystemHUDOpen) {
          setIsSystemHUDOpen(false);
        } else if (isStorageHUDOpen) {
          setIsStorageHUDOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isAboutOpen) {
          setIsAboutOpen(false);
        } else if (editingApp) {
          setEditingApp(null);
        } else if (isAddingApp) {
          setIsAddingApp(false);
        } else if (searchQuery) {
          setSearchQuery('');
        } else if (isElectron) {
          window.electronAPI!.windowHideToTray();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSettingsOpen, isRecordingShortcut, isAboutOpen, editingApp, isAddingApp, searchQuery, categories, isRecordingAppShortcut, isSystemHUDOpen, isStorageHUDOpen]);

  const handleLaunchApp = async (app: typeof INITIAL_APPS[0]) => {
    // Incrementar contadores de uso
    setApps(prevApps => prevApps.map(a => a.id === app.id ? { ...a, usage: (a.usage || 0) + 1 } : a));
    setDailyLaunchCount(prev => {
      const today = new Date().toDateString();
      const savedDate = localStorage.getItem('dailyLaunchDate');
      return savedDate === today ? prev + 1 : 1;
    });

    // Si hay ruta definida y estamos en Electron, lanzar la aplicación
    const appPath = (app as any).path;
    if (appPath && isElectron) {
      const result = await window.electronAPI!.launchApp(appPath, !!(app as any).isAdmin);
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
            category: '',
            isAdmin: false,
            shortcut: ''
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
          category: '',
          isAdmin: false,
          shortcut: ''
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
        if (isAlwaysOnTop) {
          triggerPinFlash();
          return;
        }
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
              <div className="flex items-center gap-1.5">
                {cat.id !== 'all' && (
                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-400 transition-all cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditCategoryForm({ name: cat.name, color: cat.color });
                      setEditingCategory(cat);
                    }}
                  />
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full backdrop-blur-md ${
                  activeCategory === cat.id ? 'bg-blue-500/30 text-blue-200' : 'bg-black/40 group-hover:bg-black/60'
                }`}>
                  {cat.count}
                </span>
              </div>
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
              placeholder=""
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onContextMenu={(e) => {
                if (isElectron) {
                  e.preventDefault();
                  window.electronAPI!.showTextContextMenu(e.clientX, e.clientY);
                }
              }}
              onKeyDown={async (e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  if (!searchQuery.startsWith('>')) {
                    setSearchScope(prev => prev === 'cyber' ? 'system' : 'cyber');
                  }
                }
                if (e.key === 'Enter' && searchQuery.trim().startsWith('>')) {
                  e.preventDefault();
                  const rawCmd = searchQuery.trim().substring(1).trim();
                  if (!rawCmd) return;
                  
                  // Add input trace to console logs
                  const cmdId = `${Date.now()}`;
                  setConsoleLogs(prev => [
                    ...prev,
                    { type: 'input', text: `> ${rawCmd}`, id: cmdId }
                  ]);
                  
                  if (isElectron) {
                    setIsCommandRunning(true);
                    const res = await window.electronAPI!.runShellCommand(rawCmd);
                    if (res.success && res.cmdId) {
                      setActiveCmdId(res.cmdId);
                    } else {
                      setConsoleLogs(prev => [
                        ...prev,
                        { type: 'stderr', text: res.error || 'Failed to spawn process.', id: `error-${Date.now()}` }
                      ]);
                      setIsCommandRunning(false);
                    }
                  } else {
                    // Web simulator
                    setIsCommandRunning(true);
                    setConsoleLogs(prev => [
                      ...prev,
                      { type: 'stdout', text: `Simulando ejecución de: "${rawCmd}"\n`, id: `sim-${Date.now()}` }
                    ]);
                    setTimeout(() => {
                      setConsoleLogs(prev => [
                        ...prev,
                        { type: 'stdout', text: `Pinging webhost... Successful.\n`, id: `sim-ping-${Date.now()}` },
                        { type: 'system', text: `[SISTEMA] El proceso terminó con el código de salida 0`, id: `sim-exit-${Date.now()}` }
                      ]);
                      setIsCommandRunning(false);
                    }, 1500);
                  }
                }
              }}
              className={`w-full bg-black/20 backdrop-blur-md text-white rounded-xl pl-11 py-3 text-sm focus:outline-none transition-all block shadow-inner border pr-36 ${
                searchQuery.startsWith('>') 
                  ? 'border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                  : searchScope === 'system'
                  ? 'border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'border-white/10 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]'
              } placeholder:text-slate-500`}
            />
            {searchQuery === '' && (
              <div className="absolute inset-y-0 left-11 right-36 flex items-center pointer-events-none text-slate-500 text-sm font-sans select-none overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={searchQuery.startsWith('>') ? `console-${placeholderIndex}` : searchScope === 'system' ? `system-${placeholderIndex}` : `normal-${placeholderIndex}`}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.25 }}
                    className="truncate"
                  >
                    {searchQuery.startsWith('>') 
                      ? (placeholderIndex === 0 ? t('search_placeholder_console') : t('hint_console_enter'))
                      : searchScope === 'system'
                      ? (placeholderIndex === 0 ? t('search_placeholder_system') : t('hint_system_tab'))
                      : (placeholderIndex === 0 ? t('search_placeholder_normal') : t('hint_normal_console'))
                    }
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {searchQuery.startsWith('>') ? (
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] transition-colors" />
              ) : searchScope === 'system' ? (
                <Search className="w-4 h-4 text-emerald-400 animate-pulse drop-shadow-[0_0_5px_rgba(16,185,129,0.3)] transition-colors" />
              ) : (
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors drop-shadow-sm" />
              )}
            </div>

            {/* Unified Inline Right Actions Container */}
            <div className="absolute inset-y-0 right-3 flex items-center gap-3 z-20 select-none">
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="flex items-center justify-center text-slate-400 hover:text-red-400 hover:scale-110 active:scale-95 transition-all focus:outline-none cursor-pointer p-1"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {searchQuery.startsWith('>') ? (
                <span className="text-[9px] font-cyber font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)] animate-pulse">
                  CONSOLA
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchScope(prev => prev === 'cyber' ? 'system' : 'cyber');
                  }}
                  className="flex items-center focus:outline-none cursor-pointer"
                  title="Alternar alcance de búsqueda (Cyber / Sistema) [TAB]"
                >
                  <span className={`text-[9px] font-cyber font-bold px-2 py-0.5 rounded border transition-all duration-300 ${
                    searchScope === 'system'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)] animate-pulse'
                      : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/20'
                  }`}>
                    {searchScope === 'system' ? 'SISTEMA' : 'LAUNCHER'}
                  </span>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            <button 
              onClick={() => setIsSystemHUDOpen(true)}
              className="focus:outline-none hover:opacity-80 active:scale-95 transition-all"
              title="Abrir Diagnóstico de Recursos de Sistema"
            >
              <SystemMonitor />
            </button>
            <button 
              onClick={() => setIsStorageHUDOpen(true)}
              className="focus:outline-none hover:opacity-80 active:scale-95 transition-all"
              title="Abrir Diagnóstico de Almacenamiento Físico"
            >
              <DiskMonitor />
            </button>
            
            <button 
              onClick={() => setIsClockHUDOpen(true)}
              className="focus:outline-none flex items-center gap-2 text-cyan-400 font-cyber font-bold text-[20px] tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer tabular-nums w-[150px] shrink-0 justify-start pl-6 border-l border-white/10 group"
              title="Abrir Reloj Neuronal y Programador de Ejecuciones"
            >
              <Clock className="w-5 h-5 mb-0.5 shrink-0 transition-transform duration-300 group-hover:scale-115 group-hover:rotate-12" />
              <span>{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
            </button>
          </div>
        </header>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar relative z-10 flex flex-col">
          {searchQuery.trim().startsWith('>') ? (
            <div className="flex-1 flex flex-col pt-4 font-mono text-left bg-black/45 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-2xl overflow-hidden relative min-h-[400px]">
              {/* Terminal Scanline overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,18,18,0)_98%,rgba(16,185,129,0.04)_98%)] bg-[size:100%_4px] rounded-2xl" />
              
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-cyber font-bold text-emerald-400 tracking-wider">CONSOLE DE MANDOS CYBER COCKPIT</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isCommandRunning ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] text-slate-400">{isCommandRunning ? 'EJECUTANDO PROCESO...' : 'ONLINE'}</span>
                  {consoleLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setConsoleLogs([])}
                      className="text-[10px] text-red-400/80 hover:text-red-400 ml-4 font-cyber focus:outline-none"
                    >
                      LIMPIAR PANTALLA
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 select-text selection:bg-emerald-500/30 selection:text-white">
                <div className="text-[11px] text-slate-500 mb-2">
                  Escribe cualquier comando de consola y presiona [Enter]. Prefijo `&gt;` activo.
                </div>
                {consoleLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`text-xs break-all leading-relaxed whitespace-pre-wrap ${
                      log.type === 'input' 
                        ? 'text-white font-bold' 
                        : log.type === 'stderr' 
                        ? 'text-red-400 font-bold' 
                        : log.type === 'system' 
                        ? 'text-cyan-400 font-bold border-y border-cyan-500/10 py-1 my-2' 
                        : 'text-emerald-400/90'
                    }`}
                  >
                    {log.text}
                  </div>
                ))}
                {isCommandRunning && (
                  <div className="text-xs text-emerald-400/50 animate-pulse mt-1">&gt; Procesando stream de datos...</div>
                )}
                <div ref={consoleEndRef} />
              </div>
            </div>
          ) : (searchScope === 'system' && searchQuery.trim() !== '') ? (
            <div className="flex-1 flex flex-col pt-4 select-none">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-cyber font-bold text-emerald-400 tracking-wider">RESULTADOS DEL SISTEMA DE ARCHIVOS</span>
                </div>
                <div className="text-[10px] text-slate-400 font-cyber">
                  {isSearchingSystem ? 'BUSCANDO...' : `COINCIDENCIAS: ${systemSearchResults.length}`}
                </div>
              </div>

              {isSearchingSystem && systemSearchResults.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                  <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-xs font-cyber animate-pulse">ESCANEAR CON NEURAL INDEX...</span>
                </div>
              ) : systemSearchResults.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                  <Search className="w-8 h-8 text-slate-600 border border-dashed border-slate-700 p-1.5 rounded-lg" />
                  <span className="text-xs font-cyber">NO SE ENCONTRARON COINCIDENCIAS</span>
                  <span className="text-[10px] text-slate-600">Comprueba la ortografía o intenta con otro término</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2.5 max-h-[calc(100vh-240px)]">
                  {systemSearchResults.map((item, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
                      key={`${item.path}-${index}`}
                      onClick={() => {
                        if (isElectron) {
                          window.electronAPI!.launchApp(item.path);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSystemContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          item
                        });
                      }}
                      className="group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all duration-300 cursor-pointer shadow-lg relative overflow-hidden"
                    >
                      {/* Left: icon + name & path */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center border border-white/10 group-hover:border-emerald-500/30 transition-all duration-300 relative shrink-0">
                          {item.icon ? (
                            <img src={item.icon} alt={item.name} className="w-7 h-7 object-contain" />
                          ) : item.type === 'folder' ? (
                            <Folder className="w-5 h-5 text-amber-400/80 group-hover:text-amber-400 group-hover:scale-105 transition-all duration-300" />
                          ) : (
                            <File className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 group-hover:scale-105 transition-all duration-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-all duration-300 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate select-all group-hover:text-slate-400 transition-all duration-300">
                            {item.path}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {item.type !== 'folder' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isElectron) {
                                window.electronAPI!.launchApp(item.path, true);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 hover:border-red-500/40 focus:outline-none transition-all duration-300 cursor-pointer"
                            title="Ejecutar como Administrador"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isElectron) {
                              window.electronAPI!.openFileLocation(item.path);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/40 focus:outline-none transition-all duration-300 cursor-pointer"
                          title="Abrir ubicación de archivo"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newApp = {
                              id: Date.now(),
                              name: item.name.replace(/\.[^/.]+$/, ""),
                              path: item.path,
                              icon: item.icon || '',
                              category: 'all',
                              shortcut: '',
                              isAdmin: false,
                              isFavorite: false,
                            };
                            setApps(prev => [...prev, newApp]);
                            setSearchQuery('');
                            setSearchScope('cyber');
                          }}
                          className="p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 focus:outline-none transition-all duration-300 cursor-pointer"
                          title="Agregar a CyberLauncher"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
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
                    // @ts-ignore
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    onDragOver={(e) => handleFavDragOver(e, app.id)}
                    onDrop={(e) => handleDrop(e, app.id)}
                    // @ts-ignore
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
                    setEditForm({ name: '', path: '', iconPath: '', category: '', isAdmin: false, shortcut: '' });
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
            </>
          )}
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
              onClick={() => setIsAlwaysOnTop(!isAlwaysOnTop)}
              title={isAlwaysOnTop ? "Desanclar ventana (No mantener al frente)" : "Anclar ventana (Mantener al frente)"} 
              className={`flex items-center justify-center w-7 h-7 rounded-md transition-all group focus:outline-none ${
                isPinFlashing 
                  ? 'bg-red-500/30 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-bounce' 
                  : isAlwaysOnTop 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.4)]' 
                  : 'hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 transition-transform duration-300 ${
                isPinFlashing 
                  ? 'scale-125 text-red-400' 
                  : isAlwaysOnTop 
                  ? 'fill-cyan-400' 
                  : 'rotate-45'
              }`} />
            </button>
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
            onContextMenu={(e) => {
              e.preventDefault();
              setIsSettingsOpen(true);
            }}
            className="hover:scale-110 transition-transform flex-shrink-0"
            title="Menú Inicio / Acerca de (Click derecho: Configuración)"
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
                  setEditForm({ name: '', path: '', iconPath: '', category: '', isAdmin: false, shortcut: '' });
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
            <span className="text-sm font-mono text-slate-400">{dailyLaunchCount}</span>
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
            onClick={(e) => { e.stopPropagation(); setIsAboutOpen(false); }}
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
                  &copy; 2026 CyberGems
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
            onClick={(e) => { e.stopPropagation(); setEditingApp(null); setIsAddingApp(false); }}
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

                  {/* Launch as Admin Field */}
                  <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                        <Lock className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-200 leading-tight mb-1">Ejecutar como Administrador</h4>
                        <p className="text-xs text-slate-500">Solicita privilegios elevados de administrador al iniciar.</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, isAdmin: !prev.isAdmin }))}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500/50 ${editForm.isAdmin ? 'bg-red-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow flex items-center justify-center ${editForm.isAdmin ? 'translate-x-5' : 'translate-x-0'}`}>
                        <div className={`w-2 h-2 rounded-full ${editForm.isAdmin ? 'bg-red-500 shadow-[0_0_5px_currentColor]' : 'bg-slate-400'}`} />
                      </div>
                    </button>
                  </div>

                  {/* Custom App Hotkey Recorder Field */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                          <Keyboard className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-200 leading-tight mb-1 text-left">Atajo de Teclado Global</h4>
                          <p className="text-xs text-slate-500 text-left">Lanza este acceso directo desde cualquier lugar del sistema.</p>
                        </div>
                      </div>
                      {editForm.shortcut && (
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, shortcut: '' }))}
                          className="text-xs text-red-400 hover:text-red-300 font-cyber transition-colors"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setIsRecordingAppShortcut(true)}
                      onKeyDown={(e) => {
                        if (isRecordingAppShortcut) {
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
                              setEditForm(prev => ({ ...prev, shortcut: newShortcut }));
                              setIsRecordingAppShortcut(false);
                          }
                        }
                      }}
                      onBlur={() => setIsRecordingAppShortcut(false)}
                      className={`w-full text-center px-4 py-2.5 rounded-lg text-xs font-mono outline-none transition-all ${
                        isRecordingAppShortcut 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                          : 'bg-black/30 text-slate-300 hover:bg-white/5 border border-white/10'
                      }`}
                    >
                      {isRecordingAppShortcut ? 'Presiona combinación de teclas...' : (editForm.shortcut || 'Ninguno (Haz clic para asignar)')}
                    </button>
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
                        usage: 0,
                        isAdmin: editForm.isAdmin,
                        shortcut: editForm.shortcut
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
                            category: editForm.category,
                            isAdmin: editForm.isAdmin,
                            shortcut: editForm.shortcut
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
            onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(false); }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl bg-[#0d131f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[75vh] max-h-[580px]"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/20">
                <h2 className="text-sm font-cyber font-bold text-white flex items-center gap-2 tracking-wider">
                  <Settings className="w-4.5 h-4.5 text-cyan-400" />
                  {t('settings_title')}
                </h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-1 min-h-0 bg-[#070b13]/40">
                {/* Left Sidebar Navigation */}
                <div className="w-48 border-r border-white/5 bg-black/20 flex flex-col py-3 shrink-0 select-none">
                  {([
                    ['general', t('tab_general'), '⌨'],
                    ['appearance', t('tab_appearance'), '🎨'],
                    ['system', t('tab_system'), '⚙'],
                    ['indexer', t('tab_indexer'), '🔍'],
                    ['uwp', t('tab_uwp'), '🛍']
                  ] as const).map(([id,label,icon]) => (
                    <button 
                      key={id} 
                      onClick={() => setSettingsTab(id as any)}
                      className={`flex items-center gap-2.5 px-4 py-3.5 text-[11px] font-cyber font-bold transition-all text-left border-l-2 shrink-0 ${
                        settingsTab === id 
                          ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' 
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]'
                      }`}
                    >
                      <span className="text-sm">{icon}</span>
                      <span>{label.toUpperCase()}</span>
                    </button>
                  ))}
                </div>

                {/* Right Scrollable Panel Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8 text-slate-300">

                {settingsTab === 'general' && (<>
                {/* Language Selection Config */}
                <div className="space-y-3">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    {t('general_language')}
                  </label>
                  <div className="flex gap-3">
                    {[
                      { code: 'es', name: 'ESPAÑOL' },
                      { code: 'en', name: 'ENGLISH' }
                    ].map(item => {
                      const isActive = language === item.code;
                      return (
                        <button
                          key={item.code}
                          onClick={() => {
                            setLanguage(item.code as any);
                            localStorage.setItem('cyber_lang', item.code);
                            setNotification({ message: item.code === 'es' ? 'Idioma cambiado a Español' : 'Language switched to English', type: 'success' });
                          }}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-cyber font-bold transition-all duration-300 border hover:scale-102 cursor-pointer ${
                            isActive
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.15)] border-solid'
                              : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-200'
                          }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500">{t('general_language_desc')}</p>
                </div>

                {/* Keyboard Shortcut Config */}
                <div className="space-y-3">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-slate-500" />
                    {t('general_shortcut')}
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
                    {isRecordingShortcut ? t('general_shortcut_rec') : activationShortcut}
                  </button>
                  <p className="text-xs text-slate-500">{t('general_shortcut_desc')}</p>
                </div>

                {/* Scale Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-slate-500" />
                    {t('general_scale')}
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
                  <p className="text-xs text-slate-500">{t('general_scale_desc')}</p>
                </div>

                {/* Monitor Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-slate-500" />
                    {t('general_monitor')}
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
                  <p className="text-xs text-slate-500">{t('general_monitor_desc')}</p>
                </div>
                
                </>)}

                {settingsTab === 'appearance' && (<>
                {/* Background Type Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">{t('app_bg_type')}</label>
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    {[
                      { id: 'image', icon: ImageIcon, label: t('app_bg_image') },
                      { id: 'gradient', icon: Palette, label: t('app_bg_gradient') },
                      { id: 'solid', icon: Droplets, label: t('app_bg_solid') }
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
                        <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                          {language === 'es' ? 'IMÁGENES PREDETERMINADAS' : 'PRESET BACKGROUND IMAGES'}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {PRESET_IMAGES.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => setBgImage(img)}
                              className={`h-24 rounded-xl bg-cover bg-center border-2 transition-all overflow-hidden relative ${
                                bgImage === img ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-transparent hover:border-white/20'
                              }`}
                              style={{ backgroundImage: `url(${toThumbnailUrl(img)})` }}
                            >
                               {bgImage === img && <div className="absolute inset-0 bg-blue-500/20" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                           <Link className="w-3 h-3" /> {language === 'es' ? 'IMAGEN PERSONALIZADA (URL O ARCHIVO LOCAL)' : 'CUSTOM BACKGROUND (URL OR LOCAL FILE)'}
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
                             className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                           >
                             {language === 'es' ? 'Aplicar' : 'Apply'}
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
                              <Upload className="w-4 h-4 mr-2" /> {language === 'es' ? 'PC' : 'My Computer'}
                            </button>
                         </div>
                      </div>
                      
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                            {language === 'es' ? 'INTENSIDAD DE CRISTAL (GLASS)' : 'GLASSMORPHISM BLUR LEVEL'}
                          </label>
                          <span className="text-xs text-blue-400 font-mono">{glassIntensity}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={glassIntensity}
                          onChange={(e) => setGlassIntensity(Number(e.target.value))}
                          className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <p className="text-xs text-slate-500">
                          {language === 'es' 
                            ? 'Mueve a la izquierda para un efecto más transparente, a la derecha para oscurecer la interfaz.' 
                            : 'Drag left for maximum clarity/transparency, drag right to darken the backdrop overlay.'}
                        </p>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">{t('app_opacity')}</label>
                          <span className="text-xs text-blue-400 font-mono">{bgOpacity}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={bgOpacity}
                          onChange={(e) => setBgOpacity(Number(e.target.value))}
                          className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <p className="text-xs text-slate-500">
                          {language === 'es'
                            ? 'Ajusta qué tan oscuro se ve la imagen de fondo antes de aplicar el efecto de cristal.'
                            : 'Adjust how dark the background image displays under the glass backdrop layer.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {bgType === 'gradient' && (
                    <div className="space-y-3">
                      <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                        {language === 'es' ? 'GRADIENTES' : 'PRESET GRADIENTS'}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {PRESET_GRADIENTS.map((grad, i) => (
                          <button
                            key={i}
                            onClick={() => setBgGradient(grad)}
                            className={`h-20 rounded-xl border-2 transition-all cursor-pointer ${
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
                      <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                        {language === 'es' ? 'COLORES SÓLIDOS' : 'SOLID COLORS'}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {PRESET_SOLIDS.map((color, i) => (
                          <button
                            key={i}
                            onClick={() => setBgColor(color)}
                            className={`w-14 h-14 rounded-xl border-2 transition-all cursor-pointer ${
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
                {/* Hotspots Section */}
                <div className="space-y-4">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest drop-shadow-sm flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-cyan-500" />
                    {t('general_hotspots')}
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
                          <h4 className="text-sm font-medium text-slate-200 mb-1">{t('general_hotspots_corners')}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{t('general_hotspots_corners_desc')}</p>
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-300">{t('general_hotspots_delay')}</span>
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
                          <p className="text-[10px] text-slate-500 text-right mt-1">{t('general_hotspots_delay_desc')}</p>
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
                        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                          <Eye className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-200 leading-tight mb-1">Ocultar al perder el foco</h4>
                          <p className="text-xs text-slate-500">Al hacer clic fuera del launcher, se oculta al tray automáticamente.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setHideOnBlur(!hideOnBlur)}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${hideOnBlur ? 'bg-cyan-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow flex items-center justify-center ${hideOnBlur ? 'translate-x-5' : 'translate-x-0'}`}>
                          <div className={`w-2 h-2 rounded-full ${hideOnBlur ? 'bg-cyan-500 shadow-[0_0_5px_currentColor]' : 'bg-slate-400'}`} />
                        </div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-500/10 rounded-lg border border-slate-500/20">
                          <Monitor className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-200 leading-tight mb-1">Mostrar icono en la barra de tareas</h4>
                          <p className="text-xs text-slate-500">Muestra el icono de Cyber Launcher en la barra de tareas de Windows.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowTaskbarIcon(!showTaskbarIcon)}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${showTaskbarIcon ? 'bg-slate-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow flex items-center justify-center ${showTaskbarIcon ? 'translate-x-5' : 'translate-x-0'}`}>
                          <div className={`w-2 h-2 rounded-full ${showTaskbarIcon ? 'bg-slate-500 shadow-[0_0_5px_currentColor]' : 'bg-slate-400'}`} />
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

                {settingsTab === 'uwp' && (
                  <div className="space-y-6 relative min-h-[300px]">
                    <div className="flex flex-col gap-1 border-b border-white/5 pb-4">
                      <h3 className="text-lg font-cyber font-bold text-cyan-400 tracking-wider flex items-center gap-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                        <Package className="w-5 h-5" /> SCANNER DE WINDOWS STORE
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        Detecta e integra aplicaciones de la Windows Store (UWP/MSIX) de forma nativa. La ruta virtual se resuelve dinámicamente mediante AUMID, asegurando un lanzamiento indestructible inmune a actualizaciones del sistema.
                      </p>
                    </div>

                    {/* Botón de Escaneo / Estado Inicial */}
                    {uwpAppsList.length === 0 && !isScanningUwp && (
                      <div className="flex flex-col items-center justify-center p-8 bg-black/30 border border-white/5 rounded-2xl hover:border-cyan-500/20 transition-all text-center">
                        <Hexagon className="w-12 h-12 text-cyan-400/30 animate-pulse mb-4 drop-shadow-[0_0_12px_rgba(34,211,238,0.2)]" />
                        <h4 className="text-sm font-medium text-slate-200 mb-2">Escaneo de Sistema Requerido</h4>
                        <p className="text-xs text-slate-500 max-w-sm mb-6 leading-normal font-sans">
                          Para catalogar y extraer los accesos directos, iniciaremos un escaneo en los manifiestos de WindowsApps.
                        </p>
                        <button
                          onClick={handleScanUwpApps}
                          className="px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition-all text-sm font-cyber font-bold border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] active:scale-[0.98]"
                        >
                          INICIAR ESCANEO DE APLICACIONES ⚡
                        </button>
                      </div>
                    )}

                    {/* Consola Terminal Shimmer durante Escaneo */}
                    {isScanningUwp && (
                      <div className="flex flex-col bg-black/40 border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(34,211,238,0.15)] relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                            <span className="text-xs font-cyber font-bold text-cyan-400 tracking-wider">NEURAL TERMINAL DE DIAGNÓSTICO</span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-500 animate-pulse">MEM_DUMP: SCANNING...</span>
                        </div>
                        <div className="h-40 overflow-y-auto space-y-1.5 font-mono text-[11px] text-cyan-300/80 leading-normal custom-scrollbar">
                          {uwpScanLogs.map((log, i) => (
                            <div key={i} className="flex items-start gap-1">
                              <span className="text-cyan-500 shrink-0">&gt;</span>
                              <span className={i === uwpScanLogs.length - 1 ? "text-cyan-400 font-bold" : ""}>{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resultados de Búsqueda y Lista */}
                    {uwpAppsList.length > 0 && !isScanningUwp && (
                      <div className="space-y-4">
                        {/* Buscador Superior */}
                        <div className="flex items-center gap-3 bg-black/30 border border-white/5 rounded-xl px-3.5 py-2.5 focus-within:border-cyan-500/30 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all">
                          <Search className="w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Buscar en la Windows Store..."
                            value={uwpSearchQuery}
                            onChange={(e) => setUwpSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 text-xs w-full focus:ring-0 placeholder:text-slate-600"
                          />
                          <button
                            onClick={handleScanUwpApps}
                            className="text-[10px] font-cyber font-bold text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 px-2 py-1 rounded border border-white/5 hover:border-cyan-500/20 transition-all shrink-0"
                          >
                            REESCANEAR 🔄
                          </button>
                        </div>

                        {/* Grid de Aplicaciones */}
                        <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                          {uwpAppsList
                            .filter(app => app.name.toLowerCase().includes(uwpSearchQuery.toLowerCase()))
                            .map((app, index) => {
                              const alreadyAdded = apps.some(existing => existing.path === app.aumid);
                              
                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-black/20 hover:bg-white/5 border border-white/5 rounded-xl hover:border-cyan-500/20 transition-all group"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center p-1.5 shrink-0 group-hover:border-cyan-400/30 transition-colors relative">
                                      {app.icon ? (
                                        <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 rounded text-cyan-400 font-bold text-[10px]">UWP</div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-400 transition-colors font-sans">{app.name}</h4>
                                      <p className="text-[9px] text-slate-500 truncate font-mono select-all" title={app.aumid}>{app.aumid}</p>
                                    </div>
                                  </div>

                                  <div className="shrink-0 ml-2">
                                    {alreadyAdded ? (
                                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 tracking-wider font-sans">
                                        AGREGADO
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setImportingUwpApp(app);
                                          setUwpImportCategory(categories.find(c => c.id !== 'all')?.name || 'Utilidades');
                                        }}
                                        className="text-[10px] font-cyber font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-400/30 transition-all hover:shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                                      >
                                        IMPORTAR 🛍
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Selector de Categoría para Importación */}
                    <AnimatePresence>
                      {importingUwpApp && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-2xl flex items-center justify-center p-4 z-40 border border-cyan-500/20"
                        >
                          <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                          >
                            <div className="text-center space-y-1.5">
                              <h4 className="text-sm font-cyber font-bold text-cyan-400 tracking-wider uppercase">IMPORTAR APLICACIÓN</h4>
                              <p className="text-xs text-slate-200 font-bold leading-tight font-sans">{importingUwpApp.name}</p>
                              <p className="text-[9px] text-slate-500 font-mono truncate">{importingUwpApp.aumid}</p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-cyber font-bold text-slate-400 tracking-widest uppercase">CATEGORÍA DE DESTINO</label>
                              <select
                                value={uwpImportCategory}
                                onChange={(e) => setUwpImportCategory(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40"
                              >
                                {categories.filter(c => c.id !== 'all').map(cat => (
                                  <option key={cat.id} value={cat.name} className="bg-[#0f172a] text-slate-200">
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                              <button
                                onClick={() => setImportingUwpApp(null)}
                                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => {
                                  const newApp = {
                                    id: Date.now(),
                                    name: importingUwpApp.name,
                                    category: uwpImportCategory,
                                    path: importingUwpApp.aumid,
                                    iconPath: importingUwpApp.icon || '',
                                    color: 'text-cyan-400',
                                    isFav: false,
                                    usage: 0
                                  };
                                  // @ts-ignore
                                  setApps(prev => [...prev, newApp]);
                                  setImportingUwpApp(null);
                                }}
                                className="flex-1 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl text-xs font-cyber font-bold transition-all border border-cyan-400/40 shadow-[0_0_10px_rgba(34,211,238,0.15)]"
                              >
                                CONFIRMAR
                              </button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {settingsTab === 'indexer' && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                          <Search className={`w-5 h-5 text-cyan-400 ${indexerStats.status === 'INDEXING' ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-cyber font-bold text-slate-200 tracking-wider">{t('idx_title')}</h3>
                          <p className="text-[10px] text-slate-500">{t('idx_desc')}</p>
                        </div>
                      </div>
                      
                      {/* Master Toggle */}
                      <button
                        onClick={() => handleToggleIndexer(!indexerSettings.enabled)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-cyber font-bold transition-all border ${
                          indexerSettings.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {indexerSettings.enabled ? t('idx_status_online') : t('idx_status_offline')}
                      </button>
                    </div>

                    {/* Stats Card */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-start gap-1">
                        <span className="text-[9px] font-cyber font-bold text-slate-500 tracking-widest uppercase">{t('idx_status_label')}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2 h-2 rounded-full ${
                            indexerStats.status === 'ONLINE'
                              ? 'bg-emerald-400 animate-pulse'
                              : indexerStats.status === 'INDEXING'
                              ? 'bg-amber-400 animate-ping'
                              : 'bg-red-400'
                          }`} />
                          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                            {indexerStats.status === 'INDEXING' ? (language === 'es' ? 'INDEXANDO...' : 'INDEXING...') : indexerStats.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-start gap-1">
                        <span className="text-[9px] font-cyber font-bold text-slate-500 tracking-widest uppercase">{t('idx_status_registered')}</span>
                        <span className="text-lg font-cyber font-bold text-cyan-400 mt-0.5">
                          {indexerStats.totalFiles.toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                        </span>
                      </div>
                    </div>

                    {/* Slider for Depth */}
                    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest uppercase">{t('idx_scan_depth')}</label>
                        <span className="text-xs font-cyber font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                          {language === 'es' ? 'NIVEL' : 'LEVEL'} {indexerSettings.maxDepth}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={indexerSettings.maxDepth}
                        onChange={(e) => handleDepthChange(parseInt(e.target.value, 10))}
                        disabled={!indexerSettings.enabled}
                        className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>{t('stat_level1')}</span>
                        <span>{t('stat_level2')}</span>
                        <span>{t('stat_level3')}</span>
                        <span>{t('stat_level4')}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic mt-1 font-sans leading-normal">
                        {t('idx_scan_depth_desc')}
                      </p>
                    </div>

                    {/* Discovered System Drives */}
                    <div className="space-y-3.5 text-left">
                      <label className="text-[10px] font-cyber font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                        {t('idx_drives_detected')}
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {systemDrives.map((drive) => {
                          const isIndexed = indexerSettings.paths.includes(drive);
                          return (
                            <button
                              key={drive}
                              onClick={async () => {
                                if (!indexerSettings.enabled) return;
                                try {
                                  let updatedPaths;
                                  if (isIndexed) {
                                    updatedPaths = indexerSettings.paths.filter(p => p !== drive);
                                    setNotification({ message: t('notif_drive_unlinked', { drive }), type: 'info' });
                                  } else {
                                    updatedPaths = [...indexerSettings.paths, drive];
                                    setNotification({ message: t('notif_drive_linked', { drive }), type: 'success' });
                                  }
                                  const updated = { ...indexerSettings, paths: updatedPaths };
                                  setIndexerSettings(updated);
                                  if (isElectron) {
                                    await window.electronAPI!.saveIndexerSettings(updated);
                                  }
                                } catch (e) {
                                  console.error('Error toggling drive:', e);
                                }
                              }}
                              disabled={!indexerSettings.enabled}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-cyber font-bold select-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                isIndexed
                                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                                  : 'bg-white/[0.01] text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-200'
                              }`}
                            >
                              <HardDrive className={`w-3.5 h-3.5 ${isIndexed ? 'animate-pulse text-cyan-400' : 'text-slate-500'}`} />
                              <span>{language === 'es' ? 'DISCO' : 'DRIVE'} ({drive})</span>
                            </button>
                          );
                        })}
                        {systemDrives.length === 0 && (
                          <span className="text-[10px] text-slate-600 italic">{t('idx_drives_none')}</span>
                        )}
                      </div>
                    </div>

                    {/* Authorized Folders Chip List */}
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest uppercase">
                          {t('idx_folders_authorized')}
                        </label>
                        <button
                          onClick={handleAddFolder}
                          disabled={!indexerSettings.enabled}
                          className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-30 disabled:hover:bg-cyan-500/10 text-cyan-400 rounded-lg text-[10px] font-cyber font-bold transition-all border border-cyan-500/20 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" /> {t('idx_add_folder')}
                        </button>
                      </div>

                      {indexerSettings.paths.length === 0 ? (
                        <div className="p-8 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 space-y-2 bg-black/10">
                          <FolderOpen className="w-7 h-7 text-slate-600" />
                          <span className="text-xs font-cyber">{language === 'es' ? 'SIN CARPETAS CONFIGURADAS' : 'NO CONFIGURED DIRECTORIES'}</span>
                          <span className="text-[9px] text-slate-600">{language === 'es' ? 'El buscador no rastreará directorios personalizados hasta agregar uno.' : 'The search engine will not scan custom directories until one is added.'}</span>
                        </div>
                      ) : (
                        <div className="border border-white/5 bg-black/20 rounded-xl divide-y divide-white/5 max-h-[180px] overflow-y-auto custom-scrollbar">
                          {indexerSettings.paths.map((folderPath, i) => (
                            <div key={i} className="flex items-center justify-between p-3 group hover:bg-white/[0.01] transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <Folder className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span className="text-xs text-slate-300 truncate font-mono select-all">
                                  {folderPath}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveFolder(folderPath)}
                                disabled={!indexerSettings.enabled}
                                className="opacity-0 group-hover:opacity-100 disabled:opacity-0 p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                                title={language === 'es' ? "Eliminar de la indexación" : "Remove from indexing"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* (CyberTray Section removed) */}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- EDIT CATEGORY MODAL --- */}
      <AnimatePresence>
        {editingCategory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); setEditingCategory(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0d131f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/20">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <PenBox className="w-5 h-5 text-blue-400" />
                  Editar Categoría
                </h2>
                <button 
                  onClick={() => setEditingCategory(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest">NOMBRE</label>
                  <input 
                    type="text" 
                    value={editCategoryForm.name}
                    onChange={(e) => setEditCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-cyber font-bold text-slate-400 tracking-widest">COLOR</label>
                  <div className="flex items-center gap-3">
                    <label className="relative w-10 h-10 rounded-full overflow-hidden cursor-pointer shadow-sm ring-1 ring-white/10">
                      <input 
                        type="color" 
                        value={editCategoryForm.color}
                        onChange={(e) => setEditCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                        className="absolute inset-[-10px] w-14 h-14 cursor-pointer"
                      />
                    </label>
                    <span className="text-xs font-mono text-slate-500">{editCategoryForm.color}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleSaveCategory}
                    className="flex-1 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl font-medium text-sm border border-blue-500/30 transition-colors"
                  >
                    Guardar
                  </button>
                  <button 
                    onClick={() => setEditingCategory(null)}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium text-sm border border-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleDeleteCategory}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 transition-colors"
                    title="Eliminar categoría"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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

            {(contextMenu.app as any).path && (
              <button
                onClick={() => {
                  window.electronAPI!.openFileLocation((contextMenu.app as any).path);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200"
              >
                Abrir ubicación <FolderOpen className="w-4 h-4 ml-2 text-slate-400" />
              </button>
            )}
            
            <button
               onClick={() => {
                 setEditingApp(contextMenu.app!);
                 setEditForm({
                   name: contextMenu.app!.name,
                   // @ts-ignore (Assuming path/iconPath might exist dynamically, or just empty)
                   path: (contextMenu.app as any).path || '',
                   // @ts-ignore
                   iconPath: (contextMenu.app as any).iconPath || '',
                   category: contextMenu.app!.category,
                   isAdmin: !!(contextMenu.app as any).isAdmin,
                   shortcut: (contextMenu.app as any).shortcut || ''
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

      {/* --- SYSTEM SEARCH RESULTS CONTEXT MENU --- */}
      <AnimatePresence>
        {systemContextMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[100] bg-[#0d131f]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-xl py-1.5 min-w-[220px] text-sm select-none"
            style={{ 
              left: Math.min(systemContextMenu.x, window.innerWidth - 240), 
              top: Math.min(systemContextMenu.y, window.innerHeight - 250) 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Abrir */}
            <button
              onClick={() => {
                if (isElectron) {
                  window.electronAPI!.launchApp(systemContextMenu.item.path);
                }
                setSystemContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200 cursor-pointer"
            >
              {t('ctx_open')} <Play className="w-4 h-4 ml-2 text-emerald-400" />
            </button>

            {/* Copiar */}
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(systemContextMenu.item.path);
                  setNotification({
                    message: language === 'es' ? `Copiado: ${systemContextMenu.item.name}` : `Copied: ${systemContextMenu.item.name}`,
                    type: 'success'
                  });
                } catch (err) {
                  console.error('Clipboard copy failed:', err);
                }
                setSystemContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200 cursor-pointer"
            >
              {t('ctx_copy')} <Upload className="w-4 h-4 ml-2 text-slate-400" />
            </button>

            {/* Cortar */}
            <button
              onClick={() => {
                setNotification({
                  message: language === 'es' ? `Cortado: ${systemContextMenu.item.name} (Ruta en portapapeles)` : `Cut: ${systemContextMenu.item.name} (Path copied to clipboard)`,
                  type: 'info'
                });
                navigator.clipboard.writeText(systemContextMenu.item.path).catch(console.error);
                setSystemContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200 cursor-pointer"
            >
              {t('ctx_cut')} <Minus className="w-4 h-4 ml-2 text-slate-400" />
            </button>

            {/* Copiar Ruta completa al Portapapeles */}
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(systemContextMenu.item.path);
                  setNotification({
                    message: language === 'es' ? "Ruta absoluta copiada al portapapeles" : "Absolute path copied to clipboard",
                    type: 'success'
                  });
                } catch (err) {
                  console.error('Clipboard copy failed:', err);
                }
                setSystemContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200 cursor-pointer"
            >
              {language === 'es' ? "Copiar Ruta absoluta" : "Copy Absolute Path"} <ExternalLink className="w-4 h-4 ml-2 text-cyan-400" />
            </button>

            <div className="h-px bg-white/10 my-1 mx-2" />

            {/* Anclar a Favoritos de CyberLauncher */}
            <button
              onClick={() => {
                const appId = Date.now();
                const newApp = {
                  id: appId,
                  name: systemContextMenu.item.name.replace(/\.[^/.]+$/, ""),
                  path: systemContextMenu.item.path,
                  icon: systemContextMenu.item.icon || '',
                  category: 'all',
                  shortcut: '',
                  isAdmin: false,
                  isFavorite: true,
                };
                // @ts-ignore
                setApps(prev => {
                  if (prev.some(a => a.path === newApp.path)) {
                    const existing = prev.find(a => a.path === newApp.path);
                    if (existing && !favoriteIds.includes(existing.id)) {
                      setFavoriteIds(f => [...f, existing.id]);
                    }
                    return prev;
                  }
                  setFavoriteIds(f => [...f, appId]);
                  return [...prev, newApp];
                });
                setNotification({
                  message: language === 'es' ? "Anclado a Favoritos" : "Pinned to Favorites",
                  type: 'success'
                });
                setSystemContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200 cursor-pointer"
            >
              {language === 'es' ? "Anclar a Favoritos" : "Pin to Favorites"} <Star className="w-4 h-4 ml-2 fill-yellow-500 text-yellow-400" />
            </button>

            {/* Anclar a Barra de Tareas de CyberLauncher */}
            <button
              onClick={() => {
                const appId = Date.now();
                const newApp = {
                  id: appId,
                  name: systemContextMenu.item.name.replace(/\.[^/.]+$/, ""),
                  path: systemContextMenu.item.path,
                  icon: systemContextMenu.item.icon || '',
                  category: 'all',
                  shortcut: '',
                  isAdmin: false,
                  isFavorite: false,
                };
                // @ts-ignore
                setApps(prev => {
                  if (prev.some(a => a.path === newApp.path)) {
                    const existing = prev.find(a => a.path === newApp.path);
                    if (existing && !taskbarAppIds.includes(existing.id)) {
                      setTaskbarAppIds(t => [...t, existing.id]);
                    }
                    return prev;
                  }
                  setTaskbarAppIds(t => [...t, appId]);
                  return [...prev, newApp];
                });
                setNotification({
                  message: language === 'es' ? "Anclado a Barra de Tareas" : "Pinned to Taskbar",
                  type: 'success'
                });
                setSystemContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 hover:bg-white/10 truncate transition-colors flex items-center justify-between text-slate-200 cursor-pointer"
            >
              {language === 'es' ? "Anclar a Barra" : "Pin to Taskbar"} <Plus className="w-4 h-4 ml-2 text-cyan-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TOAST NOTIFICATIONS --- */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-2xl shadow-2xl ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : notification.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
            }`}
          >
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              notification.type === 'success'
                ? 'bg-emerald-400'
                : notification.type === 'error'
                ? 'bg-red-400'
                : 'bg-cyan-400'
            }`} />
            <span className="text-xs font-cyber font-bold tracking-wide uppercase">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-80 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SystemHUD 
        isOpen={isSystemHUDOpen}
        onClose={() => setIsSystemHUDOpen(false)}
        activationShortcut={activationShortcut}
        dailyLaunchCount={dailyLaunchCount}
      />

      <StorageHUD 
        isOpen={isStorageHUDOpen}
        onClose={() => setIsStorageHUDOpen(false)}
      />

      <ClockHUD 
        isOpen={isClockHUDOpen}
        onClose={() => setIsClockHUDOpen(false)}
        apps={apps}
        scheduledTasks={scheduledTasks}
        setScheduledTasks={setScheduledTasks}
      />

      <style>{`
        /* ── Cyber Scrollbar ── */
        @keyframes cyberScrollGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(34, 211, 238, 0.6), 0 0 18px rgba(129, 140, 248, 0.25); }
          50%      { box-shadow: 0 0 10px rgba(34, 211, 238, 0.9), 0 0 28px rgba(129, 140, 248, 0.4), 0 0 4px rgba(232, 121, 249, 0.3); }
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
          transition: scrollbar-color 0.3s ease;
        }
        .mouse-active .custom-scrollbar,
        .custom-scrollbar.scrolling {
          scrollbar-color: rgba(34, 211, 238, 0.45) rgba(15, 23, 42, 0.15);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 8px;
          margin: 6px 0;
          transition: background 0.3s ease;
        }
        .mouse-active .custom-scrollbar::-webkit-scrollbar-track,
        .custom-scrollbar.scrolling::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.25);
          box-shadow: inset 0 0 4px rgba(34, 211, 238, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(34, 211, 238, 0) 0%, rgba(34, 211, 238, 0) 100%);
          border-radius: 8px;
          border: 1px solid transparent;
          transition: all 0.3s ease;
        }
        .mouse-active .custom-scrollbar::-webkit-scrollbar-thumb,
        .custom-scrollbar.scrolling::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #22d3ee 0%, #818cf8 50%, #e879f9 100%);
          border: 1px solid rgba(34, 211, 238, 0.3);
          animation: cyberScrollGlow 2s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #67e8f9 0%, #a5b4fc 50%, #f0abfc 100%);
          border: 1px solid rgba(34, 211, 238, 0.5);
          box-shadow: 0 0 14px rgba(34, 211, 238, 1), 0 0 30px rgba(129, 140, 248, 0.5), 0 0 8px rgba(232, 121, 249, 0.4);
          animation: none;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg, #a5f3fc 0%, #c7d2fe 50%, #f5d0fe 100%);
          box-shadow: 0 0 18px rgba(34, 211, 238, 1), 0 0 40px rgba(129, 140, 248, 0.6);
        }

        /* Sidebar narrower scrollbar */
        .custom-scrollbar[class*="px-4"][class*="py-2"][class*="space-y-0"]::-webkit-scrollbar {
          width: 3px;
        }
      `}</style>
    </div>
  );
}

