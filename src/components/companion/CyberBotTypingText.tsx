import React, { useLayoutEffect, useRef } from 'react';
import './cyberbot-typing.css';

export function CyberBotTypingText({ text, visible, caret = false, typing = false }: {
  text: string; visible: string; caret?: boolean; typing?: boolean;
}) {
  const viewport = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const node = viewport.current;
    if (!node) return;
    node.scrollTop = typing ? node.scrollHeight : 0;
    node.scrollLeft = typing ? node.scrollWidth : 0;
  }, [visible, typing]);
  return <span className="cyberbot-typing-text" data-cyberbot-typing={typing}>
    <span className="cyberbot-typing-accessible">{text}</span>
    <span className="cyberbot-typing-reserve" aria-hidden="true">{text}<span className="cyberbot-caret-space" /></span>
    <span ref={viewport} className="cyberbot-typing-visible" aria-hidden="true">
      <span data-cyberbot-written>{visible}</span>{caret && <span className="cyberbot-typing-caret" />}
    </span>
  </span>;
}
