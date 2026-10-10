import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import path from 'path';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron/simple';

const { version: appVersion } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    rollupOptions: { input: { launcher: path.resolve(__dirname, 'index.html'), toast: path.resolve(__dirname, 'cyberbot-toast.html') } },
  },
  plugins: [
    {
      name: 'desktop-toast-production-csp',
      transformIndexHtml(html, context) {
        // React refresh uses an inline preamble in development only.
        return !context.server && context.filename.endsWith('cyberbot-toast.html')
          ? html.replace("script-src 'self' 'unsafe-inline';", "script-src 'self';") : html;
      },
    },
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['electron-updater', 'node-pty'],
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
