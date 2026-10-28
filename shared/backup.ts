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

/** Normalizes retention count. Default is 7 copies. */
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
