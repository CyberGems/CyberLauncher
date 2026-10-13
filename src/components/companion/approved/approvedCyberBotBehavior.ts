import type { CyberBotEmotion } from '../companionTypes';
import type { ApprovedCyberBotFace } from './CyberBotReviewContext';

export function approvedCyberBotFace(emotion: CyberBotEmotion): ApprovedCyberBotFace {
  return emotion === 'idle' ? 'launcher' : emotion;
}

// Two distinct real statuses, as in the laboratory's two-phrase show.
export function nextApprovedMarquee(previous: string | null, messages: readonly string[], random = Math.random): string {
  const unique = [...new Set(messages.filter(message => message.trim()))];
  if (!unique.length) return '';
  if (unique.length === 1) return unique[0];
  const pick = (count: number) => Math.min(count - 1, Math.floor(Math.max(0, random()) * count));
  const first = pick(unique.length);
  const remaining = unique.filter((_, index) => index !== first);
  const second = pick(remaining.length);
  const pair = `${unique[first]}   ◆   ${remaining[second]}`;
  return pair === previous ? `${remaining[second]}   ◆   ${unique[first]}` : pair;
}

export function approvedMarqueeTiming(message: string) {
  const end = 20 - Math.max(60, Math.round(Array.from(message).length * 10.6));
  const seconds = Math.max(6.5, Math.round(((78 - end) / 26) * 10) / 10);
  return { end, seconds, durationMs: Math.ceil(seconds * 1000) + 1200 };
}

// Existing emotional meanings fitted to the approved visor. Speech uses the chest EQ.
const expressions: Record<string, string> = {
  happy: '<path d="M29 36 Q36 29 43 36 M57 36 Q64 29 71 36"/><path d="M44 44 Q50 48 56 43" stroke="#38bdf8" stroke-width="1.6"/>',
  delighted: '<path d="M29 35 Q36 30 43 34 M57 34 Q64 30 71 35"/><path d="M44 44 Q51 48 57 42 L59 40" stroke="#38bdf8" stroke-width="1.6"/>',
  affectionate: '<rect x="31" y="33" width="10" height="5" rx="2.5" fill="#00f0ff" stroke="none"/><rect x="59" y="33" width="10" height="5" rx="2.5" fill="#00f0ff" stroke="none"/><path d="M44 44 Q50 47 56 43" stroke="#38bdf8" stroke-width="1.6"/>',
  sparkle: '<path d="M36 29 L38 34 L43 36 L38 38 L36 43 L34 38 L29 36 L34 34 Z" fill="#00f0ff" stroke="none"/><path d="M58 35 Q64 31 70 35 M44 44 Q50 47 56 43"/>',
  wink: '<rect x="31" y="32" width="10" height="9" rx="4" fill="#00f0ff" stroke="none"/><path d="M58 36 Q64 32 70 36 M44 44 Q51 48 57 42"/>',
  scared: '<path d="M30 30 L40 36 L30 42 M70 30 L60 36 L70 42"/><ellipse cx="50" cy="44" rx="2" ry="2.5" stroke="#a5f3fc" stroke-width="1.6"/>',
  storage: '<rect x="29" y="31" width="14" height="11" rx="3"/><rect x="57" y="31" width="14" height="11" rx="3"/><rect x="43" y="44" width="14" height="5" rx="1.5" stroke-width="1.4"/><circle cx="46" cy="46.5" r="0.8" fill="#fbbf24" stroke="none"/><path d="M50 46.5 H54" stroke-width="1.4"/>',
  success: '<path d="M29 35 L34 40 L43 30 M57 35 L62 40 L71 30"/><path d="M44 44 Q50 48 56 43" stroke-width="1.6"/>',
  speaking: '<circle cx="36" cy="36.5" r="4.2" fill="#00f0ff" stroke="none"/><circle cx="64" cy="36.5" r="4.2" fill="#00f0ff" stroke="none"/>',
};

export function approvedExpressionMarkup() {
  return Object.entries(expressions).map(([face, content]) =>
    `<g id="face-${face}" style="display: none;" filter="url(#neonGlow)" fill="none" stroke="${face === 'storage' ? '#f59e0b' : face === 'success' ? '#10b981' : '#00f0ff'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${content}</g>`).join('\n');
}

const hoverVisorMarkup = `<defs>
  <clipPath id="hoverVisorClip"><rect x="23" y="25" width="54" height="26" rx="8"/></clipPath>
  <linearGradient id="hoverScanGradient" gradientUnits="userSpaceOnUse" x1="24" y1="26" x2="76" y2="26">
    <stop offset="0" stop-color="#00f0ff" stop-opacity="0"/>
    <stop offset="0.5" stop-color="#a5f3fc" stop-opacity="0.8"/>
    <stop offset="1" stop-color="#00f0ff" stop-opacity="0"/>
  </linearGradient>
</defs>
<g class="hover-visor-effects" clip-path="url(#hoverVisorClip)" pointer-events="none" aria-hidden="true">
  <path class="hover-visor-scan" d="M24 26 H76" stroke="url(#hoverScanGradient)" stroke-width="0.9"/>
</g>
`;

