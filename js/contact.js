
// GOD MODE 2: message history, AJ local time, keyboard send shortcut
// AUDIT 2026-09-10: removed the CONTACT_REPLY_DEADLINE_KEY / startReplyCountdown() pair —
// it fabricated a live "reply expected within 48h 00m 00s" ticker with no support team or
// ticket system behind it. See CSS and HTML removal notes above.
const CONTACT_HISTORY_KEY = 'indx_contact_msg_history';
let ajClockTimer = null;

function readHistory() {
  const raw = localStorage.getItem(CONTACT_HISTORY_KEY) || '[]';
  try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
}

function saveToHistory(entry) {
  const history = readHistory();
  history.unshift(entry);
  while (history.length > 10) history.pop();
  localStorage.setItem(CONTACT_HISTORY_KEY, JSON.stringify(history));
}

function renderHistoryList() {
  const list = document.getElementById('historyList');
  if (!list) return;
  const history = readHistory();
  if (!history.length) {
    list.innerHTML = '<div class="history-empty">No messages sent yet from this device.</div>';
    return;
  }
  list.innerHTML = history.map(function(item) {
    const msg = item.message || '';
    const preview = msg.length > 100 ? msg.slice(0, 100) + '…' : msg;
    const when = item.sentAt ? new Date(item.sentAt).toLocaleString() : '';
    return '<div class="history-item">' +
      '<div class="history-item-topic">' + escapeHtml(item.topic || 'Message') + '</div>' +
      '<div class="history-item-preview">' + escapeHtml(preview) + '</div>' +
      '<div class="history-item-date">' + escapeHtml(when) + '</div>' +
    '</div>';
  }).join('');
}

function openHistorySheet() {
  renderHistoryList();
  const overlay = document.getElementById('historyOverlay');
  const sheet = document.getElementById('historySheet');
  if (overlay) overlay.classList.add('show');
  if (sheet) sheet.classList.add('show');
}

function closeHistorySheet() {
  const overlay = document.getElementById('historyOverlay');
  const sheet = document.getElementById('historySheet');
  if (overlay) overlay.classList.remove('show');
  if (sheet) sheet.classList.remove('show');
}

function updateAjLocalTime() {
  const el = document.getElementById('ajLocalTime');
  if (!el) return;
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: 'numeric', minute: '2-digit', hour12: true });
    const hourFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: 'numeric', hour12: false });
    const hour = parseInt(hourFmt.format(now), 10);
    const awake = hour >= 7 && hour < 23;
    el.innerHTML = '<span class="aj-local-dot ' + (awake ? 'awake' : 'asleep') + '"></span> It\'s ' + fmt.format(now) + ' in Melbourne, where AJ is based';
  } catch (e) {
    el.textContent = '';
  }
}

function setupKeyboardSendShortcut() {
  const msgInput = document.getElementById('contactMessage');
  if (!msgInput) return;
  msgInput.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const form = document.getElementById('contactForm');
      if (form) { if (form.requestSubmit) form.requestSubmit(); else handleSubmit(e); }
    }
  });
  const hint = document.getElementById('kbdHint');
  if (hint && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '')) {
    hint.innerHTML = 'Tip: <kbd>⌘</kbd>+<kbd>Enter</kbd> to review &amp; send';
  }
}

// ── GOD MODE: draft autosave, live counter, smart prefill, confirm-to-send ──
const CONTACT_DRAFT_KEY = 'indx_contact_draft';

function prefillFromSession() {
  const name = sessionStorage.getItem('citizen_name');
  const domain = sessionStorage.getItem('citizen_web3_domain');
  const welcomeEl = document.getElementById('welcomeBack');
  if (!name) return;
  const nameInput = document.getElementById('contactName');
  if (nameInput && !nameInput.value) nameInput.value = name;
  const reachInput = document.getElementById('contactReach');
  if (reachInput && !reachInput.value && domain) reachInput.value = domain;
  if (welcomeEl) {
    welcomeEl.textContent = '👋 Welcome back, ' + name + '. We\'ve prefilled what we know.';
    welcomeEl.classList.add('show');
  }
}

function updateCharCounter(el) {
  const counter = document.getElementById('msgCharCounter');
  if (!counter) return;
  const len = el.value.length;
  const max = 500;
  counter.textContent = len + ' / ' + max;
  counter.classList.remove('warn', 'over');
  if (len > max) counter.classList.add('over');
  else if (len > max * 0.85) counter.classList.add('warn');
}

function handleMessageInput(el) {
  updateCharCounter(el);
  saveDraft();
}

function saveDraft() {
  const draft = {
    name: (document.getElementById('contactName') || {}).value || '',
    country: (document.getElementById('contactCountry') || {}).value || '',
    topic: (document.getElementById('contactTopic') || {}).value || '',
    message: (document.getElementById('contactMessage') || {}).value || '',
    reach: (document.getElementById('contactReach') || {}).value || '',
    savedAt: Date.now()
  };
  if (!draft.name && !draft.message && !draft.reach) {
    localStorage.removeItem(CONTACT_DRAFT_KEY);
    return;
  }
  localStorage.setItem(CONTACT_DRAFT_KEY, JSON.stringify(draft));
}

