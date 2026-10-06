import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CyberBot } from '../src/components/companion/CyberBot';
import { CyberBotAvatar } from '../src/components/companion/CyberBotAvatar';
import { cyberBotNotificationEmotion } from '../src/components/companion/cyberBotNotice';
import { CyberSpeechBubble } from '../src/components/companion/CyberSpeechBubble';
import { getCyberBotLayout } from '../src/components/companion/cyberBotLayout';
import { createCyberBotHoverAssist, createCyberBotIdleCycle, CYBERBOT_HOVER_DWELL_MS, CYBERBOT_HOVER_MOVE_COOLDOWN_MS, CYBERBOT_IDLE_EXPRESSIVE_MAX_MS, CYBERBOT_IDLE_EXPRESSIVE_MIN_MS, CYBERBOT_IDLE_HOVER_REST_MIN_MS, CYBERBOT_IDLE_NEUTRAL_MAX_MS, CYBERBOT_IDLE_NEUTRAL_MIN_MS, CYBERBOT_IDLE_REST_MIN_MS, CYBERBOT_SLEEP_MAX_IDLE_MS, CYBERBOT_SLEEP_MIN_IDLE_MS, CYBERBOT_SLEEP_MIN_REST_MS, CYBERBOT_VANISH_MAX_IDLE_MS, CYBERBOT_VANISH_MIN_AWAY_MS, CYBERBOT_VANISH_MIN_IDLE_MS, cyberBotExpressiveIdleExpressions, cyberBotNeutralIdleExpressions, getCyberBotIdleExpressionDuration, getCyberBotIdleRestDuration, nextCyberBotIdleExpression } from '../src/components/companion/cyberBotBehavior';
import { canReplaceCyberBotMessage, getCyberBotInitialPosition, isInQuietHours } from '../src/components/companion/useCyberBot';
import type { CyberBotMessage } from '../src/components/companion/companionTypes';
import { cyberBotPhrases, cyberBotPhraseKeyForCount, createCyberBotPhraseDeck, getCyberBotGreetingTopic, type CyberBotTopic } from '../src/components/companion/cyberBotPhrases';
import { CYBERBOT_NAME_MAX_LENGTH, CYBERBOT_NAME_REMIND_MS, cyberBotPhraseKeyWithName, isCyberBotNamePromptDue, normalizeCyberBotName } from '../src/components/companion/cyberBotName';
import { CYBERBOT_SETUP_REMIND_MS, isCyberBotDefaultSetup, isCyberBotSetupInviteDue } from '../src/components/companion/cyberBotSetup';
import { translations } from '../src/locales';
import { chooseNotificationChannel, type NotificationDeliverySettings } from '../src/notificationRouting';
import {
  chooseLaunchSpeechChannel,
  PIN_BLUR_REMINDER_COOLDOWN_MS,
  PIN_LAUNCH_BLUR_GUARD_MS,
  PIN_LAUNCH_HINT_COOLDOWN_MS,
  shouldClearToastForRendererCleanup,
  shouldHideLauncherAfterLaunch,
  shouldMentionPinOnLaunch,
  shouldRemindPinOnBlur,
} from '../src/launchFlow';

test('preferred names are optional, cleaned, and bounded', () => {
  assert.equal(normalizeCyberBotName('  Ana\n María  '), 'Ana María');
  assert.equal(normalizeCyberBotName('   '), '');
  assert.equal(Array.from(normalizeCyberBotName('Á'.repeat(50))).length, CYBERBOT_NAME_MAX_LENGTH);
});

test('the optional name invitation is offered at most twice', () => {
  const now = new Date(2026, 9, 5).getTime();
  assert.equal(isCyberBotNamePromptDue('', 'unseen', 0, now), true);
  assert.equal(isCyberBotNamePromptDue('', 'deferred', now + CYBERBOT_NAME_REMIND_MS, now), false);
  assert.equal(isCyberBotNamePromptDue('', 'deferred', now + CYBERBOT_NAME_REMIND_MS, now + CYBERBOT_NAME_REMIND_MS), true);
  assert.equal(isCyberBotNamePromptDue('', 'dismissed', 0, now), false);
  assert.equal(isCyberBotNamePromptDue('Ana', 'unseen', 0, now), false);
});

test('setup invitation targets only untouched default apps and categories, with a repeat cooldown', () => {
  const defaultApps = new Set([1001, 1002]);
  const defaultCategories = new Set(['all', 'uncategorized', 'utils']);
  const apps = [{ id: 1001 }, { id: 1002 }];
  const categories = [{ id: 'all' }, { id: 'uncategorized' }, { id: 'utils' }];
  assert.equal(isCyberBotDefaultSetup(apps, categories, defaultApps, defaultCategories), true);
  assert.equal(isCyberBotDefaultSetup([...apps, { id: 9999 }], categories, defaultApps, defaultCategories), false);
  assert.equal(isCyberBotDefaultSetup(apps, [...categories, { id: 'cat-custom' }], defaultApps, defaultCategories), false);
  assert.equal(isCyberBotDefaultSetup([{ id: 1002 }], categories, defaultApps, defaultCategories), true);

  const now = new Date(2026, 9, 5).getTime();
  assert.equal(isCyberBotSetupInviteDue(0, now), true);
  assert.equal(isCyberBotSetupInviteDue(now, now), false);
  assert.equal(isCyberBotSetupInviteDue(now, now + CYBERBOT_SETUP_REMIND_MS - 1), false);
  assert.equal(isCyberBotSetupInviteDue(now, now + CYBERBOT_SETUP_REMIND_MS), true);
});

