export type CategoryLang = 'es' | 'en';

export interface CategoryRecord {
  id: string;
  name: string;
  color: string;
}

interface PresetCategoryMeta {
  id: string;
  color: string;
  names: Record<CategoryLang, string>;
  aliases?: readonly string[];
}

export const ALL_CATEGORY_ID = 'all';
export const UNCATEGORIZED_ID = 'uncategorized';
export const UNCATEGORIZED_COLOR = '#71717a';

export const SYSTEM_CATEGORY_PRESETS: readonly PresetCategoryMeta[] = [
  { id: ALL_CATEGORY_ID, color: '#a1a1aa', names: { es: 'Todo', en: 'All' }, aliases: ['Todas'] },
  { id: UNCATEGORIZED_ID, color: UNCATEGORIZED_COLOR, names: { es: 'Sin Categoría', en: 'Uncategorized' } },
];

/** Five core starter categories for clean installations and onboarding. */
export const BASIC_CATEGORY_PRESETS: readonly PresetCategoryMeta[] = [
  { id: 'browsers', color: '#f97316', names: { es: 'Navegadores', en: 'Browsers' } },
  { id: 'design', color: '#ef4444', names: { es: 'Diseño', en: 'Design' } },
  { id: 'dev', color: '#38bdf8', names: { es: 'Desarrollo', en: 'Development' } },
  { id: 'office', color: '#a78bfa', names: { es: 'Oficina', en: 'Office' }, aliases: ['Office'] },
  { id: 'utils', color: '#60a5fa', names: { es: 'Utilidades', en: 'Utilities' } },
];

/** Legacy default presets kept so existing configs keep their localization and matching. */
export const LEGACY_CATEGORY_PRESETS: readonly PresetCategoryMeta[] = [
  { id: 'ai', color: '#34d399', names: { es: 'AI', en: 'AI' } },
  { id: 'comm', color: '#6366f1', names: { es: 'Comunicación', en: 'Communication' } },
  { id: 'ent', color: '#22c55e', names: { es: 'Entretenimiento', en: 'Entertainment' } },
  { id: 'gaming', color: '#d4d4d8', names: { es: 'Juegos', en: 'Gaming' } },
];

export const ALL_KNOWN_CATEGORY_PRESETS: readonly PresetCategoryMeta[] = [
  ...SYSTEM_CATEGORY_PRESETS,
  ...BASIC_CATEGORY_PRESETS,
  ...LEGACY_CATEGORY_PRESETS,
];

const PRESET_BY_ID = new Map<string, PresetCategoryMeta>(
  ALL_KNOWN_CATEGORY_PRESETS.map((preset) => [preset.id, preset])
);

const STOCK_NAME_TO_ID = new Map<string, string>();
for (const preset of ALL_KNOWN_CATEGORY_PRESETS) {
  STOCK_NAME_TO_ID.set(preset.names.es.toLowerCase(), preset.id);
  STOCK_NAME_TO_ID.set(preset.names.en.toLowerCase(), preset.id);
  for (const alias of preset.aliases ?? []) {
    STOCK_NAME_TO_ID.set(alias.toLowerCase(), preset.id);
  }
}

export function getPresetCategoryName(id: string, lang: CategoryLang = 'es'): string {
  const preset = PRESET_BY_ID.get(id);
  return preset ? preset.names[lang] : id;
}

export function getDefaultCategories(lang: CategoryLang = 'es'): CategoryRecord[] {
  return [...SYSTEM_CATEGORY_PRESETS, ...BASIC_CATEGORY_PRESETS].map((preset) => ({
    id: preset.id,
    name: preset.names[lang],
    color: preset.color,
  }));
}

export function ensureUncategorizedCategory(
  cats: CategoryRecord[],
  lang: CategoryLang = 'es'
): CategoryRecord[] {
  if (cats.some((c) => c.id === UNCATEGORIZED_ID)) return cats;
  const allIdx = cats.findIndex((c) => c.id === ALL_CATEGORY_ID);
  const insertAt = allIdx >= 0 ? allIdx + 1 : 0;
  return [
    ...cats.slice(0, insertAt),
    {
      id: UNCATEGORIZED_ID,
      name: getPresetCategoryName(UNCATEGORIZED_ID, lang),
      color: UNCATEGORIZED_COLOR,
    },
    ...cats.slice(insertAt),
  ];
}

