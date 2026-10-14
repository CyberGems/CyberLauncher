import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CyberBot } from '../src/components/companion/CyberBot';
import { createCyberBotContextPresence, CYBERBOT_CONTEXT_RETIRE_MS, CYBERBOT_CONTEXT_RETURN_MS } from '../src/components/companion/cyberBotContextPresence';
import { CyberBotAvatar } from '../src/components/companion/CyberBotAvatar';
import { createCyberBotTypewriter, cyberBotSpeechLifetime, cyberBotTypingDuration, CYBERBOT_CHARACTER_MS, type CyberBotTypingState } from '../src/components/companion/cyberBotTyping';
import { CyberBotTypingText } from '../src/components/companion/CyberBotTypingText';
import { DesktopCyberBotAvatar } from '../src/components/companion/desktop/DesktopCyberBotAvatar';
import { nextApprovedMarquee, approvedMarqueeTiming, createApprovedMarkup, createCyberBotHoverReaction } from '../src/components/companion/approved/approvedCyberBotBehavior';
import { createCyberBotReturnController, createCyberBotNoticeLedger, CYBERBOT_RETURN_ABSENCE_MS, CYBERBOT_RETURN_GREETING_COOLDOWN_MS } from '../src/components/companion/cyberBotReturn';
import { cyberBotNotificationEmotion } from '../src/components/companion/cyberBotNotice';
import { CyberSpeechBubble } from '../src/components/companion/CyberSpeechBubble';
import { getCyberBotLayout, getCyberBotAnchor, isCyberBotAtFloor, CYBERBOT_LANDED_BOTTOM } from '../src/components/companion/cyberBotLayout';
import {
  createCyberBotHoverAssist,
  createCyberBotIdleCycle,
  CYBERBOT_HOVER_DWELL_MS,
  CYBERBOT_HOVER_MOVE_COOLDOWN_MS,
  CYBERBOT_IDLE_EXPRESSIVE_CHANCE,
  CYBERBOT_IDLE_EXPRESSIVE_MAX_MS,
  CYBERBOT_IDLE_EXPRESSIVE_MIN_MS,
  CYBERBOT_IDLE_MARQUEE_MIN_INTERVAL_MS,
  createCyberBotIdleExpressionPicker,
  CYBERBOT_IDLE_MARQUEE_CHANCE,
  CYBERBOT_IDLE_MARQUEE_MAX_MS,
  CYBERBOT_IDLE_MARQUEE_MIN_MS,
  CYBERBOT_IDLE_NEUTRAL_MAX_MS,
  CYBERBOT_IDLE_NEUTRAL_MIN_MS,
  CYBERBOT_SLEEP_MAX_IDLE_MS,
  CYBERBOT_SLEEP_MIN_IDLE_MS,
  CYBERBOT_SLEEP_MIN_REST_MS,
  CYBERBOT_VANISH_MAX_IDLE_MS,
  CYBERBOT_VANISH_MIN_AWAY_MS,
  CYBERBOT_VANISH_MIN_IDLE_MS,
  cyberBotExpressiveIdleExpressions,
  cyberBotNeutralIdleExpressions,
  getCyberBotIdleExpressionDuration,
  getCyberBotIdleMarqueeMessages,
  getCyberBotMarqueeStatusMessages,
  nextCyberBotIdleExpression,
  nextCyberBotIdleMarqueeMessage,
  shouldCyberBotBlink,
} from '../src/components/companion/cyberBotBehavior';
import { canReplaceCyberBotMessage, getCyberBotInitialPosition, isInQuietHours } from '../src/components/companion/useCyberBot';
import type { CyberBotMessage } from '../src/components/companion/companionTypes';
import { cyberBotPhrases, cyberBotPhraseKeyForCount, createCyberBotPhraseDeck, getCyberBotGreetingTopic, type CyberBotPhrase, type CyberBotTopic } from '../src/components/companion/cyberBotPhrases';
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
  for (const key of ['cyberbot_greeting_morning', 'cyberbot_greeting_afternoon', 'cyberbot_greeting_evening', 'cyberbot_reaction_beep', 'cyberbot_return'] as const) {
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
    for (const key of ['cyberbot_name_title', 'cyberbot_name_invite', 'cyberbot_name_placeholder', 'cyberbot_name_save', 'cyberbot_name_ask_again', 'cyberbot_name_invite_later', 'cyberbot_name_invite_never'] as const) {
      assert.ok(translations[language][key]?.trim());
    }
  }
});

test('the name invitation offers an inline field, saving, and both opt-out choices', () => {
  const html = renderToStaticMarkup(React.createElement(CyberSpeechBubble, {
    message: {
      id: 'name-invite', text: 'What should I call you?', timestamp: 0,
      nameEntry: { label: 'Your name', placeholder: 'Name or nickname', submitLabel: 'Save name', onSubmit: () => {} },
      secondaryAction: { label: 'Not now', onClick: () => {} },
      tertiaryAction: { label: "Don't ask again", onClick: () => {} },
    },
    onClose: () => {}, closeLabel: 'Dismiss',
  }));
  assert.match(html, /<form/);
  assert.match(html, /<label[^>]*>Your name<\/label>/);
  assert.match(html, /autoComplete="nickname"/);
  assert.match(html, /placeholder="Name or nickname"/);
  assert.match(html, /type="submit" disabled=""/);
  assert.match(html, /Save name/);
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
  assert.equal((sleeping.match(/>[zZ]<\/text>/g) || []).length, 2);
});

test('the marquee face replaces the eyes with clipped, version-aware status text', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as { version: string };
  const messages = getCyberBotIdleMarqueeMessages(packageJson.version);
  assert.deepEqual(messages, [
    `CYBERLAUNCHER v${packageJson.version}`,
  ]);

  const marquee = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'marquee' }));
  assert.match(marquee, /data-cyberbot-face="marquee"/);
  assert.match(marquee, /data-cyberbot-marquee=/);
  assert.match(marquee, /data-cyberbot-marquee-run="0"/);
  assert.match(marquee, /clip-path="url\(#approved-[\w-]+marqueeClip\)"/);
  assert.match(marquee, /font-size="17"/);
  assert.match(marquee, /<animate attributeName="x" from="78"/);
  assert.doesNotMatch(marquee, /M 28 43 Q 33 39 38 43/);
});

