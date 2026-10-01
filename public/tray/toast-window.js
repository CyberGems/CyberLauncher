'use strict';

let currentTaskId = null;
let currentActionTarget = null;

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

if (window.desktopToast) {
  window.desktopToast.onData((data) => {
    if (!data) return;

    if (data.type === 'hide') {
      imminentCard.classList.add('exiting');
      standardCard.classList.add('exiting');
      return;
    }

    imminentCard.classList.remove('exiting');
    standardCard.classList.remove('exiting');

    if (data.type === 'imminent') {
      currentTaskId = data.taskId || null;
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
      currentActionTarget = data.action || null;
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
