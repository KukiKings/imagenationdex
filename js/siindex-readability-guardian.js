
  // AUDIT 2026-08-29: removed unused `const INDX_PRICE_USD = 0.24;` — a hardcoded fixed
  // USD price for INDX with no live price feed and no display consumer anywhere in this
  // file. Dead-code landmine: harmless while unreferenced, but ready to render a fabricated
  // "live" price if a future edit wires it into the UI. INDX has no fixed USD price.

  // ── FEATURE 1: 10-POINT AUDIT ──
  const AUDIT_ITEMS = [
    'Is every word easy to read?',
    'Is the main action obvious?',
    'Is the text large enough on a phone?',
    'Does the color contrast feel strong?',
    'Does the background make text easier — not harder — to read?',
    'Are warnings shown in plain language with a clear fix?',
    'Are buttons labeled with clear action words?',
    'Does SIINDEX explain the screen to the citizen?',
    'Does the screen work for low-vision citizens?',
    'Does the screen reduce confusion — not add to it?',
  ];

  let _auditState = Array(10).fill(null); // null = untouched, true = pass, false = fail

  function renderAudit() {
    const el = document.getElementById('auditChecklist');
    el.innerHTML = AUDIT_ITEMS.map((q, i) => {
      const s = _auditState[i];
      const cls = s === true ? 'pass' : s === false ? 'fail' : '';
      const icon = s === true ? '✓' : s === false ? '✕' : '?';
      // GOD MODE PATCH: keyboard + ARIA support on the checklist toggle
      return `<div class="checklist-item">
        <div class="check-toggle ${cls}" tabindex="0" role="checkbox" aria-checked="${s === true ? 'true' : s === false ? 'false' : 'mixed'}" data-action="h_2" data-args="${JSON.stringify(["$event",i]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" data-keydown-action="handleKeyActivate" data-keydown-args="[&quot;$event&quot;]">${icon}</div>
        <div class="check-q">${i+1}. ${q}</div>
      </div>`;
    }).join('');
    updateAuditScore();
  }

  function toggleAudit(i) {
    const s = _auditState[i];
    _auditState[i] = s === null ? true : s === true ? false : null;
    renderAudit();
    const screenName = document.getElementById('auditScreenName').value.trim();
    if (screenName) {
      // GOD MODE PATCH: remember last-used screen name for smart-default prefill
      localStorage.setItem('indx_readability_last_screen', screenName);
      const score = _auditState.filter(x => x === true).length;
      const total = _auditState.filter(x => x !== null).length;
      if (score < total) showToast('⚠ ' + (total - score) + ' item' + (total - score === 1 ? '' : 's') + ' need attention.');
    }
  }

  function updateAuditScore() {
    const answered = _auditState.filter(x => x !== null).length;
    const passes = _auditState.filter(x => x === true).length;
    const fails = _auditState.filter(x => x === false).length;
    const score = answered === 0 ? 10 : Math.round((passes / answered) * 10);
    const colors = { 10:'var(--green)', 9:'var(--green)', 8:'var(--cyan)', 7:'var(--gold)', 6:'var(--orange)', 5:'var(--orange)' };
    const color = score >= 8 ? 'var(--green)' : score >= 6 ? 'var(--gold)' : 'var(--red)';
    document.getElementById('auditScore').textContent = passes + ' / ' + (answered || 10);
    document.getElementById('auditScore').style.color = color;
    const v = document.getElementById('auditVerdict');
    if (fails === 0 && answered > 0) { v.textContent = '✓ CLEAR'; v.className = 'audit-verdict pass'; }
    else if (fails > 0 && fails <= 2) { v.textContent = '⚠ REVIEW'; v.className = 'audit-verdict warn'; }
    else if (fails > 2) { v.textContent = '✕ REDESIGN'; v.className = 'audit-verdict fail'; }
    else { v.textContent = 'NOT STARTED'; v.className = 'audit-verdict warn'; }
  }

  function clearAudit() {
    _auditState = Array(10).fill(null);
    document.getElementById('auditScreenName').value = '';
    renderAudit();
    showToast('Audit reset.');
  }

  // ── FEATURE 2: CONTRAST CHECKER ──
  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return null;
    const r = parseInt(clean.slice(0,2),16);
    const g = parseInt(clean.slice(2,4),16);
    const b = parseInt(clean.slice(4,6),16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }

  function relativeLuminance(rgb) {
    const toLinear = c => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
  }

  function contrastRatio(fg, bg) {
    const l1 = relativeLuminance(fg);
    const l2 = relativeLuminance(bg);
    const light = Math.max(l1, l2);
    const dark  = Math.min(l1, l2);
    return (light + 0.05) / (dark + 0.05);
  }

  function updateContrast() {
    const fgHex = document.getElementById('fgHex').value.trim();
    const bgHex = document.getElementById('bgHex').value.trim();
    const fg = hexToRgb(fgHex);
    const bg = hexToRgb(bgHex);
    if (!fg || !bg) return;

    const ratio = contrastRatio(fg, bg);
    const ratioStr = ratio.toFixed(1) + ':1';
    const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'FAIL';
    const gradeColor = ratio >= 4.5 ? 'var(--green)' : ratio >= 3 ? 'var(--gold)' : 'var(--red)';

    document.getElementById('contrastRatio').textContent = ratioStr;
    document.getElementById('contrastRatio').style.color = gradeColor;
    document.getElementById('contrastGrade').textContent = grade;
    document.getElementById('contrastGrade').style.color = gradeColor;

    const preview = document.getElementById('contrastPreview');
    preview.style.background = bgHex;
    document.getElementById('previewText').style.color = fgHex;
    document.getElementById('previewSub').style.color = fgHex;

    document.getElementById('wcagRow').innerHTML = [
      { label:'AA Normal (4.5:1)', pass: ratio >= 4.5 },
      { label:'AA Large (3:1)',    pass: ratio >= 3   },
      { label:'AAA Normal (7:1)', pass: ratio >= 7   },
      { label:'AAA Large (4.5:1)',pass: ratio >= 4.5 },
    ].map(w => `<div class="wcag-chip ${w.pass ? 'pass' : 'fail'}">${w.pass ? '✓' : '✕'} ${w.label}</div>`).join('');
  }

  function syncColor(which, val) {
    document.getElementById(which === 'fg' ? 'fgHex' : 'bgHex').value = val.toUpperCase();
    updateContrast();
    incrementStat('contrast'); // GOD MODE PATCH: session stats
  }

  function syncHex(which, val) {
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      document.getElementById(which === 'fg' ? 'fgSwatch' : 'bgSwatch').value = val;
    }
    updateContrast();
    incrementStat('contrast'); // GOD MODE PATCH: session stats
  }

  function setPreset(fg, bg) {
    document.getElementById('fgHex').value = fg;
    document.getElementById('bgHex').value = bg;
    document.getElementById('fgSwatch').value = fg;
    document.getElementById('bgSwatch').value = bg;
    updateContrast();
    incrementStat('contrast'); // GOD MODE PATCH: session stats
  }

  // ── FEATURE 3: BUTTON LABEL IMPROVER ──
  const LABEL_MAP = {
    'next':     [{ after:'Go to the next step', context:'Wizard / onboarding' }, { after:'Review your details', context:'Before confirmation' }, { after:'Choose your option', context:'Selection flow' }],
    'continue': [{ after:'Keep setting up my account', context:'Account creation' }, { after:'Continue to payment', context:'Checkout flow' }, { after:'Move to the next question', context:'Form wizard' }],
    'submit':   [{ after:'Send my application', context:'Application form' }, { after:'Save this information', context:'Settings form' }, { after:'Submit for review', context:'Approval flow' }],
    'confirm':  [{ after:'Approve this transfer', context:'Finance / send' }, { after:'Confirm my identity', context:'Verification' }, { after:'Yes — publish this', context:'Publishing flow' }],
    'ok':       [{ after:'I understand — continue', context:'Info modal' }, { after:'Got it', context:'Notification' }, { after:'Close this message', context:'Alert' }],
    'done':     [{ after:'Save and finish', context:'Settings / setup' }, { after:'Mark as complete', context:'Task flow' }, { after:'Return to my account', context:'Post-action' }],
    'send':     [{ after:'Send INDX now', context:'Wallet / transfer' }, { after:'Send this message', context:'Messaging' }, { after:'Submit my request', context:'Support / contact' }],
    'pay':      [{ after:'Pay with INDX', context:'Checkout' }, { after:'Approve this payment', context:'Wallet confirmation' }, { after:'Pay and confirm my order', context:'Marketplace' }],
    'sign up':  [{ after:'Create my Grid Account', context:'Onboarding' }, { after:'Join IN$DEX', context:'Marketing page' }, { after:'Start my citizen account', context:'First-time flow' }],
    'login':    [{ after:'Enter my account', context:'Auth screen' }, { after:'Sign in to IN$DEX', context:'Login page' }, { after:'Continue with my passkey', context:'Biometric login' }],
    'delete':   [{ after:'Remove this item', context:'List / file management' }, { after:'Delete my draft', context:'Content creation' }, { after:'Permanently remove', context:'Destructive action' }],
    'edit':     [{ after:'Edit this draft', context:'Content management' }, { after:'Change my details', context:'Profile settings' }, { after:'Update this record', context:'Data management' }],
  };

  function improveLabel(label) {
    if (!label || !label.trim()) return;
    const key = label.trim().toLowerCase();
    const results = LABEL_MAP[key];
    const el = document.getElementById('labelResults');
    if (!results) {
      // Generic improvement: add context words
      const improved = label.trim().charAt(0).toUpperCase() + label.trim().slice(1) + ' my ' + 'account';
      el.innerHTML = `<div class="label-pair">
        <div class="label-before">✕ ${label}</div>
        <div class="label-after">Try: "${label.trim()} my account" or "${label.trim()} this"</div>
        <div class="label-context">Add context: what does the citizen ${label.toLowerCase()}? Name the object.</div>
      </div>`;
    } else {
      el.innerHTML = results.map(r => `
        <div class="label-pair">
          <div class="label-before">✕ "${label.trim()}"</div>
          <div class="label-after">✓ "${r.after}"</div>
          <div class="label-context">${r.context}</div>
        </div>`).join('');
    }
    incrementStat('labels'); // GOD MODE PATCH: session stats
    showToast('✓ ' + (results ? results.length : 1) + ' improved label' + ((results && results.length !== 1) ? 's' : '') + ' ready.');
  }

  // ── FEATURE 4: PROTECTION MODE ──
  let _protMode = false;

  function setProtectionMode(on) {
    _protMode = on;
    document.getElementById('modeStd').classList.toggle('active', !on);
    document.getElementById('modeProt').classList.toggle('active', on);
    document.getElementById('modeCompare').style.display = on ? 'block' : 'none';

    const card = document.getElementById('demoCard');
    const title = document.getElementById('demoTitle');
    const sub = document.getElementById('demoSub');
    const lbl1 = document.getElementById('demoLabel1');
    const help1 = document.getElementById('demoHelp1');
    const lbl2 = document.getElementById('demoLabel2');
    const help2 = document.getElementById('demoHelp2');
    const btn = document.getElementById('demoPrimaryBtn');
    const note = document.getElementById('demoProtNote');

    if (on) {
      card.className = 'demo-card protected';
      title.style.fontSize = '20px';
      sub.style.fontSize = '15px'; sub.style.color = 'var(--text)';
      lbl1.style.fontSize = '16px'; lbl1.textContent = 'How much INDX do you want to send?';
      help1.style.fontSize = '14px'; help1.style.color = 'var(--text2)';
      help1.textContent = 'Check your balance before entering. You have enough INDX to send.';
      lbl2.style.fontSize = '16px'; lbl2.textContent = 'Who are you sending to?';
      help2.style.fontSize = '14px'; help2.style.color = 'var(--text2)';
      help2.textContent = 'Ask SIINDEX to find the citizen by name — or paste their wallet address carefully.';
      btn.style.fontSize = '17px'; btn.style.padding = '18px';
      btn.style.background = 'var(--gold)'; btn.style.color = 'var(--black)';
      btn.textContent = 'Review before sending INDX';
      // GOD MODE PATCH: personalize the protection note with the citizen's name when known
      var citizenName = sessionStorage.getItem('citizen_name');
      document.getElementById('protNoteText').textContent = (citizenName ? citizenName + ', this' : 'This') + ' sends real INDX from your account. Please check the amount and recipient before continuing. If anything looks wrong, tap Cancel.';
      note.style.display = 'block';
      showToast('🛡 Protection Mode active — larger text, slower flow, extra confirmation.');
    } else {
      card.className = 'demo-card standard';
      title.style.fontSize = '';
      sub.style.fontSize = ''; sub.style.color = '';
      lbl1.style.fontSize = ''; lbl1.textContent = 'Amount';
      help1.style.fontSize = ''; help1.style.color = '';
      help1.textContent = 'Enter the amount you want to send.';
      lbl2.style.fontSize = ''; lbl2.textContent = 'Recipient';
      help2.style.fontSize = ''; help2.style.color = '';
      help2.textContent = 'Paste the address or ask SIINDEX to find them.';
      btn.style.fontSize = ''; btn.style.padding = '';
      btn.style.background = 'linear-gradient(135deg,var(--cyan),var(--blue))'; btn.style.color = 'var(--black)';
      btn.textContent = 'Send INDX Now';
      note.style.display = 'none';
    }
  }

  // ── GOD MODE PATCH: SESSION STATS + AUDIT HISTORY + ACCESSIBILITY ──
  function getStats() {
    try { return JSON.parse(localStorage.getItem('indx_readability_stats') || '{}'); } catch(e) { return {}; }
  }
  function saveStats(s) {
    localStorage.setItem('indx_readability_stats', JSON.stringify(s));
  }
  function incrementStat(key) {
    const s = getStats();
    s[key] = (s[key] || 0) + 1;
    saveStats(s);
    renderStatsBar();
  }
  function renderStatsBar() {
    const s = getStats();
    const el = document.getElementById('rgStatsBar');
    if (!el) return;
    el.innerHTML = [
      { v: s.audits || 0, l: 'Audits Saved' },
      { v: s.labels || 0, l: 'Labels Improved' },
      { v: s.contrast || 0, l: 'Contrast Checks' },
    ].map(x => `<div class="rg-stat"><div class="rg-stat-val">${x.v}</div><div class="rg-stat-lbl">${x.l}</div></div>`).join('');
  }

  function getAuditLog() {
    try { return JSON.parse(localStorage.getItem('indx_readability_audit_log') || '[]'); } catch(e) { return []; }
  }
  function saveAuditResult() {
    const screen = document.getElementById('auditScreenName').value.trim();
    const answered = _auditState.filter(x => x !== null).length;
    if (!screen) { showToast('Name the screen before saving.'); return; }
    if (answered === 0) { showToast('Mark at least one item first.'); return; }
    const passes = _auditState.filter(x => x === true).length;
    const log = getAuditLog();
    log.unshift({ screen, state: _auditState.slice(), score: passes, total: answered, ts: Date.now() });
    localStorage.setItem('indx_readability_audit_log', JSON.stringify(log.slice(0, 12)));
    localStorage.setItem('indx_readability_last_screen', screen);
    incrementStat('audits');
    renderAuditHistory();
    showToast('✓ Saved audit for ' + screen + '.');
  }
  function loadAuditEntry(i) {
    const log = getAuditLog();
    const entry = log[i];
    if (!entry) return;
    _auditState = entry.state.slice();
    document.getElementById('auditScreenName').value = entry.screen;
    renderAudit();
    showToast('Loaded saved audit for ' + entry.screen + '.');
  }
  function clearAuditHistory() {
    localStorage.removeItem('indx_readability_audit_log');
    renderAuditHistory();
    showToast('Saved audits cleared.');
  }
  function renderAuditHistory() {
    const el = document.getElementById('auditHistoryList');
    if (!el) return;
    const log = getAuditLog();
    if (!log.length) { el.innerHTML = '<div class="audit-history-empty">No saved audits yet — save one above.</div>'; return; }
    el.innerHTML = log.map((e, i) => {
      const color = e.score === e.total ? 'var(--green)' : (e.total - e.score) <= 2 ? 'var(--gold)' : 'var(--red)';
      const when = new Date(e.ts).toLocaleDateString('en-AU', { day:'numeric', month:'short' });
      return `<div class="audit-history-item" tabindex="0" role="button" data-action="h_3" data-args="${JSON.stringify(["$event",i]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" data-keydown-action="handleKeyActivate" data-keydown-args="[&quot;$event&quot;]">
        <div>
          <div class="audit-history-name">${e.screen}</div>
          <div class="audit-history-meta">${when}</div>
        </div>
        <div class="audit-history-score" style="color:${color}">${e.score}/${e.total}</div>
      </div>`;
    }).join('');
  }

  function handleKeyActivate(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); }
  }

  // ── TOAST ──
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
  }

  // ── INIT ──
  window.addEventListener('DOMContentLoaded', () => {
    renderAudit();
    updateContrast();

    // GOD MODE PATCH: smart defaults + stats/history render + keyboard support
    const lastScreen = localStorage.getItem('indx_readability_last_screen');
    if (lastScreen) document.getElementById('auditScreenName').value = lastScreen;
    renderStatsBar();
    renderAuditHistory();
    document.querySelectorAll('.vague-chip, .mode-sw-btn').forEach(el => {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('keydown', handleKeyActivate);
    });
  });

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { improveLabel(document.getElementById('customLabelInput').value); }
function h_2(event, __p0) { toggleAudit(__p0); }
function h_3(event, __p0) { loadAuditEntry(__p0); }


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
    }, { capture: true, passive: false }); })(EV.keydown);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.input);

})();
