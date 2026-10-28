import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTO_BACKUP_KEEP_OPTIONS,
  DEFAULT_AUTO_BACKUP_KEEP,
  DEFAULT_AUTO_BACKUP_HOURS,
  parseBackupHours,
  parseBackupKeep,
  normalizeBackupFolder,
  backupFileName,
  isBackupFile,
  selectBackupsToPrune,
  isBackupDue,
} from '../shared/backup';

test('backup retention options: 1, 3, 5, 7 with default 3', () => {
  assert.deepEqual(AUTO_BACKUP_KEEP_OPTIONS, [1, 3, 5, 7]);
  assert.equal(DEFAULT_AUTO_BACKUP_KEEP, 3);

  // Valid values
  assert.equal(parseBackupKeep(1), 1);
  assert.equal(parseBackupKeep(3), 3);
  assert.equal(parseBackupKeep(5), 5);
  assert.equal(parseBackupKeep(7), 7);
  assert.equal(parseBackupKeep('1'), 1);
  assert.equal(parseBackupKeep('7'), 7);

  // Invalid or retired values should cleanly fall back to 3
  assert.equal(parseBackupKeep(14), 3);
  assert.equal(parseBackupKeep(30), 3);
  assert.equal(parseBackupKeep(0), 3);
  assert.equal(parseBackupKeep(-1), 3);
  assert.equal(parseBackupKeep(undefined), 3);
  assert.equal(parseBackupKeep(null), 3);
  assert.equal(parseBackupKeep('invalid'), 3);
});

test('custom destination folder normalization', () => {
  assert.equal(normalizeBackupFolder('D:\\Backups\\CyberLauncher'), 'D:\\Backups\\CyberLauncher');
  assert.equal(normalizeBackupFolder('  E:\\Respaldos  '), 'E:\\Respaldos');
  assert.equal(normalizeBackupFolder(''), null);
  assert.equal(normalizeBackupFolder('   '), null);
  assert.equal(normalizeBackupFolder(null), null);
  assert.equal(normalizeBackupFolder(undefined), null);
  assert.equal(normalizeBackupFolder(123), null);
});

test('pruning old backups retains the configured count', () => {
  const files = [
    'cyberlauncher-backup-2026-10-25T10-00-00.json',
    'cyberlauncher-backup-2026-10-26T10-00-00.json',
    'cyberlauncher-backup-2026-10-27T10-00-00.json',
    'cyberlauncher-backup-2026-10-28T10-00-00.json',
    'unrelated-file.txt',
  ];

  // Keep 1 -> prune 3 oldest
  const prunedKeep1 = selectBackupsToPrune(files, 1);
  assert.deepEqual(prunedKeep1, [
    'cyberlauncher-backup-2026-10-25T10-00-00.json',
    'cyberlauncher-backup-2026-10-26T10-00-00.json',
    'cyberlauncher-backup-2026-10-27T10-00-00.json',
  ]);

  // Keep 3 -> prune 1 oldest
  const prunedKeep3 = selectBackupsToPrune(files, 3);
  assert.deepEqual(prunedKeep3, [
    'cyberlauncher-backup-2026-10-25T10-00-00.json',
  ]);

  // Keep 5 or 7 -> nothing to prune
  assert.deepEqual(selectBackupsToPrune(files, 5), []);
  assert.deepEqual(selectBackupsToPrune(files, 7), []);
});

test('backup filename format and validation', () => {
  const date = new Date(2026, 9, 28, 12, 30, 45); // Oct 28 2026 12:30:45
  const name = backupFileName(date);
  assert.equal(name, 'cyberlauncher-backup-2026-10-28T12-30-45.json');
  assert.equal(isBackupFile(name), true);
  assert.equal(isBackupFile('other.json'), false);
  assert.equal(isBackupFile('cyberlauncher-backup-something.txt'), false);
});

test('isBackupDue scheduling check', () => {
  const now = Date.now();
  assert.equal(isBackupDue(null, now, 24), true);
  assert.equal(isBackupDue(undefined, now, 24), true);

  const twoHoursAgo = new Date(now - 2 * 3_600_000).toISOString();
  assert.equal(isBackupDue(twoHoursAgo, now, 1), true); // 1 hour threshold exceeded
  assert.equal(isBackupDue(twoHoursAgo, now, 6), false); // 6 hours threshold not reached
});
