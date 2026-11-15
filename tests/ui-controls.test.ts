import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CustomSelect } from '../src/components/CustomSelect';
import { Checkbox } from '../src/components/Checkbox';
import {
  CYBERBOT_BUBBLE_SURFACE,
  CYBERBOT_BUBBLE_TAIL_SURFACE,
  CYBERBOT_BUBBLE_TONES,
} from '../src/components/companion/cyberBotBubbleTheme';
import { translations } from '../src/locales';

test('CustomSelect renders accessible combobox trigger without native select element', () => {
  const markup = renderToStaticMarkup(
    React.createElement(CustomSelect, {
      value: 'browsers',
      onChange: () => {},
      ariaLabel: 'Category',
      options: [
        { value: 'uncategorized', label: 'Uncategorized' },
        { value: 'browsers', label: 'Browsers' },
        { value: 'design', label: 'Design' },
      ],
    })
  );

  assert.ok(markup.includes('role="combobox"'));
  assert.ok(markup.includes('aria-haspopup="listbox"'));
  assert.ok(markup.includes('aria-expanded="false"'));
  assert.ok(markup.includes('>Browsers<'));
  assert.equal(markup.includes('<select'), false);
});

test('Checkbox renders custom cyan and amber states around accessible input', () => {
  const unchecked = renderToStaticMarkup(
    React.createElement(Checkbox, {
      checked: false,
      onChange: () => {},
      ariaLabel: 'Force close',
    })
  );
  assert.ok(unchecked.includes('type="checkbox"'));
  assert.ok(unchecked.includes('border-slate-500/70'));
  assert.ok(unchecked.includes('opacity-0 scale-75'));

  const checkedCyan = renderToStaticMarkup(
    React.createElement(Checkbox, {
      checked: true,
      onChange: () => {},
      ariaLabel: 'Skip confirmation',
    })
  );
  assert.ok(checkedCyan.includes('checked=""'));
  assert.ok(checkedCyan.includes('bg-[#06b6d4]'));
  assert.ok(checkedCyan.includes('opacity-100 scale-100'));

  const checkedAmber = renderToStaticMarkup(
    React.createElement(Checkbox, {
      checked: true,
      tone: 'amber',
      onChange: () => {},
      ariaLabel: 'Include shortcuts on reset',
    })
  );
  assert.ok(checkedAmber.includes('bg-amber-500'));
});

test('App.tsx replaces all native select and checkbox controls with suite components', () => {
  const appSource = readFileSync('src/App.tsx', 'utf8');

  assert.equal(/<select[\s>]/.test(appSource), false, 'App.tsx must not render native <select> elements');
  assert.equal(/type="checkbox"/.test(appSource), false, 'App.tsx must not render native checkbox inputs');
  assert.ok(appSource.includes('<CustomSelect'));
  assert.ok(appSource.includes('<Checkbox'));
});

test('CyberBot prompt, speech bubble, and desktop toast share unified Capture-1 border and glow tokens', () => {
  const promptSource = readFileSync('src/components/companion/CyberBotPrompt.tsx', 'utf8');
  const bubbleSource = readFileSync('src/components/companion/CyberSpeechBubble.tsx', 'utf8');
  const toastCss = readFileSync('src/components/companion/desktop/toast-window.css', 'utf8');

  assert.ok(CYBERBOT_BUBBLE_SURFACE.includes('bg-[#080d1a]/95'));
  assert.ok(CYBERBOT_BUBBLE_TAIL_SURFACE.includes('bg-[#080d1a]'));
  assert.ok(CYBERBOT_BUBBLE_TONES.default.frame.includes('border-cyan-500/30'));
  assert.ok(CYBERBOT_BUBBLE_TONES.default.frame.includes('shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_20px_rgba(34,211,238,0.12)]'));

  for (const src of [promptSource, bubbleSource]) {
    assert.ok(src.includes('CYBERBOT_BUBBLE_SURFACE'));
    assert.ok(src.includes('CYBERBOT_BUBBLE_TAIL_SURFACE'));
    assert.ok(src.includes('CYBERBOT_BUBBLE_TONES'));
  }

  assert.ok(toastCss.includes('rgba(8, 13, 26, 0.95)'));
  assert.ok(toastCss.includes('rgba(6, 182, 212, 0.30)'));
  assert.ok(toastCss.includes('0 12px 36px rgba(0, 0, 0, 0.65), 0 0 20px rgba(34, 211, 238, 0.12)'));
  assert.ok(toastCss.includes('background: #080d1a;'));

  for (const hardcodedLabel of ['Monitor Sistema', 'Ajustes CyberBot', 'Activar Sonido', 'Modo Silencio']) {
    assert.equal(promptSource.includes(`'${hardcodedLabel}'`), false, `Hardcoded label ${hardcodedLabel} should be localized`);
  }

  for (const lang of ['es', 'en'] as const) {
    assert.ok(translations[lang].cyberbot_prompt_action_cyberbot_settings_short);
    assert.ok(translations[lang].cyberbot_prompt_action_quiet_enable_short);
    assert.ok(translations[lang].cyberbot_prompt_action_quiet_disable_short);
  }
});

