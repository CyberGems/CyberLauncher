'use strict';

const ICONS = {
  bot: '<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4M10 4h4M8 13v2m8-2v2"/></svg>',
  window: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="10" y1="4" x2="10" y2="8"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="6" y1="4" x2="6" y2="8"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  recent: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
  help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  diamond: '<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/><path d="M9 3l3 6 3-6"/></svg>',
  quit: '<svg viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M8 3h8l-1 5 3 3v2H6v-2l3-3z"/><path d="M12 13v8"/></svg>',
  faq: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  tag: '<svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  tag: '<svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  about: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  update: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  chevron: '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  appDefault: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
};

function getApi() {
  return window.trayMenu || (window.electronAPI && window.electronAPI.trayMenu) || null;
}
const stageEl = document.getElementById('stage');
const cardEl = document.getElementById('card');
const headEl = document.getElementById('head');
const headDividerEl = document.getElementById('headDivider');
const groupEl = document.getElementById('group');
const exitDividerEl = document.getElementById('exitDivider');
const exitGroupEl = document.getElementById('exitGroup');
const flyoutRecentsEl = document.getElementById('flyoutRecents');
const flyoutHelpEl = document.getElementById('flyoutHelp');
const flyoutSuiteEl = document.getElementById('flyoutSuite');

let currentState = {
  version: '1.15.0',
  lang: 'es',
  isVisible: false,
  shortcut: 'Alt+Shift+L',
  showTrayRecents: true,
  showSuiteRecommendations: true,
  flyoutSide: 'left',
  verticalAlign: 'bottom',
  recents: [],
  suiteApps: [
    { slug: 'cyberclock', name: 'CyberClock', desc: 'Reloj de escritorio', site: 'https://cybergems.org/apps/cyberclock/' },
    { slug: 'cyberfeeds', name: 'CyberFeeds', desc: 'Lector RSS', site: 'https://cybergems.org/apps/cyberfeeds/' },
    { slug: 'cybermanager', name: 'CyberManager', desc: 'Administrador de tareas', site: 'https://cybergems.org/apps/cybermanager/' },
    { slug: 'cybernotes', name: 'CyberNotes', desc: 'Notas', site: 'https://cybergems.org/apps/cybernotes/' },
    { slug: 'cyberpaste', name: 'CyberPaste', desc: 'Portapapeles', site: 'https://cybergems.org/apps/cyberpaste/' },
    { slug: 'cybersnap', name: 'CyberSnap', desc: 'Captura de pantalla', site: 'https://cybergems.org/apps/cybersnap/' },
    { slug: 'cybertray', name: 'CyberTray', desc: 'Accesos directos', site: 'https://cybergems.org/apps/cybertray/' },
    { slug: 'cyberviewer', name: 'CyberViewer', desc: 'Visor de imágenes', site: 'https://cybergems.org/apps/cyberviewer/' },
    { slug: 'cyberwall', name: 'CyberWall', desc: 'Firewall', site: 'https://cybergems.org/apps/cyberwall/' },
  ],
};
let activeFlyout = null;
let flyoutOpenTimer = null;
let flyoutCloseTimer = null;

function cancelFlyoutTimers() {
  if (flyoutOpenTimer) {
    clearTimeout(flyoutOpenTimer);
    flyoutOpenTimer = null;
  }
  if (flyoutCloseTimer) {
    clearTimeout(flyoutCloseTimer);
    flyoutCloseTimer = null;
  }
}

function getFlyoutElement(target) {
  if (target === 'recents') return flyoutRecentsEl;
  if (target === 'help') return flyoutHelpEl;
  if (target === 'suite') return flyoutSuiteEl;
  return null;
}

