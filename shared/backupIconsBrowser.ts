// Browser-safe helpers for portable backup icons (no Node built-ins).

export const EMBEDDED_ICONS_KEY = '_embeddedIcons';

/** Strips query (?t=...) and hash (#...) suffixes from a resource URL or path. */
export function stripIconUrlQueryAndHash(rawPath: string): string {
  if (typeof rawPath !== 'string') return '';
  return rawPath.split('?')[0].split('#')[0].trim();
}

/** Extracts filename if the reference points inside an icon-cache directory. */
export function extractIconCacheFileName(rawPath: string): string | null {
  const clean = stripIconUrlQueryAndHash(rawPath);
  if (!clean) return null;
  const normalized = clean.replace(/\\/g, '/');
  const match = normalized.match(/\/icon-cache\/([^/]+)$/i);
  return match && match[1] ? match[1] : null;
}

/**
 * Browser-only fallback: resolves `_embeddedIcons` entries to inline `data:` URLs
 * when importing a portable backup outside Electron.
 */
export function resolveEmbeddedIconsInBrowser<T extends Record<string, any>>(data: T): T {
  const embedded = data?.[EMBEDDED_ICONS_KEY];
  if (!embedded || typeof embedded !== 'object' || Array.isArray(embedded)) {
    return data;
  }

  const byCacheName = new Map<string, string>();
  for (const [key, val] of Object.entries(embedded)) {
    if (typeof val !== 'string' || !val.startsWith('data:')) continue;
    const cacheName = extractIconCacheFileName(key);
    if (cacheName && !byCacheName.has(cacheName)) {
      byCacheName.set(cacheName, val);
    }
  }

  const lookupEmbedded = (ref: unknown): string | null => {
    if (typeof ref !== 'string' || !ref || ref.startsWith('data:')) return null;
    const stripped = stripIconUrlQueryAndHash(ref);
    const direct = embedded[stripped] ?? embedded[ref];
    if (typeof direct === 'string' && direct.startsWith('data:')) return direct;
    const cacheName = extractIconCacheFileName(stripped);
    if (cacheName) {
      const hit = byCacheName.get(cacheName);
      if (hit) return hit;
    }
    return null;
  };

  const next: Record<string, any> = { ...data };
  delete next[EMBEDDED_ICONS_KEY];

  if (Array.isArray(data.apps)) {
    next.apps = data.apps.map((app: any) => {
      if (!app || typeof app !== 'object') return app;
      const hit = lookupEmbedded(app.iconPath);
      return hit ? { ...app, iconPath: hit } : app;
    });
  }

  if (Array.isArray(data.launchHistory)) {
    next.launchHistory = data.launchHistory.map((item: any) => {
      if (!item || typeof item !== 'object') return item;
      const hit = lookupEmbedded(item.icon);
      return hit ? { ...item, icon: hit } : item;
    });
  }

  for (const field of ['bgImage', 'customSlotImage'] as const) {
    const hit = lookupEmbedded(data[field]);
    if (hit) next[field] = hit;
  }

  if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
    const nextSettings: Record<string, any> = { ...data.settings };
    let settingsChanged = false;
    for (const field of ['bgImage', 'customSlotImage'] as const) {
      const hit = lookupEmbedded(nextSettings[field]);
      if (hit) {
        nextSettings[field] = hit;
        settingsChanged = true;
      }
    }
    if (settingsChanged) {
      next.settings = nextSettings;
    }
  }

  return next as T;
}