export function resolveStockCategoryId(rawName: string): string | null {
  const normalized = (rawName || '').trim().toLowerCase();
  if (!normalized) return null;
  return STOCK_NAME_TO_ID.get(normalized) ?? null;
}

export function isStockCategoryName(catId: string, catName: string): boolean {
  const preset = PRESET_BY_ID.get(catId);
  if (!preset) return false;
  const normalized = (catName || '').trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === preset.names.es.toLowerCase()) return true;
  if (normalized === preset.names.en.toLowerCase()) return true;
  return (preset.aliases ?? []).some((alias) => alias.toLowerCase() === normalized);
}

export function resolveCategoryDisplayName(
  cat: Pick<CategoryRecord, 'id' | 'name'>,
  t: (key: any) => string
): string {
  if (
    cat.id === ALL_CATEGORY_ID ||
    cat.id === UNCATEGORIZED_ID ||
    isStockCategoryName(cat.id, cat.name)
  ) {
    const translationKey = `cat_${cat.id}`;
    const translated = t(translationKey);
    if (translated && translated !== translationKey) return translated;
  }
  return cat.name;
}

export function doesAppMatchCategory(
  appCategory: string,
  cat: Pick<CategoryRecord, 'id' | 'name'>
): boolean {
  if (cat.id === ALL_CATEGORY_ID) return true;
  if (appCategory === cat.name) return true;
  if (cat.id === UNCATEGORIZED_ID || isStockCategoryName(cat.id, cat.name)) {
    return resolveStockCategoryId(appCategory) === cat.id;
  }
  return false;
}

export function resolveAppCategoryDisplayName(
  rawCategoryName: string,
  categories: CategoryRecord[],
  t: (key: any) => string
): string {
  const matched = categories.find(
    (c) => c.id !== ALL_CATEGORY_ID && doesAppMatchCategory(rawCategoryName, c)
  );
  if (matched) {
    return resolveCategoryDisplayName(matched, t);
  }
  const stockId = resolveStockCategoryId(rawCategoryName);
  if (stockId) {
    const translationKey = `cat_${stockId}`;
    const translated = t(translationKey);
    if (translated && translated !== translationKey) return translated;
  }
  return rawCategoryName;
}

export function resolveCategoryStorageValue(
  rawCategoryName: string,
  categories: CategoryRecord[],
  fallbackLang: CategoryLang = 'es'
): string {
  const matched = categories.find(
    (c) => c.id !== ALL_CATEGORY_ID && doesAppMatchCategory(rawCategoryName, c)
  );
  if (matched) return matched.name;
  const uncategorized = categories.find((c) => c.id === UNCATEGORIZED_ID);
  return uncategorized ? uncategorized.name : getPresetCategoryName(UNCATEGORIZED_ID, fallbackLang);
}

/**
 * Updates stock (non-user-renamed) categories and their app references to a target language.
 * Useful when onboarding finalizes language selection or when normalizing starter setup.
 */
export function localizeDefaultCategories<T extends { category: string }>(
  categories: CategoryRecord[],
  apps: T[],
  lang: CategoryLang
): { categories: CategoryRecord[]; apps: T[] } {
  const renamedCustomIds = new Set(
    categories
      .filter((c) => PRESET_BY_ID.has(c.id) && !isStockCategoryName(c.id, c.name))
      .map((c) => c.id)
  );

  const nextCategories = categories.map((cat) => {
    if (
      cat.id === ALL_CATEGORY_ID ||
      cat.id === UNCATEGORIZED_ID ||
      isStockCategoryName(cat.id, cat.name)
    ) {
      return { ...cat, name: getPresetCategoryName(cat.id, lang) };
    }
    return cat;
  });

  const nextApps = apps.map((app) => {
    const stockId = resolveStockCategoryId(app.category);
    if (!stockId || renamedCustomIds.has(stockId)) return app;
    const localizedName = getPresetCategoryName(stockId, lang);
    return app.category === localizedName ? app : { ...app, category: localizedName };
  });

  return { categories: nextCategories, apps: nextApps };
}
