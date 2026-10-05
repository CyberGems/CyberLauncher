import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CyberManagerRecommendation, CYBERMANAGER_RECOMMENDATION_KEY, CYBERMANAGER_SITE } from '../src/components/CyberManagerRecommendation';
import { translations } from '../src/locales';

const suite = JSON.parse(readFileSync(new URL('../public/suite/suite.json', import.meta.url), 'utf8'));
const escapedHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

test('CyberManager recommendation links to the same official page as the suite catalog', () => {
  assert.equal(CYBERMANAGER_SITE, suite.apps.find((app: { slug: string }) => app.slug === 'cybermanager')?.site);
});

test('the recommendation and its restore hint are localized and accessible', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  try {
    for (const language of ['es', 'en'] as const) {
      const t = (key: keyof typeof translations.es) => translations[language][key];
      for (const dismissed of [false, true]) {
        Object.defineProperty(globalThis, 'window', {
          configurable: true,
          value: { localStorage: { getItem: (key: string) => key === CYBERMANAGER_RECOMMENDATION_KEY && dismissed ? 'true' : null } },
        });
        const html = renderToStaticMarkup(React.createElement(CyberManagerRecommendation, { t, openExternalUrl: () => {} }));
        if (dismissed) {
          assert.ok(html.includes(escapedHtml(t('hud_manager_restore'))));
          assert.doesNotMatch(html, /suite\/cybermanager\.png/);
        } else {
          assert.match(html, /suite\/cybermanager\.png/);
          assert.ok(html.includes(escapedHtml(t('hud_manager_description'))));
          assert.ok(html.includes(escapedHtml(t('hud_manager_learn_more'))));
          assert.ok(html.includes(`aria-label="${escapedHtml(t('hud_manager_dismiss'))}"`));
        }
      }
    }
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