function setActiveFlyout(target) {
  activeFlyout = target;
  const flyouts = [
    ['recents', flyoutRecentsEl],
    ['help', flyoutHelpEl],
    ['suite', flyoutSuiteEl],
  ];
  for (const [id, el] of flyouts) {
    if (!el) continue;
    const isOpen = id === activeFlyout;
    el.classList.toggle('is-open', isOpen);
    el.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  }
  if (cardEl) {
    const triggers = cardEl.querySelectorAll('[data-flyout-trigger]');
    for (const btn of triggers) {
      const isOpen = btn.dataset.flyoutTrigger === activeFlyout;
      btn.classList.toggle('is-flyout-open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }
}

function scheduleFlyoutOpen(target) {
  cancelFlyoutTimers();
  if (activeFlyout === target) return;
  const delay = activeFlyout !== null ? 60 : 120;
  flyoutOpenTimer = setTimeout(() => {
    flyoutOpenTimer = null;
    setActiveFlyout(target);
  }, delay);
}

function scheduleFlyoutClose() {
  cancelFlyoutTimers();
  if (activeFlyout === null) return;
  flyoutCloseTimer = setTimeout(() => {
    flyoutCloseTimer = null;
    setActiveFlyout(null);
  }, 220);
}

function openFlyoutAndFocusFirst(target) {
  cancelFlyoutTimers();
  setActiveFlyout(target);
  requestAnimationFrame(() => {
    const el = getFlyoutElement(target);
    if (!el) return;
    const firstBtn = el.querySelector('button.item:not(.item-empty)');
    if (firstBtn) firstBtn.focus();
  });
}

function closeFlyoutAndReturnFocus() {
  const prev = activeFlyout;
  cancelFlyoutTimers();
  setActiveFlyout(null);
  if (prev && cardEl) {
    const trigger = cardEl.querySelector(`[data-flyout-trigger="${prev}"]`);
    if (trigger) trigger.focus();
  }
}

const I18N = {
  es: {
    back: 'Volver',
    show: 'Mostrar Launcher',
    hide: 'Ocultar Launcher',
    newApp: 'Nuevo acceso...',
    settings: 'Configuración...',
    cyberBotEnable: 'Activar CyberBot',
    cyberBotDisable: 'Desactivar CyberBot',
    statusVisible: 'En pantalla · Visible',
    statusHidden: 'En bandeja · Oculto',
    recentsTitle: 'Accesos Recientes',
    viewAllRecents: 'Ver todos los recientes ({count})',
    noRecents: 'Sin accesos recientes',
    help: 'Ayuda',
    suite: 'Más de CyberGems',
    quit: 'Salir',
    pin: 'Fijar icono en la barra...',
    faq: 'Preguntas frecuentes (FAQ)',
    changelog: 'Registro de cambios',
    website: 'Sitio web oficial',
    donate: 'Donar',
    about: 'Acerca de CyberLauncher...',
    updates: 'Buscar actualizaciones...',
    viewAllSuite: 'Más detalles online...',
  },
  en: {
    back: 'Back',
    show: 'Show Launcher',
    hide: 'Hide Launcher',
    newApp: 'New shortcut...',
    settings: 'Settings...',
    cyberBotEnable: 'Enable CyberBot',
    cyberBotDisable: 'Disable CyberBot',
    statusVisible: 'On screen · Visible',
    statusHidden: 'In tray · Hidden',
    recentsTitle: 'Recent Shortcuts',
    viewAllRecents: 'View all recent ({count})',
    noRecents: 'No recent shortcuts',
    help: 'Help',
    suite: 'More from CyberGems',
    quit: 'Exit',
    pin: 'Pin icon to taskbar...',
    faq: 'Frequently Asked Questions',
    changelog: 'Changelog',
    website: 'Official Website',
    donate: 'Donate',
    about: 'About CyberLauncher...',
    updates: 'Check for updates...',
    viewAllSuite: 'More details online...',
  },
};

function t(key, vars = {}) {
  const lang = (currentState && currentState.lang === 'en') ? 'en' : 'es';
  let text = (I18N[lang] && I18N[lang][key]) || (I18N.es && I18N.es[key]) || key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}

function makeSeparator() {
  const sep = document.createElement('div');
  sep.className = 'submenu-divider';
  sep.setAttribute('role', 'separator');
  return sep;
}

function makeItem(def) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('role', 'menuitem');
  btn.className = 'item' + (def.danger ? ' item-danger' : '') + (def.donate ? ' item-donate' : '') + (def.stacked ? ' item-stacked' : '');
  // App-style bubble via [data-tooltip]; a native title would use the OS style.
  if (def.title) btn.dataset.tooltip = def.title;

  if (def.img) {
    const img = document.createElement('img');
    img.className = def.stacked ? 'item-suite-img' : 'item-img';
    img.src = def.img;
    img.alt = '';
    img.draggable = false;
    img.addEventListener('error', () => {
      img.style.display = 'none';
      if (!def.stacked) {
        const fallbackIco = document.createElement('span');
        fallbackIco.className = 'item-ico';
        fallbackIco.innerHTML = ICONS.appDefault;
        btn.prepend(fallbackIco);
      }
    }, { once: true });
    btn.appendChild(img);
  } else if (def.icon) {
    const ico = document.createElement('span');
    ico.className = 'item-ico';
    ico.innerHTML = ICONS[def.icon] || ICONS.appDefault;
    btn.appendChild(ico);
  }

  if (def.stacked) {
    const copy = document.createElement('div');
    copy.className = 'item-copy';
    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = def.label;
    copy.appendChild(name);
    if (def.desc) {
      const desc = document.createElement('div');
      desc.className = 'item-desc';
      desc.textContent = def.desc;
      copy.appendChild(desc);
    }
    btn.appendChild(copy);
  } else {
    const lbl = document.createElement('span');
    lbl.className = 'item-label';
    lbl.textContent = def.label;
    btn.appendChild(lbl);
  }

  if (def.shortcut) {
    const sc = document.createElement('span');
    sc.className = 'item-shortcut';
    sc.textContent = def.shortcut;
    btn.appendChild(sc);
  }

  if (def.trailingIcon) {
    const ch = document.createElement('span');
    ch.className = 'item-chevron';
    ch.innerHTML = ICONS[def.trailingIcon] || ICONS.chevron;
    btn.appendChild(ch);
  }

  if (def.localAction) {
    btn.dataset.flyoutTrigger = def.localAction;
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', activeFlyout === def.localAction ? 'true' : 'false');
    if (activeFlyout === def.localAction) {
      btn.classList.add('is-flyout-open');
    }
    btn.addEventListener('mouseenter', () => {
      scheduleFlyoutOpen(def.localAction);
    });
  } else if (def.inMainCard) {
    btn.addEventListener('mouseenter', () => {
      scheduleFlyoutClose();
    });
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (def.localAction) {
      cancelFlyoutTimers();
      setActiveFlyout(activeFlyout === def.localAction ? null : def.localAction);
    } else if (def.action) {
      cancelFlyoutTimers();
      setActiveFlyout(null);
      const api = getApi();
      console.log('[TRAY-CLICK] action:', def.action, 'api present:', Boolean(api));
      if (api && api.action) {
        api.action(def.action, def.payload);
      } else {
        console.warn('[TRAY-CLICK-WARN] action ignored, api is:', api);
      }
    }
  });

  return btn;
}

function renderHead() {
  headEl.replaceChildren();
  headDividerEl.style.display = 'block';
  const version = (currentState && currentState.version) || '1.15.0';
  headEl.className = 'head';
  headEl.setAttribute('role', 'button');
  headEl.setAttribute('tabindex', '0');

  const logo = document.createElement('img');
  logo.className = 'head-logo';
  logo.src = '../icon.png';
  logo.alt = '';
  logo.draggable = false;
  logo.addEventListener('error', () => { logo.src = '../icon-20.png'; }, { once: true });

  const titleWrap = document.createElement('span');
  titleWrap.className = 'head-title';
  titleWrap.innerHTML = `Cyber<span class="head-title-accent">Launcher</span> <span class="head-ver">v${version}</span>`;

  headEl.appendChild(logo);
  headEl.appendChild(titleWrap);
  headEl.dataset.tooltip = t('about');
  headEl.onmouseenter = () => {
    scheduleFlyoutClose();
  };
  headEl.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const api = getApi();
    if (api && api.action) api.action('about-modal');
  };
  headEl.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      const api = getApi();
      if (api && api.action) api.action('about-modal');
    }
  };
}