test('the marquee animation restarts when the launcher returns from the tray', () => {
  const source = readFileSync(
    new URL('../src/components/companion/CyberBotAvatar.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /onLauncherShown\?\.\(restartMarquee\)/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /setMarqueeRun\(run => run \+ 1\)/);
});

test('speech follows writing without replacing the approved logo expression', () => {
  const silent = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'launcher' }));
  const speaking = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'launcher', isSpeaking: true }));
  assert.match(silent, /data-cyberbot-speaking="false"/);
  assert.match(speaking, /data-cyberbot-face="launcher"/);
  assert.match(speaking, /data-cyberbot-speaking="true"/);
  assert.match(speaking, /data-part="equalizerBars" class="speaking-eq"/);
  assert.match(silent, /data-part="equalizerBars" class="standby-eq"/);
  const source = readFileSync(new URL('../src/components/companion/CyberBotAvatar.tsx', import.meta.url), 'utf8');
  assert.match(source, /const speaking = isSpeaking && emotion !== 'sleeping' && !reducedMotion/);
  assert.doesNotMatch(source, /SPEECH_CUE_MS|setSpeechActive/);
});

test('speech keeps one unchanged face while using the separate chest equalizer', () => {
  const selectedFace = (html: string, emotion: string) => {
    const match = html.match(new RegExp(`<g id="[^"]+" data-part="face-${emotion}" style="display: inline;"[^>]*>([\\s\\S]*?)</g>`));
    assert.ok(match, `Missing visible ${emotion} face`);
    return match[1];
  };
  for (const emotion of ['curious', 'delighted', 'sparkle', 'affectionate', 'happy', 'wink', 'alert', 'storage', 'scared', 'success', 'speaking', 'terminal'] as const) {
    const silent = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion }));
    const talking = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion, isSpeaking: true }));
    assert.equal(selectedFace(silent, emotion), selectedFace(talking, emotion));
    assert.match(talking, /data-part="equalizerBars" class="speaking-eq"/);
    assert.doesNotMatch(talking, /data-cyberbot-speech-wave/);
  }
  const sleeping = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'sleeping', isSpeaking: true }));
  assert.match(sleeping, /data-cyberbot-speaking="false"/);
  assert.match(sleeping, /data-part="equalizerBars" class="standby-eq"/);
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
  assert.match(ram, /data-part="alert-variant-exclamation"/);
  assert.match(storage, /data-cyberbot-face="storage"/);
  const storageFace = storage.match(/data-part="face-storage"[^>]*>([\s\S]*?)<\/g>/)?.[1];
  assert.ok(storageFace);
  assert.equal((storageFace.match(/<rect /g) ?? []).length, 2, 'two exclamation stems');
  assert.equal((storageFace.match(/<circle /g) ?? []).length, 2, 'two separate exclamation dots');
  assert.match(storageFace, /d="M45 46 H55"/, 'a neutral underscore mouth');
  assert.doesNotMatch(storageFace, /width="14"|height="5"/, 'the obsolete disk glyph is gone');
  assert.match(storage, /--eq-glow-color:#f59e0b/);
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
  const html = readFileSync(new URL('../cyberbot-toast.html', import.meta.url), 'utf8');
  const source = readFileSync(new URL('../src/components/companion/desktop/toast-window.js', import.meta.url), 'utf8');
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
  let previousSpeechKey: string | null = null;
  const element = (id: string) => {
    if (!elements.has(id)) {
      const classes = new Set<string>(['hidden']);
      const listeners: Record<string, (event: { stopPropagation: () => void }) => void> = {};
      elements.set(id, {
        classList: {
          add: (...names) => names.forEach(name => classes.add(name)),
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
  const avatarStates: Array<{ face: string; speechKey: string; title: string; detail: string } | null> = [];
  const actions: Array<[string, unknown]> = [];
  let receive: (data: Record<string, unknown>) => void = () => {};
  runInNewContext(source, {
    document: { getElementById: element },
    CustomEvent: class { constructor(public type: string, public options: { detail: unknown }) {} },
    window: { dispatchEvent: (event: { options: { detail: { face: string; speechKey: string; title: string; detail: string } | null } }) => { const state = event.options.detail; if (state && state.speechKey !== previousSpeechKey) speechRestarts++; previousSpeechKey = state?.speechKey ?? null; avatarStates.push(state); }, desktopToast: {
      onData: (callback: typeof receive) => { receive = callback; },
      action: (name: string, payload: unknown) => actions.push([name, payload]),
      hide: () => {},
    } },
  });
  const click = (id: string) => element(id).listeners.click({ stopPropagation: () => {} });

  receive({ presentation: 'bot', type: 'imminent', taskId: 'task-1', title: 'Launching in 9s', detail: 'Editor', actionLabelLaunch: 'Launch now', actionLabelCancel: 'Cancel' });
  assert.equal(element('cyberbotCard').classList.contains('hidden'), false);
  assert.equal(avatarStates.at(-1)?.speechKey, 'imminent:task-1');
  assert.equal(speechRestarts, 1);
  assert.equal(element('standardCard').classList.contains('hidden'), true);
  assert.equal(avatarStates.at(-1)?.title, 'Launching in 9s');
  receive({ presentation: 'bot', type: 'imminent', taskId: 'task-1', title: 'Launching in 8s', detail: 'Editor', actionLabelLaunch: 'Launch now', actionLabelCancel: 'Cancel' });
  assert.equal(speechRestarts, 1, 'countdown updates should keep the same writing session');
  assert.equal(avatarStates[0]?.face, 'alert');
  assert.equal(avatarStates[0]?.speechKey, avatarStates[1]?.speechKey);
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
  assert.equal(avatarStates.at(-1)?.title, 'Opening Editor');
  assert.equal(element('cyberbotActions').classList.contains('hidden'), true);
  receive({ type: 'hide' });
  assert.equal(avatarStates.at(-1), null, 'hidden notifications must unmount the avatar');

  receive({ presentation: 'bot', type: 'warning', action: 'open-hud-system', title: 'High RAM usage' });
  assert.equal(element('cyberbotCard').classList.contains('alert'), true);
  assert.equal(element('cyberbotCard').classList.contains('storage'), false);
  receive({ presentation: 'bot', type: 'warning', action: 'open-hud-storage', title: 'Low disk space' });
  assert.equal(element('cyberbotCard').classList.contains('alert'), true);
  assert.equal(element('cyberbotCard').classList.contains('storage'), true);
  assert.equal(speechRestarts, 5);
  assert.equal(avatarStates.at(-1)?.face, 'storage');
  receive({ presentation: 'bot', type: 'info', title: 'Routine notice' });
  assert.equal(element('cyberbotCard').classList.contains('alert'), false);
  assert.equal(element('cyberbotCard').classList.contains('storage'), false);
});

test('floating CyberBot keeps a compact, responsive bubble beside an 84px avatar', () => {
  const css = readFileSync(new URL('../src/components/companion/desktop/toast-window.css', import.meta.url), 'utf8');
  assert.match(css, /\.cyberbot-card\s*\{[^}]*width:\s*fit-content;[^}]*max-width:\s*100%;/s);
  assert.match(css, /\.cyberbot-avatar\s*\{[^}]*flex:\s*0 0 84px;[^}]*width:\s*84px;/s);
  assert.match(css, /\.cyberbot-bubble\s*\{[^}]*flex:\s*0 1 auto;[^}]*width:\s*max-content;[^}]*max-width:\s*382px;/s);
});

