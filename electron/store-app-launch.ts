import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export async function activateStoreApp(appUserModelId: string, helperPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    // Pass the AUMID as one literal argument, never interpolate it into a shell command.
    execFile(helperPath, [appUserModelId], { windowsHide: true, timeout: 30_000, encoding: 'utf8' },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
          return;
        }
        const output = stdout.trim();
        const processId = Number(output);
        if (!/^\d+$/.test(output) || !Number.isSafeInteger(processId) || processId <= 0 || processId > 0xFFFFFFFF) {
          reject(new Error('Windows did not return a valid activated process ID.'));
          return;
        }
        resolve(processId);
      });
  });
}

export function resolveStoreAppLauncher(
  packaged: boolean, resourcesPath: string, appPath: string, mainDirectory: string,
): string {
  const candidates = packaged
    ? [path.join(resourcesPath, 'launch-store-app.exe')]
    : [
      path.join(mainDirectory, '../electron/launch-store-app.exe'),
      path.join(appPath, 'electron/launch-store-app.exe'),
    ];
  const helperPath = candidates.find(candidate => fs.existsSync(candidate));
  if (!helperPath) throw new Error('The Windows Store activation helper is missing.');
  return helperPath;
}