function makeFlyoutHead(iconKey, titleText, extraNode) {
  const head = document.createElement('div');
  head.className = 'flyout-head';

  const title = document.createElement('span');
  title.className = 'flyout-head-title';
  const ico = document.createElement('span');
  ico.className = 'flyout-head-ico';
  ico.innerHTML = ICONS[iconKey] || ICONS.diamond;
  const text = document.createElement('span');
  text.textContent = titleText;
  title.appendChild(ico);
  title.appendChild(text);
  head.appendChild(title);

  if (extraNode) {
    head.appendChild(extraNode);
  }
  return head;
}

function makeFlyoutDivider() {
  const div = document.createElement('div');
  div.className = 'divider';
  return div;
}

function renderMainView() {
  const isVis = Boolean(currentState && currentState.isVisible);
  const shortcut = (currentState && currentState.shortcut) || 'Alt+Shift+L';
  const showRecents = currentState ? currentState.showTrayRecents !== false : true;
  const showSuite = currentState ? currentState.showSuiteRecommendations !== false : true;
  const recents = (currentState && Array.isArray(currentState.recents)) ? currentState.recents : [];

  const items = [];

  // Live status row
  const statusRow = document.createElement('div');
  statusRow.className = 'status-row';
  statusRow.innerHTML = `
    <span class="status-dot ${isVis ? 'active' : 'idle'}" aria-hidden="true"></span>
    <span class="status-text">${isVis ? t('statusVisible') : t('statusHidden')}</span>
  `;
  statusRow.addEventListener('mouseenter', () => scheduleFlyoutClose());
  items.push(statusRow);

  // Show / Hide action
  items.push(
    makeItem({
      action: isVis ? 'hide' : 'show',
      icon: 'window',
      label: isVis ? t('hide') : t('show'),
      shortcut: shortcut || undefined,
      inMainCard: true,
    })
  );

  // New shortcut
  items.push(
    makeItem({
      action: 'new-app',
      icon: 'plus',
      label: t('newApp'),
      inMainCard: true,
    })
  );

  // Settings
  items.push(
    makeItem({
      action: 'settings',
      icon: 'settings',
      label: t('settings'),
      inMainCard: true,
    })
  );

  items.push(makeItem({
    action: 'toggle-cyberbot',
    icon: 'bot',
    label: t(currentState?.cyberBotEnabled === false ? 'cyberBotEnable' : 'cyberBotDisable'),
    shortcut: currentState?.cyberBotToggleShortcut,
    inMainCard: true,
  }));

  // Recent apps (Integrated top 4 apps for 1-click launch + side-by-side flyout for full list)
  if (showRecents) {
    items.push(makeSeparator());

    const labelRow = document.createElement('div');
    labelRow.className = 'section-label';
    labelRow.textContent = t('recentsTitle');
    items.push(labelRow);

    if (recents.length > 0) {
      const topRecents = recents.slice(0, 4);
      for (const r of topRecents) {
        let iconSrc = r.iconPath;
        if (iconSrc && !iconSrc.startsWith('data:') && !iconSrc.startsWith('http') && !iconSrc.startsWith('local-resource:')) {
          iconSrc = `local-resource:///${iconSrc.replace(/\\/g, '/')}`;
        }
        items.push(
          makeItem({
            action: 'launch-recent',
            payload: r,
            img: iconSrc || undefined,
            icon: iconSrc ? undefined : 'clock',
            label: r.name,
            title: r.path,
            inMainCard: true,
          })
        );
      }

      if (recents.length > 4) {
        items.push(
          makeItem({
            localAction: 'recents',
            icon: 'recent',
            label: t('viewAllRecents', { count: Math.min(recents.length, 10) }),
            trailingIcon: 'chevron',
          })
        );
      }
    } else {
      const emptyRow = document.createElement('div');
      emptyRow.className = 'item item-empty';
      emptyRow.innerHTML = `<span class="item-ico">${ICONS.clock}</span><span class="item-label item-empty-label">${t('noRecents')}</span>`;
      items.push(emptyRow);
    }
  }

  // Side-by-side flyout submenus
  items.push(makeSeparator());
  items.push(
    makeItem({
      localAction: 'help',
      icon: 'help',
      label: t('help'),
      trailingIcon: 'chevron',
    })
  );

  if (showSuite) {
    items.push(
      makeItem({
        localAction: 'suite',
        icon: 'diamond',
        label: t('suite'),
        trailingIcon: 'chevron',
      })
    );
  }

  groupEl.replaceChildren(...items);

  // Exit button
  exitDividerEl.style.display = 'block';
  exitGroupEl.style.display = 'flex';
  exitGroupEl.replaceChildren(
    makeItem({
      action: 'quit',
      icon: 'quit',
      label: t('quit'),
      danger: true,
      inMainCard: true,
    })
  );
}