function readDraft() {
  const raw = localStorage.getItem(CONTACT_DRAFT_KEY) || 'null';
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function restoreDraft() {
  const draft = readDraft();
  if (!draft) return;
  const banner = document.getElementById('draftBanner');
  const bannerTime = document.getElementById('draftBannerTime');
  if (!banner) return;
  banner.classList.add('show');
  if (bannerTime) {
    const mins = Math.max(0, Math.round((Date.now() - (draft.savedAt || Date.now())) / 60000));
    bannerTime.textContent = mins < 1 ? 'a moment ago' : (mins + ' min ago');
  }
}

function applyDraft() {
  const draft = readDraft();
  if (!draft) return;
  const nameInput = document.getElementById('contactName');
  const countrySel = document.getElementById('contactCountry');
  const topicSel = document.getElementById('contactTopic');
  const msgInput = document.getElementById('contactMessage');
  const reachInput = document.getElementById('contactReach');
  if (nameInput) nameInput.value = draft.name || '';
  if (countrySel) countrySel.value = draft.country || '';
  if (topicSel) topicSel.value = draft.topic || '';
  if (msgInput) { msgInput.value = draft.message || ''; updateCharCounter(msgInput); }
  if (reachInput) reachInput.value = draft.reach || '';
  hideDraftBanner();
  showGodToast('Draft restored.');
}

function discardDraft() {
  localStorage.removeItem(CONTACT_DRAFT_KEY);
  hideDraftBanner();
  showGodToast('Draft discarded.');
}

function hideDraftBanner() {
  const banner = document.getElementById('draftBanner');
  if (banner) banner.classList.remove('show');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openConfirmSheet() {
  const name = (document.getElementById('contactName') || {}).value || '(not provided)';
  const country = (document.getElementById('contactCountry') || {}).value || '(not provided)';
  const topic = (document.getElementById('contactTopic') || {}).value || '(not provided)';
  const message = (document.getElementById('contactMessage') || {}).value || '';
  const reach = (document.getElementById('contactReach') || {}).value || '(not provided)';
  const summary = document.getElementById('confirmSummary');
  if (summary) {
    const trimmedMsg = message.length > 140 ? message.slice(0, 140) + '…' : message;
    summary.innerHTML =
      '<div class="confirm-row"><span class="confirm-row-label">Name</span><span class="confirm-row-val">' + escapeHtml(name) + '</span></div>' +
      '<div class="confirm-row"><span class="confirm-row-label">Country</span><span class="confirm-row-val">' + escapeHtml(country) + '</span></div>' +
      '<div class="confirm-row"><span class="confirm-row-label">Topic</span><span class="confirm-row-val">' + escapeHtml(topic) + '</span></div>' +
      '<div class="confirm-row"><span class="confirm-row-label">Message</span><span class="confirm-row-val">' + escapeHtml(trimmedMsg) + '</span></div>' +
      '<div class="confirm-row"><span class="confirm-row-label">Reach you at</span><span class="confirm-row-val">' + escapeHtml(reach) + '</span></div>';
  }
  const overlay = document.getElementById('confirmOverlay');
  const sheet = document.getElementById('confirmSheet');
  if (overlay) overlay.classList.add('show');
  if (sheet) sheet.classList.add('show');
  document.addEventListener('keydown', trapConfirmSheetKey);
  const sendBtn = document.getElementById('confirmSendBtn');
  if (sendBtn) sendBtn.focus();
}

function closeConfirmSheet() {
  const overlay = document.getElementById('confirmOverlay');
  const sheet = document.getElementById('confirmSheet');
  if (overlay) overlay.classList.remove('show');
  if (sheet) sheet.classList.remove('show');
  document.removeEventListener('keydown', trapConfirmSheetKey);
}

function trapConfirmSheetKey(e) {
  if (e.key === 'Escape') { closeConfirmSheet(); return; }
  if (e.key !== 'Tab') return;
  const sheet = document.getElementById('confirmSheet');
  if (!sheet) return;
  const focusable = sheet.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// AUDIT 2026-09-10: builds a real mailto: link to IN$DEX's official inbox so the message
// actually leaves the visitor's device. There is no contact_messages table in Supabase and
// this is a public, unauthenticated page (sovereign-support.html's ticket system requires a
// logged-in citizen_id, which a visitor here does not have) — a real email to a real,
// human-read inbox is the honest option available on this page.
function buildContactMailto() {
  const name = (document.getElementById('contactName') || {}).value || '';
  const country = (document.getElementById('contactCountry') || {}).value || '';
  const topic = (document.getElementById('contactTopic') || {}).value || 'Message from IN$DEX site';
  const message = (document.getElementById('contactMessage') || {}).value || '';
  const reach = (document.getElementById('contactReach') || {}).value || '';
  const subject = 'IN$DEX contact: ' + topic + (name ? ' — ' + name : '');
  const body = [
    message,
    '',
    '---',
    'Name: ' + (name || '(not provided)'),
    'Country: ' + (country || '(not provided)'),
    'Reach me at: ' + (reach || '(not provided)')
  ].join('\n');
  return 'mailto:imagenationdex@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}

function confirmAndSend() {
  closeConfirmSheet();
  const form = document.getElementById('contactForm');
  const toast = document.getElementById('toast');
  // Hand off to the visitor's own email app, addressed to the real official inbox.
  window.location.href = buildContactMailto();
  if (toast) toast.classList.add('show');
  if (form) {
    const btn = form.querySelector('.form-submit');
    if (btn) { btn.textContent = 'Opened ✓'; btn.style.opacity = '0.6'; btn.disabled = true; }
  }
  // GOD MODE PATCH: log this message to this device's own history list
  saveToHistory({
    topic: (document.getElementById('contactTopic') || {}).value || 'Message',
    message: (document.getElementById('contactMessage') || {}).value || '',
    sentAt: Date.now()
  });
  localStorage.removeItem(CONTACT_DRAFT_KEY);
  showGodToast('Email app opening — hit send there to reach AJ.');
}

function showGodToast(msg) {
  const toastEl = document.getElementById('godToast');
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(function() { toastEl.classList.remove('show'); }, 2600);
}

// GOD MODE PATCH: intercept submit to show the confirm-before-send review sheet instead of sending immediately
function handleSubmit(e) {
  e.preventDefault();
  openConfirmSheet();
}

document.addEventListener('DOMContentLoaded', function() {
  prefillFromSession();
  restoreDraft();
  // GOD MODE PATCH: init AJ local time clock, keyboard send shortcut
  updateAjLocalTime();
  ajClockTimer = setInterval(updateAjLocalTime, 60000);
  setupKeyboardSendShortcut();
});

// ── Generated handler wrappers (inline on* attributes → named functions) ──


// ── Delegated dispatcher ──────────────────────────────────────────────────
// Replaces inline on* attributes (CSP phase: no inline handlers).
// Markup carries data-action / data-args (click) or data-<event>-action / data-<event>-args.
// JSON args: "$this" = element, "$event" = event (currentTarget = matched element),
// "$value" = element.value, "$checked" = element.checked.
function indxJ(v) { return JSON.stringify(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
(function () {
  const EV = { click: ['click', 'action', 'args', true], input: ['input', 'inputAction', 'inputArgs', true], change: ['change', 'changeAction', 'changeArgs', true],
    submit: ['submit', 'submitAction', 'submitArgs', true], keydown: ['keydown', 'keydownAction', 'keydownArgs', true], keyup: ['keyup', 'keyupAction', 'keyupArgs', true],
    keypress: ['keypress', 'keypressAction', 'keypressArgs', true], dblclick: ['dblclick', 'dblclickAction', 'dblclickArgs', true], paste: ['paste', 'pasteAction', 'pasteArgs', true],
    touchstart: ['touchstart', 'touchstartAction', 'touchstartArgs', true], touchend: ['touchend', 'touchendAction', 'touchendArgs', true], touchmove: ['touchmove', 'touchmoveAction', 'touchmoveArgs', true],
    mousedown: ['mousedown', 'mousedownAction', 'mousedownArgs', true], mouseup: ['mouseup', 'mouseupAction', 'mouseupArgs', true],
    mouseenter: ['mouseenter', 'mouseenterAction', 'mouseenterArgs', false], mouseleave: ['mouseleave', 'mouseleaveAction', 'mouseleaveArgs', false],
    mouseover: ['mouseover', 'mouseoverAction', 'mouseoverArgs', true], mouseout: ['mouseout', 'mouseoutAction', 'mouseoutArgs', true],
    blur: ['focusout', 'blurAction', 'blurArgs', false], focus: ['focusin', 'focusAction', 'focusArgs', false],
    error: ['error', 'errorAction', 'errorArgs', false], load: ['load', 'loadAction', 'loadArgs', false] };
  function run(e, el, ak, gk) {
    const name = el.dataset[ak]; if (!name) return false;
    const fn = window[name]; if (typeof fn !== 'function') return false;
    let args; try { args = el.dataset[gk] ? JSON.parse(el.dataset[gk]) : []; } catch (_) { return false; }
    const ev = new Proxy(e, { get(t, k) { if (k === 'currentTarget') return el; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
    const r = fn.apply(el, args.map(function (a) { return a === '$this' ? el : a === '$event' ? ev : a === '$value' ? el.value : a === '$checked' ? el.checked : a; }));
    if (r === false) e.preventDefault();
    return true;
  }
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.click);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.submit);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.input);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.change);

})();