const materialLightDefs = `<defs>
  <radialGradient id="materialHelmetLight" gradientUnits="userSpaceOnUse" cx="42" cy="19" r="34">
    <stop offset="0" stop-color="#cff4ff" stop-opacity="0.65"/>
    <stop offset="0.38" stop-color="#6fc9e6" stop-opacity="0.38"/>
    <stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="materialTorsoLight" gradientUnits="userSpaceOnUse" cx="42" cy="66" r="29">
    <stop offset="0" stop-color="#d5f5ff" stop-opacity="0.72"/>
    <stop offset="0.4" stop-color="#73cde7" stop-opacity="0.42"/>
    <stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
  </radialGradient>
</defs>`;
const materialHelmetMarkup = `<g class="material-light material-helmet-light" pointer-events="none" aria-hidden="true" fill="none" stroke-linecap="round">
  <path class="material-edge-base" d="M20 27 C24 19 35 15 50 15 C65 15 76 19 80 27 M17 34 C16 45 22 51 33 54 M83 34 C84 45 78 51 67 54"/>
  <path d="M20 27 C24 19 35 15 50 15 C65 15 76 19 80 27 M17 34 C16 45 22 51 33 54 M83 34 C84 45 78 51 67 54" stroke="url(#materialHelmetLight)" stroke-width="1.4" opacity="0.65"/>
</g>`;
const materialTorsoMarkup = `<g class="material-light material-torso-light" pointer-events="none" aria-hidden="true">
  <path d="M31 62 L39 62 L39.15 64 L32.6 64 L34 75.5 L33 76 Z M69 62 L61 62 L60.85 64 L67.4 64 L66 75.5 L67 76 Z" fill="url(#materialTorsoLight)"/>
  <path class="material-edge-base" d="M29.8 61 C26.5 67 27 75 31 81 M70.2 61 C73.5 67 73 75 69 81" fill="none"/>
  <path d="M29.8 61 C26.5 67 27 75 31 81 M70.2 61 C73.5 67 73 75 69 81 M34 78 L40 81 M66 78 L60 81" fill="none" stroke="url(#materialTorsoLight)" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>
</g>`;

export function createApprovedMarkup(artwork: string, prefix: string, face: ApprovedCyberBotFace, speaking: boolean, message = '') {
  const target = `face-${face === 'default' ? 'eyes-default' : face}`;
  const safeMessage = message.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);
  const timing = approvedMarqueeTiming(message);
  return artwork
    .replace("<g id=\"botAssembly\" class=\"levitating\">", "<g id=\"botAssembly\" class=\"levitating\"><animateTransform id=\"vectorLevitation\" attributeName=\"transform\" type=\"translate\" values=\"0 0;0 -8;0 0\" dur=\"3.2s\" repeatCount=\"indefinite\" calcMode=\"spline\" keyTimes=\"0;0.5;1\" keySplines=\"0.42 0 0.58 1;0.42 0 0.58 1\" begin=\"indefinite\"/>")
    .replace('<!-- CREST & FOREHEAD VARIANTS -->', materialLightDefs + '<!-- CREST & FOREHEAD VARIANTS -->')
    .replace('<!-- FRONT FACE (Lado A: Visor Frontal Activo) -->', materialHelmetMarkup + '<!-- FRONT FACE (Lado A: Visor Frontal Activo) -->')
    .replace('<!-- CHEST EQUALIZER PANEL (Core Feature 1) -->', materialTorsoMarkup + '<!-- CHEST EQUALIZER PANEL (Core Feature 1) -->')
    .replace('</g> <!-- end visorFaceContent -->', `${approvedExpressionMarkup()}</g> <!-- end visorFaceContent -->`)
    .replace('</g> <!-- end headFrontFace -->', hoverVisorMarkup + '</g> <!-- end headFrontFace -->')
    .replace(/(<g id="face-marquee-content">)[\s\S]*?<\/g>/,
      (_, open: string) => `${open}<text class="marquee-text-node" data-cyberbot-marquee="${safeMessage}" data-cyberbot-marquee-run="0" x="78" y="43" fill="#00f0ff" font-family="'JetBrains Mono', 'Segoe UI Emoji', monospace" font-size="17" font-weight="800" letter-spacing="0.04em" filter="url(#neonGlow)">${safeMessage}<animate attributeName="x" from="78" to="${timing.end}" dur="${timing.seconds}s" calcMode="linear" repeatCount="indefinite"/></text></g>`)
    .replace(/<g id="(face-(?:eyes-default|launcher-top|launcher|marquee|terminal|curious|flight|sleeping|alert|happy|delighted|affectionate|sparkle|wink|scared|storage|success|speaking))"(?: style="display: none;")?/g,
      (_, name: string) => `<g id="${name}" style="display: ${name === target ? 'inline' : 'none'};"`)
    .replace(/id="equalizerBars" class="[^"]*"/, `id="equalizerBars" class="${speaking ? 'speaking-eq' : 'standby-eq'}"`)
    .replace(/id="([\w-]+)"/g, (_, part: string) => `id="${prefix}${part}" data-part="${part}"`)
    .replace(/url\(#([\w-]+)\)/g, (_, part: string) => `url(#${prefix}${part})`);
}

export type CyberBotHoverReaction = 'focus' | 'scan';

// Alternate actual pointer entries. Face changes and held hovers do not replay an effect.
export function createCyberBotHoverReaction() {
  let wasHovered = false;
  let current: CyberBotHoverReaction | null = null;
  let next: CyberBotHoverReaction = 'focus';
  return {
    update(hovered: boolean, eligible: boolean) {
      if (!hovered || !eligible) current = null;
      else if (!wasHovered) {
        current = next;
        next = next === 'focus' ? 'scan' : 'focus';
      }
      wasHovered = hovered;
      return current;
    },
  };
}
