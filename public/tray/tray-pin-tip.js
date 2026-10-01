'use strict';

const I18N = {
  es: {
    title: 'Mantén CyberLauncher visible en la bandeja',
    bodyPrefix: 'Windows oculta los iconos nuevos detrás de la flecha ',
    bodySuffix: '. Arrastra CyberLauncher a la barra de tareas visible, o fíjalo en Configuración de Windows.',
    dontShow: 'No mostrar más',
    gotIt: 'Entendido',
    openSettings: 'Abrir Configuración de Windows',
    dismiss: 'Cerrar',
  },
  en: {
    title: 'Keep CyberLauncher visible in the tray',
    bodyPrefix: 'Windows hides new tray icons behind the overflow arrow ',
    bodySuffix: '. Drag CyberLauncher onto the visible taskbar, or pin it in Windows Settings.',
    dontShow: "Don't show again",
    gotIt: 'Got it',
    openSettings: 'Open Windows Settings',
    dismiss: 'Dismiss',
  },
};

const CHEVRON_SVG = '<span class="overflow-badge"><svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg></span>';

function getApi() {
  return window.trayPinTip || (window.electronAPI && window.electronAPI.trayPinTip) || null;
}

const rootEl = document.getElementById('root');
const cardWrapEl = document.getElementById('cardWrap');
const tailSvgEl = document.getElementById('tailSvg');
const titleEl = document.getElementById('title');
const bodyEl = document.getElementById('body');
const dontShowCheckbox = document.getElementById('dontShowCheckbox');
const dontShowLabel = document.getElementById('dontShowLabel');
const gotItBtn = document.getElementById('gotItBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsBtnLabel = document.getElementById('settingsBtnLabel');
const closeBtn = document.getElementById('closeBtn');

let currentLang = 'es';

function updateUI(lang, edge, tailOffsetPx) {
  currentLang = lang === 'en' ? 'en' : 'es';
  const t = I18N[currentLang];

  titleEl.textContent = t.title;
  bodyEl.innerHTML = `${t.bodyPrefix}${CHEVRON_SVG}${t.bodySuffix}`;
  dontShowLabel.textContent = t.dontShow;
  gotItBtn.textContent = t.gotIt;
  settingsBtnLabel.textContent = t.openSettings;
  closeBtn.title = t.dismiss;

  if (edge === 'top') {
    cardWrapEl.className = 'card-wrap edge-top';
  } else {
    cardWrapEl.className = 'card-wrap edge-bottom';
  }

  if (typeof tailOffsetPx === 'number' && tailOffsetPx > 0) {
    tailSvgEl.style.left = `${Math.round(tailOffsetPx)}px`;
  } else {
    tailSvgEl.style.left = 'calc(50% - 8px)';
  }

  reportSize();
}

function reportSize() {
  if (!rootEl) return;
  requestAnimationFrame(() => {
    const rect = rootEl.getBoundingClientRect();
    const w = Math.ceil(rect.width);
    const h = Math.ceil(rect.height);
    const api = getApi();
    if (api && api.ready && w > 0 && h > 0) {
      api.ready({ width: w, height: h });
    }
  });
}

function dismiss() {
  const api = getApi();
  if (api && api.dismiss) {
    api.dismiss(dontShowCheckbox.checked);
  }
}

function openSettings() {
  const api = getApi();
  if (api && api.openSettings) {
    api.openSettings(dontShowCheckbox.checked);
  }
}

gotItBtn.addEventListener('click', (e) => {
  e.preventDefault();
  dismiss();
});

closeBtn.addEventListener('click', (e) => {
  e.preventDefault();
  dismiss();
});

settingsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  openSettings();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    dismiss();
  }
});

// Context menu disabled
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Initialize with default language
updateUI('es', 'bottom', 0);

// Subscribe to IPC data
function initIpc() {
  const api = getApi();
  if (!api || !api.onData) return false;
  api.onData((data) => {
    if (data) {
      updateUI(data.lang, data.edge, data.tailOffset);
    }
  });
  return true;
}

if (!initIpc()) {
  window.addEventListener('DOMContentLoaded', () => {
    if (!initIpc()) {
      setTimeout(initIpc, 60);
    }
  });
}
