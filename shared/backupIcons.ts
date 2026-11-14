// Node/Electron helpers for portable icon embedding/restoration in backups and atomic config writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  EMBEDDED_ICONS_KEY,
  stripIconUrlQueryAndHash,
  extractIconCacheFileName,
} from './backupIconsBrowser';
import { PRESET_IMAGES } from './backgrounds';

export { EMBEDDED_ICONS_KEY, stripIconUrlQueryAndHash, extractIconCacheFileName };

const DEFAULT_MAX_ICON_BYTES = 1024 * 1024; // 1 MB cap per embedded icon
const DEFAULT_MAX_WALLPAPER_BYTES = 8 * 1024 * 1024; // 8 MB cap per embedded custom wallpaper

const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

const EXT_TO_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

/** Converts a local OS file path to a `local-resource:///` URL. */
export function filePathToLocalResourceUrl(filePath: string): string {
  return `local-resource:///${filePath.replace(/\\/g, '/')}`;
}

/**
 * Converts a `local-resource:///` URL or raw local file path into an OS filesystem path.
 * Returns empty string for remote URLs (`http`/`https`), inline `data:` URLs, or empty values.
 */
export function localResourceUrlToFilePath(resourceUrl: string): string {
  if (typeof resourceUrl !== 'string') return '';
  const stripped = stripIconUrlQueryAndHash(resourceUrl);
  if (!stripped) return '';
  if (/^(data:|https?:)/i.test(stripped)) return '';

  if (/^local-resource:\/\//i.test(stripped)) {
    let raw = stripped.replace(/^local-resource:\/\//i, '');
    try {
      raw = decodeURIComponent(raw);
    } catch {
      // Keep raw string if URI decoding fails
    }
    while (raw.startsWith('/')) {
      raw = raw.slice(1);
    }
    return path.normalize(raw);
  }

  return path.isAbsolute(stripped) ? path.normalize(stripped) : '';
}

function writeBufferAtomicSync(targetPath: string, data: Buffer | string, encoding?: BufferEncoding): void {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${targetPath}.tmp-${process.pid}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  try {
    if (typeof data === 'string') {
      fs.writeFileSync(tmpPath, data, encoding || 'utf-8');
    } else {
      fs.writeFileSync(tmpPath, data);
    }
    fs.renameSync(tmpPath, targetPath);
  } catch (err) {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      // ignore cleanup error
    }
    throw err;
  }
}

/** Atomically writes UTF-8 text to disk via temp-file + rename (prevents 0-byte truncation). */
export function writeFileAtomicSync(targetPath: string, content: string): void {
  writeBufferAtomicSync(targetPath, content, 'utf-8');
}

