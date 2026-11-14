import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MissingShortcutModal } from '../src/components/MissingShortcutModal';
import { translations, type TranslationKey } from '../src/locales';

function makeTranslator(lang: 'es' | 'en') {
  return (key: TranslationKey, variables?: Record<string, string>) => {
    let text: string = translations[lang][key] || key;
    if (variables) {
      for (const [k, v] of Object.entries(variables)) {
        text = text.replace(`{${k}}`, v);
      }
    }
    return text;
  };
}

test('MissingShortcutModal renders bilingual delete, locate, and cancel controls', () => {
  for (const lang of ['es', 'en'] as const) {
    const t = makeTranslator(lang);
    const savedPath = 'C:\\Apps\\MissingApp.exe';
    const html = renderToStaticMarkup(
      React.createElement(MissingShortcutModal, {
        isOpen: true,
        appName: 'MissingApp',
        savedPath,
        isRelinking: false,
        t,
        onClose: () => {},
        onDelete: () => {},
        onLocate: () => {},
      })
    );

    assert.ok(html.includes(t('missing_shortcut_title')));
    assert.ok(html.includes(t('missing_shortcut_delete')));
    assert.ok(html.includes(t('missing_shortcut_locate')));
    assert.ok(html.includes(`aria-label="${t('confirm_reset_btn_cancel')}"`));
    assert.ok(html.includes(savedPath));
    assert.ok(html.includes('MissingApp'));

    const relinkingHtml = renderToStaticMarkup(
      React.createElement(MissingShortcutModal, {
        isOpen: true,
        appName: 'MissingApp',
        savedPath,
        isRelinking: true,
        t,
        onClose: () => {},
        onDelete: () => {},
        onLocate: () => {},
      })
    );
    assert.ok(relinkingHtml.includes(t('missing_shortcut_locating')));
  }
});

test('MissingShortcutModal renders nothing when closed', () => {
  const html = renderToStaticMarkup(
    React.createElement(MissingShortcutModal, {
      isOpen: false,
      appName: 'MissingApp',
      savedPath: 'C:\\Apps\\MissingApp.exe',
      isRelinking: false,
      t: makeTranslator('es'),
      onClose: () => {},
      onDelete: () => {},
      onLocate: () => {},
    })
  );
  assert.equal(html, '');
});

