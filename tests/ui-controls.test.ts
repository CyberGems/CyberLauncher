import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CustomSelect } from '../src/components/CustomSelect';
import { Checkbox } from '../src/components/Checkbox';
import { UwpImportConfirmModal } from '../src/components/UwpImportConfirmModal';
import { AppConfirmModals } from '../src/components/AppConfirmModals';
import { CyberAnalogClock } from '../src/components/CyberAnalogClock';
import { MODAL_SHADOW_AMBER, MODAL_SHADOW_CYAN } from '../src/components/modalTheme';
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
      onChange: () => { },
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
      onChange: () => { },
      ariaLabel: 'Force close',
    })
  );
  assert.ok(unchecked.includes('type="checkbox"'));
  assert.ok(unchecked.includes('border-slate-500/70'));
  assert.ok(unchecked.includes('opacity-0 scale-75'));

  const checkedCyan = renderToStaticMarkup(
    React.createElement(Checkbox, {
      checked: true,
      onChange: () => { },
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
      onChange: () => { },
      ariaLabel: 'Include shortcuts on reset',
    })
  );
  assert.ok(checkedAmber.includes('bg-amber-500'));
});

test('App.tsx, AppConfirmModals, and cyberbot-review replace all native select and checkbox controls', () => {
  const appSource = readFileSync('src/App.tsx', 'utf8');
  const confirmSource = readFileSync('src/components/AppConfirmModals.tsx', 'utf8');
  const reviewSource = readFileSync('src/cyberbot-review.tsx', 'utf8');

  for (const [name, source] of [
    ['src/App.tsx', appSource],
    ['src/components/AppConfirmModals.tsx', confirmSource],
    ['src/cyberbot-review.tsx', reviewSource],
  ] as const) {
    assert.equal(/<select[\s>]/.test(source), false, `${name} must not render native <select> elements`);
    assert.equal(/type="checkbox"/.test(source), false, `${name} must not render native checkbox inputs`);
  }

  assert.ok(appSource.includes('<CustomSelect'));
  assert.ok(appSource.includes('<UwpImportConfirmModal'));
  assert.ok(appSource.includes('<AppConfirmModals'));
  assert.ok(confirmSource.includes('<Checkbox'));
  assert.ok(reviewSource.includes('<CustomSelect'));
  assert.ok(reviewSource.includes('<Checkbox'));
});

test('UwpImportConfirmModal prioritizes app icon and name over subtle action header', () => {
  const withIcon = renderToStaticMarkup(
    React.createElement(UwpImportConfirmModal, {
      app: {
        name: 'Affinity',
        aumid: 'Canva.Affinity_8a0j1tnjnt4a4!Canva.Affinity',
        icon: 'data:image/png;base64,iVBORw0KGgo=',
      },
      category: 'Design',
      onChangeCategory: () => { },
      categoryOptions: [
        { value: 'Uncategorized', label: 'Uncategorized' },
        { value: 'Design', label: 'Design' },
      ],
      onCancel: () => { },
      onConfirm: () => { },
      t: (key) => translations.en[key],
    })
  );

  assert.ok(withIcon.includes('Affinity'));
  assert.ok(withIcon.includes('src="data:image/png;base64,iVBORw0KGgo="'));
  assert.ok(withIcon.includes('text-base font-bold text-white'));
  assert.ok(withIcon.includes('text-[10px] font-cyber font-bold text-slate-400'));
  assert.ok(withIcon.includes(MODAL_SHADOW_CYAN));
  assert.equal(withIcon.includes('shadow-[0_0_30px_rgba(34,211,238,0.2)]'), false);

  const withoutIcon = renderToStaticMarkup(
    React.createElement(UwpImportConfirmModal, {
      app: {
        name: 'Affinity',
        aumid: 'Canva.Affinity_8a0j1tnjnt4a4!Canva.Affinity',
        icon: '',
      },
      category: 'Design',
      onChangeCategory: () => { },
      categoryOptions: [{ value: 'Design', label: 'Design' }],
      onCancel: () => { },
      onConfirm: () => { },
      t: (key) => translations.en[key],
    })
  );
  assert.ok(withoutIcon.includes('>UWP<'));
});

