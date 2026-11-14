import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  EMBEDDED_ICONS_KEY,
  bundleEmbeddedBackupIcons,
  restorePortableBackupIcons,
  parseValidBackupJson,
  writeFileAtomicSync,
  writeFileAtomic,
  filePathToLocalResourceUrl,
  localResourceUrlToFilePath,
} from '../shared/backupIcons';
import { resolveEmbeddedIconsInBrowser } from '../shared/backupIconsBrowser';

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('bundleEmbeddedBackupIcons embeds cache and custom local icons without mutating input', () => {
  const tmpDir = makeTempDir('cl-backup-bundle-');
  try {
    const cacheDir = path.join(tmpDir, 'icon-cache');
    const customDir = path.join(tmpDir, 'custom-icons');
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.mkdirSync(customDir, { recursive: true });

    const cachedPng = path.join(cacheDir, 'abc123def456789012345678.png');
    const customIco = path.join(customDir, 'custom-app.ico');
    const historyPng = path.join(cacheDir, '999988887777666655554444.png');

    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
    const icoBytes = Buffer.from([0x00, 0x00, 0x01, 0x00, 5, 6, 7, 8]);
    const histBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 9, 10, 11, 12]);

    fs.writeFileSync(cachedPng, pngBytes);
    fs.writeFileSync(customIco, icoBytes);
    fs.writeFileSync(historyPng, histBytes);

    const cachedUrl = `${filePathToLocalResourceUrl(cachedPng)}?t=1788671130029`;
    const customUrl = filePathToLocalResourceUrl(customIco);
    const historyUrl = `${filePathToLocalResourceUrl(historyPng)}?t=1788671130999`;

    const original = {
      apps: [
        { id: 1, name: 'Cached App', iconPath: cachedUrl, path: 'C:\\Apps\\app1.exe' },
        { id: 2, name: 'Custom Icon App', iconPath: customUrl, path: 'C:\\Apps\\app2.exe' },
        { id: 3, name: 'Inline Base64 App', iconPath: 'data:image/png;base64,AAAA', path: 'C:\\Apps\\app3.exe' },
        { id: 4, name: 'Remote App', iconPath: 'https://example.com/icon.png', path: 'https://example.com' },
      ],
      launchHistory: [
        { id: 'h1', name: 'Recent', path: 'C:\\Apps\\recent.exe', icon: historyUrl },
      ],
    };

    const bundled = bundleEmbeddedBackupIcons(original, { iconCacheDir: cacheDir });

    // Input remains unmutated
    assert.equal((original as Record<string, any>)[EMBEDDED_ICONS_KEY], undefined);

    const embedded = bundled[EMBEDDED_ICONS_KEY];
    assert.ok(embedded, 'Expected _embeddedIcons map in backup');
    assert.equal(Object.keys(embedded).length, 3);
    assert.ok(embedded[filePathToLocalResourceUrl(cachedPng)].startsWith('data:image/png;base64,'));
    assert.ok(embedded[customUrl].startsWith('data:image/x-icon;base64,'));
    assert.ok(embedded[filePathToLocalResourceUrl(historyPng)].startsWith('data:image/png;base64,'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('restorePortableBackupIcons migrates icons across PCs and strips _embeddedIcons', async () => {
  const pcADir = makeTempDir('cl-pc-a-');
  const pcBDir = makeTempDir('cl-pc-b-');
  try {
    const pcACache = path.join(pcADir, 'icon-cache');
    const pcACustom = path.join(pcADir, 'Desktop', 'Icons');
    const pcBCache = path.join(pcBDir, 'icon-cache');
    fs.mkdirSync(pcACache, { recursive: true });
    fs.mkdirSync(pcACustom, { recursive: true });

    const appAPng = path.join(pcACache, '5fa875e9086c35231e5f11de.png');
    const customPng = path.join(pcACustom, 'my-tool.png');
    const pngPayloadA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 11, 22, 33, 44]);
    const pngPayloadB = Buffer.from([0x89, 0x50, 0x4e, 0x47, 55, 66, 77, 88]);
    fs.writeFileSync(appAPng, pngPayloadA);
    fs.writeFileSync(customPng, pngPayloadB);

    const backup = bundleEmbeddedBackupIcons(
      {
        apps: [
          {
            id: 10,
            name: 'App A',
            path: 'C:\\Program Files\\AppA\\AppA.exe',
            iconPath: `${filePathToLocalResourceUrl(appAPng)}?t=100`,
          },
          {
            id: 11,
            name: 'Custom App',
            path: 'C:\\Tools\\tool.exe',
            iconPath: filePathToLocalResourceUrl(customPng),
          },
        ],
        launchHistory: [
          {
            id: 'h1',
            name: 'App A',
            path: 'C:\\Program Files\\AppA\\AppA.exe',
            icon: `${filePathToLocalResourceUrl(appAPng)}?t=100`,
          },
        ],
      },
      { iconCacheDir: pcACache }
    );

    // Simulate PC A completely wiped / migrating to fresh PC B
    fs.rmSync(pcADir, { recursive: true, force: true });

    const restored = await restorePortableBackupIcons(backup, {
      iconCacheDir: pcBCache,
      cacheTimestamp: 99999,
    });

    assert.equal((restored as Record<string, any>)[EMBEDDED_ICONS_KEY], undefined);

    const restoredPathA = localResourceUrlToFilePath(restored.apps[0].iconPath);
    const restoredPathB = localResourceUrlToFilePath(restored.apps[1].iconPath);
    const restoredHistPath = localResourceUrlToFilePath(restored.launchHistory[0].icon);

    assert.ok(restoredPathA.startsWith(path.normalize(pcBCache)));
    assert.ok(restoredPathB.startsWith(path.normalize(pcBCache)));
    assert.ok(restoredHistPath.startsWith(path.normalize(pcBCache)));

    assert.deepEqual(fs.readFileSync(restoredPathA), pngPayloadA);
    assert.deepEqual(fs.readFileSync(restoredPathB), pngPayloadB);
    assert.deepEqual(fs.readFileSync(restoredHistPath), pngPayloadA);
    assert.ok(restored.apps[0].iconPath.endsWith('?t=99999'));
  } finally {
    fs.rmSync(pcADir, { recursive: true, force: true });
    fs.rmSync(pcBDir, { recursive: true, force: true });
  }
});

test('restorePortableBackupIcons handles legacy backups via cache remap, extractFallback, and dead link cleanup', async () => {
  const tmpDir = makeTempDir('cl-legacy-restore-');
  try {
    const localCache = path.join(tmpDir, 'icon-cache');
    fs.mkdirSync(localCache, { recursive: true });
    const existingHashFile = path.join(localCache, '111122223333444455556666.png');
    fs.writeFileSync(existingHashFile, Buffer.from([1, 2, 3, 4]));

    const legacyBackup = {
      apps: [
        {
          id: 1,
          name: 'Remappable',
          path: 'C:\\Apps\\remappable.exe',
          iconPath: 'local-resource:///C:/Users/OLD_PC/AppData/Roaming/CyberLauncher/icon-cache/111122223333444455556666.png?t=1',
        },
        {
          id: 2,
          name: 'Reextractable',
          path: 'C:\\Apps\\reextract.exe',
          iconPath: 'local-resource:///C:/Users/OLD_PC/AppData/Roaming/CyberLauncher/icon-cache/aaaaaaaaaaaaaaaaaaaaaaaa.png?t=1',
        },
        {
          id: 3,
          name: 'Unavailable',
          path: 'C:\\Apps\\missing.exe',
          iconPath: 'local-resource:///C:/Users/OLD_PC/AppData/Roaming/CyberLauncher/icon-cache/bbbbbbbbbbbbbbbbbbbbbbbb.png?t=1',
        },
      ],
    };

    const reextractedUrl = 'local-resource:///C:/fresh/reextracted.png?t=42';
    const restored = await restorePortableBackupIcons(legacyBackup, {
      iconCacheDir: localCache,
      cacheTimestamp: 555,
      extractFallback: async (app) => (app.id === 2 ? reextractedUrl : null),
    });

    assert.equal(restored.apps[0].iconPath, `${filePathToLocalResourceUrl(existingHashFile)}?t=555`);
    assert.equal(restored.apps[1].iconPath, reextractedUrl);
    assert.equal(restored.apps[2].iconPath, '');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('resolveEmbeddedIconsInBrowser converts portable icons to data URLs and strips _embeddedIcons', () => {
  const backup = {
    apps: [
      { id: 1, name: 'Tool', iconPath: 'local-resource:///C:/Users/Carlos/AppData/Roaming/CyberLauncher/icon-cache/abc.png?t=12' },
    ],
    [EMBEDDED_ICONS_KEY]: {
      'local-resource:///C:/Users/Carlos/AppData/Roaming/CyberLauncher/icon-cache/abc.png': 'data:image/png;base64,Zm9v',
    },
  };

  const resolved = resolveEmbeddedIconsInBrowser(backup);
  assert.equal((resolved as Record<string, any>)[EMBEDDED_ICONS_KEY], undefined);
  assert.equal(resolved.apps[0].iconPath, 'data:image/png;base64,Zm9v');
});

test('parseValidBackupJson rejects 0-byte and malformed files while atomic writes produce intact JSON', async () => {
  const tmpDir = makeTempDir('cl-atomic-');
  try {
    const syncFile = path.join(tmpDir, 'sync.json');
    const asyncFile = path.join(tmpDir, 'async.json');
    writeFileAtomicSync(syncFile, JSON.stringify({ apps: [{ id: 1 }] }));
    await writeFileAtomic(asyncFile, JSON.stringify({ apps: [{ id: 2 }] }));

    assert.deepEqual(parseValidBackupJson(fs.readFileSync(syncFile, 'utf-8')), { apps: [{ id: 1 }] });
    assert.deepEqual(parseValidBackupJson(fs.readFileSync(asyncFile, 'utf-8')), { apps: [{ id: 2 }] });

    assert.equal(parseValidBackupJson(''), null);
    assert.equal(parseValidBackupJson('   '), null);
    assert.equal(parseValidBackupJson('{"apps": ['), null);
    assert.equal(parseValidBackupJson('[]'), null);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