/** Atomically writes UTF-8 text asynchronously via temp-file + rename. */
export async function writeFileAtomic(targetPath: string, content: string): Promise<void> {
  const dir = path.dirname(targetPath);
  await fs.promises.mkdir(dir, { recursive: true });
  const tmpPath = `${targetPath}.tmp-${process.pid}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  try {
    await fs.promises.writeFile(tmpPath, content, 'utf-8');
    await fs.promises.rename(tmpPath, targetPath);
  } catch (err) {
    await fs.promises.unlink(tmpPath).catch(() => {});
    throw err;
  }
}

/** Parses and validates backup JSON content. Returns null if empty or invalid JSON object. */
export function parseValidBackupJson(rawContent: string): Record<string, any> | null {
  if (typeof rawContent !== 'string' || rawContent.trim().length < 2) return null;
  try {
    const parsed = JSON.parse(rawContent);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, any>;
  } catch {
    return null;
  }
}

function resolveDiskIconFile(iconRef: string, iconCacheDir?: string): string | null {
  const diskPath = localResourceUrlToFilePath(iconRef);
  if (diskPath && fs.existsSync(diskPath)) {
    try {
      if (fs.statSync(diskPath).isFile()) return diskPath;
    } catch {
      // continue to cache fallback
    }
  }
  const cacheName = extractIconCacheFileName(iconRef);
  if (cacheName && iconCacheDir) {
    const candidate = path.join(iconCacheDir, cacheName);
    if (fs.existsSync(candidate)) {
      try {
        if (fs.statSync(candidate).isFile()) return candidate;
      } catch {
        // ignore
      }
    }
  }
  return null;
}

function isPresetOrInlineWallpaper(ref: string): boolean {
  const stripped = stripIconUrlQueryAndHash(ref);
  if (!stripped || /^(data:|https?:)/i.test(stripped)) return true;
  const relName = stripped.replace(/^\.\//, '');
  if (PRESET_IMAGES.includes(relName)) return true;
  return !localResourceUrlToFilePath(stripped);
}

/**
 * Clones a config/export payload and embeds local app icons, history icons, and custom wallpapers
 * as base64 data URLs inside `_embeddedIcons` so backups restore identically even after cache deletion or PC migration.
 */
export function bundleEmbeddedBackupIcons<T extends Record<string, any>>(
  configObj: T,
  options: { iconCacheDir?: string; maxIconBytes?: number; maxWallpaperBytes?: number } = {}
): T & { _embeddedIcons?: Record<string, string> } {
  const maxIconBytes = options.maxIconBytes ?? DEFAULT_MAX_ICON_BYTES;
  const maxWallpaperBytes = options.maxWallpaperBytes ?? DEFAULT_MAX_WALLPAPER_BYTES;
  const embedded: Record<string, string> = {};

  const existingEmbedded = configObj?.[EMBEDDED_ICONS_KEY];
  if (existingEmbedded && typeof existingEmbedded === 'object' && !Array.isArray(existingEmbedded)) {
    for (const [k, v] of Object.entries(existingEmbedded)) {
      if (typeof v === 'string' && v.startsWith('data:')) {
        embedded[k] = v;
      }
    }
  }

  const collectRef = (ref: unknown, maxBytes: number, allowCacheLookup: boolean) => {
    if (typeof ref !== 'string') return;
    const stripped = stripIconUrlQueryAndHash(ref);
    if (!stripped || /^(data:|https?:)/i.test(stripped)) return;
    if (embedded[stripped]) return;

    const diskPath = resolveDiskIconFile(stripped, allowCacheLookup ? options.iconCacheDir : undefined);
    if (!diskPath) return;

    try {
      const stat = fs.statSync(diskPath);
      if (stat.size <= 0 || stat.size > maxBytes) return;
      const ext = path.extname(diskPath).toLowerCase();
      const mime = EXT_TO_MIME[ext] || 'image/png';
      const base64 = fs.readFileSync(diskPath).toString('base64');
      embedded[stripped] = `data:${mime};base64,${base64}`;
    } catch {
      // Skip unreadable files gracefully
    }
  };

  if (Array.isArray(configObj.apps)) {
    for (const app of configObj.apps) {
      if (app && typeof app === 'object') {
        collectRef(app.iconPath, maxIconBytes, true);
      }
    }
  }

  if (Array.isArray(configObj.launchHistory)) {
    for (const item of configObj.launchHistory) {
      if (item && typeof item === 'object') {
        collectRef(item.icon, maxIconBytes, true);
      }
    }
  }

  const collectWallpaper = (ref: unknown) => {
    if (typeof ref !== 'string' || isPresetOrInlineWallpaper(ref)) return;
    collectRef(ref, maxWallpaperBytes, false);
  };

  collectWallpaper(configObj.bgImage);
  collectWallpaper(configObj.customSlotImage);
  if (configObj.settings && typeof configObj.settings === 'object' && !Array.isArray(configObj.settings)) {
    collectWallpaper(configObj.settings.bgImage);
    collectWallpaper(configObj.settings.customSlotImage);
  }

  const clone: Record<string, any> = { ...configObj };
  if (Object.keys(embedded).length > 0) {
    clone[EMBEDDED_ICONS_KEY] = embedded;
  } else {
    delete clone[EMBEDDED_ICONS_KEY];
  }
  return clone as T & { _embeddedIcons?: Record<string, string> };
}

function decodeImageDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  try {
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0) return null;
    return { mime: match[1].toLowerCase(), buffer };
  } catch {
    return null;
  }
}

export interface RestoreBackupIconsOptions {
  iconCacheDir: string;
  wallpaperDir?: string;
  cacheTimestamp?: number;
  extractFallback?: (app: Record<string, any>) => Promise<string | null>;
}

/**
 * Restores portable `_embeddedIcons` into the current machine's `icon-cache`, remaps cross-PC paths,
 * re-extracts any missing icons from installed apps when restoring legacy backups, and strips `_embeddedIcons`
 * before writing live config.
 */
export async function restorePortableBackupIcons<T extends Record<string, any>>(
  backupObj: T,
  options: RestoreBackupIconsOptions
): Promise<T> {
  const timestamp = options.cacheTimestamp ?? Date.now();
  const embeddedRaw = backupObj?.[EMBEDDED_ICONS_KEY];
  const embedded: Record<string, string> =
    embeddedRaw && typeof embeddedRaw === 'object' && !Array.isArray(embeddedRaw)
      ? embeddedRaw
      : {};

  const embeddedByCacheName = new Map<string, string>();
  for (const [key, value] of Object.entries(embedded)) {
    if (typeof value !== 'string' || !value.startsWith('data:')) continue;
    const cacheName = extractIconCacheFileName(key);
    if (cacheName && !embeddedByCacheName.has(cacheName)) {
      embeddedByCacheName.set(cacheName, value);
    }
  }

  fs.mkdirSync(options.iconCacheDir, { recursive: true });
  const materializedByKey = new Map<string, string>();

  const resolveOrMaterializeIcon = (ref: unknown, seed: string): { resolved: string | null; missingLocal: boolean } => {
    if (typeof ref !== 'string' || !ref.trim()) {
      return { resolved: typeof ref === 'string' ? ref : null, missingLocal: false };
    }
    const trimmed = ref.trim();
    if (/^(data:|https?:)/i.test(trimmed)) {
      return { resolved: trimmed, missingLocal: false };
    }

    const stripped = stripIconUrlQueryAndHash(trimmed);
    const cachedUrl = materializedByKey.get(stripped);
    if (cachedUrl) {
      return { resolved: cachedUrl, missingLocal: false };
    }

    const cacheName = extractIconCacheFileName(stripped);
    const dataUrl =
      embedded[stripped] ??
      embedded[trimmed] ??
      (cacheName ? embeddedByCacheName.get(cacheName) : undefined);

    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
      const decoded = decodeImageDataUrl(dataUrl);
      if (decoded) {
        const safeCacheName = cacheName ? path.basename(cacheName) : '';
        const ext = MIME_TO_EXT[decoded.mime] || '.png';
        const destFileName =
          safeCacheName ||
          `imported-${crypto.createHash('sha1').update((seed || stripped).toLowerCase()).digest('hex').slice(0, 20)}${ext}`;
        const destPath = path.join(options.iconCacheDir, destFileName);
        writeBufferAtomicSync(destPath, decoded.buffer);
        const url = `${filePathToLocalResourceUrl(destPath)}?t=${timestamp}`;
        materializedByKey.set(stripped, url);
        return { resolved: url, missingLocal: false };
      }
    }

    // Legacy backup without embedded bytes: check exact local file or same cache hash on this PC
    const diskPath = localResourceUrlToFilePath(stripped);
    if (diskPath && fs.existsSync(diskPath)) {
      return { resolved: `${filePathToLocalResourceUrl(diskPath)}?t=${timestamp}`, missingLocal: false };
    }

    if (cacheName) {
      const localCacheCandidate = path.join(options.iconCacheDir, path.basename(cacheName));
      if (fs.existsSync(localCacheCandidate)) {
        const url = `${filePathToLocalResourceUrl(localCacheCandidate)}?t=${timestamp}`;
        materializedByKey.set(stripped, url);
        return { resolved: url, missingLocal: false };
      }
    }

    return { resolved: null, missingLocal: true };
  };

  const result: Record<string, any> = { ...backupObj };
  delete result[EMBEDDED_ICONS_KEY];

  if (Array.isArray(backupObj.apps)) {
    const restoredApps = backupObj.apps.map((app: any) => (app && typeof app === 'object' ? { ...app } : app));
    const missingIndices: number[] = [];

    for (let i = 0; i < restoredApps.length; i++) {
      const app = restoredApps[i];
      if (!app || typeof app !== 'object') continue;
      const { resolved, missingLocal } = resolveOrMaterializeIcon(app.iconPath, `${app.id ?? i}:${app.path || app.name || ''}`);
      if (resolved !== null) {
        app.iconPath = resolved;
      } else if (missingLocal) {
        app.iconPath = '';
        if (typeof app.path === 'string' && app.path.trim() && options.extractFallback) {
          missingIndices.push(i);
        }
      }
    }

    if (missingIndices.length > 0 && options.extractFallback) {
      const queue = [...missingIndices];
      const concurrency = Math.min(3, queue.length);
      const workers = Array.from({ length: concurrency }, async () => {
        while (queue.length > 0) {
          const idx = queue.shift();
          if (idx === undefined) continue;
          const app = restoredApps[idx];
          try {
            const reextracted = await options.extractFallback!(app);
            if (typeof reextracted === 'string' && reextracted.trim()) {
              app.iconPath = reextracted.trim();
            }
          } catch {
            // Keep clean empty iconPath fallback if extraction fails
          }
        }
      });
      await Promise.all(workers);
    }

    result.apps = restoredApps;
  }

  if (Array.isArray(backupObj.launchHistory)) {
    result.launchHistory = backupObj.launchHistory.map((item: any, idx: number) => {
      if (!item || typeof item !== 'object') return item;
      const { resolved, missingLocal } = resolveOrMaterializeIcon(item.icon, `hist:${idx}:${item.path || item.name || ''}`);
      if (resolved !== null) {
        return { ...item, icon: resolved };
      }
      if (missingLocal) {
        return { ...item, icon: '' };
      }
      return item;
    });
  }

  const targetWallpaperDir = options.wallpaperDir || path.join(path.dirname(options.iconCacheDir), 'wallpapers');
  const materializedWallpapers = new Map<string, string>();
  const resolveOrMaterializeWallpaper = (ref: unknown, seed: string): string | undefined => {
    if (typeof ref !== 'string') return undefined;
    const trimmed = ref.trim();
    if (!trimmed || isPresetOrInlineWallpaper(trimmed)) {
      return undefined;
    }
    const stripped = stripIconUrlQueryAndHash(trimmed);
    const cached = materializedWallpapers.get(stripped);
    if (cached) return cached;

    const dataUrl = embedded[stripped] ?? embedded[trimmed];
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
      const decoded = decodeImageDataUrl(dataUrl);
      if (decoded) {
        fs.mkdirSync(targetWallpaperDir, { recursive: true });
        const ext = MIME_TO_EXT[decoded.mime] || '.png';
        const hash = crypto.createHash('sha1').update((stripped || seed).toLowerCase()).digest('hex').slice(0, 20);
        const destPath = path.join(targetWallpaperDir, `imported-wallpaper-${hash}${ext}`);
        writeBufferAtomicSync(destPath, decoded.buffer);
        materializedWallpapers.set(stripped, destPath);
        return destPath;
      }
    }
    return undefined;
  };

  for (const field of ['bgImage', 'customSlotImage'] as const) {
    const restoredPath = resolveOrMaterializeWallpaper(backupObj[field], field);
    if (restoredPath) result[field] = restoredPath;
  }

  if (backupObj.settings && typeof backupObj.settings === 'object' && !Array.isArray(backupObj.settings)) {
    const nextSettings: Record<string, any> = { ...backupObj.settings };
    let settingsChanged = false;
    for (const field of ['bgImage', 'customSlotImage'] as const) {
      const restoredPath = resolveOrMaterializeWallpaper(nextSettings[field], `settings:${field}`);
      if (restoredPath) {
        nextSettings[field] = restoredPath;
        settingsChanged = true;
      }
    }
    if (settingsChanged) {
      result.settings = nextSettings;
    }
  }

  return result as T;
}

export interface PruneWallpapersOptions {
  wallpaperDir: string;
  referencedPaths: Array<string | null | undefined>;
}

/**
 * Deletes orphaned `imported-wallpaper-*` files inside `wallpaperDir` that are no longer referenced
 * by the live wallpaper configuration (`bgImage` / `customSlotImage`). Leaves manually placed files intact.
 */
export function pruneOrphanWallpapers(options: PruneWallpapersOptions): number {
  const { wallpaperDir, referencedPaths } = options;
  if (!wallpaperDir || !fs.existsSync(wallpaperDir)) return 0;

  const activeResolved = new Set<string>();
  for (const ref of referencedPaths) {
    if (typeof ref !== 'string') continue;
    const diskPath = localResourceUrlToFilePath(ref);
    if (diskPath) {
      activeResolved.add(path.resolve(diskPath).toLowerCase());
    }
  }

  let removed = 0;
  try {
    const entries = fs.readdirSync(wallpaperDir);
    for (const entry of entries) {
      if (!entry.startsWith('imported-wallpaper-')) continue;
      const fullPath = path.join(wallpaperDir, entry);
      try {
        if (!fs.statSync(fullPath).isFile()) continue;
        const normalized = path.resolve(fullPath).toLowerCase();
        if (!activeResolved.has(normalized)) {
          fs.unlinkSync(fullPath);
          removed++;
        }
      } catch {
        // Ignore individual locked or missing file errors
      }
    }
  } catch {
    return removed;
  }

  return removed;
}

