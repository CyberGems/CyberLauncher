import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Terminal as TerminalIcon, FolderOpen, Copy, Check, ClipboardPaste, ExternalLink, Trash2, X, RotateCcw, Square } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import Tooltip from './Tooltip';
import type { TranslationKey } from './locales';

type Shell = 'powershell' | 'cmd';
type TerminalStatus = 'starting' | 'ready' | 'exited' | 'error';

interface CyberTerminalProps {
  shell: Shell;
  cwd: string;
  onShellChange: (shell: Shell) => void;
  onCwdChange: (cwd: string) => void;
  onClose: () => void;
  t: (key: TranslationKey) => string;
}

export default function CyberTerminal({ shell, cwd, onShellChange, onCwdChange, onClose, t }: CyberTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const cwdRef = useRef(cwd);
  const onCwdChangeRef = useRef(onCwdChange);
  const tRef = useRef(t);
  const [status, setStatus] = useState<TerminalStatus>('starting');
  const [error, setError] = useState('');
  const [exitCode, setExitCode] = useState(0);
  const [restartKey, setRestartKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => { cwdRef.current = cwd; }, [cwd]);
  useEffect(() => { onCwdChangeRef.current = onCwdChange; }, [onCwdChange]);
  useEffect(() => { tRef.current = t; }, [t]);

  useEffect(() => {
    const host = containerRef.current;
    const api = window.electronAPI;
    if (!host || !api?.terminalStart) {
      setStatus('error');
      setError(t('terminal_desktop_only'));
      return;
    }

    let disposed = false;
    let started = false;
    let exited = false;
    const id = crypto.randomUUID();
    const terminal = new Terminal({
      allowTransparency: true,
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: 'JetBrains Mono, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.35,
      scrollback: 5000,
      theme: {
        background: '#080b12',
        foreground: '#d8e5ec',
        cursor: '#3be0c0',
        cursorAccent: '#080b12',
        selectionBackground: '#1b605a99',
        black: '#111822', red: '#f87171', green: '#4ade9b', yellow: '#facc6b',
        blue: '#77b6ff', magenta: '#c4a0ff', cyan: '#5eead4', white: '#d8e5ec',
        brightBlack: '#637486', brightRed: '#fca5a5', brightGreen: '#86efac',
        brightYellow: '#fde68a', brightBlue: '#93c5fd', brightMagenta: '#d8b4fe',
        brightCyan: '#a5f3fc', brightWhite: '#f8fafc',
      },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(host);
    terminal.textarea?.setAttribute('aria-label', tRef.current('terminal_input_label'));
    terminalRef.current = terminal;
    setStatus('starting');
    setError('');

    const fitTerminal = () => {
      if (disposed || host.clientWidth < 10 || host.clientHeight < 10) return;
      try {
        fit.fit();
        if (started) api.terminalResize?.(id, terminal.cols, terminal.rows);
      } catch (fitError) {
        console.error('[TERMINAL] Resize failed:', fitError);
      }
    };
    const observer = new ResizeObserver(fitTerminal);
    observer.observe(host);
    const frame = requestAnimationFrame(fitTerminal);

    const input = terminal.onData(data => api.terminalWrite?.(id, data));
    const title = terminal.onTitleChange(value => {
      if (!value.startsWith('CYBERCWD:')) return;
      const nextCwd = value.slice('CYBERCWD:'.length);
      if (!nextCwd || nextCwd === cwdRef.current) return;
      cwdRef.current = nextCwd;
      onCwdChangeRef.current(nextCwd);
      void api.setConsoleCwd?.(nextCwd).catch(console.error);
    });
    terminal.attachCustomKeyEventHandler(event => {
      if (event.type !== 'keydown' || !event.ctrlKey || !event.shiftKey) return true;
      if (event.code === 'KeyC') {
        const selected = terminal.getSelection();
        if (selected) void navigator.clipboard.writeText(selected).catch(cause => console.error('[TERMINAL] Copy failed:', cause));
        return false;
      }
      if (event.code === 'KeyV') {
        void navigator.clipboard.readText().then(text => {
          if (text) terminal.paste(text);
        }).catch(cause => console.error('[TERMINAL] Paste failed:', cause));
        return false;
      }
      return true;
    });
    const offData = api.onTerminalData?.(event => {
      if (event.id === id) terminal.write(event.data);
    });
    const offExit = api.onTerminalExit?.(event => {
      if (event.id !== id || disposed) return;
      started = false;
      exited = true;
      setExitCode(event.exitCode);
      setStatus('exited');
      terminal.write(`\r\n[${tRef.current('terminal_process_exited')}: ${event.exitCode}]\r\n`);
    });

    fitTerminal();
    void api.terminalStart({ id, shell, cwd: cwdRef.current, cols: terminal.cols, rows: terminal.rows })
      .then(result => {
        if (disposed) {
          if (result.success) void api.terminalClose?.(id);
          return;
        }
        if (!result.success) {
          setStatus('error');
          setError(result.error || tRef.current('terminal_start_failed'));
          return;
        }
        if (exited) return;
        started = true;
        setStatus('ready');
        fitTerminal();
        terminal.focus();
      })
      .catch(cause => {
        if (!disposed) {
          setStatus('error');
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      offData?.();
      offExit?.();
      input.dispose();
      title.dispose();
      terminalRef.current = null;
      terminal.dispose();
      void api.terminalClose?.(id);
    };
    // A new shell or explicit restart creates a fresh PTY. CWD changes do not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shell, restartKey]);

  const focus = () => terminalRef.current?.focus();
  const copy = async () => {
    const terminal = terminalRef.current;
    if (!terminal) return;
    const selected = terminal.getSelection();
    if (!selected) terminal.selectAll();
    const text = terminal.getSelection();
    terminal.clearSelection();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (cause) {
      console.error('[TERMINAL] Copy failed:', cause);
    }
    focus();
  };
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const terminal = terminalRef.current;
        terminal?.paste(text);
        terminal?.focus();
      }
    } catch (cause) {
      console.error('[TERMINAL] Paste failed:', cause);
    }
  };

  const interrupt = () => { if (status === 'ready') { terminalRef.current?.input('\x03'); focus(); } };
  const clear = () => { terminalRef.current?.clear(); focus(); };
  const openFolder = () => { void window.electronAPI?.openPath?.(cwd); };
  const openExternal = async () => {
    setActionError('');
    try {
      const opened = await window.electronAPI?.openExternalTerminal?.(cwd);
      if (!opened) setActionError(t('terminal_external_failed'));
    } catch (cause) {
      console.error('[TERMINAL] External terminal failed:', cause);
      setActionError(t('terminal_external_failed'));
    }
  };
  const restart = () => { if (status === 'exited' || status === 'error') setRestartKey(value => value + 1); };
  const shortcut = (label: string, key: string) => `${label} · Alt+${key}`;
  const handleHotkey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.code === 'KeyJ') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const actions: Record<string, () => void> = {
      Digit1: () => onShellChange('powershell'),
      Digit2: () => onShellChange('cmd'),
      KeyO: openFolder,
      KeyI: interrupt,
      KeyC: () => { void copy(); },
      KeyV: () => { if (status === 'ready') void paste(); },
      KeyE: () => { void openExternal(); },
      KeyL: clear,
      KeyR: restart,
      KeyQ: onClose,
    };
    const action = actions[event.code];
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  return (
    <div data-cyber-terminal onKeyDownCapture={handleHotkey} className="flex-1 flex flex-col font-mono text-left bg-[#080b12]/95 border border-cyan-500/20 rounded-2xl p-4 shadow-2xl overflow-hidden relative min-h-[400px]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-3 mb-3 shrink-0 select-none">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-cyber font-bold text-emerald-400 tracking-wider">{t('terminal_title')}</span>
          </div>
          <div className="flex items-center bg-black/50 border border-emerald-500/20 rounded-lg p-0.5 text-[10px] font-cyber">
            {(['powershell', 'cmd'] as const).map(option => (
              <Tooltip key={option} label={shortcut(option === 'cmd' ? 'CMD' : 'PowerShell', option === 'cmd' ? '2' : '1')}>
                <button type="button" onClick={() => onShellChange(option)} aria-pressed={shell === option} aria-keyshortcuts={option === 'cmd' ? 'Alt+2' : 'Alt+1'}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${shell === option ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'}`}>
                  {option === 'cmd' ? 'CMD' : 'PowerShell'}
                </button>
              </Tooltip>
            ))}
          </div>
          <Tooltip label={`${shortcut(t('terminal_open_folder'), 'O')}: ${cwd}`} placement="bottom">
            <button type="button" onClick={openFolder} aria-label={t('terminal_open_folder')} aria-keyshortcuts="Alt+O"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 rounded-lg text-[11px] text-slate-300 hover:text-emerald-300 transition-colors max-w-[280px] cursor-pointer">
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate font-mono">{cwd}</span>
            </button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1.5">
          <span role="status" className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 border border-white/5 rounded-md text-[10px] text-slate-400 font-cyber">
            <span className={`w-2 h-2 rounded-full ${status === 'ready' ? 'bg-emerald-500' : status === 'starting' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
            {status === 'ready' ? t('terminal_status_online') : status === 'starting' ? t('terminal_status_connecting') : t('terminal_status_closed')}
          </span>
          {status === 'ready' ? (
            <Tooltip label={shortcut(t('terminal_interrupt'), 'I')}><button type="button" onClick={interrupt} aria-label={t('terminal_interrupt')} aria-keyshortcuts="Alt+I" className="p-1.5 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-white/10"><Square className="w-3.5 h-3.5" /></button></Tooltip>
          ) : (status === 'exited' || status === 'error') ? (
            <Tooltip label={shortcut(t('terminal_restart'), 'R')}><button type="button" onClick={restart} aria-label={t('terminal_restart')} aria-keyshortcuts="Alt+R" className="p-1.5 text-slate-400 hover:text-emerald-300 rounded-lg hover:bg-white/10"><RotateCcw className="w-3.5 h-3.5" /></button></Tooltip>
          ) : null}
          <Tooltip label={shortcut(copied ? t('terminal_copied') : t('terminal_copy_output'), 'C')}><button type="button" onClick={() => void copy()} aria-label={t('terminal_copy_output')} aria-keyshortcuts="Alt+C" className="p-1.5 text-slate-400 hover:text-emerald-300 rounded-lg hover:bg-white/10">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</button></Tooltip>
          <Tooltip label={shortcut(t('terminal_paste'), 'V')}><button type="button" onClick={() => void paste()} aria-label={t('terminal_paste')} aria-keyshortcuts="Alt+V" disabled={status !== 'ready'} className="p-1.5 text-slate-400 hover:text-emerald-300 rounded-lg hover:bg-white/10 disabled:opacity-30"><ClipboardPaste className="w-3.5 h-3.5" /></button></Tooltip>
          <Tooltip label={shortcut(t('terminal_open_external'), 'E')}><button type="button" onClick={() => void openExternal()} aria-label={t('terminal_open_external')} aria-keyshortcuts="Alt+E" className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-white/10"><ExternalLink className="w-3.5 h-3.5" /></button></Tooltip>
          <Tooltip label={shortcut(t('terminal_clear'), 'L')}><button type="button" onClick={clear} aria-label={t('terminal_clear')} aria-keyshortcuts="Alt+L" className="p-1.5 text-slate-400 hover:text-red-300 rounded-lg hover:bg-white/10"><Trash2 className="w-3.5 h-3.5" /></button></Tooltip>
          <Tooltip label={shortcut(t('terminal_close'), 'Q')}><button type="button" onClick={onClose} aria-label={t('terminal_close')} aria-keyshortcuts="Alt+Q" className="p-1.5 text-slate-400 hover:text-red-300 rounded-lg hover:bg-white/10"><X className="w-3.5 h-3.5" /></button></Tooltip>
        </div>
      </div>
      {error && <div role="alert" className="text-xs text-red-300 mb-2">{t('terminal_start_failed')}: {error}</div>}
      {actionError && <div role="alert" className="text-xs text-red-300 mb-2">{actionError}</div>}
      {status === 'exited' && <div role="status" className="text-xs text-amber-300 mb-2">{t('terminal_process_exited')}: {exitCode}</div>}
      <div ref={containerRef} onClick={focus} aria-label={t('terminal_input_label')} className="flex-1 min-h-0 min-w-0 px-2 py-1 cursor-text" />
      <div className="mt-2 pt-2 border-t border-white/5 text-[10px] leading-relaxed text-slate-500 select-none">{t('terminal_hint')}</div>
    </div>
  );
}
