import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { TranslationKey } from '../../locales';
import { createCyberBotPhraseDeck, getCyberBotGreetingTopic, type CyberBotTopic } from './cyberBotPhrases';
import { CYBERBOT_NAME_REMIND_MS, cyberBotPhraseKeyWithName, normalizeCyberBotName } from './cyberBotName';
import type { 
  CyberBotMessage, 
  CyberBotPosition, 
  CyberBotChatterLevel, 
  CyberBotEmotion,
  CyberBotQuietHoursConfig,
  CyberBotSettings
} from './companionTypes';

export function isInQuietHours(from: string, to: string, now = new Date()): boolean {
  if (!from || !to) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [fromH, fromM] = from.split(':').map(Number);
  const [toH, toM] = to.split(':').map(Number);
  const fromMinutes = (fromH || 0) * 60 + (fromM || 0);
  const toMinutes = (toH || 0) * 60 + (toM || 0);

  if (fromMinutes <= toMinutes) {
    return currentMinutes >= fromMinutes && currentMinutes < toMinutes;
  } else {
    // Spans midnight, e.g. 22:00 to 07:00
    return currentMinutes >= fromMinutes || currentMinutes < toMinutes;
  }
}

export function canReplaceCyberBotMessage(
  current: CyberBotMessage | null,
  nextPriority: NonNullable<CyberBotMessage['priority']>
): boolean {
  const ranks = { low: 0, normal: 1, high: 2 };
  return !current || ranks[nextPriority] >= ranks[current.priority || 'normal'];
}

interface UseCyberBotProps {
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  dailyLaunchCount?: number;
  playCyberBeep?: () => void;
  ready?: boolean;
}

interface CyberBotPhraseOptions {
  params?: Record<string, string>;
  durationMs?: number;
  priority?: CyberBotMessage['priority'];
}

