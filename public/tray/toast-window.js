'use strict';

let currentTaskId = null;
let currentActionTarget = null;
let currentReleaseUrl = null;

const cyberbotCard = document.getElementById('cyberbotCard');
const cyberbotTitle = document.getElementById('cyberbotTitle');
const cyberbotDetail = document.getElementById('cyberbotDetail');
const cyberbotBrandTag = document.getElementById('cyberbotBrandTag');
const cyberbotActions = document.getElementById('cyberbotActions');
const cyberbotActionBtn = document.getElementById('cyberbotActionBtn');
const cyberbotSecondaryBtn = document.getElementById('cyberbotSecondaryBtn');
const cyberbotDismissBtn = document.getElementById('cyberbotDismissBtn');

const imminentCard = document.getElementById('imminentCard');
const imminentSeconds = document.getElementById('imminentSeconds');
const imminentTitle = document.getElementById('imminentTitle');
const imminentDetail = document.getElementById('imminentDetail');
const imminentBrandTag = document.getElementById('imminentBrandTag');
const launchNowBtn = document.getElementById('launchNowBtn');
const launchNowLabel = document.getElementById('launchNowLabel');
const cancelLaunchBtn = document.getElementById('cancelLaunchBtn');
const cancelLaunchLabel = document.getElementById('cancelLaunchLabel');

const standardCard = document.getElementById('standardCard');
const statusDot = document.getElementById('statusDot');
const standardTitle = document.getElementById('standardTitle');
const standardDetail = document.getElementById('standardDetail');
const standardActionBtn = document.getElementById('standardActionBtn');
const standardActionLabel = document.getElementById('standardActionLabel');
const standardReleaseBtn = document.getElementById('standardReleaseBtn');
const brandMetaTag = document.getElementById('brandMetaTag');
const dismissToastBtn = document.getElementById('dismissToastBtn');

launchNowBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (window.desktopToast && currentTaskId) {
    window.desktopToast.action('launch-now', { taskId: currentTaskId });
  }
});

cancelLaunchBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (window.desktopToast && currentTaskId) {
    window.desktopToast.action('cancel-task', { taskId: currentTaskId });
  }
});

standardActionBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (window.desktopToast && currentActionTarget) {
    window.desktopToast.action('open-hud', { target: currentActionTarget });
  }
});

standardReleaseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (window.desktopToast && currentReleaseUrl) {
    window.desktopToast.action('open-release', { url: currentReleaseUrl });
  }
});

standardCard.addEventListener('click', (e) => {
  if (e.target.closest('#dismissToastBtn')) return;
  if (e.target.closest('#standardActionBtn')) return;
  if (window.desktopToast && currentActionTarget) {
    window.desktopToast.action('open-hud', { target: currentActionTarget });
  }
});

dismissToastBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (window.desktopToast) {
    window.desktopToast.hide();
  }
});

function runBotAction(kind) {
  if (!window.desktopToast) return;
  if (kind === 'launch' && currentTaskId) window.desktopToast.action('launch-now', { taskId: currentTaskId });
  if (kind === 'cancel' && currentTaskId) window.desktopToast.action('cancel-task', { taskId: currentTaskId });
  if (kind === 'hud' && currentActionTarget) window.desktopToast.action('open-hud', { target: currentActionTarget });
  if (kind === 'release' && currentReleaseUrl) window.desktopToast.action('open-release', { url: currentReleaseUrl });
}

cyberbotActionBtn.addEventListener('click', (e) => { e.stopPropagation(); runBotAction(cyberbotActionBtn.dataset.kind); });
cyberbotSecondaryBtn.addEventListener('click', (e) => { e.stopPropagation(); runBotAction(cyberbotSecondaryBtn.dataset.kind); });
cyberbotDismissBtn.addEventListener('click', (e) => { e.stopPropagation(); window.desktopToast?.hide(); });