test('setup and add-app guidance is available in Spanish and English', () => {
  for (const language of ['es', 'en'] as const) {
    for (const key of ['cyberbot_setup_invite', 'cyberbot_setup_add_app', 'cyberbot_setup_add_category'] as const) {
      assert.ok(translations[language][key]?.trim());
    }
    for (const topic of ['add_app', 'add_app_drop', 'add_category'] as const) {
      assert.ok(cyberBotPhrases[topic].length >= 2);
      for (const phrase of cyberBotPhrases[topic]) assert.ok(translations[language][phrase.key]?.trim());
    }
  }
});

test('only selected phrases use the preferred name and both languages have neutral fallbacks', () => {
  for (const key of ['cyberbot_greeting_morning', 'cyberbot_greeting_afternoon', 'cyberbot_greeting_evening', 'cyberbot_reaction_beep', 'cyberbot_last_launch_2'] as const) {
    const namedKey = cyberBotPhraseKeyWithName(key, 'Ana');
    assert.notEqual(namedKey, key);
    assert.equal(cyberBotPhraseKeyWithName(key, ''), key);
    for (const language of ['es', 'en'] as const) {
      assert.ok(translations[language][namedKey].includes('{userName}'));
      assert.ok(!translations[language][key].includes('{userName}'));
    }
  }
  assert.equal(cyberBotPhraseKeyWithName('cyberbot_greeting_morning_2', 'Ana'), 'cyberbot_greeting_morning_2');
  for (const language of ['es', 'en'] as const) {
    for (const key of ['cyberbot_name_title', 'cyberbot_name_invite', 'cyberbot_name_invite_set', 'cyberbot_name_invite_later', 'cyberbot_name_invite_never'] as const) {
      assert.ok(translations[language][key]?.trim());
    }
  }
});

test('the name invitation exposes its three explicit choices', () => {
  const html = renderToStaticMarkup(React.createElement(CyberSpeechBubble, {
    message: {
      id: 'name-invite', text: 'What should I call you?', timestamp: 0,
      action: { label: 'Choose a name', onClick: () => {} },
      secondaryAction: { label: 'Not now', onClick: () => {} },
      tertiaryAction: { label: "Don't ask again", onClick: () => {} },
    },
    onClose: () => {}, closeLabel: 'Dismiss',
  }));
  assert.match(html, /Choose a name/);
  assert.match(html, /Not now/);
  assert.match(html, /Don&#x27;t ask again/);
});

test('speech uses the CyberBot symbol without an empty header row', () => {
  const base = { id: 'greeting', text: 'Good morning', timestamp: 0 };
  const ordinary = renderToStaticMarkup(React.createElement(CyberSpeechBubble, {
    message: base, onClose: () => {}, closeLabel: 'Dismiss',
  }));
  assert.doesNotMatch(ordinary, /CYBERBOT/);
  assert.match(ordinary, /lucide-bot/);
  assert.doesNotMatch(ordinary, /icon-32\.png/);
  assert.match(ordinary, /Good morning/);
  assert.ok(ordinary.indexOf('lucide-bot') < ordinary.indexOf('Good morning'));
  assert.doesNotMatch(ordinary, /mb-1"><span aria-hidden/);

  const scheduled = renderToStaticMarkup(React.createElement(CyberSpeechBubble, {
    message: { ...base, tag: 'TIMER', emotion: 'alert' }, onClose: () => {}, closeLabel: 'Dismiss',
  }));
  assert.match(scheduled, /TIMER/);
});

test('app-launch count speech is clear for zero, one, and repeated launches in both languages', () => {
  assert.equal(cyberBotPhraseKeyForCount('cyberbot_chat_click_2', '0'), 'cyberbot_chat_click_2_zero');
  assert.equal(cyberBotPhraseKeyForCount('cyberbot_chat_click_2', '1'), 'cyberbot_chat_click_2_one');
  assert.equal(cyberBotPhraseKeyForCount('cyberbot_chat_click_2', '14'), 'cyberbot_chat_click_2');
  assert.equal(cyberBotPhraseKeyForCount('cyberbot_chat_click_3', '14'), 'cyberbot_chat_click_3');
  for (const language of ['es', 'en'] as const) {
    const { cyberbot_chat_click_2: many, cyberbot_chat_click_2_one: one, cyberbot_chat_click_2_zero: zero } = translations[language];
    assert.match(many, /\{count\}/);
    assert.doesNotMatch(one + zero, /\{count\}/);
    for (const phrase of [many, one, zero]) assert.match(phrase, /CyberLauncher/);
  }
});

test('CyberBot keeps the refined expression in-brand and shows sleep glyphs', () => {
  const confident = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'delighted' }));
  assert.match(confident, /data-cyberbot-face="delighted"/);
  assert.doesNotMatch(confident, /#f43f5e|♥/);

  const warm = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'affectionate' }));
  assert.doesNotMatch(warm, /#f43f5e|♥/);

  const sleeping = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'sleeping' }));
  assert.match(sleeping, /data-cyberbot-face="sleeping"/);
  assert.equal((sleeping.match(/>z<\/text>/g) || []).length, 2);
});

test('speech adds a finite facial signal without replacing the logo expression', () => {
  const silent = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'launcher' }));
  const speaking = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'launcher', speechKey: 'message:1' }));
  assert.match(silent, /data-cyberbot-speaking="false"/);
  assert.doesNotMatch(silent, /data-cyberbot-speech-wave/);
  assert.match(speaking, /data-cyberbot-face="launcher"/);
  assert.match(speaking, /data-cyberbot-speaking="true"/);
  assert.match(speaking, /data-cyberbot-speech-wave="true"/);
  assert.match(speaking, /M 64 38 H 68 V 42 H 72/);
});