test('floating notifications reuse the approved shell and preserve alert, disk and success expressions', () => {
  const html = readFileSync(new URL('../cyberbot-toast.html', import.meta.url), 'utf8');
  assert.match(html, /id="cyberbotAvatar" class="cyberbot-avatar"/);
  assert.doesNotMatch(html, /botBody|bot-face-logo|bot-speech-wave/);
  for (const face of ['launcher', 'alert', 'storage', 'success'] as const) {
    const markup = renderToStaticMarkup(React.createElement(DesktopCyberBotAvatar, { face, speaking: true }));
    assert.match(markup, /data-cyberbot-design="approved"/);
    assert.ok(markup.includes(`data-cyberbot-face="${face}"`));
    assert.match(markup, /width:84px;height:96\.6px/);
    assert.match(markup, /viewBox="0 0 100 115"/);
  }
});


test('typing reveals whole graphemes, then details, and finishes its speaking state', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const states: CyberBotTypingState[] = [];
  const writer = createCyberBotTypewriter(state => states.push(state));
  const text = 'A\u0301👨‍👩‍👧‍👦👩🏽‍💻🚀';
  writer.update('one', text, 'ñ🐈');
  assert.equal(states.at(-1)?.text, '');
  assert.equal(states.at(-1)?.part, 'text');
  context.mock.timers.tick(CYBERBOT_CHARACTER_MS);
  assert.equal(states.at(-1)?.text, 'A\u0301');
  context.mock.timers.tick(CYBERBOT_CHARACTER_MS);
  assert.equal(states.at(-1)?.text, 'A\u0301👨‍👩‍👧‍👦');
  context.mock.timers.tick(CYBERBOT_CHARACTER_MS * 2);
  assert.equal(states.at(-1)?.text, text);
  assert.equal(states.at(-1)?.part, 'detail');
  context.mock.timers.tick(CYBERBOT_CHARACTER_MS);
  assert.equal(states.at(-1)?.detail, 'ñ');
  context.mock.timers.tick(CYBERBOT_CHARACTER_MS);
  assert.deepEqual(states.at(-1), { key: 'one', text, detail: 'ñ🐈', part: null, isTyping: false });
  writer.dispose();
});

test('writing stays active past 1.8 seconds and identical payloads do not reset its deadline', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const states: CyberBotTypingState[] = [];
  const writer = createCyberBotTypewriter(state => states.push(state));
  writer.update('long', 'x'.repeat(100));
  context.mock.timers.tick(1800);
  assert.equal(states.at(-1)?.isTyping, true);
  writer.update('long', 'x'.repeat(100));
  assert.ok((states.at(-1)?.text.length ?? 0) > 60);
  context.mock.timers.tick(1000);
  assert.equal(states.at(-1)?.isTyping, false);
  assert.equal(states.at(-1)?.text.length, 100);
  writer.dispose();
});

test('replacement and disposal cancel old typing rather than leaking its text or callbacks', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const states: CyberBotTypingState[] = [];
  const writer = createCyberBotTypewriter(state => states.push(state));
  writer.update('old', 'x'.repeat(100));
  context.mock.timers.tick(100);
  writer.update('new', 'Hola');
  assert.deepEqual(states.at(-1), { key: 'new', text: '', detail: '', part: 'text', isTyping: true });
  context.mock.timers.tick(CYBERBOT_CHARACTER_MS * 4);
  assert.equal(states.at(-1)?.text, 'Hola');
  assert.equal(states.at(-1)?.isTyping, false);
  writer.update('third', 'un mensaje muy largo');
  writer.dispose();
  const count = states.length;
  context.mock.timers.tick(10000);
  assert.equal(states.length, count);
});

