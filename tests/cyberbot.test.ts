import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CyberBot, getCyberBotViewportAdjustment } from '../src/components/companion/CyberBot';
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

test('a speech bubble near the viewport edge moves inward with the avatar', () => {
  const adjustment = getCyberBotViewportAdjustment(
    { left: 80, right: 174, top: 80, bottom: 174 },
    { left: -20, right: 280, top: -40, bottom: 60 },
    800,
    600
  );
  assert.deepEqual(adjustment, { x: 32, y: 52 });
  assert.deepEqual(getCyberBotViewportAdjustment(
    { left: 686, right: 780, top: 486, bottom: 580 },
    { left: 540, right: 840, top: 440, bottom: 640 },
    800,
    600
  ), { x: -52, y: -52 });
});

test('the companion exposes one keyboard button and an accessible dismiss action', () => {
  const html = renderToStaticMarkup(React.createElement(CyberBot, {
    enabled: true,
    activeMessage: message('high'),
    onDismissMessage: () => {},
    dragBoundsRef: React.createRef<HTMLDivElement>(),
    interactLabel: 'Interact with CyberBot',
    closeLabel: 'Dismiss CyberBot message',
  }));

  assert.match(html, /<button[^>]*aria-label="Interact with CyberBot"/);
  assert.match(html, /aria-label="Dismiss CyberBot message"/);
  assert.match(html, /data-no-hide/);
  assert.match(html, /data-cyberbot-control/);
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
