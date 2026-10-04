import fs from 'node:fs';
import path from 'node:path';

const MAX_LOG_BYTES = 2 * 1024 * 1024;
const BACKUP_COUNT = 2;

/** Small, persistent event log for diagnosing a visible window that stops painting. */
export function createDisplayDiagnostics(userDataDir: string) {
  const filePath = path.join(userDataDir, 'display-diagnostics.log');
  let reportedWriteFailure = false;

  const write = (event: string, details: Record<string, string | number | boolean | null> = {}) => {
    try {
      const line = `${JSON.stringify({ at: new Date().toISOString(), pid: process.pid, uptimeSec: Math.round(process.uptime()), event, ...details })}\n`;
      fs.mkdirSync(userDataDir, { recursive: true });

      const currentBytes = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
      if (currentBytes + Buffer.byteLength(line, 'utf8') > MAX_LOG_BYTES) {
        for (let index = BACKUP_COUNT; index >= 1; index--) {
          const source = index === 1 ? filePath : `${filePath}.${index - 1}`;
          const destination = `${filePath}.${index}`;
          if (fs.existsSync(destination)) fs.unlinkSync(destination);
          if (fs.existsSync(source)) fs.renameSync(source, destination);
        }
      }

      fs.appendFileSync(filePath, line, 'utf8');
    } catch (error) {
      if (!reportedWriteFailure) {
        reportedWriteFailure = true;
        console.error('[DISPLAY-DIAGNOSTICS] Could not write event log:', error);
      }
    }
  };

  return { filePath, write };
}