test('Modals use calmed glow tokens across UWP, Power, Onboarding, CommandPalette, and MissingShortcut', () => {
  const onboardingSource = readFileSync('src/components/OnboardingModal.tsx', 'utf8');
  const missingSource = readFileSync('src/components/MissingShortcutModal.tsx', 'utf8');
  const paletteSource = readFileSync('src/CommandPalette.tsx', 'utf8');
  const confirmSource = readFileSync('src/components/AppConfirmModals.tsx', 'utf8');
  const appSource = readFileSync('src/App.tsx', 'utf8');

  assert.equal(onboardingSource.includes('0_0_25px_rgba(34,211,238,0.14)'), false);
  assert.equal(missingSource.includes('0_0_35px_rgba(245,158,11,0.14)'), false);
  assert.equal(paletteSource.includes('0_0_20px_rgba(34,211,238,0.12)'), false);
  assert.equal(confirmSource.includes('0_0_30px_rgba'), false);
  assert.equal(appSource.includes('0_0_35px_rgba(245,158,11,0.25)'), false);
  assert.equal(appSource.includes('0_0_20px_rgba(34,211,238,0.1)'), false);

  const factoryMarkup = renderToStaticMarkup(
    React.createElement(AppConfirmModals, {
      t: (key) => translations.en[key],
      getCategoryDisplayName: (cat) => cat.name,
      appToDelete: null,
      dontAskAgainOnAppDelete: false,
      onChangeDontAskAgainOnAppDelete: () => { },
      onCancelDeleteApp: () => { },
      onConfirmDeleteApp: () => { },
      categoryToDelete: null,
      onCancelDeleteCategory: () => { },
      onConfirmDeleteCategory: () => { },
      confirmResetType: null,
      onCancelReset: () => { },
      onConfirmReset: () => { },
      backupToRestore: null,
      onCancelRestoreBackup: () => { },
      onConfirmRestoreBackup: () => { },
      backupToDelete: null,
      onCancelDeleteBackup: () => { },
      onConfirmDeleteBackup: () => { },
      isFactoryResetOpen: true,
      factoryResetIncludeApps: true,
      onChangeFactoryResetIncludeApps: () => { },
      onCancelFactoryReset: () => { },
      onConfirmFactoryReset: () => { },
      powerConfirmAction: null,
      powerCountdown: 10,
      powerForceClose: false,
      onChangePowerForceClose: () => { },
      onCancelPowerAction: () => { },
      onExecutePowerAction: () => { },
    })
  );
  assert.ok(factoryMarkup.includes(MODAL_SHADOW_AMBER));
  assert.ok(factoryMarkup.includes('bg-amber-500 border-amber-400'));
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

test('All Items / Todo headings and shortcut terminology stay aligned in English and Spanish', () => {
  assert.equal(translations.es.cat_all, 'Todo');
  assert.equal(translations.en.cat_all, 'All Items');
  assert.equal(translations.es.title_all_apps, 'TODO');
  assert.equal(translations.en.title_all_apps, 'ALL ITEMS');
  assert.equal(translations.es.title_apps, 'ACCESOS');
  assert.equal(translations.en.title_apps, 'SHORTCUTS');
  assert.equal(translations.es.title_most_used, 'MÁS USADOS');
  assert.equal(translations.en.title_most_used, 'MOST USED');
  assert.equal(translations.es.hud_clock_no_apps.includes('\u2014'), false);
  assert.equal(translations.en.hud_clock_no_apps.includes('\u2014'), false);

  const appSource = readFileSync('src/App.tsx', 'utf8');
  assert.ok(appSource.includes('const isAllCategory = cat.id === ALL_CATEGORY_ID;'));
  assert.ok(appSource.includes('{isAllCategory ? ('));
  assert.ok(appSource.includes("isAllCategory ? 'text-[15px]' : 'text-sm'"));
  assert.ok(appSource.includes("<LayoutGrid className=\"w-4 h-4 text-slate-400 shrink-0\" />"));
});

test('CyberAnalogClock renders sober dial with etched CyberLauncher icon watermark and no loud neon filters', () => {
  const fixedDate = new Date(2026, 10, 14, 15, 34, 23);
  const markup = renderToStaticMarkup(
    React.createElement(CyberAnalogClock, {
      visible: false,
      timeOverride: fixedDate,
    })
  );

  assert.ok(markup.includes('./icon-256.png'));
  assert.ok(markup.includes('cyber-clock-logo-clip'));
  assert.ok(markup.includes('cyber-clock-logo-fade'));
  assert.ok(markup.includes('width="82"'));
  assert.ok(markup.includes('font-size="11"'));
  assert.ok(markup.includes('15:34:23'));
  assert.equal(markup.includes('CYBERLAUNCHER'), false);
  assert.equal(markup.includes('CYBERGEMS'), false);
  assert.equal(markup.includes('feGaussianBlur'), false);
});

test('Collapsible favorites, scheduler inline shortcut search, and tray pin popup wrapping are localized and intact', () => {
  const appSource = readFileSync('src/App.tsx', 'utf8');
  const trayTipJs = readFileSync('public/tray/tray-pin-tip.js', 'utf8');
  const trayTipCss = readFileSync('public/tray/tray-pin-tip.css', 'utf8');
  const trayTipHtml = readFileSync('public/tray/tray-pin-tip.html', 'utf8');

  assert.ok(translations.es.favorites_collapse);
  assert.ok(translations.es.favorites_expand);
  assert.ok(translations.en.favorites_collapse);
  assert.ok(translations.en.favorites_expand);
  assert.ok(translations.es.hud_clock_no_matching_apps);
  assert.ok(translations.en.hud_clock_no_matching_apps);

  assert.ok(appSource.includes('cl_favorites_collapsed'));
  assert.ok(appSource.includes('aria-expanded={!isFavoritesCollapsed}'));
  assert.ok(appSource.includes('setAppSearchQuery'));
  assert.ok(appSource.includes("t('hud_clock_no_matching_apps')"));

  assert.ok(trayTipJs.includes('<span class="overflow-inline">'));
  assert.ok(trayTipCss.includes('.overflow-inline'));
  assert.ok(trayTipCss.includes('white-space: nowrap'));
  assert.ok(trayTipHtml.includes('class="checkbox-shell"'));
  assert.ok(trayTipHtml.includes('class="checkbox-box"'));
  assert.ok(trayTipCss.includes('#06b6d4'));
  assert.equal(trayTipHtml.includes('onerror='), false);
});

