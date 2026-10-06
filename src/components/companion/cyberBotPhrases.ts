import type { TranslationKey } from '../../locales';
import type { CyberBotEmotion } from './companionTypes';

export interface CyberBotPhrase {
  key: Extract<TranslationKey, `cyberbot_${string}`>;
  emotion: CyberBotEmotion;
}

// Each context has its own deck. Alerts keep their exact, factual text outside this catalog.
export const cyberBotPhrases = {
  interaction: [
    { key: 'cyberbot_reaction_beep', emotion: 'terminal' },
    { key: 'cyberbot_reaction_pixels', emotion: 'launcher' },
    { key: 'cyberbot_reaction_circuits', emotion: 'terminal' },
    { key: 'cyberbot_reaction_ambitions', emotion: 'curious' },
    { key: 'cyberbot_reaction_shortcuts', emotion: 'terminal' },
    { key: 'cyberbot_reaction_mug', emotion: 'launcher' },
    { key: 'cyberbot_reaction_cursor', emotion: 'terminal' },
    { key: 'cyberbot_reaction_satellite', emotion: 'curious' },
    { key: 'cyberbot_reaction_blue', emotion: 'launcher' },
    { key: 'cyberbot_reaction_cape', emotion: 'terminal' },
    { key: 'cyberbot_reaction_corner', emotion: 'launcher' },
    { key: 'cyberbot_reaction_achievement', emotion: 'sparkle' },
    { key: 'cyberbot_tip_tab', emotion: 'terminal' },
    { key: 'cyberbot_tip_command_palette', emotion: 'terminal' },
    { key: 'cyberbot_tip_resources', emotion: 'launcher' },
    { key: 'cyberbot_tip_quiet_hours', emotion: 'launcher' },
    { key: 'cyberbot_tip_position', emotion: 'curious' },
    { key: 'cyberbot_chat_click_3', emotion: 'terminal' },
    { key: 'cyberbot_chat_click_2', emotion: 'launcher' },
  ],
  greeting_morning: [
    { key: 'cyberbot_greeting_morning', emotion: 'curious' },
    { key: 'cyberbot_greeting_morning_2', emotion: 'launcher' },
    { key: 'cyberbot_greeting_morning_3', emotion: 'terminal' },
  ],
  greeting_afternoon: [
    { key: 'cyberbot_greeting_afternoon', emotion: 'curious' },
    { key: 'cyberbot_greeting_afternoon_2', emotion: 'terminal' },
    { key: 'cyberbot_greeting_afternoon_3', emotion: 'launcher' },
  ],
  greeting_evening: [
    { key: 'cyberbot_greeting_evening', emotion: 'terminal' },
    { key: 'cyberbot_greeting_evening_2', emotion: 'curious' },
    { key: 'cyberbot_greeting_evening_3', emotion: 'launcher' },
  ],
  settings_general: [
    { key: 'cyberbot_context_settings', emotion: 'terminal' },
    { key: 'cyberbot_context_settings_2', emotion: 'launcher' },
    { key: 'cyberbot_context_settings_3', emotion: 'curious' },
  ],
  settings_cyberbot: [
    { key: 'cyberbot_context_settings_cyberbot', emotion: 'terminal' },
    { key: 'cyberbot_context_settings_cyberbot_2', emotion: 'launcher' },
    { key: 'cyberbot_context_settings_cyberbot_3', emotion: 'curious' },
  ],
  settings_backup: [
    { key: 'cyberbot_context_settings_backup', emotion: 'terminal' },
    { key: 'cyberbot_context_settings_backup_2', emotion: 'launcher' },
    { key: 'cyberbot_context_settings_backup_3', emotion: 'curious' },
  ],
  hud_system: [
    { key: 'cyberbot_context_hud_system', emotion: 'terminal' },
    { key: 'cyberbot_context_hud_system_2', emotion: 'launcher' },
    { key: 'cyberbot_context_hud_system_3', emotion: 'curious' },
  ],
  hud_storage: [
    { key: 'cyberbot_context_hud_storage', emotion: 'terminal' },
    { key: 'cyberbot_context_hud_storage_2', emotion: 'launcher' },
    { key: 'cyberbot_context_hud_storage_3', emotion: 'curious' },
  ],
  command_palette: [
    { key: 'cyberbot_context_cmd_palette', emotion: 'terminal' },
    { key: 'cyberbot_context_cmd_palette_2', emotion: 'launcher' },
    { key: 'cyberbot_context_cmd_palette_3', emotion: 'curious' },
  ],
  terminal: [
    { key: 'cyberbot_context_terminal', emotion: 'terminal' },
    { key: 'cyberbot_context_terminal_2', emotion: 'terminal' },
    { key: 'cyberbot_context_terminal_3', emotion: 'terminal' },
  ],
  add_app: [
    { key: 'cyberbot_context_add_app', emotion: 'terminal' },
    { key: 'cyberbot_context_add_app_2', emotion: 'launcher' },
    { key: 'cyberbot_context_add_app_3', emotion: 'curious' },
  ],
  add_app_drop: [
    { key: 'cyberbot_context_add_app_drop', emotion: 'terminal' },
    { key: 'cyberbot_context_add_app_drop_2', emotion: 'launcher' },
  ],
  add_category: [
    { key: 'cyberbot_context_add_category', emotion: 'terminal' },
    { key: 'cyberbot_context_add_category_2', emotion: 'launcher' },
  ],
  about: [
    { key: 'cyberbot_context_about', emotion: 'launcher' },
    { key: 'cyberbot_context_about_2', emotion: 'delighted' },
    { key: 'cyberbot_context_about_3', emotion: 'sparkle' },
  ],
  launch: [
    { key: 'cyberbot_launching_app', emotion: 'terminal' },
    { key: 'cyberbot_launching_app_2', emotion: 'launcher' },
    { key: 'cyberbot_launching_app_3', emotion: 'curious' },
  ],
  launch_admin: [
    { key: 'cyberbot_launching_admin', emotion: 'terminal' },
    { key: 'cyberbot_launching_admin_2', emotion: 'launcher' },
    { key: 'cyberbot_launching_admin_3', emotion: 'curious' },
  ],
  launch_pinned: [
    { key: 'cyberbot_launching_pinned', emotion: 'terminal' },
    { key: 'cyberbot_launching_pinned_2', emotion: 'launcher' },
    { key: 'cyberbot_launching_pinned_3', emotion: 'curious' },
  ],
  launch_admin_pinned: [
    { key: 'cyberbot_launching_admin_pinned', emotion: 'terminal' },
    { key: 'cyberbot_launching_admin_pinned_2', emotion: 'launcher' },
  ],
  pin_blur: [
    { key: 'cyberbot_pin_blur', emotion: 'terminal' },
    { key: 'cyberbot_pin_blur_2', emotion: 'launcher' },
    { key: 'cyberbot_pin_blur_3', emotion: 'curious' },
  ],
  last_launch: [
    { key: 'cyberbot_last_launch', emotion: 'terminal' },
    { key: 'cyberbot_last_launch_2', emotion: 'launcher' },
    { key: 'cyberbot_last_launch_3', emotion: 'curious' },
  ],
  backup_success: [
    { key: 'cyberbot_backup_success', emotion: 'success' },
    { key: 'cyberbot_backup_success_2', emotion: 'success' },
    { key: 'cyberbot_backup_success_3', emotion: 'success' },
  ],
} as const satisfies Record<string, readonly [CyberBotPhrase, ...CyberBotPhrase[]]>;

export type CyberBotTopic = keyof typeof cyberBotPhrases;

export function cyberBotPhraseKeyForCount(key: CyberBotPhrase['key'], count?: string): CyberBotPhrase['key'] {
  if (key !== 'cyberbot_chat_click_2') return key;
  if (count === '0') return 'cyberbot_chat_click_2_zero';
  if (count === '1') return 'cyberbot_chat_click_2_one';
  return key;
}

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