function renderHelpFlyout() {
  if (!flyoutHelpEl) return;
  const group = document.createElement('div');
  group.className = 'group group-bottom';
  group.replaceChildren(
    makeItem({ action: 'help-pin', icon: 'pin', label: t('pin') }),
    makeSeparator(),
    makeItem({ action: 'help-faq', icon: 'faq', label: t('faq') }),
    makeItem({ action: 'help-changelog', icon: 'tag', label: t('changelog') }),
    makeItem({ action: 'help-website', icon: 'diamond', label: t('website') }),
    makeItem({ action: 'help-donate', icon: 'heart', label: t('donate'), donate: true }),
    makeSeparator(),
    makeItem({ action: 'about-modal', icon: 'about', label: t('about') }),
    makeItem({ action: 'check-updates', icon: 'update', label: t('updates') })
  );
  flyoutHelpEl.replaceChildren(
    makeFlyoutHead('help', t('help')),
    makeFlyoutDivider(),
    group
  );
}

function renderSuiteFlyout() {
  if (!flyoutSuiteEl) return;
  const apps = (currentState && Array.isArray(currentState.suiteApps)) ? currentState.suiteApps : [];
  const sisterApps = apps.filter((a) => a && a.slug !== 'cyberlauncher');

  const brandBtn = document.createElement('button');
  brandBtn.type = 'button';
  brandBtn.className = 'suite-brand-mark';
  brandBtn.innerHTML = `<img class="suite-brand-logo" src="../assets/cybergems-logo.svg" alt="" onerror="this.src='../assets/cybergems-logo.png'"><span class="suite-brand-name">CyberGems</span>`;
  brandBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const api = getApi();
    if (api && api.action) api.action('suite-home');
  };

  const items = sisterApps.map((app) => {
    return makeItem({
      action: 'suite-app',
      payload: { site: app.site, slug: app.slug },
      img: `../assets/suite/${app.slug}.png`,
      icon: 'diamond',
      label: app.name,
      desc: app.desc,
      stacked: true,
    });
  });

  items.push(makeSeparator());
  items.push(
    makeItem({
      action: 'suite-view-all',
      icon: 'arrowRight',
      label: t('viewAllSuite'),
    })
  );

  const group = document.createElement('div');
  group.className = 'group group-bottom';
  group.replaceChildren(...items);

  flyoutSuiteEl.replaceChildren(
    makeFlyoutHead('diamond', t('suite'), brandBtn),
    makeFlyoutDivider(),
    group
  );
}

