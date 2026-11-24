import React, { useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal, flushSync } from 'react-dom';
import { DesktopCyberBotAvatar, type DesktopCyberBotState } from './components/companion/desktop/DesktopCyberBotAvatar';
import { useCyberBotTyping } from './components/companion/useCyberBotTyping';
import { CyberBotTypingText } from './components/companion/CyberBotTypingText';
import './components/companion/desktop/toast-window.css';
import './components/companion/desktop/toast-window.js';

const host = document.getElementById('cyberbotAvatar');
const titleHost = document.getElementById('cyberbotTitle');
const detailHost = document.getElementById('cyberbotDetail');
if (!host || !titleHost || !detailHost) throw new Error('Missing desktop CyberBot announcement host');
const root = createRoot(host);
function DesktopAnnouncement({ face, speechKey, title, detail, animateText }: DesktopCyberBotState) {
  const typing = useCyberBotTyping(speechKey, title, detail, animateText);
  useLayoutEffect(() => {
    const copy = titleHost?.parentElement;
    if (copy) copy.scrollTop = 0;
  }, [speechKey]);
  return <>
    <DesktopCyberBotAvatar face={face} speaking={typing.isTyping} />
    {createPortal(<CyberBotTypingText text={title} visible={typing.text} caret={typing.part === 'text'} typing={typing.isTyping} />, titleHost!)}
    {createPortal(<CyberBotTypingText text={detail} visible={typing.detail} caret={typing.part === 'detail'} typing={typing.isTyping} />, detailHost!)}
  </>;
}
window.addEventListener('cyberbot-toast-avatar', (event: Event) => {
  const state = (event as CustomEvent<DesktopCyberBotState | null>).detail;
  // Commit the text and face together before the toast card is revealed.
  flushSync(() => root.render(state ? <DesktopAnnouncement {...state} /> : null));
});
