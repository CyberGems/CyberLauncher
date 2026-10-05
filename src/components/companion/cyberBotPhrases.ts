import type { TranslationKey } from '../../locales';
import type { CyberBotEmotion } from './companionTypes';

export interface CyberBotPhrase {
  key: Extract<TranslationKey, `cyberbot_${string}`>;
  emotion: CyberBotEmotion;
}

// Each context has its own deck. Alerts keep their exact, factual text outside this catalog.
export const cyberBotPhrases = {
  interaction: [
    { key: 'cyberbot_reaction_beep', emotion: 'happy' },
    { key: 'cyberbot_reaction_pixels', emotion: 'affectionate' },
    { key: 'cyberbot_reaction_circuits', emotion: 'wink' },
    { key: 'cyberbot_reaction_ambitions', emotion: 'delighted' },
    { key: 'cyberbot_reaction_shortcuts', emotion: 'wink' },
    { key: 'cyberbot_reaction_mug', emotion: 'wink' },
    { key: 'cyberbot_reaction_cursor', emotion: 'wink' },
    { key: 'cyberbot_reaction_satellite', emotion: 'curious' },
    { key: 'cyberbot_reaction_blue', emotion: 'wink' },
    { key: 'cyberbot_reaction_cape', emotion: 'happy' },
    { key: 'cyberbot_reaction_corner', emotion: 'happy' },
    { key: 'cyberbot_reaction_achievement', emotion: 'sparkle' },
    { key: 'cyberbot_tip_tab', emotion: 'speaking' },
    { key: 'cyberbot_tip_command_palette', emotion: 'speaking' },
    { key: 'cyberbot_tip_resources', emotion: 'speaking' },
    { key: 'cyberbot_tip_quiet_hours', emotion: 'speaking' },
    { key: 'cyberbot_tip_position', emotion: 'speaking' },
    { key: 'cyberbot_chat_click_3', emotion: 'speaking' },
    { key: 'cyberbot_chat_click_2', emotion: 'speaking' },
  ],
  greeting_morning: [
    { key: 'cyberbot_greeting_morning', emotion: 'happy' },
    { key: 'cyberbot_greeting_morning_2', emotion: 'happy' },
    { key: 'cyberbot_greeting_morning_3', emotion: 'happy' },
  ],
  greeting_afternoon: [
    { key: 'cyberbot_greeting_afternoon', emotion: 'happy' },
    { key: 'cyberbot_greeting_afternoon_2', emotion: 'wink' },
    { key: 'cyberbot_greeting_afternoon_3', emotion: 'happy' },
  ],
  greeting_evening: [
    { key: 'cyberbot_greeting_evening', emotion: 'happy' },
    { key: 'cyberbot_greeting_evening_2', emotion: 'wink' },
    { key: 'cyberbot_greeting_evening_3', emotion: 'happy' },
  ],
  settings_general: [
    { key: 'cyberbot_context_settings', emotion: 'speaking' },
    { key: 'cyberbot_context_settings_2', emotion: 'happy' },
    { key: 'cyberbot_context_settings_3', emotion: 'happy' },
  ],
  settings_cyberbot: [
    { key: 'cyberbot_context_settings_cyberbot', emotion: 'wink' },
    { key: 'cyberbot_context_settings_cyberbot_2', emotion: 'wink' },
    { key: 'cyberbot_context_settings_cyberbot_3', emotion: 'happy' },
  ],
  settings_backup: [
    { key: 'cyberbot_context_settings_backup', emotion: 'speaking' },
    { key: 'cyberbot_context_settings_backup_2', emotion: 'happy' },
    { key: 'cyberbot_context_settings_backup_3', emotion: 'happy' },
  ],
  hud_system: [
    { key: 'cyberbot_context_hud_system', emotion: 'speaking' },
    { key: 'cyberbot_context_hud_system_2', emotion: 'speaking' },
    { key: 'cyberbot_context_hud_system_3', emotion: 'happy' },
  ],
  hud_storage: [
    { key: 'cyberbot_context_hud_storage', emotion: 'speaking' },
    { key: 'cyberbot_context_hud_storage_2', emotion: 'speaking' },
    { key: 'cyberbot_context_hud_storage_3', emotion: 'happy' },
  ],
  command_palette: [
    { key: 'cyberbot_context_cmd_palette', emotion: 'speaking' },
    { key: 'cyberbot_context_cmd_palette_2', emotion: 'happy' },
    { key: 'cyberbot_context_cmd_palette_3', emotion: 'speaking' },
  ],
  launch: [
    { key: 'cyberbot_launching_app', emotion: 'happy' },
    { key: 'cyberbot_launching_app_2', emotion: 'happy' },
    { key: 'cyberbot_launching_app_3', emotion: 'wink' },
  ],
  launch_admin: [
    { key: 'cyberbot_launching_admin', emotion: 'speaking' },
    { key: 'cyberbot_launching_admin_2', emotion: 'speaking' },
    { key: 'cyberbot_launching_admin_3', emotion: 'happy' },
  ],
  last_launch: [
    { key: 'cyberbot_last_launch', emotion: 'speaking' },
    { key: 'cyberbot_last_launch_2', emotion: 'happy' },
    { key: 'cyberbot_last_launch_3', emotion: 'wink' },
  ],
  backup_success: [
    { key: 'cyberbot_backup_success', emotion: 'success' },
    { key: 'cyberbot_backup_success_2', emotion: 'success' },
    { key: 'cyberbot_backup_success_3', emotion: 'success' },
  ],
} as const satisfies Record<string, readonly [CyberBotPhrase, ...CyberBotPhrase[]]>;

export type CyberBotTopic = keyof typeof cyberBotPhrases;

export function getCyberBotGreetingTopic(now = new Date()): CyberBotTopic {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'greeting_morning';
  if (hour >= 20 || hour < 5) return 'greeting_evening';
  return 'greeting_afternoon';
}

export function createCyberBotPhraseDeck(random = Math.random) {
  const decks = new Map<CyberBotTopic, { remaining: CyberBotPhrase[]; lastKey?: CyberBotPhrase['key'] }>();

  return {
    tryNext(topic: CyberBotTopic, show: (phrase: CyberBotPhrase) => boolean): boolean {
      let deck = decks.get(topic);
      if (!deck) {
        deck = { remaining: [] };
        decks.set(topic, deck);
      }

      if (deck.remaining.length === 0) {
        deck.remaining = [...cyberBotPhrases[topic]];
        for (let i = deck.remaining.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [deck.remaining[i], deck.remaining[j]] = [deck.remaining[j], deck.remaining[i]];
        }

        // The last phrase of one round must not be the first phrase of the next.
        const next = deck.remaining.length - 1;
        if (next > 0 && deck.remaining[next].key === deck.lastKey) {
          [deck.remaining[0], deck.remaining[next]] = [deck.remaining[next], deck.remaining[0]];
        }
      }

      const phrase = deck.remaining[deck.remaining.length - 1];
      // Quiet hours, critical alerts, and other speech policies must not consume an unseen phrase.
      if (!show(phrase)) return false;
      deck.remaining.pop();
      deck.lastKey = phrase.key;
      return true;
    },
  };
}
