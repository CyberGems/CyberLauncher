/**
 * Extracts language-specific release notes section from GitHub Markdown.
 * Mirrors CyberClock update parsing standard:
 * - When language is 'es', looks for explicit comments or <details>...Español...</summary>...
 * - When language is 'en', strips Spanish <details> block so English stays clean.
 */
export function extractLanguageSection(markdown: string, language: 'es' | 'en' = 'en'): string {
  if (!markdown) return '';

  // 1. Check for explicit comment tags: <!-- lang:es --> ... <!-- /lang:es -->
  const commentRegex = new RegExp(`<!--\\s*lang:${language}\\s*-->([\\s\\S]*?)<!--\\s*/lang:${language}\\s*-->`, 'i');
  const commentMatch = markdown.match(commentRegex);
  if (commentMatch && commentMatch[1]?.trim()) {
    return commentMatch[1].trim();
  }

  // 2. Check for details summary block or header in Spanish: <summary>...Español...</summary>
  if (language === 'es') {
    const esBlockRegex = /(?:<details>[\s\S]*?<summary>[\s\S]*?(?:español|spanish)[\s\S]*?<\/summary>([\s\S]*?)<\/details>)|(?:#{2,4}\s*(?:.*?(?:español|novedades|cambios).*?)\r?\n([\s\S]*?)(?=(?:#{2,4}\s)|<\/details>|$))/i;
    const esMatch = markdown.match(esBlockRegex);
    const content = esMatch ? (esMatch[1] || esMatch[2]) : null;
    if (content && content.trim()) {
      return content.trim();
    }
  }

  // 3. Fallback: if user is on English, or no Spanish block exists, exclude any Spanish details blocks so English remains clean
  return markdown.replace(/<details>[\s\S]*?<summary>[\s\S]*?(?:español|spanish)[\s\S]*?<\/summary>[\s\S]*?<\/details>/gi, '');
}

export function cleanMarkdownChangelog(raw: string, language: 'es' | 'en' = 'en'): string {
  const section = extractLanguageSection(raw, language);
  const lines = section
    .replace(/^\uFEFF/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<h[1-6]\b[^>]*>/gi, '\n### ')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<br\s*\/?>|<\/(?:p|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .split(/\r?\n/);
  const filtered: string[] = [];
  let inTableOrDownloads = false;
  let inInstallBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      filtered.push('');
      continue;
    }
    if (/^#{1,6}\s+.*\b(?:Before you install|Antes de instalar)\b/i.test(trimmed)) {
      inInstallBlock = true;
      continue;
    }
    if (inInstallBlock) {
      if (/^#{1,3}\s+/i.test(trimmed)) {
        inInstallBlock = false;
      } else {
        continue;
      }
    }
    // Filter out downloads and checksum sections
    if (/^#{1,6}\s+.*\b(?:Downloads|Descargas|Paquetes|Checksums|Assets|Hashes|VirusTotal|SHA256)\b/i.test(trimmed)) {
      inTableOrDownloads = true;
      continue;
    }
    if (inTableOrDownloads) {
      if (/^#{1,3}\s+(?!.*(?:Downloads|Paquetes|Checksums|Assets|Hashes))/i.test(trimmed)) {
        inTableOrDownloads = false;
      } else {
        continue;
      }
    }
    if (/^\|/.test(trimmed)) continue; // Table lines
    if (/^\*Crafted with precision/i.test(trimmed)) continue;
    filtered.push(line);
  }
  return filtered.join('\n').trim();
}

export function peekReleaseNotes(body: string | undefined, language: 'es' | 'en'): ReleaseListItem[] {
  if (!body) return [];
  const blocks = parseReleaseBlocks(cleanMarkdownChangelog(body, language));
  const clean = (text: string) => text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*|`([^`]+)`/g, '$1$2')
    .trim();
  const items = blocks.flatMap(block => block.type === 'list' ? block.items : []);
  if (items.length) return items.map(item => ({
    text: clean(item.text),
    children: item.children.map(clean),
  }));
  const summary = blocks.find(block => block.type === 'paragraph' && !/^Full Changelog/i.test(block.text));
  return summary?.type === 'paragraph' ? [{ text: clean(summary.text), children: [] }] : [];
}

export type ReleaseListItem = { text: string; children: string[] };
export type ReleaseBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: ReleaseListItem[] };

/**
 * Parses cleaned changelog markdown into render blocks with one nesting level.
 * Indented sub-bullets attach to the previous top-level item, markdown soft-wrapped
 * continuation lines extend the last item, and blockquote markers are stripped.
 */
export function parseReleaseBlocks(cleaned: string): ReleaseBlock[] {
  const lines = cleaned.split('\n');
  const blocks: ReleaseBlock[] = [];
  let items: ReleaseListItem[] = [];

  const flushList = () => {
    if (!items.length) return;
    blocks.push({ type: 'list', items });
    items = [];
  };

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (heading) {
      flushList();
      blocks.push({ type: 'heading', text: heading[1] });
    } else if (bullet) {
      const text = bullet[1];
      if (/^\s/.test(line) && items.length > 0) {
        items[items.length - 1].children.push(text);
      } else {
        items.push({ text, children: [] });
      }
    } else if (!line.trim() || /^---+/.test(line.trim())) {
      flushList();
    } else if (items.length > 0) {
      // Soft-wrapped continuation of the current item (markdown lazy continuation)
      const last = items[items.length - 1];
      if (last.children.length > 0) {
        last.children[last.children.length - 1] += ` ${line.trim()}`;
      } else {
        last.text += ` ${line.trim()}`;
      }
    } else {
      blocks.push({ type: 'paragraph', text: line.replace(/^>\s?/, '') });
    }
  }
  flushList();
  return blocks;
}
