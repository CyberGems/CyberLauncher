import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  DEFAULT_BG_IMAGE,
  PRESET_IMAGES,
  PACKAGED_BG_BY_FILENAME,
  normalizeBgImage,
  toPresetThumbnailUrl,
} from '../shared/backgrounds';

const PUBLIC_DIR = path.resolve('public');

test('every PRESET_IMAGES entry has a 1920x1080 wallpaper and matching 480x270 thumbnail', async () => {
  assert.ok(PRESET_IMAGES.includes(DEFAULT_BG_IMAGE), 'DEFAULT_BG_IMAGE must be in PRESET_IMAGES');

  for (const preset of PRESET_IMAGES) {
    const wallpaperPath = path.join(PUBLIC_DIR, preset);
    assert.ok(fs.existsSync(wallpaperPath), `Missing preset wallpaper: ${wallpaperPath}`);
    const fullMeta = await sharp(wallpaperPath).metadata();
    assert.equal(fullMeta.width, 1920, `${preset} width should be 1920`);
    assert.equal(fullMeta.height, 1080, `${preset} height should be 1080`);

    const thumbRel = toPresetThumbnailUrl(preset).replace(/^\.\//, '');
    const thumbPath = path.join(PUBLIC_DIR, thumbRel);
    assert.ok(fs.existsSync(thumbPath), `Missing preset thumbnail: ${thumbPath}`);
    const thumbMeta = await sharp(thumbPath).metadata();
    assert.equal(thumbMeta.width, 480, `${thumbRel} width should be 480`);
    assert.equal(thumbMeta.height, 270, `${thumbRel} height should be 270`);
  }
});

test('packaged background filename aliases normalize to current PRESET_IMAGES', () => {
  for (const [alias, target] of Object.entries(PACKAGED_BG_BY_FILENAME)) {
    assert.ok(PRESET_IMAGES.includes(target), `Alias ${alias} targets unknown preset ${target}`);
    assert.equal(normalizeBgImage(alias), target);
    assert.equal(normalizeBgImage(`C:\\old\\path\\${alias}`), target);
  }
  assert.equal(normalizeBgImage(undefined), DEFAULT_BG_IMAGE);
  assert.equal(normalizeBgImage('https://example.com/custom.jpg'), 'https://example.com/custom.jpg');
});

test('NSIS installer sidebar assets exist at 164x314', async () => {
  const pngPath = path.join(PUBLIC_DIR, 'installerSidebar.png');
  const bmpPath = path.join(PUBLIC_DIR, 'installerSidebar.bmp');

  assert.ok(fs.existsSync(pngPath), 'Missing public/installerSidebar.png');
  const pngMeta = await sharp(pngPath).metadata();
  assert.equal(pngMeta.width, 164);
  assert.equal(pngMeta.height, 314);

  assert.ok(fs.existsSync(bmpPath), 'Missing public/installerSidebar.bmp');
  const bmpBuf = fs.readFileSync(bmpPath);
  assert.equal(bmpBuf.toString('ascii', 0, 2), 'BM');
  assert.equal(bmpBuf.readInt32LE(18), 164);
  assert.equal(bmpBuf.readInt32LE(22), 314);
});

