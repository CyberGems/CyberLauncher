import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BASIC_CATEGORY_PRESETS } from '../shared/categories';
import { getDefaultWindowsApps, localizeStockAppNames } from '../shared/defaultApps';
import { OnboardingModal } from '../src/components/OnboardingModal';
import {
  EDITABLE_INPUT_TYPES,
  getMenuItemDisabledState,
  isEditableInputType,
} from '../src/components/TextFieldContextMenu';
import { translations, type TranslationKey } from '../src/locales';

test('getDefaultWindowsApps and localizeStockAppNames switch untouched stock apps without touching custom renames', () => {
  const esApps = getDefaultWindowsApps('es');
  const enApps = getDefaultWindowsApps('en');

  assert.equal(esApps.length, 11);
  assert.equal(enApps.length, 11);
  assert.equal(esApps[0].name, 'Calculadora');
  assert.equal(enApps[0].name, 'Calculator');

  const mixed = [
    ...esApps.slice(0, 2),
    { ...esApps[2], name: 'Mi Ajustes Personalizados' }, // user-renamed stock ID 1003
    { id: 99999, name: 'Custom User Tool' },
  ];

  const localizedToEn = localizeStockAppNames(mixed, 'en');
  assert.equal(localizedToEn[0].name, 'Calculator');
  assert.equal(localizedToEn[1].name, 'Paint');
  assert.equal(localizedToEn[2].name, 'Mi Ajustes Personalizados');
  assert.equal(localizedToEn[3].name, 'Custom User Tool');

  const backToEs = localizeStockAppNames(localizedToEn, 'es');
  assert.equal(backToEs[0].name, 'Calculadora');
  assert.equal(backToEs[2].name, 'Mi Ajustes Personalizados');
  assert.equal(backToEs[3].name, 'Custom User Tool');
});

test('OnboardingModal renders localized welcome copy, 5 starter categories, and CyberBot name field', () => {
  for (const lang of ['es', 'en'] as const) {
    const t = (key: TranslationKey, variables?: Record<string, string>) => {
      let text: string = translations[lang][key] || key;
      if (variables) {
        for (const [k, v] of Object.entries(variables)) {
          text = text.replace(`{${k}}`, v);
        }
      }
      return text;
    };

    const html = renderToStaticMarkup(
      React.createElement(OnboardingModal, {
        isOpen: true,
        language: lang,
        initialName: lang === 'en' ? 'Alex' : '',
        logo: React.createElement('img', { src: './icon.png', alt: 'CyberLauncher' }),
        t,
        onSelectLanguage: () => {},
        onComplete: () => {},
      })
    );

    assert.ok(html.includes(translations[lang].onboarding_title));
    assert.ok(html.includes(translations[lang].onboarding_skip));
    assert.ok(html.includes(translations[lang].onboarding_start));
    assert.ok(html.includes('id="onboarding-cyberbot-name"'));
    for (const preset of BASIC_CATEGORY_PRESETS) {
      assert.ok(html.includes(preset.names[lang]), `Missing preset ${preset.names[lang]}`);
    }
  }

  const closedHtml = renderToStaticMarkup(
    React.createElement(OnboardingModal, {
      isOpen: false,
      language: 'es',
      initialName: '',
      logo: React.createElement('span'),
      t: (k) => translations.es[k],
      onSelectLanguage: () => {},
      onComplete: () => {},
    })
  );
  assert.equal(closedHtml, '');
});

test('TextFieldContextMenu accepts text-like input types and excludes non-text controls', () => {
  for (const textType of ['', 'text', 'search', 'password', 'url', 'email', 'tel', 'number', 'date', 'datetime-local', 'time', 'month', 'week']) {
    assert.equal(isEditableInputType(textType), true, `Expected ${textType || '(empty)'} to be editable`);
  }
  assert.ok(EDITABLE_INPUT_TYPES.has('password'));

  for (const nonTextType of ['checkbox', 'radio', 'range', 'file', 'button', 'submit', 'color', 'hidden']) {
    assert.equal(isEditableInputType(nonTextType), false, `Expected ${nonTextType} to be excluded`);
  }
});

test('TextFieldContextMenu disabled states reflect selection, readOnly, undo/redo history, and clipboard', () => {
  assert.deepEqual(
    getMenuItemDisabledState({
      readOnly: false,
      canUndo: false,
      canRedo: false,
      hasSelection: false,
      hasText: false,
      canPaste: false,
    }),
    {
      undo: true,
      redo: true,
      cut: true,
      copy: true,
      paste: true,
      selectAll: true,
      delete: true,
    }
  );

  assert.deepEqual(
    getMenuItemDisabledState({
      readOnly: false,
      canUndo: true,
      canRedo: true,
      hasSelection: true,
      hasText: true,
      canPaste: true,
    }),
    {
      undo: false,
      redo: false,
      cut: false,
      copy: false,
      paste: false,
      selectAll: false,
      delete: false,
    }
  );

  assert.deepEqual(
    getMenuItemDisabledState({
      readOnly: true,
      canUndo: true,
      canRedo: true,
      hasSelection: true,
      hasText: true,
      canPaste: true,
    }),
    {
      undo: true,
      redo: true,
      cut: true,
      copy: false, // Copy remains enabled on readOnly fields when text is selected
      paste: true,
      selectAll: false,
      delete: true,
    }
  );
});

test('Onboarding and text-menu translations exist in both Spanish and English without em dashes', () => {
  const keys: TranslationKey[] = [
    'text_menu_aria',
    'text_menu_undo',
    'text_menu_redo',
    'text_menu_cut',
    'text_menu_copy',
    'text_menu_paste',
    'text_menu_select_all',
    'text_menu_delete',
    'onboarding_badge',
    'onboarding_title',
    'onboarding_subtitle',
    'onboarding_lang_label',
    'onboarding_preview_title',
    'onboarding_preview_summary',
    'onboarding_name_label',
    'onboarding_optional',
    'onboarding_name_placeholder',
    'onboarding_name_desc',
    'onboarding_skip',
    'onboarding_start',
    'onboarding_welcome_toast',
    'cmd_palette_action_onboarding',
    'cmd_palette_action_onboarding_desc',
  ];

  for (const key of keys) {
    for (const lang of ['es', 'en'] as const) {
      const value = translations[lang][key];
      assert.equal(typeof value, 'string', `Missing ${lang}.${key}`);
      assert.ok(value.trim().length > 0, `Empty ${lang}.${key}`);
      assert.ok(!value.includes('—'), `Unexpected em dash in ${lang}.${key}`);
    }
  }
});

