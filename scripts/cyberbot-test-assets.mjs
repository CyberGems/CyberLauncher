// Node's SSR tests consume the same Vite artwork imports used by the app.
// CSS is tested in Electron; Node has no style/layout engine.
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('.svg?raw')) return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.svg?raw')) {
      const file = new URL(url); file.search = '';
      return { format: 'module', source: `export default ${JSON.stringify(readFileSync(file, 'utf8'))}`, shortCircuit: true };
    }
    if (url.endsWith('.css')) return { format: 'module', source: 'export {}', shortCircuit: true };
    return nextLoad(url, context);
  },
});