test('speaking replaces each expression’s mouth instead of drawing a second one', () => {
  const mouths = [
    ['curious', 'M 46 51 Q 50 53 55 49'],
    ['delighted', 'M 44 51 Q 51 55 58 49'],
    ['sparkle', 'M 45 51 Q 51 54 57 50'],
    ['affectionate', 'M 45 51 Q 51 54 57 50'],
    ['happy', 'M 45 51 Q 51 54 57 50'],
    ['wink', 'M 45 51 Q 52 55 58 49'],
    ['alert', 'data-cyberbot-mouth="alert"'],
    ['storage', 'data-cyberbot-mouth="storage"'],
    ['scared', '>o</text>'],
    ['success', '‿'],
    ['speaking', '‿'],
    ['terminal', '>_</text>'],
  ] as const;
  for (const [emotion, mouth] of mouths) {
    const silent = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion }));
    const talking = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion, speechKey: `test:${emotion}` }));
    assert.ok(silent.includes(mouth), `${emotion} should retain its resting mouth`);
    assert.ok(!talking.includes(mouth), `${emotion} should hide its resting mouth while speaking`);
    assert.match(talking, /data-cyberbot-speech-wave="true"/);
  }
  const sleeping = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'sleeping', speechKey: 'test:sleep' }));
  assert.match(sleeping, /data-cyberbot-speaking="false"/);
  assert.doesNotMatch(sleeping, /data-cyberbot-speech-wave/);
});

test('RAM alerts keep the alert face while storage notices get a dedicated face', () => {
  assert.equal(cyberBotNotificationEmotion({ type: 'warning', action: 'open-hud-system' }), 'alert');
  assert.equal(cyberBotNotificationEmotion({ type: 'error', action: 'open-hud-system' }), 'alert');
  assert.equal(cyberBotNotificationEmotion({ type: 'warning', action: 'open-hud-storage' }), 'storage');
  assert.equal(cyberBotNotificationEmotion({ type: 'error', action: 'open-hud-storage' }), 'storage');
  assert.equal(cyberBotNotificationEmotion({ type: 'success' }), 'success');
  assert.equal(cyberBotNotificationEmotion({ type: 'info' }), 'speaking');

  const ram = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'alert' }));
  const storage = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'storage' }));
  assert.match(ram, /M 31 37 H 35 L 34 44 H 32 Z/);
  assert.match(storage, /data-cyberbot-face="storage"/);
  assert.match(storage, /x="43" y="51" width="14" height="6"/);
  assert.match(storage, /rgba\(245, 158, 11, 0\.45\)/);
});

test('announcement routing gives CyberBot priority with a banner fallback', () => {
  const settings: NotificationDeliverySettings = {
    botEnabled: true,
    bannersEnabled: true,
    chatterLevel: 'full',
    quietHours: { enabled: false, from: '22:00', to: '07:00' },
  };
  assert.equal(chooseNotificationChannel(settings, { critical: false }), 'bot');
  assert.equal(chooseNotificationChannel(settings, { critical: false, botAvailable: false }), 'banner');
  assert.equal(chooseNotificationChannel({ ...settings, botEnabled: false }, { critical: false }), 'banner');
  assert.equal(chooseNotificationChannel({ ...settings, botEnabled: false, bannersEnabled: false }, { critical: false }), 'none');
  assert.equal(chooseNotificationChannel({ ...settings, bannersEnabled: false }, { critical: false, botAvailable: false }), 'none');
});

test('minimal chatter and quiet hours mute ordinary notices without muting critical alerts', () => {
  const settings: NotificationDeliverySettings = {
    botEnabled: true,
    bannersEnabled: true,
    chatterLevel: 'minimal',
    quietHours: { enabled: false, from: '22:00', to: '07:00' },
  };
  assert.equal(chooseNotificationChannel(settings, { critical: false }), 'none');
  assert.equal(chooseNotificationChannel(settings, { critical: true }), 'bot');
  assert.equal(chooseNotificationChannel(settings, { critical: false, essential: true }), 'bot');
  const quiet = { ...settings, chatterLevel: 'full' as const, quietHours: { enabled: true, from: '22:00', to: '07:00' } };
  assert.equal(chooseNotificationChannel(quiet, { critical: false, now: new Date(2026, 9, 4, 23, 0) }), 'none');
  assert.equal(chooseNotificationChannel(quiet, { critical: true, now: new Date(2026, 9, 4, 23, 0) }), 'bot');
  assert.equal(chooseNotificationChannel(quiet, { critical: false, essential: true, now: new Date(2026, 9, 4, 23, 0) }), 'bot');
  assert.equal(chooseNotificationChannel(quiet, { critical: false, now: new Date(2026, 9, 4, 8, 0) }), 'bot');
});

test('launches hide only when unpinned and not scheduled to keep the window open', () => {
  assert.equal(shouldHideLauncherAfterLaunch(false, false), true);
  assert.equal(shouldHideLauncherAfterLaunch(true, false), false);
  assert.equal(shouldHideLauncherAfterLaunch(false, true), false);
  assert.equal(shouldHideLauncherAfterLaunch(true, true), false);
});

test('launch speech follows actual visibility and never falls back to a banner', () => {
  const settings: NotificationDeliverySettings = {
    botEnabled: true,
    bannersEnabled: true,
    chatterLevel: 'full',
    quietHours: { enabled: false, from: '22:00', to: '07:00' },
  };
  assert.equal(chooseLaunchSpeechChannel(settings, false, true, true), 'inline');
  assert.equal(chooseLaunchSpeechChannel(settings, true, true, true), 'floating');
  assert.equal(chooseLaunchSpeechChannel(settings, true, false, false), 'none');
  assert.equal(chooseLaunchSpeechChannel(settings, false, false, true), 'none');
  assert.equal(chooseLaunchSpeechChannel({ ...settings, botEnabled: false }, true, true, true), 'none');
  assert.equal(chooseLaunchSpeechChannel({ ...settings, chatterLevel: 'minimal' }, true, true, true), 'none');
  const quiet = { ...settings, quietHours: { enabled: true, from: '22:00', to: '07:00' } };
  assert.equal(chooseLaunchSpeechChannel(quiet, true, true, true, new Date(2026, 9, 4, 23, 0)), 'none');
  assert.equal(shouldClearToastForRendererCleanup('launch'), false);
  assert.equal(shouldClearToastForRendererCleanup('system-alert'), true);
  assert.equal(shouldClearToastForRendererCleanup(), true);
  for (const language of ['es', 'en'] as const) {
    assert.ok(translations[language].launch_missing_path_detail.trim());
  }
});

