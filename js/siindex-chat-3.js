
// SIINDEX Citizen Voice Core adapter — replaces the retired public chat endpoint.
(function () {
  const coreRows = new Map();

  function updateAssistant(detail) {
    let record = coreRows.get(detail.id);
    if (!record) {
      const created = createSIBubble();
      record = created;
      coreRows.set(detail.id, record);
    }
    record.bubbleEl.innerHTML = formatSI(detail.text);
    if (!detail.streaming) {
      record.timeEl.textContent = now();
      attachCopyBtn(record.rowEl);
    }
    scroll();
  }

  window.addEventListener('siindex:message', event => {
    const detail = event.detail || {};
    if (detail.source !== 'chat-page') return;
    if (detail.role === 'user') {
      addUserMsg(detail.text);
    } else {
      hideTyping();
      updateAssistant(detail);
    }
  });

  window.addEventListener('siindex:status', event => {
    const detail = event.detail || {};
    const status = document.getElementById('chatVoiceStatus');
    const mic = document.getElementById('chatMicBtn');
    if (status) status.textContent = detail.text || 'Ready.';
    if (mic) {
      const live = detail.state === 'listening';
      mic.setAttribute('aria-pressed', live ? 'true' : 'false');
      mic.style.background = live ? 'var(--red)' : '';
    }
  });

  handleSend = function () {
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    if (!text || !window.SIINDEXVoice) return;
    input.value = '';
    const chips = document.getElementById('promptsRow');
    if (chips) chips.remove();
    document.querySelectorAll('.si-followup-row').forEach(el => el.remove());
    showTyping();
    window.SIINDEXVoice.ask(text, { source: 'chat-page' });
  };

  window.startChatVoice = function () {
    if (window.SIINDEXVoice) window.SIINDEXVoice.listen({ source: 'chat-page' });
  };

  toggleVoice = function () {
    if (!window.SIINDEXVoice) return;
    window.SIINDEXVoice.setVoiceEnabled(!window.SIINDEXVoice.voiceEnabled);
    voiceOn = window.SIINDEXVoice.voiceEnabled;
    const button = document.getElementById('voiceBtn');
    button.textContent = voiceOn ? '🔊 Voice' : '🔇 Voice';
    button.classList.toggle('active', voiceOn);
  };

  voiceOn = window.SIINDEXVoice ? window.SIINDEXVoice.voiceEnabled : false;
  const voiceButton = document.getElementById('voiceBtn');
  if (voiceButton) {
    voiceButton.textContent = voiceOn ? '🔊 Voice' : '🔇 Voice';
    voiceButton.classList.toggle('active', voiceOn);
  }
})();

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { this.style.display='none';this.parentElement.textContent='SI'; }
function h_2(event) { exportChat();closeBmOverlay(); }
function h_3(event) { if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();handleSend();}; }
function h_4(event, __p0) { deleteBookmark(__p0); }


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
    }, { capture: true, passive: false }); })(EV.error);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.click);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.keydown);
  // Images that failed before this script ran miss the native error event: replay it once.
  document.querySelectorAll('img[data-error-action]').forEach(function (img) { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) img.dispatchEvent(new Event('error')); });
})();
