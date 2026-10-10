import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const project = path.resolve(import.meta.dirname, '..');
const version = JSON.parse(readFileSync(path.join(project, 'package.json'), 'utf8')).version;
const main = path.join(project, 'dist-electron/main.js');
if (!existsSync(main)) throw new Error('Run npm run build before opening the review.');
const profile = mkdtempSync(path.join(tmpdir(), 'CyberLauncher-CyberBot-review-'));
const data = path.join(profile, 'data');
mkdirSync(data);

// Copy appearance and launcher organization, never tasks or the user's profile.
const configured = path.join(process.env.APPDATA, 'CyberLauncher', 'cyber-launcher-config.json');
const iconCache = path.join(path.dirname(configured), 'icon-cache');
if (existsSync(iconCache)) cpSync(iconCache, path.join(data, 'icon-cache'), { recursive: true });
const appearance = {};
if (existsSync(configured)) {
  const original = JSON.parse(readFileSync(configured, 'utf8'));
  for (const key of ['apps', 'categories', 'favoriteIds', 'taskbarAppIds', 'bgType', 'bgImage', 'customImageUrl',
    'customSlotImage', 'bgColor', 'bgGradient', 'glassIntensity', 'bgOpacity', 'leftSidebarWidth', 'leftSidebarCollapsed',
    'rightSidebarWidth', 'rightSidebarCollapsed', 'language', 'showHeaderClock', 'showFooterDateTime', 'showFooterUptime',
    'showFooterLaunches', 'enableTooltips', 'showSuiteRecommendations']) {
    if (original[key] !== undefined) appearance[key] = original[key];
  }
}
writeFileSync(path.join(data, 'cyber-launcher-config.json'), JSON.stringify({
  ...appearance, startWithWindows: false, startMinimized: false, hideOnBlur: false, hideOnClickDeadSpot: false,
  showTaskbarIcon: true, autoUpdate: false, autoBackupEnabled: false, systemAlertsEnabled: false,
  diskAlertsEnabled: false, ramAlertsEnabled: false, hotspotCorners: [], scheduledTasks: [],
  activationShortcut: 'Ctrl+Alt+Shift+F11',
  cyberBotSettings: { enabled: true, position: 'bottom-right', dodgeEnabled: false, hoverAssistEnabled: false,
    bannersEnabled: true, preferredName: '', namePromptState: 'dismissed', namePromptAfter: 0,
    chatterLevel: 'minimal', quietHours: { enabled: false, from: '22:00', to: '07:00' } },
}, null, 2));
const server = await createServer({
  configFile: false, root: project, plugins: [react(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  resolve: { alias: { '@': project } },
  server: { host: '127.0.0.1', port: 4321, strictPort: true, watch: { ignored: ['**/scripts/**', '**/tests/**', '**/docs/**'] } },
});
await server.listen();
const env = { ...process.env, VITE_DEV_SERVER_URL: 'http://127.0.0.1:4321/cyberbot-review.html', PORTABLE_EXECUTABLE_DIR: profile };
delete env.ELECTRON_RUN_AS_NODE;
delete env.PORTABLE_EXECUTABLE_FILE;
const args = [path.join(project, 'scripts/cyberbot-review-host.cjs')];
if (process.argv.includes('--inspect')) args.push('--remote-debugging-port=9445', '--remote-debugging-address=127.0.0.1');
const electron = spawn(require('electron'), args, { cwd: project, env, stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
console.log(`CyberBot review: ${env.VITE_DEV_SERVER_URL}`);
console.log(`Isolated data: ${data}`);
console.log('Close the review using the tray Exit command, or press Ctrl+C in this terminal.');
async function close() {
  if (electron.exitCode === null && electron.connected) electron.send('quit-cyberbot-review');
  await server.close();
}
electron.on('exit', async code => { await server.close(); process.exitCode = code ?? 0; });
electron.on('error', async error => { console.error(error); await close(); process.exitCode = 1; });
process.on('SIGINT', close);
process.on('SIGTERM', close);