test('PIN guidance pauses after a launch and does not repeat on every outside click', () => {
  const start = 100_000;
  assert.equal(shouldMentionPinOnLaunch(start, 0), true);
  assert.equal(shouldMentionPinOnLaunch(start + PIN_LAUNCH_HINT_COOLDOWN_MS - 1, start), false);
  assert.equal(shouldMentionPinOnLaunch(start + PIN_LAUNCH_HINT_COOLDOWN_MS, start), true);
  assert.equal(shouldRemindPinOnBlur(start + PIN_LAUNCH_BLUR_GUARD_MS - 1, start, 0), false);
  assert.equal(shouldRemindPinOnBlur(start + PIN_LAUNCH_BLUR_GUARD_MS, start, 0), true);
  assert.equal(shouldRemindPinOnBlur(start + PIN_BLUR_REMINDER_COOLDOWN_MS - 1, 0, start), false);
  assert.equal(shouldRemindPinOnBlur(start + PIN_BLUR_REMINDER_COOLDOWN_MS, 0, start), true);
});

test('floating CyberBot keeps scheduled actions and release links usable', () => {
  const html = readFileSync(new URL('../public/tray/toast-window.html', import.meta.url), 'utf8');
  const source = readFileSync(new URL('../public/tray/toast-window.js', import.meta.url), 'utf8');
  const ids = [...source.matchAll(/getElementById\('([^']+)'\)/g)].map(match => match[1]);
  for (const id of ids) assert.ok(html.includes(`id="${id}"`), `Missing toast element ${id}`);

  const elements = new Map<string, {
    classList: { add: (...names: string[]) => void; remove: (...names: string[]) => void; toggle: (name: string, force?: boolean) => void; contains: (name: string) => boolean };
    dataset: Record<string, string>;
    textContent: string;
    listeners: Record<string, (event: { stopPropagation: () => void }) => void>;
    addEventListener: (event: string, handler: (event: { stopPropagation: () => void }) => void) => void;
    setAttribute: (name: string, value: string) => void;
  }>();
  let speechRestarts = 0;
  const element = (id: string) => {
    if (!elements.has(id)) {
      const classes = new Set<string>(['hidden']);
      const listeners: Record<string, (event: { stopPropagation: () => void }) => void> = {};
      elements.set(id, {
        classList: {
          add: (...names) => names.forEach(name => { if (id === 'cyberbotCard' && name === 'speaking') speechRestarts++; classes.add(name); }),
          remove: (...names) => names.forEach(name => classes.delete(name)),
          toggle: (name, force) => { if (force === undefined ? !classes.has(name) : force) classes.add(name); else classes.delete(name); },
          contains: name => classes.has(name),
        },
        dataset: {}, textContent: '', listeners,
        addEventListener: (event, handler) => { listeners[event] = handler; },
        setAttribute: () => {},
      });
    }
    return elements.get(id)!;
  };
  const actions: Array<[string, unknown]> = [];
  let receive: (data: Record<string, unknown>) => void = () => {};
  runInNewContext(source, {
    document: { getElementById: element },
    window: { desktopToast: {
      onData: (callback: typeof receive) => { receive = callback; },
      action: (name: string, payload: unknown) => actions.push([name, payload]),
      hide: () => {},
    } },
  });
  const click = (id: string) => element(id).listeners.click({ stopPropagation: () => {} });

  receive({ presentation: 'bot', type: 'imminent', taskId: 'task-1', title: 'Launching in 9s', detail: 'Editor', actionLabelLaunch: 'Launch now', actionLabelCancel: 'Cancel' });
  assert.equal(element('cyberbotCard').classList.contains('hidden'), false);
  assert.equal(element('cyberbotCard').classList.contains('speaking'), true);
  assert.equal(speechRestarts, 1);
  assert.equal(element('standardCard').classList.contains('hidden'), true);
  assert.equal(element('cyberbotTitle').textContent, 'Launching in 9s');
  receive({ presentation: 'bot', type: 'imminent', taskId: 'task-1', title: 'Launching in 8s', detail: 'Editor', actionLabelLaunch: 'Launch now', actionLabelCancel: 'Cancel' });
  assert.equal(speechRestarts, 1, 'countdown updates should not restart the speaking cue');
  click('cyberbotActionBtn');
  click('cyberbotSecondaryBtn');
  assert.deepEqual(actions.map(action => action[0]), ['launch-now', 'cancel-task']);

  receive({ presentation: 'bot', type: 'info', title: 'Update available', action: 'open-about', actionLabel: 'About', releaseUrl: 'https://example.com/release', releaseLabel: 'Release notes' });
  assert.equal(speechRestarts, 2);
  click('cyberbotActionBtn');
  click('cyberbotSecondaryBtn');
  assert.deepEqual(actions.map(action => action[0]), ['launch-now', 'cancel-task', 'open-hud', 'open-release']);

  receive({ presentation: 'bot', type: 'info', source: 'launch', title: 'Opening Editor' });
  assert.equal(speechRestarts, 3);
  assert.equal(element('cyberbotCard').classList.contains('hidden'), false);
  assert.equal(element('cyberbotTitle').textContent, 'Opening Editor');
  assert.equal(element('cyberbotActions').classList.contains('hidden'), true);
  receive({ type: 'hide' });
  assert.equal(element('cyberbotCard').classList.contains('speaking'), false);

  receive({ presentation: 'bot', type: 'warning', action: 'open-hud-system', title: 'High RAM usage' });
  assert.equal(element('cyberbotCard').classList.contains('alert'), true);
  assert.equal(element('cyberbotCard').classList.contains('storage'), false);
  receive({ presentation: 'bot', type: 'warning', action: 'open-hud-storage', title: 'Low disk space' });
  assert.equal(element('cyberbotCard').classList.contains('alert'), true);
  assert.equal(element('cyberbotCard').classList.contains('storage'), true);
  assert.equal(speechRestarts, 5);
  receive({ presentation: 'bot', type: 'info', title: 'Routine notice' });
  assert.equal(element('cyberbotCard').classList.contains('alert'), false);
  assert.equal(element('cyberbotCard').classList.contains('storage'), false);
});

test('floating CyberBot keeps a compact, responsive bubble beside an 84px avatar', () => {
  const css = readFileSync(new URL('../public/tray/toast-window.css', import.meta.url), 'utf8');
  assert.match(css, /\.cyberbot-card\s*\{[^}]*width:\s*fit-content;[^}]*max-width:\s*100%;/s);
  assert.match(css, /\.cyberbot-avatar\s*\{[^}]*flex:\s*0 0 84px;[^}]*width:\s*84px;/s);
  assert.match(css, /\.cyberbot-bubble\s*\{[^}]*flex:\s*0 1 auto;[^}]*width:\s*max-content;[^}]*max-width:\s*382px;/s);
});

