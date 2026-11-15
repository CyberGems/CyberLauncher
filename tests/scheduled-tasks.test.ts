import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScheduledTasks } from '../shared/backup';

const validAppTask = {
  id: 'task-1',
  name: 'Open work apps',
  totalSeconds: 600,
  remainingSeconds: 420,
  targetPath: 'C:\\Apps\\work.exe',
  isAdmin: false,
  type: 'app',
};

test('parseScheduledTasks keeps valid tasks with their remaining countdown', () => {
  const tasks = parseScheduledTasks([validAppTask]);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, 'task-1');
  assert.equal(tasks[0].totalSeconds, 600);
  assert.equal(tasks[0].remainingSeconds, 420);
  assert.equal(tasks[0].type, 'app');
  assert.equal(tasks[0].targetPath, 'C:\\Apps\\work.exe');
  assert.equal(tasks[0].isAdmin, false);
});

test('parseScheduledTasks restarts the countdown when remaining is missing', () => {
  const tasks = parseScheduledTasks([{ ...validAppTask, remainingSeconds: undefined }]);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].remainingSeconds, tasks[0].totalSeconds);
});

test('parseScheduledTasks clamps remaining above total and drops expired tasks', () => {
  const tasks = parseScheduledTasks([
    { ...validAppTask, id: 'clamped', remainingSeconds: 9999 },
    { ...validAppTask, id: 'expired', remainingSeconds: 0 },
    { ...validAppTask, id: 'expired-str', remainingSeconds: '-5' },
  ]);
  assert.deepEqual(tasks.map(t => t.id), ['clamped']);
  assert.equal(tasks[0].remainingSeconds, 600);
});

test('parseScheduledTasks drops malformed entries', () => {
  const tasks = parseScheduledTasks([
    null,
    'nope',
    {},
    { ...validAppTask, id: '  ' },
    { ...validAppTask, id: 'no-name', name: '   ' },
    { ...validAppTask, id: 'bad-type', type: 'magic' },
    { ...validAppTask, id: 'bad-total', totalSeconds: 0 },
    { ...validAppTask, id: 'neg-total', totalSeconds: -5 },
    { id: 'app-no-path', name: 'x', totalSeconds: 10, remainingSeconds: 10, type: 'app' },
    { id: 'cmd-empty', name: 'x', totalSeconds: 10, remainingSeconds: 10, type: 'command', command: '   ' },
    { id: 'cmd-ok', name: 'x', totalSeconds: 10, remainingSeconds: 5, type: 'command', command: 'notepad' },
  ]);
  assert.deepEqual(tasks.map(t => t.id), ['cmd-ok']);
});

test('parseScheduledTasks keeps string numbers and admin flag', () => {
  const tasks = parseScheduledTasks([{
    ...validAppTask,
    totalSeconds: '900',
    remainingSeconds: '300',
    isAdmin: true,
  }]);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].totalSeconds, 900);
  assert.equal(tasks[0].remainingSeconds, 300);
  assert.equal(tasks[0].isAdmin, true);
});

test('parseScheduledTasks caps durations at 24h', () => {
  const tasks = parseScheduledTasks([{ ...validAppTask, totalSeconds: 999999, remainingSeconds: 999999 }]);
  assert.equal(tasks[0].totalSeconds, 24 * 60 * 60);
  assert.equal(tasks[0].remainingSeconds, 24 * 60 * 60);
});

test('parseScheduledTasks returns empty for non-array input', () => {
  assert.deepEqual(parseScheduledTasks(undefined), []);
  assert.deepEqual(parseScheduledTasks(null), []);
  assert.deepEqual(parseScheduledTasks('tasks'), []);
  assert.deepEqual(parseScheduledTasks({}), []);
});
