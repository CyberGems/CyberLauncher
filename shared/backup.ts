// Pure logic for scheduled automatic backups: testable and shared between Electron and React.

export const AUTO_BACKUP_INTERVALS_HOURS: readonly number[] = [6, 12, 24, 168];
export const AUTO_BACKUP_KEEP_OPTIONS: readonly number[] = [1, 3, 5, 7];
export const DEFAULT_AUTO_BACKUP_HOURS = 24;
export const DEFAULT_AUTO_BACKUP_KEEP = 3;
export const BACKUP_FILE_PREFIX = 'cyberlauncher-backup-';

export interface BackupItem {
  file: string;
  size: number;
  mtime: string;
}

export interface AutoBackupConfig {
  enabled: boolean;
  hours: number;
  keep: number;
  last: string | null;
  customFolder?: string | null;
}

/** Normalizes custom backup directory path or returns null if not specified. */
export function normalizeBackupFolder(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

/** Normalizes the interval value in hours. Default is 24 hours (daily). */
export function parseBackupHours(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : typeof value === 'number' ? value : NaN;
  return AUTO_BACKUP_INTERVALS_HOURS.includes(n) ? n : DEFAULT_AUTO_BACKUP_HOURS;
}

/** Normalizes retention count. Default is 3 copies. */
export function parseBackupKeep(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : typeof value === 'number' ? value : NaN;
  return AUTO_BACKUP_KEEP_OPTIONS.includes(n) ? n : DEFAULT_AUTO_BACKUP_KEEP;
}

/** True if backup never ran, timestamp is invalid, or the interval has passed. */
export function isBackupDue(lastIso: string | null | undefined, nowMs: number, hours: number): boolean {
  if (!lastIso) return true;
  const last = Date.parse(lastIso);
  if (!Number.isFinite(last)) return true;
  return nowMs - last >= hours * 3_600_000;
}

/** Formats a safe filename sortable chronologically: cyberlauncher-backup-YYYY-MM-DDTHH-mm-ss.json */
export function backupFileName(at: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${BACKUP_FILE_PREFIX}${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())}T${p(at.getHours())}-${p(at.getMinutes())}-${p(at.getSeconds())}.json`;
}

export function isBackupFile(name: unknown): boolean {
  return typeof name === 'string' && name.startsWith(BACKUP_FILE_PREFIX) && name.endsWith('.json');
}

/** Returns the oldest backup filenames that exceed retention threshold. */
export function selectBackupsToPrune(files: string[], keep: number): string[] {
  const sorted = [...files].filter(isBackupFile).sort();
  return sorted.slice(0, Math.max(0, sorted.length - Math.max(0, keep)));
}

export interface ParsedScheduledTask {
  id: string;
  name: string;
  totalSeconds: number;
  remainingSeconds: number;
  targetPath?: string;
  isAdmin?: boolean;
  command?: string;
  type: 'app' | 'command';
}

const MAX_SCHEDULED_TASK_SECONDS = 24 * 60 * 60;

function parsePositiveSeconds(value: unknown, maxSeconds: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? parseInt(value, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) return NaN;
  return Math.min(Math.floor(n), maxSeconds);
}

/**
 * Normalizes persisted or exported scheduled tasks, dropping malformed entries.
 * Expired tasks (remainingSeconds <= 0) are dropped; missing remaining time
 * restarts the full countdown. Countdowns freeze while the app is closed and
 * resume with the stored remaining time on the next launch.
 */
export function parseScheduledTasks(value: unknown): ParsedScheduledTask[] {
  if (!Array.isArray(value)) return [];
  const tasks: ParsedScheduledTask[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim().slice(0, 80) : null;
    const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim().slice(0, 200) : null;
    const type = item.type === 'command' ? 'command' : item.type === 'app' ? 'app' : null;
    const totalSeconds = parsePositiveSeconds(item.totalSeconds, MAX_SCHEDULED_TASK_SECONDS);
    if (!id || !name || !type || Number.isNaN(totalSeconds)) continue;

    const remainingRaw = parsePositiveSeconds(item.remainingSeconds, totalSeconds);
    if (typeof item.remainingSeconds === 'number' && item.remainingSeconds <= 0) continue;
    if (typeof item.remainingSeconds === 'string' && parseInt(item.remainingSeconds, 10) <= 0) continue;
    const remainingSeconds = Number.isNaN(remainingRaw) ? totalSeconds : remainingRaw;

    const targetPath = typeof item.targetPath === 'string' ? item.targetPath : undefined;
    const command = typeof item.command === 'string' && item.command.trim() ? item.command : undefined;
    if (type === 'app' && typeof targetPath !== 'string') continue;
    if (type === 'command' && !command) continue;

    tasks.push({
      id,
      name,
      totalSeconds,
      remainingSeconds,
      targetPath,
      isAdmin: item.isAdmin === true,
      command,
      type,
    });
  }
  return tasks;
}
