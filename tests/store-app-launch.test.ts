import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { activateStoreApp, resolveStoreAppLauncher } from '../electron/store-app-launch';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'CyberLauncher-store-launch-test-'));
after(() => fs.rmSync(temporary, { recursive: true, force: true }));

test('resolves the development and packaged helper locations', () => {
  const development = path.join(temporary, 'electron');
  fs.mkdirSync(development);
  fs.writeFileSync(path.join(development, 'launch-store-app.exe'), '');
  fs.writeFileSync(path.join(temporary, 'launch-store-app.exe'), '');
  assert.equal(resolveStoreAppLauncher(false, 'unused', temporary, path.join(temporary, 'dist-electron')), path.join(development, 'launch-store-app.exe'));
  assert.equal(resolveStoreAppLauncher(true, temporary, 'unused', 'unused'), path.join(temporary, 'launch-store-app.exe'));
  assert.equal(resolveStoreAppLauncher(false, 'unused', path.join(temporary, 'scripts'), path.join(temporary, 'dist-electron')), path.join(development, 'launch-store-app.exe'));
  assert.throws(() => resolveStoreAppLauncher(true, path.join(temporary, 'absent'), temporary, path.join(temporary, 'dist-electron')), /helper is missing/);
});

test('requires confirmation from the helper, rather than treating process creation as activation', async () => {
  const fixture = path.join(temporary, 'result.cjs');
  for (const output of ['', '0', '-1', '1.5', '4294967296', 'not a process ID']) {
    fs.writeFileSync(fixture, 'process.stdout.write(' + JSON.stringify(output) + ');');
    await assert.rejects(activateStoreApp(fixture, process.execPath), /valid activated process ID/);
  }
  fs.writeFileSync(fixture, 'process.stdout.write("1234");');
  assert.equal(await activateStoreApp(fixture, process.execPath), 1234);
});

test('preserves the Windows error detail and reports helper execution failures', async () => {
  const fixture = path.join(temporary, 'failure.cjs');
  fs.writeFileSync(fixture, 'process.stderr.write("0x80073CF1: Package not found"); process.exitCode = 1;');
  await assert.rejects(activateStoreApp(fixture, process.execPath), /0x80073CF1: Package not found/);
  await assert.rejects(activateStoreApp('unused', path.join(temporary, 'missing.exe')), /ENOENT/);
});

const nativeHelper = path.resolve('electron/launch-store-app.exe');
test('the Windows distribution includes the native activation helper', () => {
  const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.ok(manifest.build.extraResources.some(resource =>
    resource.from === 'electron/launch-store-app.exe' && resource.to === 'launch-store-app.exe'));
  assert.equal(fs.readFileSync(nativeHelper).subarray(0, 2).toString('ascii'), 'MZ');
});

test('native activation rejects an uninstalled package with a Windows HRESULT', { skip: process.platform !== 'win32' }, async () => {
  await assert.rejects(activateStoreApp('CyberLauncher.NotInstalled_1234567890123!App', nativeHelper), /0x80073CF1/);
});

test('native activation treats shell metacharacters as literal AUMID data', { skip: process.platform !== 'win32' }, async () => {
  const marker = path.join(temporary, 'must-not-exist.txt');
  await assert.rejects(activateStoreApp('CyberLauncher.NotInstalled_1234567890123!App & echo injected > "' + marker + '"', nativeHelper));
  assert.equal(fs.existsSync(marker), false);
});

test('native helper rejects a missing AUMID', { skip: process.platform !== 'win32' }, () => {
  assert.throws(() => execFileSync(nativeHelper, [], { windowsHide: true, stdio: 'pipe' }), error => {
    assert.match(String((error as { stderr: Buffer }).stderr), /application user model ID is required/);
    return true;
  });
});

// Opt in explicitly: normal test runs must not open a user's applications.
test('activates the selected installed app and returns its Windows process ID', {
  skip: process.platform !== 'win32' || !process.env.TEST_STORE_APP_ID,
}, async () => {
  assert.ok(await activateStoreApp(process.env.TEST_STORE_APP_ID!, nativeHelper) > 0);
});