function renderRecentsFlyout() {
  if (!flyoutRecentsEl) return;
  const recents = ((currentState && Array.isArray(currentState.recents)) ? currentState.recents : []).slice(0, 10);
  const group = document.createElement('div');
  group.className = 'group group-bottom';

  if (recents.length === 0) {
    const emptyRow = document.createElement('div');
    emptyRow.className = 'item item-empty';
    emptyRow.innerHTML = `<span class="item-ico">${ICONS.clock}</span><span class="item-label item-empty-label">${t('noRecents')}</span>`;
    group.replaceChildren(emptyRow);
  } else {
    const items = recents.map((r, i) => {
      let iconSrc = r.iconPath;
      if (iconSrc && !iconSrc.startsWith('data:') && !iconSrc.startsWith('http') && !iconSrc.startsWith('local-resource:')) {
        iconSrc = `local-resource:///${iconSrc.replace(/\\/g, '/')}`;
      }
      const num = i + 1;
      const shortcutKey = num === 10 ? '0' : String(num);
      return makeItem({
        action: 'launch-recent',
        payload: r,
        img: iconSrc || undefined,
        icon: iconSrc ? undefined : 'clock',
        label: `${num}. ${r.name}`,
        shortcut: `Alt+${shortcutKey}`,
        title: r.path,
      });
    });
    group.replaceChildren(...items);
  }

  flyoutRecentsEl.replaceChildren(
    makeFlyoutHead('recent', t('recentsTitle')),
    makeFlyoutDivider(),
    group
  );
}

