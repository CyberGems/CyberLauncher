import { Notification, BrowserWindow } from 'electron';
import fs from 'node:fs';
import os from 'node:os';

export interface SystemAlertsConfig {
  systemAlertsEnabled: boolean;
  diskAlertsEnabled: boolean;
  ramAlertsEnabled: boolean;
  ramThresholdPercent: number; // 75, 80, 85, 90
  ramLowAbsoluteAlertEnabled: boolean;
  language?: 'es' | 'en';
}

const DEFAULT_CONFIG: SystemAlertsConfig = {
  systemAlertsEnabled: true,
  diskAlertsEnabled: true,
  ramAlertsEnabled: true,
  ramThresholdPercent: 80,
  ramLowAbsoluteAlertEnabled: true,
  language: 'es',
};

let currentConfig: SystemAlertsConfig = { ...DEFAULT_CONFIG };
let checkTimer: NodeJS.Timeout | null = null;
let warmUpTimer: NodeJS.Timeout | null = null;

let getMainWindowFn: () => BrowserWindow | null = () => null;
let getAppIconPathFn: () => string = () => '';
let showMainWindowFn: () => void = () => {};

// State tracking for disk alerts
let lastDiskTier: number | null = null;
let lastDiskAlertTime = 0;

// State tracking for RAM alerts
let lastRamAlertTime = 0;
let ramHighConsecutiveCount = 0;

function getSystemDriveLetter(): string {
  if (process.platform === 'win32') {
    const rawDrive = process.env.SystemDrive || 'C:';
    return rawDrive.toUpperCase().endsWith(':') ? rawDrive.toUpperCase() : `${rawDrive.toUpperCase()}:`;
  }
  return '/';
}

function sendAlertNotification(options: {
  title: string;
  body: string;
  type: 'disk' | 'ram';
  level: 'warning' | 'critical';
}) {
  const win = getMainWindowFn();
  const icon = getAppIconPathFn();

  // Send toast event to renderer window (if alive)
  if (win && !win.isDestroyed()) {
    win.webContents.send('system-alert-toast', {
      type: options.type,
      title: options.title,
      message: options.body,
      level: options.level,
    });
  }

  // Send native desktop notification via Electron
  if (Notification.isSupported()) {
    try {
      const notif = new Notification({
        title: options.title,
        body: options.body,
        icon: icon || undefined,
        silent: false,
      });

      notif.on('click', () => {
        showMainWindowFn();
        const activeWin = getMainWindowFn();
        if (activeWin && !activeWin.isDestroyed()) {
          activeWin.webContents.send('system-alert-action', { type: options.type });
        }
      });

      notif.show();
    } catch (err) {
      console.error('[SYSTEM-ALERTS] Error showing native notification:', err);
    }
  }
}

function checkDiskHealth() {
  if (!currentConfig.systemAlertsEnabled || !currentConfig.diskAlertsEnabled) {
    return;
  }

  try {
    const driveLetter = getSystemDriveLetter();
    const drivePath = process.platform === 'win32' ? `${driveLetter}\\` : driveLetter;

    if (!fs.statfsSync) return;
    const stat = fs.statfsSync(drivePath);
    const freeBytes = stat.bavail * stat.bsize;
    const freeGb = freeBytes / (1024 * 1024 * 1024);

    // Tiers in descending order of urgency: 1 GB, 5 GB, 10 GB, 20 GB
    const tiers = [1, 5, 10, 20];
    let currentTier: number | null = null;
    for (const t of tiers) {
      if (freeGb <= t) {
        currentTier = t;
        break;
      }
    }

    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    if (currentTier !== null) {
      const isWorseTier = lastDiskTier === null || currentTier < lastDiskTier;
      const isDailyReminder = currentTier === lastDiskTier && (now - lastDiskAlertTime >= ONE_DAY_MS);

      if (isWorseTier || isDailyReminder) {
        lastDiskTier = currentTier;
        lastDiskAlertTime = now;

        const isEs = currentConfig.language !== 'en';
        const formattedFree = freeGb.toFixed(1);

        let title = '';
        let body = '';
        const level: 'warning' | 'critical' = currentTier <= 5 ? 'critical' : 'warning';

        if (currentTier === 1) {
          title = isEs ? `CyberLauncher: ¡Espacio en disco crítico! (${driveLetter})` : `CyberLauncher: Critical disk space! (${driveLetter})`;
          body = isEs
            ? `¡Alerta urgente! Quedan solo ${formattedFree} GB libres en la unidad de sistema.`
            : `Urgent alert! Only ${formattedFree} GB free remaining on the system drive.`;
        } else if (currentTier === 5) {
          title = isEs ? `CyberLauncher: ¡Espacio en disco crítico! (${driveLetter})` : `CyberLauncher: Critical disk space! (${driveLetter})`;
          body = isEs
            ? `Quedan solo ${formattedFree} GB libres en la unidad de sistema. Se recomienda liberar espacio.`
            : `Only ${formattedFree} GB free remaining on the system drive. Freeing up space is recommended.`;
        } else if (currentTier === 10) {
          title = isEs ? `CyberLauncher: Poco espacio en disco (${driveLetter})` : `CyberLauncher: Low disk space (${driveLetter})`;
          body = isEs
            ? `Advertencia de almacenamiento: quedan ${formattedFree} GB libres en la unidad de sistema.`
            : `Storage warning: ${formattedFree} GB free remaining on the system drive.`;
        } else {
          // 20 GB
          title = isEs ? `CyberLauncher: Aviso de espacio en disco (${driveLetter})` : `CyberLauncher: Low disk space notice (${driveLetter})`;
          body = isEs
            ? `Quedan ${formattedFree} GB libres en la unidad de sistema. Considera limpiar archivos temporales.`
            : `${formattedFree} GB free remaining on the system drive. Consider cleaning temporary files.`;
        }

        console.log(`[SYSTEM-ALERTS] Disk alert triggered for tier ${currentTier}GB (${formattedFree}GB free)`);
        sendAlertNotification({ title, body, type: 'disk', level });
      }
    } else {
      // Space is > 20 GB: apply hysteresis before resetting tier tracking
      if (freeGb >= 22) {
        lastDiskTier = null;
      } else if (lastDiskTier !== null && freeGb >= lastDiskTier + 2) {
        // Step-up hysteresis: if previously at tier 1, and now at >= 3 GB, relax tier
        if (lastDiskTier === 1 && freeGb >= 3) lastDiskTier = 5;
        else if (lastDiskTier === 5 && freeGb >= 7) lastDiskTier = 10;
        else if (lastDiskTier === 10 && freeGb >= 12) lastDiskTier = 20;
      }
    }
  } catch (err) {
    console.error('[SYSTEM-ALERTS] Error checking disk health:', err);
  }
}