export function useCyberBot({ t, dailyLaunchCount = 0, playCyberBeep, ready = true }: UseCyberBotProps) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('cyberbot_enabled');
    return saved === null ? true : saved === 'true';
  });

  const [position, setPosition] = useState<CyberBotPosition>(() => {
    const saved = localStorage.getItem('cyberbot_position');
    return saved === 'bottom-left' || saved === 'top-right' ? saved : 'bottom-right';
  });

  const [dodgeEnabled, setDodgeEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('cyberbot_dodge');
    return saved === 'true';
  });

  const [hoverAssistEnabled, setHoverAssistEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('cyberbot_hover_assist');
    return saved === null ? true : saved === 'true';
  });

  const [bannersEnabled, setBannersEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('cyberbot_banners_enabled');
    return saved === null ? true : saved === 'true';
  });

  const [preferredName, setPreferredName] = useState(() => normalizeCyberBotName(localStorage.getItem('cyberbot_preferred_name') || ''));
  const [namePromptState, setNamePromptState] = useState<CyberBotSettings['namePromptState']>(() => {
    if (normalizeCyberBotName(localStorage.getItem('cyberbot_preferred_name') || '')) return 'completed';
    const saved = localStorage.getItem('cyberbot_name_prompt_state');
    return saved === 'deferred' || saved === 'dismissed' || saved === 'completed' ? saved : 'unseen';
  });
  const [namePromptAfter, setNamePromptAfter] = useState(() => {
    const value = Number(localStorage.getItem('cyberbot_name_prompt_after'));
    return Number.isFinite(value) && value > 0 ? value : 0;
  });

  const [chatterLevel, setChatterLevel] = useState<CyberBotChatterLevel>(() => {
    const saved = localStorage.getItem('cyberbot_chatter');
    return saved === 'minimal' ? 'minimal' : 'full';
  });

  const [quietHours, setQuietHours] = useState<CyberBotQuietHoursConfig>(() => {
    const saved = localStorage.getItem('cyberbot_quiet_hours');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
          return {
            enabled: !!parsed.enabled,
            from: typeof parsed.from === 'string' && timePattern.test(parsed.from) ? parsed.from : '22:00',
            to: typeof parsed.to === 'string' && timePattern.test(parsed.to) ? parsed.to : '07:00',
          };
        }
      } catch {}
    }
    return {
      enabled: false,
      from: '22:00',
      to: '07:00',
    };
  });

  const [activeMessage, setActiveMessage] = useState<CyberBotMessage | null>(null);
  const activeMessageRef = useRef<CyberBotMessage | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const phraseDeckRef = useRef<ReturnType<typeof createCyberBotPhraseDeck> | null>(null);
  if (!phraseDeckRef.current) phraseDeckRef.current = createCyberBotPhraseDeck();
  const greetedRef = useRef(false);

  // Persist settings
  const toggleEnabled = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      localStorage.setItem('cyberbot_enabled', String(next));
      return next;
    });
  }, []);

  const updatePosition = useCallback((newPos: CyberBotPosition) => {
    setPosition(newPos);
    localStorage.setItem('cyberbot_position', newPos);
  }, []);

  const updateDodgeEnabled = useCallback((newDodge: boolean) => {
    setDodgeEnabled(newDodge);
    localStorage.setItem('cyberbot_dodge', String(newDodge));
  }, []);

  const updateHoverAssistEnabled = useCallback((newValue: boolean) => {
    setHoverAssistEnabled(newValue);
    localStorage.setItem('cyberbot_hover_assist', String(newValue));
  }, []);

  const updateBannersEnabled = useCallback((newValue: boolean) => {
    setBannersEnabled(newValue);
    localStorage.setItem('cyberbot_banners_enabled', String(newValue));
  }, []);

  const persistPreferredName = useCallback((value: string) => {
    const normalized = normalizeCyberBotName(value);
    setPreferredName(normalized);
    localStorage.setItem('cyberbot_preferred_name', normalized);
    return normalized;
  }, []);

  const completeNamePrompt = useCallback(() => {
    setNamePromptState('completed');
    setNamePromptAfter(0);
    localStorage.setItem('cyberbot_name_prompt_state', 'completed');
    localStorage.setItem('cyberbot_name_prompt_after', '0');
  }, []);

  const updatePreferredName = useCallback((value: string) => {
    persistPreferredName(value);
    completeNamePrompt();
  }, [persistPreferredName, completeNamePrompt]);

  const advanceNamePrompt = useCallback(() => {
    if (namePromptState === 'unseen') {
      const remindAt = Date.now() + CYBERBOT_NAME_REMIND_MS;
      setNamePromptState('deferred');
      setNamePromptAfter(remindAt);
      localStorage.setItem('cyberbot_name_prompt_state', 'deferred');
      localStorage.setItem('cyberbot_name_prompt_after', String(remindAt));
    } else if (namePromptState === 'deferred') {
      setNamePromptState('dismissed');
      setNamePromptAfter(0);
      localStorage.setItem('cyberbot_name_prompt_state', 'dismissed');
      localStorage.setItem('cyberbot_name_prompt_after', '0');
    }
  }, [namePromptState]);

  const dismissNamePromptForever = useCallback(() => {
    setNamePromptState('dismissed');
    setNamePromptAfter(0);
    localStorage.setItem('cyberbot_name_prompt_state', 'dismissed');
    localStorage.setItem('cyberbot_name_prompt_after', '0');
  }, []);

  const updateChatterLevel = useCallback((level: CyberBotChatterLevel) => {
    setChatterLevel(level);
    localStorage.setItem('cyberbot_chatter', level);
  }, []);

  const updateQuietHours = useCallback((patch: Partial<CyberBotQuietHoursConfig>) => {
    setQuietHours(prev => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('cyberbot_quiet_hours', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Disk configuration and imported backups take precedence over the local fallback.
  const restoreSettings = useCallback((settings: Partial<CyberBotSettings>) => {
    if (!settings || typeof settings !== 'object') return;
    if (typeof settings.enabled === 'boolean') {
      setEnabled(settings.enabled);
      localStorage.setItem('cyberbot_enabled', String(settings.enabled));
    }
    if (settings.position === 'bottom-left' || settings.position === 'bottom-right' || settings.position === 'top-right') {
      updatePosition(settings.position);
    }
    if (typeof settings.dodgeEnabled === 'boolean') updateDodgeEnabled(settings.dodgeEnabled);
    if (typeof settings.hoverAssistEnabled === 'boolean') updateHoverAssistEnabled(settings.hoverAssistEnabled);
    if (typeof settings.bannersEnabled === 'boolean') updateBannersEnabled(settings.bannersEnabled);
    const restoredName = typeof settings.preferredName === 'string'
      ? persistPreferredName(settings.preferredName)
      : normalizeCyberBotName(localStorage.getItem('cyberbot_preferred_name') || '');
    if (restoredName) completeNamePrompt();
    else if (settings.namePromptState === 'unseen' || settings.namePromptState === 'deferred' || settings.namePromptState === 'dismissed' || settings.namePromptState === 'completed') {
      setNamePromptState(settings.namePromptState);
      localStorage.setItem('cyberbot_name_prompt_state', settings.namePromptState);
    }
    if (!restoredName && typeof settings.namePromptAfter === 'number' && Number.isFinite(settings.namePromptAfter) && settings.namePromptAfter >= 0) {
      setNamePromptAfter(settings.namePromptAfter);
      localStorage.setItem('cyberbot_name_prompt_after', String(settings.namePromptAfter));
    }
    if (settings.chatterLevel === 'full' || settings.chatterLevel === 'minimal') updateChatterLevel(settings.chatterLevel);
    if (settings.quietHours && typeof settings.quietHours === 'object') {
      const { enabled, from, to } = settings.quietHours;
      const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
      updateQuietHours({
        ...(typeof enabled === 'boolean' ? { enabled } : {}),
        ...(typeof from === 'string' && timePattern.test(from) ? { from } : {}),
        ...(typeof to === 'string' && timePattern.test(to) ? { to } : {}),
      });
    }
  }, [updatePosition, updateDodgeEnabled, updateHoverAssistEnabled, updateBannersEnabled, persistPreferredName, completeNamePrompt, updateChatterLevel, updateQuietHours]);

  const dismissMessage = useCallback(() => {
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    activeMessageRef.current = null;
    setActiveMessage(null);
  }, []);

  useEffect(() => {
    if (!enabled) dismissMessage();
  }, [enabled, dismissMessage]);

  useEffect(() => () => {
    if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current);
  }, []);

  const say = useCallback((msg: {
    id?: string;
    text: string;
    detail?: string;
    emotion?: CyberBotEmotion;
    tag?: string;
    action?: { label: string; onClick: () => void };
    secondaryAction?: { label: string; onClick: () => void };
    tertiaryAction?: { label: string; onClick: () => void };
    onDismiss?: () => void;
    durationMs?: number;
    priority?: 'low' | 'normal' | 'high';
    essential?: boolean;
  }) => {
    if (!enabled) return false;
    const priority = msg.priority || 'normal';

    // Quiet and minimal modes reserve speech for critical messages.
    if (quietHours.enabled && isInQuietHours(quietHours.from, quietHours.to)) {
      if (priority !== 'high' && !msg.essential) {
        return false;
      }
    }

    if (chatterLevel === 'minimal' && priority !== 'high' && !msg.essential) {
      return false;
    }

    if (!canReplaceCyberBotMessage(activeMessageRef.current, priority)) return false;

    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    const duration = msg.durationMs !== undefined ? msg.durationMs : 6500;

    const newMessage: CyberBotMessage = {
      id: msg.id || `bot_msg_${Date.now()}_${Math.random()}`,
      text: msg.text,
      detail: msg.detail,
      emotion: msg.emotion || 'speaking',
      tag: msg.tag || t('cyberbot_tag_name'),
      action: msg.action,
      secondaryAction: msg.secondaryAction,
      tertiaryAction: msg.tertiaryAction,
      onDismiss: msg.onDismiss,
      durationMs: duration,
      timestamp: Date.now(),
      priority,
    };

    activeMessageRef.current = newMessage;
    setActiveMessage(newMessage);

    if (duration > 0) {
      dismissTimerRef.current = window.setTimeout(() => {
        if (activeMessageRef.current?.id !== newMessage.id) return;
        activeMessageRef.current = null;
        dismissTimerRef.current = null;
        setActiveMessage(null);
      }, duration);
    }
    return true;
  }, [enabled, chatterLevel, quietHours, t]);

  const sayPhrase = useCallback((topic: CyberBotTopic, options: CyberBotPhraseOptions = {}) => {
    return phraseDeckRef.current!.tryNext(topic, phrase => say({
      text: t(cyberBotPhraseKeyWithName(phrase.key, preferredName), { ...options.params, userName: preferredName }),
      emotion: phrase.emotion,
      priority: options.priority ?? 'low',
      durationMs: options.durationMs,
    }));
  }, [say, t, preferredName]);

  // Greet once per activation, after disk settings load. Language/settings changes are not new arrivals.
  useEffect(() => {
    if (!enabled) {
      greetedRef.current = false;
      return;
    }
    if (!ready || greetedRef.current || chatterLevel === 'minimal') return;
    if (quietHours.enabled && isInQuietHours(quietHours.from, quietHours.to)) return;

    const timer = window.setTimeout(() => {
      greetedRef.current = sayPhrase(getCyberBotGreetingTopic(), {
        durationMs: 6000,
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [enabled, ready, chatterLevel, quietHours, sayPhrase]);

  // Handle direct click on CyberBot
  const handleClickBot = useCallback(() => {
    playCyberBeep?.();

    sayPhrase('interaction', {
      params: { count: String(dailyLaunchCount) },
      durationMs: 6500,
      priority: 'normal',
    });
  }, [dailyLaunchCount, playCyberBeep, sayPhrase]);

  const settings = useMemo<CyberBotSettings>(() => (
    { enabled, position, dodgeEnabled, hoverAssistEnabled, bannersEnabled, preferredName, namePromptState, namePromptAfter, chatterLevel, quietHours }
  ), [enabled, position, dodgeEnabled, hoverAssistEnabled, bannersEnabled, preferredName, namePromptState, namePromptAfter, chatterLevel, quietHours]);

  return {
    enabled,
    toggleEnabled,
    position,
    updatePosition,
    dodgeEnabled,
    updateDodgeEnabled,
    hoverAssistEnabled,
    updateHoverAssistEnabled,
    bannersEnabled,
    updateBannersEnabled,
    preferredName,
    updatePreferredName,
    namePromptState,
    namePromptAfter,
    advanceNamePrompt,
    dismissNamePromptForever,
    completeNamePrompt,
    chatterLevel,
    updateChatterLevel,
    quietHours,
    updateQuietHours,
    settings,
    restoreSettings,
    activeMessage,
    say,
    sayPhrase,
    dismissMessage,
    handleClickBot,
  };
}
