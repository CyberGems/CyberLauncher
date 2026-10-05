import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CyberBot } from '../src/components/companion/CyberBot';
import { getCyberBotLayout } from '../src/components/companion/cyberBotLayout';
import { createCyberBotHoverAssist, createCyberBotSleepTimer, CYBERBOT_HOVER_DWELL_MS, CYBERBOT_HOVER_MOVE_COOLDOWN_MS, CYBERBOT_SLEEP_DELAY_MS, nextCyberBotIdleExpression } from '../src/components/companion/cyberBotBehavior';
import { canReplaceCyberBotMessage, isInQuietHours } from '../src/components/companion/useCyberBot';
import type { CyberBotMessage } from '../src/components/companion/companionTypes';
import { cyberBotPhrases, createCyberBotPhraseDeck, getCyberBotGreetingTopic, type CyberBotTopic } from '../src/components/companion/cyberBotPhrases';
import { translations } from '../src/locales';

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

test('sleep waits for inactivity, wakes on interaction, and cleans up its timer', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const changes: boolean[] = [];
  const timer = createCyberBotSleepTimer(sleeping => changes.push(sleeping));
  context.mock.timers.tick(CYBERBOT_SLEEP_DELAY_MS - 1);
  timer.wake();
  context.mock.timers.tick(CYBERBOT_SLEEP_DELAY_MS - 1);
  assert.deepEqual(changes, []);
  context.mock.timers.tick(1);
  assert.deepEqual(changes, [true]);
  timer.wake();
  assert.deepEqual(changes, [true, false]);
  timer.dispose();
  context.mock.timers.tick(CYBERBOT_SLEEP_DELAY_MS * 2);
  timer.wake();
  assert.deepEqual(changes, [true, false]);
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

test('idle expression selection includes the new faces without repeating the previous expression', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 12; i++) {
    const face = nextCyberBotIdleExpression('idle', () => i / 12);
    seen.add(face);
    assert.notEqual(nextCyberBotIdleExpression(face, () => 0), face);
  }
  assert.ok(seen.has('curious'));
  assert.ok(seen.has('delighted'));
  assert.ok(seen.has('affectionate'));
  assert.ok(seen.has('sparkle'));
  assert.ok(seen.has('terminal'));
  assert.equal(seen.has('launcher'), false);
});

test('the About panel has a bilingual phrase deck featuring the CyberLauncher face', () => {
  assert.equal(cyberBotPhrases.about.length, 3);
  assert.ok(cyberBotPhrases.about.some(phrase => phrase.emotion === 'launcher'));
  for (const { key } of cyberBotPhrases.about) {
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
  for (const topic of ['launch', 'launch_admin', 'last_launch'] as const) {
    for (const { key } of cyberBotPhrases[topic]) {
      for (const language of ['es', 'en'] as const) {
        assert.ok(translations[language][key].includes('{name}'), `${language}: ${key}`);
      }
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
