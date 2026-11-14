import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALL_CATEGORY_ID,
  BASIC_CATEGORY_PRESETS,
  LEGACY_CATEGORY_PRESETS,
  UNCATEGORIZED_ID,
  doesAppMatchCategory,
  ensureUncategorizedCategory,
  getDefaultCategories,
  getPresetCategoryName,
  isStockCategoryName,
  localizeDefaultCategories,
  resolveAppCategoryDisplayName,
  resolveCategoryDisplayName,
  resolveCategoryStorageValue,
  resolveStockCategoryId,
} from '../shared/categories.ts';
import { translations } from '../src/locales.ts';

function makeTranslator(lang: 'es' | 'en') {
  return (key: string) => {
    const dict = translations[lang] as Record<string, string>;
    return dict[key] ?? key;
  };
}

test('default starter setup exposes exactly 5 basic categories plus system entries in active language', () => {
  assert.equal(BASIC_CATEGORY_PRESETS.length, 5);

  const esDefaults = getDefaultCategories('es');
  assert.deepEqual(
    esDefaults.map((c) => c.id),
    ['all', 'uncategorized', 'browsers', 'design', 'dev', 'office', 'utils']
  );
  assert.deepEqual(
    esDefaults.map((c) => c.name),
    ['Todo', 'Sin Categoría', 'Navegadores', 'Diseño', 'Desarrollo', 'Oficina', 'Utilidades']
  );

  const enDefaults = getDefaultCategories('en');
  assert.deepEqual(
    enDefaults.map((c) => c.name),
    ['All', 'Uncategorized', 'Browsers', 'Design', 'Development', 'Office', 'Utilities']
  );
});

test('Spanish locale cat_* keys match the 5 basic presets and system categories', () => {
  const tEs = makeTranslator('es');
  const tEn = makeTranslator('en');

  for (const cat of getDefaultCategories('es')) {
    assert.equal(resolveCategoryDisplayName(cat, tEs), cat.name);
    assert.equal(resolveCategoryDisplayName(cat, tEn), getPresetCategoryName(cat.id, 'en'));
  }
});

test('apps match their category across localized stored names and dynamic UI language switches', () => {
  const esCategories = getDefaultCategories('es');
  const enCategories = getDefaultCategories('en');

  const utilsCatEn = enCategories.find((c) => c.id === 'utils')!;
  const utilsCatEs = esCategories.find((c) => c.id === 'utils')!;
  const uncatEn = enCategories.find((c) => c.id === UNCATEGORIZED_ID)!;
  const uncatEs = esCategories.find((c) => c.id === UNCATEGORIZED_ID)!;
  const allCat = esCategories.find((c) => c.id === ALL_CATEGORY_ID)!;

  assert.equal(doesAppMatchCategory('Utilidades', utilsCatEn), true);
  assert.equal(doesAppMatchCategory('Utilities', utilsCatEs), true);
  assert.equal(doesAppMatchCategory('Office', esCategories.find((c) => c.id === 'office')!), true);
  assert.equal(doesAppMatchCategory('Oficina', enCategories.find((c) => c.id === 'office')!), true);
  assert.equal(doesAppMatchCategory('Sin Categoría', uncatEn), true);
  assert.equal(doesAppMatchCategory('Uncategorized', uncatEs), true);
  assert.equal(doesAppMatchCategory('Custom Cat', allCat), true);
  assert.equal(resolveStockCategoryId('Todas'), ALL_CATEGORY_ID);
  assert.equal(doesAppMatchCategory('Custom Cat', utilsCatEs), false);

  const tEs = makeTranslator('es');
  const tEn = makeTranslator('en');
  assert.equal(resolveAppCategoryDisplayName('Utilities', esCategories, tEs), 'Utilidades');
  assert.equal(resolveAppCategoryDisplayName('Utilidades', esCategories, tEn), 'Utilities');
});

test('user-renamed preset categories keep custom display name and still match apps', () => {
  const renamed = { id: 'utils', name: 'Herramientas', color: '#60a5fa' };
  const categories = [...getDefaultCategories('es').filter((c) => c.id !== 'utils'), renamed];
  const tEn = makeTranslator('en');
  const tEs = makeTranslator('es');

  assert.equal(isStockCategoryName(renamed.id, renamed.name), false);
  assert.equal(resolveCategoryDisplayName(renamed, tEn), 'Herramientas');
  assert.equal(resolveCategoryDisplayName(renamed, tEs), 'Herramientas');
  assert.equal(doesAppMatchCategory('Herramientas', renamed), true);
  assert.equal(resolveAppCategoryDisplayName('Herramientas', categories, tEn), 'Herramientas');
});

test('cross-language app category resolves to current category storage value for select controls', () => {
  const esCategories = getDefaultCategories('es');
  assert.equal(resolveCategoryStorageValue('Utilities', esCategories, 'es'), 'Utilidades');
  assert.equal(resolveCategoryStorageValue('Uncategorized', esCategories, 'es'), 'Sin Categoría');
  assert.equal(resolveCategoryStorageValue('Deleted Category', esCategories, 'es'), 'Sin Categoría');
});

test('legacy category presets remain recognized for existing user configs and backups', () => {
  const tEs = makeTranslator('es');
  for (const preset of LEGACY_CATEGORY_PRESETS) {
    assert.equal(resolveStockCategoryId(preset.names.en), preset.id);
    assert.equal(resolveStockCategoryId(preset.names.es), preset.id);
    const cat = { id: preset.id, name: preset.names.en, color: preset.color };
    assert.equal(resolveCategoryDisplayName(cat, tEs), preset.names.es);
    assert.equal(doesAppMatchCategory(preset.names.es, cat), true);
  }
});

test('ensureUncategorizedCategory preserves existing uncategorized entry or inserts one in target language', () => {
  const withoutUncat = getDefaultCategories('en').filter((c) => c.id !== UNCATEGORIZED_ID);
  const restoredEs = ensureUncategorizedCategory(withoutUncat, 'es');
  const uncatIndex = restoredEs.findIndex((c) => c.id === UNCATEGORIZED_ID);
  assert.equal(uncatIndex, 1);
  assert.equal(restoredEs[uncatIndex].name, 'Sin Categoría');
});

test('localizeDefaultCategories prepares onboarding/setup categories and apps in target language without touching custom renames', () => {
  const initialCategories = [
    ...getDefaultCategories('es').filter((c) => c.id !== 'browsers'),
    { id: 'browsers', name: 'Mis Navegadores', color: '#f97316' },
    { id: 'custom-1', name: 'Trabajo', color: '#22d3ee' },
  ];
  const initialApps = [
    { name: 'Calc', category: 'Utilidades' },
    { name: 'Browser', category: 'Mis Navegadores' },
    { name: 'Portal', category: 'Trabajo' },
  ];

  const localized = localizeDefaultCategories(initialCategories, initialApps, 'en');
  assert.equal(localized.categories.find((c) => c.id === 'all')?.name, 'All');
  assert.equal(localized.categories.find((c) => c.id === 'uncategorized')?.name, 'Uncategorized');
  assert.equal(localized.categories.find((c) => c.id === 'utils')?.name, 'Utilities');
  assert.equal(localized.categories.find((c) => c.id === 'browsers')?.name, 'Mis Navegadores');
  assert.equal(localized.categories.find((c) => c.id === 'custom-1')?.name, 'Trabajo');

  assert.deepEqual(localized.apps, [
    { name: 'Calc', category: 'Utilities' },
    { name: 'Browser', category: 'Mis Navegadores' },
    { name: 'Portal', category: 'Trabajo' },
  ]);
});

