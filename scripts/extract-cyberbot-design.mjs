import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const postcss = require('postcss');
const project = path.resolve(import.meta.dirname, '..');
const source = readFileSync(path.join(project, 'public/cyberbot-preview.html'), 'utf8');
const svg = source.match(/<svg id="cyberBotV2"[\s\S]*?<\/svg>/)?.[0];
const style = source.match(/<style>([\s\S]*?)<\/style>/)?.[1];
if (!svg || !style) throw new Error('The approved laboratory SVG or styles are missing.');

// Preserve HTML SVG attributes exactly. In particular, correcting the laboratory's
// camel-case stopColor attributes would change its approved black surfaces to blue.
const artwork = svg.replace('width="220" height="253"', 'width="100%" height="100%"').replace(/[ \t]+$/gm, '');
const css = postcss.parse(style);
const start = style.indexOf('/* Robot Floating Assembly');
const end = style.indexOf('/* Dock Live Context Preview');
const selectorStart = style.indexOf('.visor-blinking');
if (start < 0 || end < start || selectorStart < 0) throw new Error('Laboratory style boundaries changed.');

// Only robot rules, never laboratory page layout or controls.
css.nodes = css.nodes.filter(node => {
  const offset = node.source.start.offset;
  return (offset >= start && offset < end) || offset >= selectorStart;
});
const scope = '.cyberbot-approved-avatar';
const keyframes = new Map();
css.walkAtRules('keyframes', rule => {
  const name = rule.params;
  keyframes.set(name, `approved-${name}`);
  rule.params = `approved-${name}`;
});
css.walkRules(rule => {
  if (rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') return;
  rule.selectors = rule.selectors.filter(selector => !/#miniBotClone|#miniBotSlot/.test(selector)).map(selector => {
    if (selector === ':root') return scope;
    const local = selector.replace(/#([\w-]+)/g, '[data-part="$1"]');
    if (local.startsWith('body')) return local.replace(/^body/, scope);
    if (local.startsWith('.compact-screen-active')) return `${scope}${local}`;
    return `${scope} ${local}`;
  });
  if (!rule.selectors.length) rule.remove();
});
css.walkDecls(declaration => {
  if (!declaration.prop.startsWith('animation')) return;
  for (const [before, after] of keyframes) {
    declaration.value = declaration.value.replace(new RegExp(`\\b${before}\\b`, 'g'), after);
  }
});
const directory = path.join(project, 'src/components/companion/approved');
mkdirSync(directory, { recursive: true });
writeFileSync(path.join(directory, 'cyberbot-approved.svg'), artwork + '\n');
writeFileSync(path.join(directory, 'cyberbot-approved.css'), `/* Extracted from the approved laboratory. Geometry and timing are preserved. */\n@import '@fontsource/jetbrains-mono/600.css';\n${css.toString()}\n
.cyberbot-approved-avatar { display: inline-flex; flex: none; overflow: visible; }
.cyberbot-approved-avatar.reduced-motion * { animation: none !important; transition: none !important; }
.cyberbot-approved-avatar.reduced-motion.compact-screen-active [data-part="headGroup"] { transform: translateY(49px); }
`.replace(/[ \t]+$/gm, ''));
console.log('Extracted approved SVG and scoped robot styles. The laboratory was not modified.');