function checkRamHealth() {
  if (!currentConfig.systemAlertsEnabled || !currentConfig.ramAlertsEnabled) {
    ramHighConsecutiveCount = 0;
    return;
  }

  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const percent = Math.round((usedMem / totalMem) * 100);
    const freeGb = Math.round((freeMem / (1024 * 1024 * 1024)) * 10) / 10;
    const usedGb = Math.round((usedMem / (1024 * 1024 * 1024)) * 10) / 10;
    const totalGb = Math.round((totalMem / (1024 * 1024 * 1024)) * 10) / 10;

    const thresholdPercent = currentConfig.ramThresholdPercent || 80;
    const isHighPercent = percent >= thresholdPercent;
    const isLowAbsolute = currentConfig.ramLowAbsoluteAlertEnabled && freeGb < 2.0;

    if (isHighPercent || isLowAbsolute) {
      ramHighConsecutiveCount++;
    } else {
      ramHighConsecutiveCount = 0;
    }

    const now = Date.now();
    const isEmergency = percent >= 92 || freeGb < 1.0;
    const cooldownMs = isEmergency ? 5 * 60 * 1000 : 25 * 60 * 1000;
    const timeSinceLastAlert = now - lastRamAlertTime;

    // Condition must be sustained across at least 2 consecutive checks (~60s apart)
    if (ramHighConsecutiveCount >= 2 && timeSinceLastAlert >= cooldownMs) {
      lastRamAlertTime = now;

      const isEs = currentConfig.language !== 'en';
      const level: 'warning' | 'critical' = (percent >= 90 || freeGb < 1.5) ? 'critical' : 'warning';

      let title = '';
      let body = '';

      if (isLowAbsolute && !isHighPercent) {
        title = isEs ? 'CyberLauncher: Memoria RAM baja' : 'CyberLauncher: Low available RAM';
        body = isEs
          ? `Quedan solo ${freeGb.toFixed(1)} GB de memoria libre (${usedGb.toFixed(1)} GB de ${totalGb.toFixed(1)} GB en uso).`
          : `Only ${freeGb.toFixed(1)} GB free memory remaining (${usedGb.toFixed(1)} GB of ${totalGb.toFixed(1)} GB in use).`;
      } else {
        title = isEs ? `CyberLauncher: Alto consumo de RAM (${percent}%)` : `CyberLauncher: High RAM usage (${percent}%)`;
        body = isEs
          ? `El uso de memoria se mantiene en ${percent}% (${usedGb.toFixed(1)} GB de ${totalGb.toFixed(1)} GB en uso).`
          : `Memory usage remains sustained at ${percent}% (${usedGb.toFixed(1)} GB of ${totalGb.toFixed(1)} GB in use).`;
      }

      console.log(`[SYSTEM-ALERTS] RAM alert triggered: ${percent}% used, ${freeGb}GB free`);
      sendAlertNotification({ title, body, type: 'ram', level });
    }
  } catch (err) {
    console.error('[SYSTEM-ALERTS] Error checking RAM health:', err);
  }
}

function runChecks() {
  checkDiskHealth();
  checkRamHealth();
}

export function initSystemAlerts(
  getMainWindow: () => BrowserWindow | null,
  getAppIconPath: () => string,
  showMainWindow: () => void,
  initialConfig?: Partial<SystemAlertsConfig>
) {
  getMainWindowFn = getMainWindow;
  getAppIconPathFn = getAppIconPath;
  showMainWindowFn = showMainWindow;

  if (initialConfig) {
    updateSystemAlertsConfig(initialConfig);
  }

  // Clean existing timers if any
  stopSystemAlerts();

  // Initial check after 4 seconds warm-up
  warmUpTimer = setTimeout(() => {
    runChecks();
  }, 4000);

  // Periodic check every 60 seconds
  checkTimer = setInterval(() => {
    runChecks();
  }, 60000);

  console.log('[SYSTEM-ALERTS] Initialized with interval 60s');
}

export function updateSystemAlertsConfig(newConfig: Partial<SystemAlertsConfig>) {
  currentConfig = {
    ...currentConfig,
    ...newConfig,
  };
}

export function stopSystemAlerts() {
  if (warmUpTimer) {
    clearTimeout(warmUpTimer);
    warmUpTimer = null;
  }
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}