test('floating speech cue is finite and disabled under reduced motion', () => {
  const html = readFileSync(new URL('../public/tray/toast-window.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../public/tray/toast-window.css', import.meta.url), 'utf8');
  assert.match(html, /class="bot-speech-wave"/);
  assert.match(html, /class="bot-antenna-signal"/);
  assert.match(html, /M31 37h4l-1 7h-2z M32 46h2v3h-2z/);
  assert.match(html, /class="bot-face-alert"[\s\S]*class="bot-mouth" x="45" y="42" width="10" height="5"/);
  assert.match(html, /class="bot-face-storage"[\s\S]*class="bot-mouth"[\s\S]*x="43" y="51" width="14" height="6"/);
  assert.match(css, /\.cyberbot-card\.alert:not\(\.storage\) \.bot-face-alert \{ display: inline; \}/);
  assert.match(css, /\.cyberbot-card\.storage \.bot-face-storage \{ display: inline; \}/);
  assert.match(css, /\.cyberbot-card\.speaking \.bot-head \{ animation: botSpeechNod 1\.8s/);
  assert.match(css, /@keyframes botSpeechSignal \{[^}]*100% \{ opacity: 0; \}/);
  assert.match(css, /\.cyberbot-card\.speaking \.bot-face-alert \.bot-mouth,[\s\S]*\.bot-face-storage \.bot-mouth \{ animation: botSpeechMouth 1\.8s/);
  assert.match(css, /@keyframes botSpeechMouth \{ 0%, 99% \{ opacity: 0; \} 100% \{ opacity: 1; \} \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.cyberbot-card\.speaking \.bot-speech-wave line,[\s\S]*animation: none;/);
});

const message = (priority: CyberBotMessage['priority']): CyberBotMessage => ({
  id: 'critical',
  text: 'Critical alert',
  priority,
  timestamp: 0,
});

test('casual messages cannot interrupt a critical alert', () => {
  assert.equal(canReplaceCyberBotMessage(message('high'), 'low'), false);
  assert.equal(canReplaceCyberBotMessage(message('high'), 'normal'), false);
  assert.equal(canReplaceCyberBotMessage(message('normal'), 'low'), false);
  assert.equal(canReplaceCyberBotMessage(message('normal'), 'high'), true);
  assert.equal(canReplaceCyberBotMessage(message('high'), 'high'), true);
  assert.equal(canReplaceCyberBotMessage(null, 'low'), true);
});

test('quiet hours span midnight and stop at the configured end', () => {
  const at = (hour: number) => new Date(2026, 9, 4, hour, 0);
  assert.equal(isInQuietHours('22:00', '07:00', at(21)), false);
  assert.equal(isInQuietHours('22:00', '07:00', at(22)), true);
  assert.equal(isInQuietHours('22:00', '07:00', at(0)), true);
  assert.equal(isInQuietHours('22:00', '07:00', at(7)), false);
});

test('the avatar and speech remain inside the viewport after dragging to an edge', () => {
  for (const preferred of [{ left: -200, top: -100 }, { left: 900, top: 800 }]) {
    const layout = getCyberBotLayout({ width: 800, height: 600, preferred, align: 'right', bubbleHeight: 120, obstacles: [] });
    assert.equal(layout.hidden, false);
    assert.equal(layout.bubbleVisible, true);
    assert.ok(layout.left >= 12 && layout.left + 94 <= 788);
    assert.ok(layout.top - 132 >= 12 && layout.top + 94 <= 588);
    const speechLeft = layout.align === 'right' ? layout.left + 94 - layout.bubbleWidth : layout.left;
    assert.ok(speechLeft >= 12 && speechLeft + layout.bubbleWidth <= 788);
  }
});

test('an unconfigured CyberBot starts at the right, including in a narrow window', () => {
  assert.equal(getCyberBotInitialPosition(null), 'bottom-right');
  assert.equal(getCyberBotInitialPosition('invalid'), 'bottom-right');
  assert.equal(getCyberBotInitialPosition('bottom-left'), 'bottom-left');
  assert.equal(getCyberBotInitialPosition('top-right'), 'top-right');

  for (const width of [451, 800]) {
    const layout = getCyberBotLayout({
      width, height: 600, preferred: { left: width - 126, top: 450 },
      align: 'right', bubbleHeight: 140, obstacles: [],
    });
    assert.equal(layout.left, width - 126);
    assert.equal(layout.align, 'right');
  }
});

test('a right panel moves the robot and its entire bubble aside, then the saved position is restored', () => {
  const base = { width: 800, height: 600, preferred: { left: 674, top: 450 }, align: 'right' as const, bubbleHeight: 100 };
  const original = getCyberBotLayout({ ...base, obstacles: [] });
  const aside = getCyberBotLayout({ ...base, obstacles: [{ left: 380, top: 0, right: 800, bottom: 600 }] });
  assert.ok(aside.left + 94 <= 368);
  assert.equal(aside.bubbleVisible, true);
  assert.equal(aside.hidden, false);
  const speechRight = aside.align === 'right' ? aside.left + 94 : aside.left + aside.bubbleWidth;
  assert.ok(speechRight <= 368);
  assert.deepEqual(getCyberBotLayout({ ...base, obstacles: [] }), original);
});

test('speech fits the narrow free strip shown beside a large panel', () => {
  const layout = getCyberBotLayout({
    width: 830, height: 1080, preferred: { left: 704, top: 930 }, align: 'right', bubbleHeight: 180,
    obstacles: [{ left: 204, top: 0, right: 830, bottom: 1080 }],
  });
  assert.equal(layout.bubbleVisible, true);
  assert.equal(layout.bubbleWidth, 180);
  assert.ok(layout.left + 94 <= 192);
});

test('a full-width panel hides the companion; a smaller gap can keep just the avatar', () => {
  const base = { width: 800, height: 600, preferred: { left: 674, top: 450 }, align: 'right' as const, bubbleHeight: 120 };
  assert.equal(getCyberBotLayout({ ...base, obstacles: [{ left: 0, top: 0, right: 800, bottom: 600 }] }).hidden, true);
  const compact = getCyberBotLayout({ ...base, obstacles: [{ left: 140, top: 0, right: 800, bottom: 600 }] });
  assert.equal(compact.hidden, false);
  assert.equal(compact.bubbleVisible, false);
  assert.ok(compact.left + 94 <= 128);
});

test('centered dialogs and overlapping panels both remain unobstructed', () => {
  const obstacles = [
    { left: 800, top: 0, right: 1200, bottom: 800 },
    { left: 350, top: 100, right: 850, bottom: 700 },
  ];
  const layout = getCyberBotLayout({ width: 1200, height: 800, preferred: { left: 1074, top: 650 }, align: 'right', bubbleHeight: 120, obstacles });
  assert.equal(layout.hidden, false);
  assert.equal(layout.bubbleVisible, true);
  const footprint = {
    left: layout.align === 'right' ? layout.left + 94 - layout.bubbleWidth : layout.left,
    right: layout.align === 'right' ? layout.left + 94 : layout.left + layout.bubbleWidth,
    top: layout.top - 132,
    bottom: layout.top + 94,
  };
  for (const obstacle of obstacles) {
    assert.ok(footprint.right <= obstacle.left - 12 || footprint.left >= obstacle.right + 12 || footprint.bottom <= obstacle.top - 12 || footprint.top >= obstacle.bottom + 12);
  }
});

test('idle cycle favors 15–30 second departures and eventually takes a 45–60 second sleep', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const changes: string[] = [];
  const cycle = createCyberBotIdleCycle(state => changes.push(state), () => 0);
  context.mock.timers.tick(CYBERBOT_VANISH_MIN_IDLE_MS - 1);
  cycle.wake();
  context.mock.timers.tick(CYBERBOT_VANISH_MIN_IDLE_MS - 1);
  assert.deepEqual(changes, []);
  context.mock.timers.tick(1);
  assert.deepEqual(changes, ['hidden']);
  context.mock.timers.tick(CYBERBOT_VANISH_MIN_AWAY_MS);
  context.mock.timers.tick(CYBERBOT_VANISH_MIN_IDLE_MS);
  assert.deepEqual(changes, ['hidden', 'awake', 'hidden']);
  context.mock.timers.tick(CYBERBOT_VANISH_MIN_AWAY_MS);
  context.mock.timers.tick(CYBERBOT_SLEEP_MIN_IDLE_MS - 1);
  assert.deepEqual(changes.at(-1), 'awake');
  context.mock.timers.tick(1);
  assert.deepEqual(changes.at(-1), 'sleeping');
  context.mock.timers.tick(CYBERBOT_SLEEP_MIN_REST_MS);
  assert.deepEqual(changes.at(-1), 'awake');
  cycle.dispose();
  const count = changes.length;
  context.mock.timers.tick(CYBERBOT_SLEEP_MAX_IDLE_MS * 3);
  assert.equal(changes.length, count);
});

test('the random idle windows reach their upper limits and either state wakes on activity', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const changes: Array<{ state: string; style: string }> = [];
  const sequence = [0, 0.999999, 0.999999, 0, 0];
  const cycle = createCyberBotIdleCycle((state, style) => changes.push({ state, style }), () => sequence.shift() ?? 0);
  context.mock.timers.tick(CYBERBOT_VANISH_MAX_IDLE_MS - 1);
  assert.deepEqual(changes, []);
  context.mock.timers.tick(1);
  assert.deepEqual(changes.at(-1), { state: 'hidden', style: 'ascend' });
  cycle.wake();
  assert.deepEqual(changes.at(-1), { state: 'awake', style: 'ascend' });
  cycle.dispose();

  const sleepChanges: string[] = [];
  const sleepCycle = createCyberBotIdleCycle(state => sleepChanges.push(state), () => 0.999999);
  context.mock.timers.tick(CYBERBOT_SLEEP_MAX_IDLE_MS - 1);
  assert.deepEqual(sleepChanges, []);
  context.mock.timers.tick(1);
  assert.deepEqual(sleepChanges, ['sleeping']);
  sleepCycle.wake();
  assert.deepEqual(sleepChanges, ['sleeping', 'awake']);
  sleepCycle.dispose();
});

test('messages or busy UI interrupt and suspend either idle gesture', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const changes: string[] = [];
  const cycle = createCyberBotIdleCycle(state => changes.push(state), () => 0);
  cycle.pause();
  context.mock.timers.tick(CYBERBOT_VANISH_MAX_IDLE_MS * 2);
  assert.deepEqual(changes, []);
  cycle.resume();
  context.mock.timers.tick(CYBERBOT_VANISH_MIN_IDLE_MS);
  assert.deepEqual(changes, ['hidden']);
  cycle.pause();
  assert.deepEqual(changes, ['hidden', 'awake']);
  context.mock.timers.tick(CYBERBOT_VANISH_MIN_AWAY_MS * 2);
  assert.deepEqual(changes, ['hidden', 'awake']);
  cycle.resume();
  context.mock.timers.tick(CYBERBOT_VANISH_MIN_IDLE_MS);
  assert.deepEqual(changes, ['hidden', 'awake', 'hidden']);
  cycle.wake();
  assert.deepEqual(changes, ['hidden', 'awake', 'hidden', 'awake']);
  cycle.dispose();
});