test('live countdown updates and reduced motion show complete text without replaying speech', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const states: CyberBotTypingState[] = [];
  const writer = createCyberBotTypewriter(state => states.push(state));
  writer.update('countdown', 'Launch in 10s', 'Editor');
  context.mock.timers.tick(56);
  writer.update('countdown', 'Launch in 9s', 'Editor');
  assert.deepEqual(states.at(-1), { key: 'countdown', text: 'Launch in 9s', detail: 'Editor', part: null, isTyping: false });
  writer.update('motion', 'Un mensaje largo', '', true);
  context.mock.timers.tick(56);
  writer.update('motion', 'Un mensaje largo', '', false);
  assert.equal(states.at(-1)?.text, 'Un mensaje largo');
  assert.equal(states.at(-1)?.isTyping, false);
  writer.update('motion', 'Un mensaje largo', '', true);
  assert.equal(states.at(-1)?.isTyping, false);
  writer.update('reduced-first', 'Texto completo', 'Detalle', false);
  assert.equal(states.at(-1)?.detail, 'Detalle');
  assert.equal(states.at(-1)?.isTyping, false);
  writer.dispose();
});

test('message lifetime includes complete writing and reading, while persistent notices stay persistent', () => {
  const text = 'Á'.repeat(200);
  assert.equal(cyberBotTypingDuration('A\u0301👨‍👩‍👧‍👦'), 2 * CYBERBOT_CHARACTER_MS);
  assert.equal(cyberBotSpeechLifetime(4500, text, 'Detalle'), cyberBotTypingDuration(text, 'Detalle') + 2500);
  assert.equal(cyberBotSpeechLifetime(6500, 'Hola'), 6500);
  assert.equal(cyberBotSpeechLifetime(0, text), 0);
});

