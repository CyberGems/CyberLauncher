import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  extractLanguageSection,
  cleanMarkdownChangelog,
  parseReleaseBlocks,
  peekReleaseNotes,
} from '../src/releaseNotes';

// Fixture shaped like the real published release body: summary, blockquote,
// ES <details> block with nested bullets, install furniture, and downloads table.
const releaseBody = `<p align="center">
  <img src="https://example.com/icon.png" width="120" alt="CyberLauncher">
</p>

## 📋 CyberLauncher v1.16.0: Release Notes

<!-- changelog-summary:start -->
Summary line for toasts.
<!-- changelog-summary:end -->

> **New to CyberLauncher?** A keyboard-driven Windows launcher.

---

### ✨ Key Features & Highlights

- 🧭 **Main feature**:
  - First sub-bullet detail.
  - Second sub-bullet detail that
  continues on a soft-wrapped line.
- 💾 **Second feature**: single-level bullet text.

<details>
<summary><b>🇪🇸 Ver notas de la versión en Español</b></summary>

### 🚀 Novedades de esta versión

Resumen en español.

- 🧭 **Función principal**:
  - Primer detalle anidado.
  - Segundo detalle anidado.
- 💾 **Segunda función**: texto de un solo nivel.

### ⚠️ Antes de instalar

- **Windows:** esta versión aún no está firmada digitalmente.

</details>

---

### ⚠️ Before you install

- **Windows:** this release is not code-signed yet.

---

### 📦 Downloads & Packages

| File | Description | Platform |
| :--- | :--- | :--- |
| **[Setup-1.16.0.exe](https://example.com/setup)** | Installer | Windows |
`;

test('extractLanguageSection picks the Spanish details block', () => {
  const section = extractLanguageSection(releaseBody, 'es');
  assert.match(section, /Función principal/);
  assert.doesNotMatch(section, /Second feature/);
});

test('extractLanguageSection keeps English content without the Spanish block', () => {
  const section = extractLanguageSection(releaseBody, 'en');
  assert.match(section, /Main feature/);
  assert.doesNotMatch(section, /Función principal/);
});

test('cleanMarkdownChangelog filters install furniture, downloads and tables', () => {
  const es = cleanMarkdownChangelog(releaseBody, 'es');
  assert.doesNotMatch(es, /Antes de instalar/);
  assert.doesNotMatch(es, /firmada digitalmente/);
  assert.doesNotMatch(es, /Downloads & Packages/);
  assert.match(es, /Función principal/);

  const en = cleanMarkdownChangelog(releaseBody, 'en');
  assert.doesNotMatch(en, /Before you install/);
  assert.doesNotMatch(en, /code-signed/);
  assert.doesNotMatch(en, /Setup-1\.16\.0/);
  assert.match(en, /Main feature/);
});

test('parseReleaseBlocks nests sub-bullets under their parent item', () => {
  const blocks = parseReleaseBlocks('- 🧭 **Parent**:\n  - First child.\n  - Second child.\n- 💾 **Other**: text.');
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'list');
  if (blocks[0].type !== 'list') return;
  assert.equal(blocks[0].items.length, 2);
  assert.equal(blocks[0].items[0].children.length, 2);
  assert.equal(blocks[0].items[0].children[0], 'First child.');
  assert.equal(blocks[0].items[0].children[1], 'Second child.');
  assert.equal(blocks[0].items[1].children.length, 0);
});

test('parseReleaseBlocks merges soft-wrapped continuation lines into the item', () => {
  const blocks = parseReleaseBlocks('- Bullet that\nkeeps going.\n\nNext paragraph.');
  assert.equal(blocks.length, 2);
  if (blocks[0].type !== 'list') return;
  assert.equal(blocks[0].items[0].text, 'Bullet that keeps going.');
  assert.equal(blocks[1].type, 'paragraph');
});

test('parseReleaseBlocks appends continuations to the last nested child', () => {
  const blocks = parseReleaseBlocks('- Parent:\n  - Child line\nwrapped here.');
  if (blocks[0].type !== 'list') return;
  assert.equal(blocks[0].items[0].children[0], 'Child line wrapped here.');
});

test('parseReleaseBlocks strips blockquote markers from paragraphs', () => {
  const blocks = parseReleaseBlocks('> **Note:** hello.');
  assert.equal(blocks.length, 1);
  if (blocks[0].type !== 'paragraph') return;
  assert.equal(blocks[0].text, '**Note:** hello.');
});

test('parseReleaseBlocks promotes orphan sub-bullets to top level', () => {
  const blocks = parseReleaseBlocks('Intro paragraph.\n  - Orphan child.');
  const list = blocks.find((b) => b.type === 'list');
  assert.ok(list && list.type === 'list');
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].children.length, 0);
});

test('real-shaped release body produces no dash-prefixed paragraphs', () => {
  for (const language of ['es', 'en'] as const) {
    const blocks = parseReleaseBlocks(cleanMarkdownChangelog(releaseBody, language));
    const paragraphs = blocks.flatMap((b) => (b.type === 'paragraph' ? [b.text] : []));
    for (const p of paragraphs) {
      assert.doesNotMatch(p, /^\s*[-*]\s/, `paragraph still starts with a dash marker: ${p}`);
    }
    const lists = blocks.flatMap((b) => (b.type === 'list' ? [b] : []));
    assert.ok(lists.length > 0);
    const parentsWithChildren = lists.flatMap((l) => l.items.filter((i) => i.children.length > 0));
    assert.ok(parentsWithChildren.length > 0, 'nested sub-bullets were not attached to a parent');
  }
});

test('updater preview keeps localized HTML highlights and drops installer sections', () => {
  const notes = '<h3>Highlights</h3><ul><li>Improved search</li></ul>' +
    '<details><summary>Español</summary><h3>Novedades</h3><ul><li>Búsqueda mejorada</li></ul>' +
    '<h3>ℹ️ Antes de instalar</h3><ul><li>Detalles de instalación</li></ul></details>' +
    '<h3>🔐 VirusTotal and SHA256</h3><ul><li>Checksums</li></ul>';
  assert.deepEqual(peekReleaseNotes(notes, 'en'), [{ text: 'Improved search', children: [] }]);
  assert.deepEqual(peekReleaseNotes(notes, 'es'), [{ text: 'Búsqueda mejorada', children: [] }]);
});