test('hover assistance warns for three seconds and can be canceled before moving', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const counts: Array<number | null> = [];
  let moves = 0;
  const assist = createCyberBotHoverAssist(count => counts.push(count), () => { moves += 1; });

  assist.enter();
  context.mock.timers.tick(CYBERBOT_HOVER_DWELL_MS - 1);
  assert.deepEqual(counts, []);
  context.mock.timers.tick(1);
  assert.deepEqual(counts, [3]);
  context.mock.timers.tick(1000);
  assert.deepEqual(counts, [3, 2]);
  assist.cancel();
  context.mock.timers.tick(5000);
  assert.equal(moves, 0);
  assert.deepEqual(counts, [3, 2, null]);

  assist.leave();
  assist.enter();
  context.mock.timers.tick(CYBERBOT_HOVER_DWELL_MS);
  context.mock.timers.tick(1000);
  context.mock.timers.tick(1000);
  context.mock.timers.tick(1000);
  assert.equal(moves, 1);
  assert.deepEqual(counts.slice(-4), [3, 2, 1, null]);

  assist.leave();
  assist.enter();
  context.mock.timers.tick(CYBERBOT_HOVER_DWELL_MS + 3000);
  assert.equal(moves, 1, 'a new hover cannot cause an immediate second relocation');
  context.mock.timers.tick(CYBERBOT_HOVER_MOVE_COOLDOWN_MS);
  assist.leave();
  assist.enter();
  context.mock.timers.tick(CYBERBOT_HOVER_DWELL_MS);
  assert.equal(counts.at(-1), 3);
  assist.dispose();
  context.mock.timers.tick(5000);
  assert.equal(moves, 1);
});

