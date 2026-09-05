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

async function extractIcoLayers(icoBuf) {
  const count = icoBuf.readUInt16LE(4);
  const layers = new Map();
  for (let i = 0; i < count; i++) {
    const off = 6 + i * 16;
    const w = icoBuf.readUInt8(off) || 256;
    const h = icoBuf.readUInt8(off + 1) || 256;
    const bpp = icoBuf.readUInt16LE(off + 6);
    const size = icoBuf.readUInt32LE(off + 8);
    const offset = icoBuf.readUInt32LE(off + 12);
    if (bpp !== 32) continue;

    const slice = icoBuf.subarray(offset, offset + size);
    if (slice.readUInt32BE(0) === 0x89504e47) {
      // Direct PNG layer
      layers.set(w, slice);
    } else {
      // 32bpp DIB (BITMAPINFOHEADER + BGRA pixels)
      const dibHeaderSize = slice.readUInt32LE(0);
      const rawPixels = slice.subarray(dibHeaderSize, dibHeaderSize + w * h * 4);
      const pixels = Buffer.alloc(w * h * 4);
      for (let y = 0; y < h; y++) {
        const srcRow = h - 1 - y;
        for (let x = 0; x < w; x++) {
          const srcIdx = (srcRow * w + x) * 4;
          const dstIdx = (y * w + x) * 4;
          pixels[dstIdx] = rawPixels[srcIdx + 2]; // R
          pixels[dstIdx + 1] = rawPixels[srcIdx + 1]; // G
          pixels[dstIdx + 2] = rawPixels[srcIdx]; // B
          pixels[dstIdx + 3] = rawPixels[srcIdx + 3]; // A
        }
      }
      const pngBuf = await sharp(pixels, { raw: { width: w, height: h, channels: 4 } })
        .png({ compressionLevel: 9 })
        .toBuffer();
      layers.set(w, pngBuf);
    }
  }
  return layers;
}

async function enhanceSmallIcon(pngBuf, size) {
  if (size > 48) return pngBuf;
  const { data, info } = await sharp(pngBuf).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const margin = Math.max(1, Math.round(w * 0.12));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
      const isOuter = (x < margin || x >= w - margin || y < margin || y >= h - margin);

      // Enhance outer rounded-square border to vibrant high-contrast cyan
      if (a > 30 && isOuter) {
        if (g > 40 && g < 190 && b > 60 && b < 215 && r < 70) {
          const norm = Math.min(1.0, g / 120);
          data[idx] = Math.round(8 * norm);
          data[idx + 1] = Math.round(225 * norm);
          data[idx + 2] = Math.round(248 * norm);
          data[idx + 3] = 255;
        }
      }

      // Enhance fourth element (spark / star / plus) to crisp bright white
      if (x >= Math.floor(w * 0.5) && y >= Math.floor(h * 0.5)) {
        if (r > 35 && g > 80 && b > 100) {
          const br = (g + b) / 2;
          if (br > 110) {
            const t = Math.min(1.0, (br - 110) / 75);
            data[idx] = Math.round(r + (245 - r) * t);
            data[idx + 1] = Math.round(g + (252 - g) * t);
            data[idx + 2] = Math.round(b + (255 - b) * t);
          }
        }
      }
    }
  }

  return await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
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

  const icoBuf = fs.readFileSync(srcIco);
  const icoLayers = await extractIcoLayers(icoBuf);

  fs.copyFileSync(srcIco, path.join(pub, 'icon.ico'));
  fs.copyFileSync(srcPng, path.join(pub, 'icon.png'));

  // Generate or extract pixel-perfect representations for tray (16, 20, 24, 32, 40) and web/readme (256)
  for (const size of [16, 20, 24, 32, 40, 256]) {
    const dest = path.join(pub, `icon-${size}.png`);
    let rawBuf;
    if (icoLayers.has(size)) {
      rawBuf = icoLayers.get(size);
    } else {
      rawBuf = await sharp(srcPng)
        .resize(size, size, { kernel: 'lanczos3', fit: 'contain' })
        .png({ compressionLevel: 9 })
        .toBuffer();
    }
    const finalBuf = await enhanceSmallIcon(rawBuf, size);
    fs.writeFileSync(dest, finalBuf);
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
    'help.png': lucideSvg(
      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'
    ),
    'faq.png': lucideSvg(
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'
    ),
    'changelog.png': lucideSvg(
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'
    ),
    'homepage.png': lucideSvg(
      '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
    ),
    'donate.png': lucideSvg(
      '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
      { stroke: '#e8796a' }
    ),
    'about.png': lucideSvg(
      '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
    ),
    'update.png': lucideSvg(
      '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>'
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

  // Copy application logo as brand icon for tray header item (1x and 2x for HiDPI)
  fs.copyFileSync(path.join(pub, 'icon-16.png'), path.join(menuDir, 'brand.png'));
  fs.copyFileSync(path.join(pub, 'icon-32.png'), path.join(menuDir, 'brand@2x.png'));
  console.log('wrote menu-icons/brand.png and brand@2x.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
