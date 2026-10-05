import type { TranslationKey } from '../../locales';
import type { CyberBotNamePromptState } from './companionTypes';

export const CYBERBOT_NAME_MAX_LENGTH = 32;
export const CYBERBOT_NAME_REMIND_MS = 7 * 24 * 60 * 60 * 1000;

export function normalizeCyberBotName(value: string): string {
  const cleaned = value.replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/\s+/g, ' ').trim();
  return Array.from(cleaned).slice(0, CYBERBOT_NAME_MAX_LENGTH).join('').trim();
}

export function isCyberBotNamePromptDue(
  name: string,
  state: CyberBotNamePromptState,
  remindAt: number,
  now = Date.now(),
): boolean {
  if (name) return false;
  return state === 'unseen' || (state === 'deferred' && remindAt > 0 && now >= remindAt);
}

const namedPhrases: Partial<Record<TranslationKey, TranslationKey>> = {
  cyberbot_greeting_morning: 'cyberbot_greeting_morning_named',
  cyberbot_greeting_afternoon: 'cyberbot_greeting_afternoon_named',
  cyberbot_greeting_evening: 'cyberbot_greeting_evening_named',
  cyberbot_reaction_beep: 'cyberbot_reaction_beep_named',
  cyberbot_last_launch_2: 'cyberbot_last_launch_named',
};

export function cyberBotPhraseKeyWithName(key: TranslationKey, preferredName: string): TranslationKey {
  return preferredName ? namedPhrases[key] || key : key;
}
