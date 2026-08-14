/**
 * Generate public app + tray + menu icons from artifacts/.
 * See AGENTS.md → "Application icon update".
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = path.join(root, 'artifacts');
const pub = path.join(root, 'public');
const menuDir = path.join(pub, 'menu-icons');

const srcPng = path.join(artifacts, 'icon.png');
const srcIco = path.join(artifacts, 'icon.ico');

function lucideSvg(inner, { stroke = '#ffffff', size = 64 } = {}) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
  );
}

async function svgToPng16(svgBuf, dest) {
  const raster = await sharp(svgBuf, { density: 384 })
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp(raster)
    .resize(16, 16, { kernel: 'lanczos3', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(dest);
}

async function main() {
  if (!fs.existsSync(srcPng)) {
    throw new Error(`Missing ${srcPng} — place the 1024×1024 master PNG in artifacts/`);
  }
  if (!fs.existsSync(srcIco)) {
    throw new Error(`Missing ${srcIco} — place the multi-size Windows ICO in artifacts/`);
  }

  fs.mkdirSync(pub, { recursive: true });
  fs.mkdirSync(menuDir, { recursive: true });

  fs.copyFileSync(srcIco, path.join(pub, 'icon.ico'));
  fs.copyFileSync(srcPng, path.join(pub, 'icon.png'));

  for (const size of [16, 20, 24, 32, 256]) {
    await sharp(srcPng)
      .resize(size, size, { kernel: 'lanczos3', fit: 'contain' })
      .png({ compressionLevel: 9 })
      .toFile(path.join(pub, `icon-${size}.png`));
    console.log('wrote', `icon-${size}.png`);
  }
  console.log('wrote icon.ico, icon.png');

  const menuSvgs = {
    'show-hide.png': lucideSvg(
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/>'
    ),
    'settings.png': lucideSvg(
      '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'
    ),
    'about.png': lucideSvg(
      '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
    ),
    'quit.png': lucideSvg(
      '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>',
      { stroke: '#e8796a' }
    ),
  };

  for (const [file, svg] of Object.entries(menuSvgs)) {
    const dest = path.join(menuDir, file);
    await svgToPng16(svg, dest);
    console.log('wrote menu-icons/' + file);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
