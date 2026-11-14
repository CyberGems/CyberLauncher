/**
 * Generate the NSIS installer sidebar artwork (164×314 BMP + PNG) from public/icon.png.
 * Matches the CyberGems suite visual language (pale gradient, brand arc,
 * constellation dots, and centered app icon with a subtle cyan glow).
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SIDEBAR_WIDTH = 164;
const SIDEBAR_HEIGHT = 314;
const ICON_SIZE = 92;
const ICON_CENTER_X = Math.floor(SIDEBAR_WIDTH / 2);
const ICON_CENTER_Y = 118;

function encodeBMP(width, height, rawRGBBuffer) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);

  // BITMAPFILEHEADER (14 bytes)
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt16LE(0, 6);
  buf.writeUInt16LE(0, 8);
  buf.writeUInt32LE(54, 10);

  // BITMAPINFOHEADER (40 bytes)
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // positive = bottom-up
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30); // BI_RGB
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38); // ~72 DPI
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  for (let y = 0; y < height; y++) {
    const srcY = height - 1 - y;
    const rowOffset = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const srcIdx = (srcY * width + x) * 3;
      buf[rowOffset + x * 3] = rawRGBBuffer[srcIdx + 2]; // B
      buf[rowOffset + x * 3 + 1] = rawRGBBuffer[srcIdx + 1]; // G
      buf[rowOffset + x * 3 + 2] = rawRGBBuffer[srcIdx]; // R
    }
  }
  return buf;
}

function buildPlateSvg(width, height) {
  const arcCx = (width * 1.30).toFixed(2);
  const arcCy = (height * 0.50).toFixed(2);
  const arcRadius = width * 1.05;

  const dots = [];
  for (let i = 0; i < 26; i++) {
    const angleRad = (((i * 137.5) % 360) * Math.PI) / 180;
    const r = 0.30 + 0.22 * ((i % 5) / 4);
    const x = width * 0.78 + Math.cos(angleRad) * width * r * 0.62;
    const y = height * 0.52 + Math.sin(angleRad) * height * r * 0.42;
    if (x >= 0 && x <= width && y >= 0 && y <= height) {
      dots.push({ x, y, r: i % 4 === 0 ? 2 : 1 });
    }
  }

  const linesSvg = [];
  for (let i = 0; i < dots.length; i++) {
    for (const next of dots.slice(i + 1, i + 3)) {
      if (Math.hypot(dots[i].x - next.x, dots[i].y - next.y) < 34) {
        linesSvg.push(
          `<line x1="${dots[i].x.toFixed(2)}" y1="${dots[i].y.toFixed(2)}" x2="${next.x.toFixed(2)}" y2="${next.y.toFixed(2)}" stroke="#deebfa" stroke-width="1" />`
        );
      }
    }
  }

  const dotsSvg = dots.map(
    (d) => `<circle cx="${d.x.toFixed(2)}" cy="${d.y.toFixed(2)}" r="${d.r}" fill="#c9dcf0" />`
  );

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="plateBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e8f1fc" />
    </linearGradient>
    <radialGradient id="iconGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.22" />
      <stop offset="55%" stop-color="#22d3ee" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#plateBg)" />
  <circle cx="${arcCx}" cy="${arcCy}" r="${arcRadius.toFixed(2)}" fill="none" stroke="#dae8f9" stroke-width="3" />
  <circle cx="${arcCx}" cy="${arcCy}" r="${(arcRadius - 14).toFixed(2)}" fill="none" stroke="#dae8f9" stroke-width="2" />
  ${linesSvg.join('\n  ')}
  ${dotsSvg.join('\n  ')}
  <circle cx="${ICON_CENTER_X}" cy="${ICON_CENTER_Y}" r="68" fill="url(#iconGlow)" />
</svg>`);
}

async function main() {
  const sourceIcon = path.resolve('public/icon.png');
  const outDir = path.resolve('public');

  if (!fs.existsSync(sourceIcon)) {
    throw new Error(`App icon not found at: ${sourceIcon}`);
  }

  console.log(`Generating installer sidebar (${SIDEBAR_WIDTH}x${SIDEBAR_HEIGHT}) from public/icon.png...`);

  const plateBuffer = await sharp(buildPlateSvg(SIDEBAR_WIDTH, SIDEBAR_HEIGHT))
    .png()
    .toBuffer();

  const iconBuffer = await sharp(sourceIcon)
    .resize(ICON_SIZE, ICON_SIZE, { kernel: 'lanczos3', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const composed = sharp(plateBuffer).composite([
    {
      input: iconBuffer,
      left: ICON_CENTER_X - Math.floor(ICON_SIZE / 2),
      top: ICON_CENTER_Y - Math.floor(ICON_SIZE / 2),
    },
  ]);

  const pngPath = path.join(outDir, 'installerSidebar.png');
  await composed.clone().png({ compressionLevel: 9 }).toFile(pngPath);

  const { data: rawSidebar, info: sidebarInfo } = await composed
    .clone()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sidebarBmp = encodeBMP(sidebarInfo.width, sidebarInfo.height, rawSidebar);
  const bmpPath = path.join(outDir, 'installerSidebar.bmp');
  fs.writeFileSync(bmpPath, sidebarBmp);
  console.log(`Saved ${bmpPath} (${sidebarBmp.length} bytes) and ${pngPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
