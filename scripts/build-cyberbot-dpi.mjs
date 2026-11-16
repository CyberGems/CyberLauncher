import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'win32') throw new Error('The CyberBot DPI module is built on Windows.');

const root = fileURLToPath(new URL('../', import.meta.url));
const nativeSource = path.join(root, 'electron', 'native');
const cache = path.join(root, 'node_modules', '.cache', 'cyberbot-dpi-win32');
const require = createRequire(import.meta.url);
const { version } = require(path.join(root, 'package-lock.json')).packages['node_modules/electron'];
const nodeGyp = createRequire(process.env.npm_execpath).resolve('node-gyp/bin/node-gyp.js');

mkdirSync(cache, { recursive: true });
for (const name of ['binding.gyp', 'cyberbot-dpi-win32.cpp']) {
  copyFileSync(path.join(nativeSource, name), path.join(cache, name));
}
execFileSync(process.execPath, [nodeGyp, 'rebuild', '--arch=x64', '--dist-url=https://electronjs.org/headers',
  `--target=${version}`], { cwd: cache, stdio: 'inherit', windowsHide: true });

const moduleName = 'cyberbot-dpi-win32.node';
copyFileSync(path.join(cache, 'build', 'Release', moduleName), path.join(root, 'electron', moduleName));
console.log(`Built electron/${moduleName}`);