function renderView() {
  if (stageEl) {
    stageEl.dataset.flyoutSide = currentState?.flyoutSide === 'right' ? 'right' : 'left';
    stageEl.dataset.verticalAlign = currentState?.verticalAlign === 'top' ? 'top' : 'bottom';
  }

  renderHead();
  groupEl.className = 'group';
  renderMainView();
  renderRecentsFlyout();
  renderHelpFlyout();
  renderSuiteFlyout();

  const showRecents = currentState ? currentState.showTrayRecents !== false : true;
  const showSuite = currentState ? currentState.showSuiteRecommendations !== false : true;
  const recents = (currentState && Array.isArray(currentState.recents)) ? currentState.recents : [];
  if (activeFlyout === 'recents' && (!showRecents || recents.length <= 4)) {
    activeFlyout = null;
  } else if (activeFlyout === 'suite' && !showSuite) {
    activeFlyout = null;
  }
  setActiveFlyout(activeFlyout);

  reportSize();
}

function measureCardHeight(el) {
  if (!el) return 0;
  return Math.max(el.scrollHeight, Math.ceil(el.getBoundingClientRect().height));
}

function reportSize() {
  if (!cardEl) return;
  requestAnimationFrame(() => {
    const pad = 24;
    const showRecents = currentState ? currentState.showTrayRecents !== false : true;
    const showSuite = currentState ? currentState.showSuiteRecommendations !== false : true;
    const recents = (currentState && Array.isArray(currentState.recents)) ? currentState.recents : [];

    const mainH = measureCardHeight(cardEl);
    const helpH = measureCardHeight(flyoutHelpEl);
    const suiteH = showSuite ? measureCardHeight(flyoutSuiteEl) : 0;
    const recentsH = (showRecents && recents.length > 4) ? measureCardHeight(flyoutRecentsEl) : 0;

    const cardH = Math.max(mainH, helpH, suiteH, recentsH);
    const h = Math.ceil(cardH + 2 * pad);
    const w = Math.ceil(cardEl.offsetWidth + 2 * pad);
    const api = getApi();
    if (api && api.ready && w > 0 && h > 0) {
      api.ready({ width: w, height: h, view: 'main' });
    }
  });
}

function hideMenu() {
  cancelFlyoutTimers();
  setActiveFlyout(null);
  const api = getApi();
  if (api && api.hide) {
    api.hide();
  }
}

if (cardEl) {
  cardEl.addEventListener('mouseleave', () => {
    scheduleFlyoutClose();
  });
}

for (const flyoutEl of [flyoutRecentsEl, flyoutHelpEl, flyoutSuiteEl]) {
  if (!flyoutEl) continue;
  flyoutEl.addEventListener('mouseenter', () => {
    cancelFlyoutTimers();
  });
  flyoutEl.addEventListener('mouseleave', () => {
    scheduleFlyoutClose();
  });
}

// Click on transparent canvas outside main card and open flyout dismisses the menu
document.addEventListener('mousedown', (e) => {
  const target = e.target;
  if (!(target instanceof Node)) return;
  if (cardEl && cardEl.contains(target)) return;
  const openFlyout = getFlyoutElement(activeFlyout);
  if (openFlyout && openFlyout.contains(target)) return;
  hideMenu();
});

