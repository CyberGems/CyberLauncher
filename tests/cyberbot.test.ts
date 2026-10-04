import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CyberBot, getCyberBotViewportAdjustment } from '../src/components/companion/CyberBot';
import { canReplaceCyberBotMessage, isInQuietHours } from '../src/components/companion/useCyberBot';
import type { CyberBotMessage } from '../src/components/companion/companionTypes';

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
    interactLabel: 'Talk to CyberBot',
    closeLabel: 'Dismiss CyberBot message',
  }));

  assert.match(html, /<button[^>]*aria-label="Talk to CyberBot"/);
  assert.match(html, /aria-label="Dismiss CyberBot message"/);
  assert.match(html, /data-no-hide/);
  assert.match(html, /data-cyberbot-control/);
  assert.match(html, /role="alert"/);
  assert.equal((html.match(/aria-label="Talk to CyberBot"/g) || []).length, 1);
});
