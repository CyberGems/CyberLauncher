import { useState, useEffect, useRef, useCallback } from 'react';
import type { 
  CyberBotMessage, 
  CyberBotPosition, 
  CyberBotChatterLevel, 
  CyberBotEmotion,
  CyberBotQuietHoursConfig
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

interface UseCyberBotProps {
  t: (key: any, params?: Record<string, string>) => string;
  dailyLaunchCount?: number;
  playCyberBeep?: () => void;
}

export function useCyberBot({ t, dailyLaunchCount = 0, playCyberBeep }: UseCyberBotProps) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('cyberbot_enabled');
    return saved === null ? true : saved === 'true';
  });

  const [position, setPosition] = useState<CyberBotPosition>(() => {
    const saved = localStorage.getItem('cyberbot_position');
    return (saved as CyberBotPosition) || 'bottom-right';
  });

  const [dodgeEnabled, setDodgeEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('cyberbot_dodge');
    return saved === null ? true : saved === 'true';
  });

  const [chatterLevel, setChatterLevel] = useState<CyberBotChatterLevel>(() => {
    const saved = localStorage.getItem('cyberbot_chatter');
    return (saved as CyberBotChatterLevel) || 'full';
  });

  const [quietHours, setQuietHours] = useState<CyberBotQuietHoursConfig>(() => {
    const saved = localStorage.getItem('cyberbot_quiet_hours');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            enabled: !!parsed.enabled,
            from: parsed.from || '22:00',
            to: parsed.to || '07:00',
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
  const dismissTimerRef = useRef<number | null>(null);
  const clickIndexRef = useRef(0);

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

  const dismissMessage = useCallback(() => {
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setActiveMessage(null);
  }, []);

  const say = useCallback((msg: {
    text: string;
    detail?: string;
    emotion?: CyberBotEmotion;
    tag?: string;
    action?: { label: string; onClick: () => void };
    durationMs?: number;
    priority?: 'low' | 'normal' | 'high';
  }) => {
    if (!enabled) return;

    // Check quiet hours: only allow high priority or alerts
    if (quietHours.enabled && isInQuietHours(quietHours.from, quietHours.to)) {
      if (msg.priority !== 'high' && msg.emotion !== 'alert') {
        return;
      }
    }

    // In minimal mode, only display high priority or alert messages
    if (chatterLevel === 'minimal' && msg.priority !== 'high' && msg.emotion !== 'alert') {
      return;
    }

    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    const duration = msg.durationMs !== undefined ? msg.durationMs : 6500;

    const newMessage: CyberBotMessage = {
      id: `bot_msg_${Date.now()}_${Math.random()}`,
      text: msg.text,
      detail: msg.detail,
      emotion: msg.emotion || 'speaking',
      tag: msg.tag || t('cyberbot_tag_name'),
      action: msg.action,
      durationMs: duration,
      timestamp: Date.now(),
      priority: msg.priority || 'normal',
    };

    setActiveMessage(newMessage);

    if (duration > 0) {
      dismissTimerRef.current = window.setTimeout(() => {
        setActiveMessage(null);
      }, duration);
    }
  }, [enabled, chatterLevel, quietHours, t]);

  // Initial greeting upon startup
  useEffect(() => {
    if (!enabled || chatterLevel === 'minimal') return;
    if (quietHours.enabled && isInQuietHours(quietHours.from, quietHours.to)) return;

    const timer = window.setTimeout(() => {
      const hour = new Date().getHours();
      let greeting = t('cyberbot_greeting_afternoon');
      if (hour >= 5 && hour < 12) {
        greeting = t('cyberbot_greeting_morning');
      } else if (hour >= 20 || hour < 5) {
        greeting = t('cyberbot_greeting_evening');
      }

      say({
        text: greeting,
        emotion: 'happy',
        priority: 'low',
        durationMs: 6000,
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [enabled, chatterLevel, quietHours, t, say]);

  // Handle direct click on CyberBot
  const handleClickBot = useCallback(() => {
    playCyberBeep?.();

    const tips = [
      t('cyberbot_chat_click_1'),
      t('cyberbot_chat_click_2', { count: String(dailyLaunchCount) }),
      t('cyberbot_tip_tab'),
      t('cyberbot_tip_command_palette'),
      t('cyberbot_tip_resources'),
      t('cyberbot_chat_click_3'),
    ];

    const chosenTip = tips[clickIndexRef.current % tips.length];
    clickIndexRef.current += 1;

    say({
      text: chosenTip,
      emotion: 'wink',
      durationMs: 6500,
      priority: 'normal',
    });
  }, [dailyLaunchCount, playCyberBeep, say, t]);

  return {
    enabled,
    toggleEnabled,
    position,
    updatePosition,
    dodgeEnabled,
    updateDodgeEnabled,
    chatterLevel,
    updateChatterLevel,
    quietHours,
    updateQuietHours,
    activeMessage,
    say,
    dismissMessage,
    handleClickBot,
  };
}