test('leaving during the countdown cancels the hover move', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  let moves = 0;
  const assist = createCyberBotHoverAssist(() => {}, () => { moves += 1; });
  assist.enter();
  context.mock.timers.tick(CYBERBOT_HOVER_DWELL_MS + 1000);
  assist.leave();
  context.mock.timers.tick(5000);
  assert.equal(moves, 0);
  assist.dispose();
});

test('idle expressions favor neutral faces and never repeat consecutively', () => {
  let seed = 42;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let previous: CyberBotMessage['emotion'] = 'idle';
  let neutralCount = 0;
  let expressiveCount = 0;

  for (let i = 0; i < 500; i++) {
    const face = nextCyberBotIdleExpression(previous ?? 'idle', random);
    assert.notEqual(face, previous);
    if (cyberBotNeutralIdleExpressions.includes(face as typeof cyberBotNeutralIdleExpressions[number])) neutralCount += 1;
    if (cyberBotExpressiveIdleExpressions.includes(face as typeof cyberBotExpressiveIdleExpressions[number])) expressiveCount += 1;
    previous = face;
  }

  assert.ok(neutralCount > expressiveCount * 4, 'neutral faces should dominate the idle loop');
  assert.equal(neutralCount + expressiveCount, 500);
});

test('idle timing keeps neutral and resting faces on screen longer than cheerful gestures', () => {
  assert.equal(getCyberBotIdleRestDuration(false, false, () => 0), CYBERBOT_IDLE_REST_MIN_MS);
  assert.equal(getCyberBotIdleRestDuration(true, false, () => 0), CYBERBOT_IDLE_HOVER_REST_MIN_MS);
  assert.equal(getCyberBotIdleExpressionDuration('curious', () => 0), CYBERBOT_IDLE_NEUTRAL_MIN_MS);
  assert.equal(getCyberBotIdleExpressionDuration('terminal', () => 0.999999), CYBERBOT_IDLE_NEUTRAL_MAX_MS);
  assert.equal(getCyberBotIdleExpressionDuration('happy', () => 0), CYBERBOT_IDLE_EXPRESSIVE_MIN_MS);
  assert.equal(getCyberBotIdleExpressionDuration('happy', () => 0.999999), CYBERBOT_IDLE_EXPRESSIVE_MAX_MS);
  assert.ok(CYBERBOT_IDLE_NEUTRAL_MIN_MS > CYBERBOT_IDLE_EXPRESSIVE_MAX_MS);
});