// Global key handlers
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    if (activeFlyout !== null) {
      closeFlyoutAndReturnFocus();
    } else {
      hideMenu();
    }
    return;
  }

  const flyoutSide = currentState?.flyoutSide === 'right' ? 'right' : 'left';
  const openKey = flyoutSide === 'left' ? 'ArrowLeft' : 'ArrowRight';
  const closeKey = flyoutSide === 'left' ? 'ArrowRight' : 'ArrowLeft';
  const openFlyoutEl = getFlyoutElement(activeFlyout);
  const activeEl = document.activeElement;
  const inFlyout = Boolean(openFlyoutEl && activeEl && openFlyoutEl.contains(activeEl));

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const scope = (inFlyout && openFlyoutEl) ? openFlyoutEl : cardEl;
    if (!scope) return;
    const buttons = Array.from(scope.querySelectorAll('button.item:not(.item-empty)'));
    if (buttons.length === 0) return;
    e.preventDefault();
    const idx = buttons.indexOf(activeEl);
    const delta = e.key === 'ArrowDown' ? 1 : -1;
    const nextIdx = idx === -1
      ? (delta > 0 ? 0 : buttons.length - 1)
      : (idx + delta + buttons.length) % buttons.length;
    buttons[nextIdx]?.focus();
    return;
  }

  if (e.key === openKey || (!inFlyout && e.key === closeKey)) {
    const triggerTarget = activeEl && activeEl.dataset ? activeEl.dataset.flyoutTrigger : null;
    if (!inFlyout && triggerTarget) {
      e.preventDefault();
      openFlyoutAndFocusFirst(triggerTarget);
      return;
    }
  }

  if (e.key === closeKey && activeFlyout !== null) {
    e.preventDefault();
    closeFlyoutAndReturnFocus();
    return;
  }

  if (activeFlyout === 'recents') {
    const recents = ((currentState && Array.isArray(currentState.recents)) ? currentState.recents : []).slice(0, 10);
    let idx = -1;
    if (e.key >= '1' && e.key <= '9') {
      idx = parseInt(e.key, 10) - 1;
    } else if (e.key === '0') {
      idx = 9;
    }
    if (idx >= 0 && idx < recents.length) {
      e.preventDefault();
      const api = getApi();
      if (api && api.action) {
        api.action('launch-recent', recents[idx]);
      }
    }
  }
});

// Disable right-click menu inside tray menu
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Blur dismiss
window.addEventListener('blur', () => {
  cancelFlyoutTimers();
  setActiveFlyout(null);
  setTimeout(() => {
    const api = getApi();
    if (api && api.hide) api.hide();
  }, 100);
});

// Initial immediate render so card is never empty
renderView();

function resetToMain() {
  cancelFlyoutTimers();
  setActiveFlyout(null);
  renderView();
}

// Subscribe to IPC
let ipcInitialized = false;
function initIpc() {
  if (ipcInitialized) return true;
  const api = getApi();
  console.log('[TRAY-INIT-IPC] api present:', Boolean(api), 'window.trayMenu:', Boolean(window.trayMenu));
  if (!api) return false;

  if (api.onState) {
    api.onState((state) => {
      console.log('[TRAY-ON-STATE] received state. recents:', state?.recents?.length);
      if (state) {
        currentState = { ...currentState, ...state };
        if (state.resetView) {
          cancelFlyoutTimers();
          activeFlyout = null;
        }
      }
      renderView();
    });
  }

  if (api.onShow) {
    api.onShow(() => resetToMain());
  }

  if (api.onReset) {
    api.onReset(() => resetToMain());
  }

  if (api.requestState) {
    console.log('[TRAY-REQ-STATE] requesting state from main');
    api.requestState();
  }

  ipcInitialized = true;
  return true;
}

if (!initIpc()) {
  window.addEventListener('DOMContentLoaded', () => {
    if (!initIpc()) {
      setTimeout(initIpc, 50);
      setTimeout(initIpc, 200);
    }
  });
}

