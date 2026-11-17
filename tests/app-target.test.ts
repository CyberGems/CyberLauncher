import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { isUriAppTarget, normalizeAppTarget, resolveAppFileTarget } from '../electron/app-target';
import { getDefaultWindowsApps } from '../shared/defaultApps';

test('Windows Settings URI shortcuts are not checked as files', () => {
  for (const target of ['ms-settings:', 'ms-settings:about', 'ms-settings:appsfeatures', 'ms-settings:network', 'https://cybergems.org']) {
    assert.equal(isUriAppTarget(target), true, target);
  }
  for (const target of ['calc.exe', 'C:\\Apps\\tool.exe', 'C:tool.exe', '\\\\server\\share\\tool.exe']) {
    assert.equal(isUriAppTarget(target), false, target);
  }
  assert.equal(normalizeAppTarget('  "ms-settings:about"  '), 'ms-settings:about');
  assert.equal(normalizeAppTarget(" 'calc.exe' "), 'calc.exe');
});

test('starter commands resolve from Windows folders and absent files stay missing', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'CyberLauncher-target-'));
  try {
    const system32 = path.join(temporary, 'System32');
    const powerShell = path.join(system32, 'WindowsPowerShell', 'v1.0');
    fs.mkdirSync(powerShell, { recursive: true });
    for (const [directory, command] of [
      [system32, 'taskmgr.exe'],
      [temporary, 'explorer.exe'],
      [powerShell, 'powershell.exe'],
    ]) {
      const fullPath = path.join(directory, command);
      fs.writeFileSync(fullPath, '');
      assert.equal(resolveAppFileTarget(command, temporary), fullPath);
      assert.equal(resolveAppFileTarget(fullPath, temporary), fullPath);
    }
    assert.equal(resolveAppFileTarget('CyberLauncher-missing-file.exe', temporary), undefined);
    fs.unlinkSync(path.join(system32, 'taskmgr.exe'));
    assert.equal(resolveAppFileTarget('taskmgr.exe', temporary), undefined);
    for (const app of getDefaultWindowsApps('es')) {
      const target = normalizeAppTarget(app.path!);
      if (isUriAppTarget(target)) continue;
      const fullPath = path.join(system32, target);
      fs.writeFileSync(fullPath, '');
      assert.equal(resolveAppFileTarget(target, temporary), fullPath, app.name);
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