test('the About panel has a bilingual phrase deck featuring the CyberLauncher face', () => {
  assert.equal(cyberBotPhrases.about.length, 3);
  assert.ok(cyberBotPhrases.about.some(phrase => phrase.emotion === 'launcher'));
  for (const { key } of cyberBotPhrases.about) {
    assert.ok(translations.es[key]?.trim());
    assert.ok(translations.en[key]?.trim());
  }
});

test('Cyber Terminal has a bilingual contextual phrase deck', () => {
  assert.equal(cyberBotPhrases.terminal.length, 3);
  assert.ok(cyberBotPhrases.terminal.some(phrase => phrase.emotion === 'terminal'));
  for (const { key } of cyberBotPhrases.terminal) {
    assert.ok(translations.es[key]?.trim());
    assert.ok(translations.en[key]?.trim());
  }
});

test('the companion exposes one keyboard button and an accessible dismiss action', () => {
  const html = renderToStaticMarkup(React.createElement(CyberBot, {
    enabled: true,
    activeMessage: message('high'),
    onDismissMessage: () => {},
    dragBoundsRef: React.createRef<HTMLDivElement>(),
    interactLabel: 'Interact with CyberBot',
    closeLabel: 'Dismiss CyberBot message',
    hoverAssistText: count => `Moving in ${count}`,
  }));

  assert.match(html, /<button[^>]*aria-label="Interact with CyberBot"/);
  assert.match(html, /aria-label="Dismiss CyberBot message"/);
  assert.match(html, /data-no-hide/);
  assert.match(html, /data-cyberbot-control/);
  assert.match(html, /data-cyberbot-face="launcher"/);
  assert.match(html, /role="alert"/);
  assert.equal((html.match(/aria-label="Interact with CyberBot"/g) || []).length, 1);
});

test('each phrase deck exhausts its choices before repeating and avoids consecutive repeats across rounds', () => {
  let seed = 42;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const deck = createCyberBotPhraseDeck(random);

  for (const topic of Object.keys(cyberBotPhrases) as CyberBotTopic[]) {
    let previous: string | undefined;
    const expected = new Set(cyberBotPhrases[topic].map(phrase => phrase.key));
    for (let round = 0; round < 8; round++) {
      const seen = new Set<string>();
      for (let i = 0; i < expected.size; i++) {
        assert.equal(deck.tryNext(topic, phrase => {
          assert.notEqual(phrase.key, previous, `${topic}: repeated at a round boundary`);
          assert.equal(seen.has(phrase.key), false, `${topic}: repeated before deck was exhausted`);
          seen.add(phrase.key);
          previous = phrase.key;
          return true;
        }), true);
      }
      assert.deepEqual(seen, expected);
    }
  }
});

test('suppressed speech keeps its next phrase and contexts do not consume each other', () => {
  const deck = createCyberBotPhraseDeck(() => 0);
  let pending: string;
  assert.equal(deck.tryNext('interaction', phrase => {
    pending = phrase.key;
    return false;
  }), false);

  assert.equal(deck.tryNext('backup_success', () => true), true);
  assert.equal(deck.tryNext('interaction', phrase => {
    assert.equal(phrase.key, pending);
    return true;
  }), true);
  deck.tryNext('interaction', phrase => {
    assert.notEqual(phrase.key, pending);
    return true;
  });
});

test('every catalog phrase has matching English and Spanish placeholders and no duplicate entries', () => {
  const allKeys = new Set<string>();
  for (const phrases of Object.values(cyberBotPhrases)) {
    for (const { key } of phrases) {
      assert.equal(allKeys.has(key), false, `Duplicate catalog entry: ${key}`);
      allKeys.add(key);
      const es = translations.es[key];
      const en = translations.en[key];
      assert.ok(es?.trim(), `Missing Spanish phrase: ${key}`);
      assert.ok(en?.trim(), `Missing English phrase: ${key}`);
      assert.deepEqual(es.match(/\{\w+\}/g) || [], en.match(/\{\w+\}/g) || [], key);
    }
  }
});

test('hover assistance labels and countdown are translated in both languages', () => {
  for (const language of ['es', 'en'] as const) {
    assert.ok(translations[language].cyberbot_hover_assist_title);
    assert.ok(translations[language].cyberbot_hover_assist_desc);
    assert.ok(translations[language].cyberbot_hover_assist_message.includes('{count}'));
  }
});

test('launch and return variants retain the application name in both languages', () => {
  for (const topic of ['launch', 'launch_admin', 'launch_pinned', 'launch_admin_pinned', 'last_launch'] as const) {
    for (const { key } of cyberBotPhrases[topic]) {
      for (const language of ['es', 'en'] as const) {
        assert.ok(translations[language][key].includes('{name}'), `${language}: ${key}`);
      }
    }
  }
  for (const { key } of cyberBotPhrases.pin_blur) {
    for (const language of ['es', 'en'] as const) {
      assert.ok(translations[language][key].includes('PIN'), `${language}: ${key}`);
    }
  }
});

test('greetings follow local morning, afternoon, and night boundaries', () => {
  const at = (hour: number, minute = 0) => new Date(2026, 9, 4, hour, minute);
  assert.equal(getCyberBotGreetingTopic(at(4, 59)), 'greeting_evening');
  assert.equal(getCyberBotGreetingTopic(at(5)), 'greeting_morning');
  assert.equal(getCyberBotGreetingTopic(at(11, 59)), 'greeting_morning');
  assert.equal(getCyberBotGreetingTopic(at(12)), 'greeting_afternoon');
  assert.equal(getCyberBotGreetingTopic(at(19, 59)), 'greeting_afternoon');
  assert.equal(getCyberBotGreetingTopic(at(20)), 'greeting_evening');
});