if (window.desktopToast) {
  window.desktopToast.onData((data) => {
    if (!data) return;

    if (data.type === 'hide') {
      imminentCard.classList.add('exiting');
      standardCard.classList.add('exiting');
      cyberbotCard.classList.add('exiting');
      return;
    }

    imminentCard.classList.remove('exiting');
    standardCard.classList.remove('exiting');
    cyberbotCard.classList.remove('exiting');
    currentTaskId = data.taskId || null;
    currentActionTarget = data.action || null;
    currentReleaseUrl = data.releaseUrl || null;
    if (data.dismissLabel) {
      dismissToastBtn.setAttribute('aria-label', data.dismissLabel);
      cyberbotDismissBtn.setAttribute('aria-label', data.dismissLabel);
    }

    if (data.presentation === 'bot') {
      imminentCard.classList.add('hidden');
      standardCard.classList.add('hidden');
      cyberbotCard.classList.remove('hidden');
      cyberbotCard.classList.toggle('alert', data.type === 'warning' || data.type === 'error' || data.type === 'imminent');
      cyberbotTitle.textContent = data.title || '';
      cyberbotDetail.textContent = data.detail || '';
      cyberbotDetail.classList.toggle('hidden', !data.detail);
      cyberbotBrandTag.textContent = data.brandTag ? `/ ${data.brandTag}` : '';

      cyberbotActionBtn.classList.add('hidden');
      cyberbotSecondaryBtn.classList.add('hidden');
      if (data.type === 'imminent') {
        cyberbotActionBtn.textContent = data.actionLabelLaunch || '';
        cyberbotActionBtn.dataset.kind = 'launch';
        cyberbotActionBtn.classList.remove('hidden');
        cyberbotSecondaryBtn.textContent = data.actionLabelCancel || '';
        cyberbotSecondaryBtn.dataset.kind = 'cancel';
        cyberbotSecondaryBtn.classList.remove('hidden');
      } else {
        if (data.action && data.actionLabel) {
          cyberbotActionBtn.textContent = data.actionLabel;
          cyberbotActionBtn.dataset.kind = 'hud';
          cyberbotActionBtn.classList.remove('hidden');
        }
        if (data.releaseUrl && data.releaseLabel) {
          const button = data.action ? cyberbotSecondaryBtn : cyberbotActionBtn;
          button.textContent = data.releaseLabel;
          button.dataset.kind = 'release';
          button.classList.remove('hidden');
        }
      }
      cyberbotActions.classList.toggle('hidden', cyberbotActionBtn.classList.contains('hidden') && cyberbotSecondaryBtn.classList.contains('hidden'));
      return;
    }

    cyberbotCard.classList.add('hidden');

    if (data.type === 'imminent') {
      standardCard.classList.add('hidden');
      imminentCard.classList.remove('hidden');

      const secs = (data.countdownSeconds != null) ? data.countdownSeconds : 10;
      imminentSeconds.textContent = secs.toString().padStart(2, '0');
      imminentTitle.textContent = data.title || `LANZAMIENTO EN ${secs}S`;
      imminentDetail.textContent = data.detail || '';

      if (imminentBrandTag) {
        imminentBrandTag.textContent = data.brandTag || 'TIMER';
      }

      if (data.actionLabelLaunch) launchNowLabel.textContent = data.actionLabelLaunch;
      if (data.actionLabelCancel) cancelLaunchLabel.textContent = data.actionLabelCancel;
    } else {
      imminentCard.classList.add('hidden');
      standardCard.classList.remove('hidden');

      standardCard.classList.remove('type-success', 'type-error', 'type-warning', 'type-info', 'has-action');
      statusDot.classList.remove('dot-emerald', 'dot-red', 'dot-amber', 'dot-cyan');

      if (data.action) {
        standardCard.classList.add('has-action');
      }

      if (data.type === 'success') {
        standardCard.classList.add('type-success');
        statusDot.classList.add('dot-emerald');
      } else if (data.type === 'error' || data.level === 'critical') {
        standardCard.classList.add('type-error');
        statusDot.classList.add('dot-red');
      } else if (data.type === 'warning' || data.level === 'warning') {
        standardCard.classList.add('type-warning');
        statusDot.classList.add('dot-amber');
      } else {
        standardCard.classList.add('type-info');
        statusDot.classList.add('dot-cyan');
      }

      standardTitle.textContent = data.title || '';
      if (data.detail) {
        standardDetail.textContent = data.detail;
        standardDetail.classList.remove('hidden');
      } else {
        standardDetail.textContent = '';
        standardDetail.classList.add('hidden');
      }

      if (data.action && data.actionLabel) {
        standardActionBtn.classList.remove('hidden');
        standardActionLabel.textContent = data.actionLabel;
      } else {
        standardActionBtn.classList.add('hidden');
      }
      standardReleaseBtn.classList.toggle('hidden', !data.releaseUrl || !data.releaseLabel);
      if (data.releaseUrl && data.releaseLabel) standardReleaseBtn.textContent = data.releaseLabel;

      if (brandMetaTag) {
        if (data.brandTag) {
          brandMetaTag.textContent = data.brandTag;
        } else if (data.action === 'open-hud-clock') {
          brandMetaTag.textContent = 'PROGRAMADOR';
        } else if (data.action === 'open-hud-storage') {
          brandMetaTag.textContent = 'DISCO';
        } else if (data.action === 'open-hud-system') {
          brandMetaTag.textContent = 'MEMORIA';
        } else {
          brandMetaTag.textContent = 'SISTEMA';
        }
      }
    }
  });
}
