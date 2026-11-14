export const DEFAULT_BG_IMAGE = 'bg_default.jpg';

/** Packaged presets only — relative names so they survive install on any PC. */
export const PRESET_IMAGES = [
  DEFAULT_BG_IMAGE,
  'bg_waves.jpg',
  'bg_bubbles.png',
];

/** Filename → packaged relative asset (absolute/dev paths normalize to these). */
export const PACKAGED_BG_BY_FILENAME: Record<string, string> = {
  'bg_default.jpg': DEFAULT_BG_IMAGE,
  'default_background.jpg': DEFAULT_BG_IMAGE,
  'bg_waves.jpg': 'bg_waves.jpg',
  'default02.jpg': 'bg_waves.jpg',
  'bg_bubbles.png': 'bg_bubbles.png',
  'default03.png': 'bg_bubbles.png',
  'default03.jpg': 'bg_bubbles.png',
  // Pre-release legacy names → current presets (files no longer shipped)
  'bg_abstract.jpg': 'bg_waves.jpg',
  'bg_cyberpunk.jpg': 'bg_bubbles.png',
  'bg_geom.jpg': DEFAULT_BG_IMAGE,
};

/** Migrate legacy absolute paths / old project folders to packaged preset names. */
export const normalizeBgImage = (path: string | null | undefined): string => {
  if (!path) return DEFAULT_BG_IMAGE;
  if (path.includes('antigravity_projects')) return DEFAULT_BG_IMAGE;

  const trimmed = path.replace(/^\.\//, '');
  const fileName = trimmed.replace(/^.*[\\/]/, '').toLowerCase();
  const packaged = PACKAGED_BG_BY_FILENAME[fileName];
  if (packaged) return packaged;

  return path;
};

/** Resolve packaged assets with ./ so file:// and Electron loadFile both work. */
export const toPackagedAssetUrl = (relativeName: string) =>
  relativeName.startsWith('./') ? relativeName : `./${relativeName}`;

/** Resolve packaged preset thumbnail (pre-scaled 16:9 Lanczos asset in public/thumbs). */
export const toPresetThumbnailUrl = (presetName: string) =>
  `./thumbs/${presetName.replace(/^\.\//, '')}`;

export const toThumbnailUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  if (!path.includes(':') && !path.includes('\\')) {
    return toPackagedAssetUrl(path.replace(/^\.\//, ''));
  }
  const normalized = path.replace(/\\/g, '/');
  return `local-resource:///${encodeURI(normalized)}`;
};

