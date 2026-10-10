export const CYBERBOT_CHARACTER_MS = 28;
export const CYBERBOT_READ_AFTER_MS = 2500;
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const characters = (text: string) => Array.from(segmenter.segment(text), part => part.segment);

export interface CyberBotTypingState {
  key: string;
  text: string;
  detail: string;
  part: 'text' | 'detail' | null;
  isTyping: boolean;
}
export function cyberBotTypingDuration(text: string, detail = '') {
  return (characters(text).length + characters(detail).length) * CYBERBOT_CHARACTER_MS;
}
export function cyberBotSpeechLifetime(duration: number, text: string, detail = '') {
  return duration <= 0 ? duration : Math.max(duration, cyberBotTypingDuration(text, detail) + CYBERBOT_READ_AFTER_MS);
}
export function initialCyberBotTyping(key: string, text: string, detail: string, animated: boolean): CyberBotTypingState {
  const isTyping = animated && !!(text || detail);
  return { key, text: isTyping ? '' : text, detail: isTyping ? '' : detail,
    part: isTyping ? text ? 'text' : 'detail' : null, isTyping };
}

export function createCyberBotTypewriter(notify: (state: CyberBotTypingState) => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let current: { key: string; text: string; detail: string; titleChars: string[]; detailChars: string[]; started: number; finished: boolean } | undefined;
  let disposed = false;
  const cancel = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
  const publish = () => {
    if (!current || disposed) return;
    const count = current.finished ? Infinity : Math.floor((Date.now() - current.started) / CYBERBOT_CHARACTER_MS);
    const titleCount = current.titleChars.length;
    const total = titleCount + current.detailChars.length;
    if (count >= total) current.finished = true;
    notify({ key: current.key, text: current.titleChars.slice(0, count).join(''),
      detail: current.detailChars.slice(0, Math.max(0, count - titleCount)).join(''),
      part: current.finished ? null : count < titleCount ? 'text' : 'detail', isTyping: !current.finished });
    if (!current.finished) timer = setTimeout(publish, CYBERBOT_CHARACTER_MS);
  };
  return {
    update(key: string, text: string, detail = '', animated = true) {
      if (disposed) return;
      cancel();
      if (!current || current.key !== key) {
        current = { key, text, detail, titleChars: characters(text), detailChars: characters(detail),
          started: Date.now(), finished: !animated || !(text || detail) };
      } else {
        // Live values such as countdown seconds change in place, without replaying speech.
        if (current.text !== text || current.detail !== detail || !animated) current.finished = true;
        current = { ...current, text, detail, titleChars: characters(text), detailChars: characters(detail) };
      }
      publish();
    },
    dispose() { disposed = true; cancel(); },
  };
}
