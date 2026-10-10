import React from 'react';
import { createRoot } from 'react-dom/client';
import { DesktopCyberBotAvatar, type DesktopCyberBotState } from './components/companion/desktop/DesktopCyberBotAvatar';
import './components/companion/desktop/toast-window.css';
import './components/companion/desktop/toast-window.js';

const host = document.getElementById('cyberbotAvatar');
if (!host) throw new Error('Missing desktop CyberBot avatar host');
const root = createRoot(host);
window.addEventListener('cyberbot-toast-avatar', (event: Event) => {
  const state = (event as CustomEvent<DesktopCyberBotState | null>).detail;
  // Unmount hidden announcements so speech and ambient timers cannot outlive them.
  root.render(state ? <DesktopCyberBotAvatar {...state} /> : null);
});