test('typing has one accessible full message, hidden layout reserve and a safe visual caret', () => {
  const markup = renderToStaticMarkup(React.createElement(CyberBotTypingText, {
    text: '<img src=x>Hola', visible: '<img', caret: true, typing: true,
  }));
  assert.doesNotMatch(markup, /<img/);
  assert.match(markup, /cyberbot-typing-accessible/);
  assert.match(markup, /cyberbot-typing-reserve" aria-hidden="true"/);
  assert.match(markup, /cyberbot-typing-visible" aria-hidden="true"/);
  assert.match(markup, /data-cyberbot-written/);
  assert.match(markup, /cyberbot-typing-caret/);
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
  let marqueeCount = 0;
  const neutralFaces = new Set<string>();

  for (let i = 0; i < 500; i++) {
    const face = nextCyberBotIdleExpression(previous ?? 'idle', random);
    assert.notEqual(face, previous);
    if (cyberBotNeutralIdleExpressions.includes(face as typeof cyberBotNeutralIdleExpressions[number])) {
      neutralCount += 1;
      neutralFaces.add(face);
    }
    if (cyberBotExpressiveIdleExpressions.includes(face as typeof cyberBotExpressiveIdleExpressions[number])) expressiveCount += 1;
    if (face === 'marquee') marqueeCount += 1;
    previous = face;
  }

  assert.ok(neutralCount > expressiveCount * 4, 'neutral faces should dominate the idle loop');
  assert.ok(marqueeCount > 0 && marqueeCount < 40, 'marquee stays rare even without its time guard');
  assert.equal(neutralCount + expressiveCount + marqueeCount, 500);
  assert.deepEqual(neutralFaces, new Set(cyberBotNeutralIdleExpressions));
  assert.equal(CYBERBOT_IDLE_EXPRESSIVE_CHANCE, 0.02);
  assert.equal(CYBERBOT_IDLE_MARQUEE_CHANCE, 0.05);
  assert.notEqual(nextCyberBotIdleExpression('curious', () => 0.999999), 'marquee');
  assert.notEqual(nextCyberBotIdleExpression('curious', () => 0.03, false), 'marquee');
});

test('idle rounds favor eyes, logo and flight over Terminal and curiosity', () => {
  const picker = createCyberBotIdleExpressionPicker(() => 0.5, () => 0);
  let previous: NonNullable<CyberBotMessage['emotion']> = 'launcher';
  const faces: string[] = [];
  for (let i = 0; i < 230; i++) {
    const face = picker.next(previous);
    assert.notEqual(face, previous);
    faces.push(face);
    previous = face;
  }
  assert.deepEqual(new Set(faces.slice(0, 3)), new Set(['default', 'launcher', 'flight']));
  for (const face of ['default', 'launcher', 'flight']) {
    assert.equal(faces.filter(value => value === face).length, 60);
  }
  assert.equal(faces.filter(face => face === 'terminal').length, 30);
  assert.equal(faces.filter(face => face === 'curious').length, 20);
  for (let i = 0; i < faces.length; i += 23) {
    assert.deepEqual(new Set(faces.slice(i, i + 23)), new Set(['default', 'launcher', 'flight', 'curious', 'terminal']));
  }
});

test('rare gestures do not consume unseen composed expressions', () => {
  let now = 0;
  const rolls = [0.5, 0, 0.01, 0, 0.5, 0, 0.03, 0.5, 0];
  const picker = createCyberBotIdleExpressionPicker(() => {
    assert.ok(rolls.length, 'unexpected random draw');
    return rolls.shift()!;
  }, () => now);
  assert.equal(picker.next('launcher'), 'default');
  assert.equal(picker.next('default'), 'happy');
  assert.equal(picker.next('happy'), 'launcher');
  now = CYBERBOT_IDLE_MARQUEE_MIN_INTERVAL_MS;
  assert.equal(picker.next('launcher'), 'marquee');
  assert.equal(picker.next('marquee'), 'flight');
  assert.equal(rolls.length, 0);
});

test('marquee eligibility waits two minutes, survives interruptions and postpones on return', () => {
  let now = 0;
  // Always request a screen: the cadence must still prevent early/repeated passes.
  const picker = createCyberBotIdleExpressionPicker(() => 0.03, () => now);
  let face: NonNullable<CyberBotMessage['emotion']> = 'launcher';
  for (now = 0; now < CYBERBOT_IDLE_MARQUEE_MIN_INTERVAL_MS; now += 1000) {
    face = picker.next(face);
    assert.notEqual(face, 'marquee');
  }
  assert.equal(picker.next(face), 'marquee');
  now += 7000;
  assert.notEqual(picker.next('marquee'), 'marquee');
  assert.notEqual(picker.next('launcher'), 'marquee', 'an interruption cannot resume a new screen immediately');
  now = CYBERBOT_IDLE_MARQUEE_MIN_INTERVAL_MS * 2 - 1;
  assert.notEqual(picker.next('curious'), 'marquee');
  now += 1;
  assert.equal(picker.next('curious'), 'marquee');
  now += 60_000;
  picker.postponeMarquee();
  now += CYBERBOT_IDLE_MARQUEE_MIN_INTERVAL_MS - 1;
  assert.notEqual(picker.next('launcher'), 'marquee');
  now += 1;
  assert.equal(picker.next('launcher'), 'marquee');
});

test('idle marquee messages vary without immediate repeats', () => {
  const messages = getCyberBotIdleMarqueeMessages('1.12.0', ['SHORTCUTS // 3', 'LAUNCHES TODAY // 7']);
  let previous: string | null = null;
  const seen = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const message = nextCyberBotIdleMarqueeMessage(previous, messages, () => (i % messages.length) / messages.length);
    assert.notEqual(message, previous);
    seen.add(message);
    previous = message;
  }
  assert.deepEqual(seen, new Set(messages));
});

test('idle marquee reports real library, usage, shortcut and pending tasks in both languages', () => {
  const state = { apps: [{ id: 1 }, { id: 2 }, { id: 3 }], favoriteIds: [2, 99, 2], dailyLaunchCount: 7,
    scheduledTasks: [{ remainingSeconds: 60 }, { remainingSeconds: 0 }, { remainingSeconds: -3 }],
    activationShortcut: 'Ctrl+Alt+L' };
  for (const language of ['es', 'en'] as const) {
    const translate: Parameters<typeof getCyberBotMarqueeStatusMessages>[1] = (key, values) =>
      translations[language][key].replace(/\{(\w+)\}/g, (_, name: string) => values[name]);
    const statuses = getCyberBotMarqueeStatusMessages(state, translate);
    assert.deepEqual(statuses, language === 'es'
      ? ['ACCESOS // 3', 'LANZAMIENTOS HOY // 7', 'ABRIR LAUNCHER // Ctrl+Alt+L', 'FAVORITOS // 1', 'LANZAMIENTOS PROGRAMADOS // 1']
      : ['SHORTCUTS // 3', 'LAUNCHES TODAY // 7', 'OPEN LAUNCHER // Ctrl+Alt+L', 'FAVORITES // 1', 'SCHEDULED LAUNCHES // 1']);
    assert.doesNotMatch(statuses.join(' '), /\{|READY|ONLINE|SYSTEMS|CYBERGEMS|LISTO|EN LÍNEA|SISTEMAS/);
    const empty = getCyberBotMarqueeStatusMessages({ ...state, apps: [], favoriteIds: [], scheduledTasks: [], activationShortcut: '', dailyLaunchCount: 0 }, translate);
    assert.equal(empty.length, 2);
    assert.ok(empty.every(text => text.endsWith('0')));
    assert.deepEqual(getCyberBotIdleMarqueeMessages('1.12.0', statuses), ['CYBERLAUNCHER v1.12.0', ...statuses]);
  }
});

test('idle timing holds every random face for several seconds', () => {
  assert.equal(getCyberBotIdleExpressionDuration('launcher', () => 0), CYBERBOT_IDLE_NEUTRAL_MIN_MS);
  assert.equal(getCyberBotIdleExpressionDuration('terminal', () => 0.999999), CYBERBOT_IDLE_NEUTRAL_MAX_MS);
  assert.equal(getCyberBotIdleExpressionDuration('happy', () => 0), CYBERBOT_IDLE_EXPRESSIVE_MIN_MS);
  assert.equal(getCyberBotIdleExpressionDuration('happy', () => 0.999999), CYBERBOT_IDLE_EXPRESSIVE_MAX_MS);
  assert.equal(getCyberBotIdleExpressionDuration('marquee', () => 0), CYBERBOT_IDLE_MARQUEE_MIN_MS);
  assert.equal(getCyberBotIdleExpressionDuration('marquee', () => 0.999999), CYBERBOT_IDLE_MARQUEE_MAX_MS);
  assert.ok(CYBERBOT_IDLE_EXPRESSIVE_MIN_MS >= 3_000);
});

test('the Terminal face remains stable instead of using the generic blink', () => {
  assert.equal(shouldCyberBotBlink('terminal'), false);
  assert.equal(shouldCyberBotBlink('launcher'), false);
  assert.equal(shouldCyberBotBlink('marquee'), false);
  assert.equal(shouldCyberBotBlink('curious'), true);
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
  assert.equal(cyberBotPhrases.terminal.length, 8);
  assert.ok(cyberBotPhrases.terminal.every(phrase => phrase.emotion === 'terminal'));
  for (const { key } of cyberBotPhrases.terminal) {
    assert.ok(translations.es[key]?.trim());
    assert.ok(translations.en[key]?.trim());
  }
});

test('casual CyberBot commentary reserves cheerful faces for actual achievements', () => {
  const casualTopics = [
    'interaction', 'greeting_morning', 'greeting_afternoon', 'greeting_evening',
    'settings_general', 'settings_cyberbot', 'settings_backup', 'hud_system',
    'hud_storage', 'command_palette', 'terminal', 'add_app', 'add_app_drop',
    'add_category', 'launch', 'launch_admin', 'launch_pinned',
    'launch_admin_pinned', 'pin_blur', 'return',
  ] as const;
  const cheerful = new Set(['happy', 'wink', 'delighted', 'affectionate', 'sparkle', 'speaking']);
  const casualPhrases = casualTopics.flatMap(topic => [...cyberBotPhrases[topic]]) as CyberBotPhrase[];
  const cheerfulPhrases = casualPhrases
    .filter(phrase => cheerful.has(phrase.emotion));

  assert.deepEqual(cheerfulPhrases.map(phrase => phrase.key), ['cyberbot_reaction_achievement']);
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

test('a priority expression overrides a message face while Cyber Terminal is open', () => {
  const html = renderToStaticMarkup(React.createElement(CyberBot, {
    enabled: true,
    activeMessage: { ...message('high'), emotion: 'happy' },
    onDismissMessage: () => {},
    dragBoundsRef: React.createRef<HTMLDivElement>(),
    interactLabel: 'Interact with CyberBot',
    closeLabel: 'Dismiss CyberBot message',
    hoverAssistText: count => `Moving in ${count}`,
    priorityEmotion: 'terminal',
  }));

  assert.match(html, /data-cyberbot-face="terminal"/);
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

test('launch variants retain the application name in both languages', () => {
  for (const topic of ['launch', 'launch_admin', 'launch_pinned', 'launch_admin_pinned'] as const) {
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

test('the approved marquee chooses distinct real phrases and gives long text time to exit', () => {
  assert.equal(nextApprovedMarquee(null, [], () => 0), '');
  assert.equal(nextApprovedMarquee(null, ['online', 'online'], () => 0), 'online');
  assert.equal(nextApprovedMarquee(null, ['online', 'ready'], () => 0), 'online   ◆   ready');
  assert.equal(nextApprovedMarquee('online   ◆   ready', ['online', 'ready'], () => 0), 'ready   ◆   online');
  const timing = approvedMarqueeTiming('á'.repeat(100));
  assert.ok(timing.end <= 20 - 100 * 10.6);
  assert.ok(timing.durationMs >= ((78 - timing.end) / 26) * 1000 + 1000);
});

test('approved SVG instances keep local references unique and marquee input cannot become markup', () => {
  const attack = '<script>alert(1)</script>"&';
  const svg = readFileSync(new URL('../src/components/companion/approved/cyberbot-approved.svg', import.meta.url), 'utf8');
  const first = createApprovedMarkup(svg, 'one-', 'marquee', false, attack);
  const second = createApprovedMarkup(svg, 'two-', 'marquee', false, attack);
  assert.doesNotMatch(first, /<script>/);
  assert.match(first, /&lt;script&gt;alert\(1\)&lt;\/script&gt;&quot;&amp;/);
  const ids = [...(first + second).matchAll(/id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, target] of (first + second).matchAll(/url\(#([\w-]+)\)/g)) assert.ok(ids.includes(target), target);
});

test('landed head touches the actual footer and drag offsets retain the same anchor', () => {
  for (const [width, height, floorTop] of [[1440, 900, 843], [1000, 650, 570], [800, 600, 540]]) {
    const anchor = getCyberBotAnchor(width, height, 'bottom-right', { x: 0, y: 0 }, floorTop);
    assert.ok(Math.abs(anchor.top + CYBERBOT_LANDED_BOTTOM - floorTop) < 0.001);
    assert.equal(anchor.left, width - 138);
    const dragged = getCyberBotAnchor(width, height, 'bottom-right', { x: -120, y: -80 }, floorTop);
    assert.equal(dragged.left, anchor.left - 120);
    assert.equal(dragged.top, anchor.top - 80);
    assert.equal(getCyberBotAnchor(width, height, 'top-right', { x: 0, y: 0 }, floorTop).top, 80);
  }
});

test('a first marquee pass delays idle departure without resetting or starving its deadline', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const changes: string[] = [];
  const cycle = createCyberBotIdleCycle(state => changes.push(state), () => 0);
  context.mock.timers.tick(10_000);
  cycle.setReading(true);
  context.mock.timers.tick(30_000);
  assert.deepEqual(changes, [], 'Do not interrupt a first reading pass');
  cycle.setReading(false);
  context.mock.timers.tick(0);
  assert.deepEqual(changes, ['hidden'], 'Depart as soon as reading ends if already due');
  context.mock.timers.tick(CYBERBOT_VANISH_MIN_AWAY_MS);
  assert.deepEqual(changes, ['hidden', 'awake']);
  cycle.setReading(true);
  cycle.pause();
  cycle.setReading(false);
  context.mock.timers.tick(60_000);
  assert.deepEqual(changes, ['hidden', 'awake'], 'Busy UI still suspends departures');
  cycle.resume();
  context.mock.timers.tick(CYBERBOT_VANISH_MIN_IDLE_MS);
  assert.deepEqual(changes, ['hidden', 'awake', 'hidden']);
  cycle.dispose();
});

test('hover alternates focus and scan only on fresh pointer entries', () => {
  const hover = createCyberBotHoverReaction();
  assert.equal(hover.update(false, true), null);
  assert.equal(hover.update(true, true), 'focus');
  for (let i = 0; i < 20; i++) assert.equal(hover.update(true, true), 'focus');
  assert.equal(hover.update(false, true), null);
  assert.equal(hover.update(true, true), 'scan');
  for (let i = 0; i < 20; i++) assert.equal(hover.update(true, true), 'scan');
  hover.update(false, true);
  assert.equal(hover.update(true, true), 'focus');
});

test('blocked or interrupted hover does not consume or replay a reaction while held', () => {
  const hover = createCyberBotHoverReaction();
  assert.equal(hover.update(true, false), null);
  assert.equal(hover.update(true, true), null, 'unblocking a held pointer must not trigger an effect');
  hover.update(false, true);
  assert.equal(hover.update(true, true), 'focus', 'a blocked entry must not consume focus');
  assert.equal(hover.update(true, false), null, 'dragging, alerts or reduced motion cancel attention');
  assert.equal(hover.update(true, true), null, 'cancelled attention must wait for a new entry');
  hover.update(false, true);
  assert.equal(hover.update(true, true), 'scan');
  assert.equal(createCyberBotHoverReaction().update(true, true), 'focus', 'instances keep independent entry sequences');
});

test('screen landing follows the actual floor after moving or relocating the bot', () => {
  const floorTop = 743;
  const floorAnchor = getCyberBotAnchor(1200, 800, 'bottom-right', { x: 0, y: 0 }, floorTop);
  assert.equal(isCyberBotAtFloor(floorAnchor.top, floorTop), true);
  const horizontal = getCyberBotAnchor(1200, 800, 'bottom-right', { x: -200, y: 0 }, floorTop);
  assert.equal(isCyberBotAtFloor(horizontal.top, floorTop), true);
  const raised = getCyberBotAnchor(1200, 800, 'bottom-right', { x: -200, y: -80 }, floorTop);
  assert.equal(isCyberBotAtFloor(raised.top, floorTop), false);
  assert.equal(isCyberBotAtFloor(floorAnchor.top + 0.25, floorTop), true);
  assert.equal(isCyberBotAtFloor(floorAnchor.top, floorTop - 40), false);
  assert.equal(isCyberBotAtFloor(80, floorTop), false);
  const relocated = getCyberBotLayout({ width: 1200, height: 800, preferred: floorAnchor, align: 'right',
    bubbleHeight: 0, obstacles: [{ left: 0, top: 620, right: 1200, bottom: 800 }] });
  assert.equal(relocated.hidden, false);
  assert.equal(isCyberBotAtFloor(relocated.top, floorTop), false);
});

test('elevated marquee keeps its body and scrolling text until landing is allowed', () => {
  const elevated = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'marquee', canLand: false }));
  assert.match(elevated, /data-cyberbot-face="marquee"/);
  assert.match(elevated, /<animate attributeName="x"/);
  assert.doesNotMatch(elevated, /compact-screen-active/);
  const grounded = renderToStaticMarkup(React.createElement(CyberBotAvatar, { emotion: 'marquee', canLand: true }));
  assert.match(grounded, /compact-screen-active/);
});


test('a version-only or empty marquee catalog has a valid fallback', () => {
  assert.equal(nextCyberBotIdleMarqueeMessage('CYBERLAUNCHER v1.12.0', getCyberBotIdleMarqueeMessages('1.12.0')), 'CYBERLAUNCHER v1.12.0');
  assert.equal(nextCyberBotIdleMarqueeMessage(null, []), '');
});

test('returns ignore initial/duplicate shows and alternate two brief gestures', () => {
  const controller = createCyberBotReturnController();
  const options = { enabled: true, blocked: false, allowSpeech: true, tasks: [],
    greet: () => { assert.fail('short returns must not greet'); }, announceTask: () => false };
  assert.equal(controller.shown({ ...options, now: 0 }), null);
  controller.hidden(100);
  assert.deepEqual(controller.shown({ ...options, now: 600 }), { id: 1, kind: 'scan' });
  assert.equal(controller.shown({ ...options, now: 700 }), null);
  controller.hidden(1000);
  assert.deepEqual(controller.shown({ ...options, now: 1300 }), { id: 2, kind: 'sensors' });
});

test('return greetings require ten minutes away and thirty minutes between accepted greetings', () => {
  const controller = createCyberBotReturnController();
  let greetings = 0;
  const options = { enabled: true, blocked: false, allowSpeech: true, tasks: [],
    greet: () => { greetings++; return true; }, announceTask: () => false };
  controller.hidden(0);
  controller.hidden(CYBERBOT_RETURN_ABSENCE_MS - 1); // Repeated hide must not reset the absence.
  assert.equal(controller.shown({ ...options, now: CYBERBOT_RETURN_ABSENCE_MS }), null);
  assert.equal(greetings, 1);
  controller.hidden(CYBERBOT_RETURN_ABSENCE_MS);
  assert.ok(controller.shown({ ...options, now: 2 * CYBERBOT_RETURN_ABSENCE_MS }));
  assert.equal(greetings, 1);
  controller.hidden(3 * CYBERBOT_RETURN_ABSENCE_MS);
  assert.equal(controller.shown({ ...options, now: CYBERBOT_RETURN_ABSENCE_MS + CYBERBOT_RETURN_GREETING_COOLDOWN_MS }), null);
  assert.equal(greetings, 2);
});

test('busy returns yield to notices/countdowns and muted speech keeps a silent acknowledgement', () => {
  const controller = createCyberBotReturnController();
  const options = { enabled: true, blocked: true, allowSpeech: true,
    tasks: [{ id: 'task', name: 'Next', remainingSeconds: 50 }],
    greet: () => { assert.fail('busy return greeted'); }, announceTask: () => { assert.fail('busy return announced a task'); } };
  controller.hidden(0);
  assert.equal(controller.shown({ ...options, now: CYBERBOT_RETURN_ABSENCE_MS }), null);
  controller.hidden(1);
  assert.equal(controller.shown({ ...options, enabled: false, blocked: false, now: CYBERBOT_RETURN_ABSENCE_MS }), null);
  controller.hidden(0);
  assert.deepEqual(controller.shown({ ...options, blocked: false, allowSpeech: false, now: CYBERBOT_RETURN_ABSENCE_MS }), { id: 1, kind: 'scan' });
});

test('return task notices use the nearest real future task once and leave imminent countdowns alone', () => {
  const controller = createCyberBotReturnController();
  const announced: string[] = [];
  const tasks = [
    { id: 'done', name: 'Done', remainingSeconds: 0 },
    { id: 'imminent', name: 'Imminent', remainingSeconds: 10 },
    { id: 'later', name: 'Later', remainingSeconds: 301 },
    { id: 'invalid', name: 'Invalid', remainingSeconds: NaN },
    { id: 'second', name: 'Second', remainingSeconds: 200 },
    { id: 'first', name: 'First', remainingSeconds: 35 },
  ];
  const options = { enabled: true, blocked: false, allowSpeech: true, tasks,
    greet: () => { assert.fail('task must precede greeting'); },
    announceTask: task => { announced.push(task.id); return true; } };
  controller.hidden(0);
  assert.equal(controller.shown({ ...options, now: CYBERBOT_RETURN_ABSENCE_MS }), null);
  controller.hidden(0);
  assert.equal(controller.shown({ ...options, now: CYBERBOT_RETURN_ABSENCE_MS }), null);
  assert.deepEqual(announced, ['first', 'second']);
  controller.hidden(100);
  const advancedTasks = tasks.map(task => ({ ...task, remainingSeconds: task.remainingSeconds - 1 }));
  assert.equal(controller.shown({ ...options, now: 150, tasks: advancedTasks }), null);
  assert.deepEqual(announced, ['first', 'second', 'later'], 'the formerly distant task has reached the five-minute boundary');
  controller.hidden(200);
  assert.ok(controller.shown({ ...options, now: 250, tasks: advancedTasks }));
  assert.deepEqual(announced, ['first', 'second', 'later']);
});

test('rejected return speech does not consume a task or greeting opportunity', () => {
  const controller = createCyberBotReturnController();
  let accepted = false, attempts = 0;
  const options = { enabled: true, blocked: false, allowSpeech: true,
    tasks: [{ id: 'a', name: 'A', remainingSeconds: 40 }],
    greet: () => { attempts++; return accepted; }, announceTask: () => { attempts++; return accepted; } };
  controller.hidden(0); controller.shown({ ...options, now: CYBERBOT_RETURN_ABSENCE_MS });
  accepted = true;
  controller.hidden(0); controller.shown({ ...options, now: CYBERBOT_RETURN_ABSENCE_MS });
  assert.equal(attempts, 2);
  accepted = false;
  controller.hidden(0); controller.shown({ ...options, tasks: [], now: CYBERBOT_RETURN_ABSENCE_MS });
  accepted = true;
  controller.hidden(0); controller.shown({ ...options, tasks: [], now: CYBERBOT_RETURN_ABSENCE_MS });
  assert.equal(attempts, 4);
});

test('notice delivery tracks an accepted instance without suppressing a genuinely new identical alert', () => {
  const ledger = createCyberBotNoticeLedger();
  const first = { message: 'RAM warning' }, second = { message: 'RAM warning' };
  assert.equal(ledger.has(first), false);
  const id = ledger.id(first);
  ledger.mark(first);
  assert.equal(ledger.has(first), true);
  assert.equal(ledger.id(first), id);
  assert.equal(ledger.has(second), false);
  assert.notEqual(ledger.id(second), id);
});

test('return greetings and task estimates are bilingual and contain no last-app reminders', () => {
  assert.equal(cyberBotPhrases.return.length, 4);
  for (const language of ['es', 'en'] as const) {
    const greetings = cyberBotPhrases.return.map(phrase => translations[language][phrase.key]);
    assert.equal(new Set(greetings).size, greetings.length);
    assert.ok(greetings.every(text => !!text && !text.includes('{name}')));
    assert.ok(translations[language].cyberbot_return_task_seconds.includes('{seconds}'));
    assert.ok(translations[language].cyberbot_return_task_minutes.includes('{minutes}'));
    assert.ok(translations[language].cyberbot_return_named.includes('{userName}'));
  }
});

test('context retirement waits for speech and reading, then returns after closing', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const changes: boolean[] = [];
  const cycle = createCyberBotContextPresence(away => changes.push(away));
  cycle.update({ open: true, busy: true, attention: false });
  context.mock.timers.tick(20_000);
  assert.deepEqual(changes, []);
  cycle.update({ open: true, busy: false, attention: false });
  context.mock.timers.tick(CYBERBOT_CONTEXT_RETIRE_MS - 1);
  assert.deepEqual(changes, []);
  context.mock.timers.tick(1);
  assert.deepEqual(changes, [true]);
  context.mock.timers.tick(60_000);
  assert.deepEqual(changes, [true]);
  cycle.update({ open: false, busy: false, attention: false });
  context.mock.timers.tick(CYBERBOT_CONTEXT_RETURN_MS - 1);
  assert.deepEqual(changes, [true]);
  context.mock.timers.tick(1);
  assert.deepEqual(changes, [true, false]);
  cycle.dispose();
});

test('quick contexts do not flash and reopening cancels a pending return', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const changes: boolean[] = [];
  const cycle = createCyberBotContextPresence(away => changes.push(away));
  cycle.update({ open: true, busy: false, attention: false });
  context.mock.timers.tick(500);
  cycle.update({ open: false, busy: false, attention: false });
  context.mock.timers.tick(5000);
  assert.deepEqual(changes, []);
  cycle.update({ open: true, busy: false, attention: false });
  context.mock.timers.tick(CYBERBOT_CONTEXT_RETIRE_MS);
  cycle.update({ open: false, busy: false, attention: false });
  context.mock.timers.tick(700);
  cycle.update({ open: true, busy: false, attention: false });
  context.mock.timers.tick(5000);
  assert.deepEqual(changes, [true]);
  cycle.update({ open: false, busy: false, attention: false });
  context.mock.timers.tick(CYBERBOT_CONTEXT_RETURN_MS);
  assert.deepEqual(changes, [true, false]);
  cycle.dispose();
});

test('important attention can wake a parked bot and disposal cancels pending work', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const changes: boolean[] = [];
  const cycle = createCyberBotContextPresence(away => changes.push(away));
  cycle.update({ open: true, busy: false, attention: false });
  context.mock.timers.tick(CYBERBOT_CONTEXT_RETIRE_MS);
  cycle.update({ open: true, busy: true, attention: true });
  assert.deepEqual(changes, [true, false]);
  context.mock.timers.tick(20_000);
  assert.deepEqual(changes, [true, false]);
  cycle.update({ open: true, busy: false, attention: false });
  context.mock.timers.tick(CYBERBOT_CONTEXT_RETIRE_MS);
  cycle.update({ open: false, busy: false, attention: false });
  cycle.dispose();
  context.mock.timers.tick(20_000);
  assert.deepEqual(changes, [true, false, true]);
});

test('repeated context activity neither postpones retirement nor restarts return', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const changes: boolean[] = [];
  const cycle = createCyberBotContextPresence(away => changes.push(away));
  for (let i = 0; i < 3; i++) {
    cycle.update({ open: true, busy: false, attention: false });
    context.mock.timers.tick(1000);
  }
  assert.deepEqual(changes, [true]);
  for (let i = 0; i < 3; i++) {
    cycle.update({ open: false, busy: false, attention: false });
    context.mock.timers.tick(500);
  }
  assert.deepEqual(changes, [true, false]);
  cycle.dispose();
});
