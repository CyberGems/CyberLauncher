import fs from 'node:fs';
import path from 'node:path';

export function normalizeAppTarget(target: string): string {
  return target.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();
}

export function isUriAppTarget(target: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target) && !/^[a-zA-Z]:/.test(target);
}

/** Match the file lookup used to launch Windows commands and saved paths. */
export function resolveAppFileTarget(
  target: string,
  systemRoot = process.env.SystemRoot || 'C:\\Windows',
): string | undefined {
  const normalized = path.normalize(target);
  const candidates = [
    normalized,
    path.join(systemRoot, 'System32', normalized),
    path.join(systemRoot, normalized),
    path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', normalized),
  ];
  return candidates.find(candidate => fs.existsSync(candidate));
}
