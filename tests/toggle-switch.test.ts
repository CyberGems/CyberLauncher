import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ToggleSwitch } from '../src/components/ToggleSwitch';
import { translations } from '../src/locales';

test('ToggleSwitch renders CyberGems suite-standard geometry and states', () => {
  const offMarkup = renderToStaticMarkup(
    React.createElement(ToggleSwitch, {
      checked: false,
      onChange: () => {},
      ariaLabel: 'Test toggle off',
    })
  );

  assert.ok(offMarkup.includes('role="switch"'));
  assert.ok(offMarkup.includes('aria-checked="false"'));
  assert.ok(offMarkup.includes('w-11 h-6'));
  assert.ok(offMarkup.includes('bg-[#5e6672]'));
  assert.ok(offMarkup.includes('bg-[#12161e]'));
  assert.ok(offMarkup.includes('translate-x-0'));

  const onMarkup = renderToStaticMarkup(
    React.createElement(ToggleSwitch, {
      checked: true,
      onChange: () => {},
      ariaLabel: 'Test toggle on',
    })
  );

  assert.ok(onMarkup.includes('aria-checked="true"'));
  assert.ok(onMarkup.includes('bg-[#06b6d4]'));
  assert.ok(onMarkup.includes('shadow-[0_0_12px_rgba(6,182,212,0.45)]'));
  assert.ok(onMarkup.includes('translate-x-[20px] bg-white'));
  assert.ok(onMarkup.includes('M3.2 8.35 6.45 11.45 12.8 4.7'));
});

test('Settings and onboarding share ToggleSwitch, and update notifications are configured in Settings', () => {
  const appSource = readFileSync('src/App.tsx', 'utf8');
  const aboutSource = readFileSync('src/AboutModal.tsx', 'utf8');
  const onboardingSource = readFileSync('src/components/OnboardingModal.tsx', 'utf8');

  for (const [name, source] of [
    ['src/App.tsx', appSource],
    ['src/components/OnboardingModal.tsx', onboardingSource],
  ] as const) {
    assert.ok(source.includes('<ToggleSwitch'), `${name} should use ToggleSwitch`);
    assert.equal(
      /relative w-11 h-6 rounded-full/.test(source),
      false,
      `${name} must not define ad-hoc toggle button markup`
    );
  }
  assert.match(appSource, /<ToggleSwitch\s+checked=\{autoUpdate\}/);
  assert.doesNotMatch(aboutSource, /<ToggleSwitch|role=["']switch["']|onAutoUpdateChange/);
});

test('CyberBot Assistant wording is consistent in English and Spanish settings copy', () => {
  assert.ok(translations.es.tab_cyberbot.includes('ASISTENTE'));
  assert.ok(translations.en.tab_cyberbot.includes('ASSISTANT'));
  assert.ok(translations.es.cyberbot_settings_title.includes('Asistente CyberBot'));
  assert.ok(translations.en.cyberbot_settings_title.includes('CyberBot Assistant'));
  assert.ok(translations.es.cyberbot_disabled_confirmation.includes('Asistente CyberBot'));
  assert.ok(translations.en.cyberbot_disabled_confirmation.includes('CyberBot Assistant'));
});

