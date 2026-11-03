
const INDX_PRICE = 0.24;
let currentStep = 0;
let amountStr = '';
let merchantName = '';
let fromName = '';
let earnedIndx = 0;

const INDX_PRICE_USD = 0.24;

// Read URL params
const params = new URLSearchParams(window.location.search);
fromName = params.get('from') || '';
const isDemo = params.get('demo') === '1';

// Personalise welcome
if (fromName) {
  const cap = fromName.charAt(0).toUpperCase() + fromName.slice(1);
  document.getElementById('welcomeFrom').textContent = cap + ' wants to pay you via IN$DEX';
  document.getElementById('customerLabel').textContent = cap;
}

// ── F4: Auto-fill from sessionStorage ───────────────────────────
(function autoFill() {
  const savedName = localStorage.getItem('indx_epos_merchant_name') || sessionStorage.getItem('citizen_name') || '';
  const savedDomain = localStorage.getItem('indx_epos_merchant_domain') || sessionStorage.getItem('citizen_web3_domain') || '';
  const savedPhone = localStorage.getItem('indx_epos_merchant_phone') || '';
  if (savedName) {
    const nameEl = document.getElementById('merchantName');
    if (nameEl) nameEl.value = savedName;
  }
  if (savedDomain) {
    const domEl = document.getElementById('merchantDomain');
    if (domEl) domEl.value = savedDomain;
  }
  if (savedPhone) {
    const phoneEl = document.getElementById('merchantPhone');
    if (phoneEl) phoneEl.value = savedPhone;
  }
  // If all pre-filled, skip to step 2
  if (savedName && savedPhone) {
    merchantName = savedName;
    setTimeout(() => goStep(2), 0);
  }
})();

// ── F1: Quick amount presets with frequency tracking ─────────────
const freqAmounts = JSON.parse(localStorage.getItem('indx_epos_freq_amounts') || '{}');

function setPreset(amount) {
  amountStr = amount.toString();
  updateAmountDisplay();
  // Track frequency
  freqAmounts[amount] = (freqAmounts[amount] || 0) + 1;
  localStorage.setItem('indx_epos_freq_amounts', JSON.stringify(freqAmounts));
  renderPresets();
}

function renderPresets() {
  // Mark the top 2 most-used as "frequent"
  const sorted = Object.entries(freqAmounts).sort((a,b) => b[1]-a[1]).slice(0,2).map(e => parseFloat(e[0]));
  document.querySelectorAll('.preset-chip').forEach(chip => {
    const val = parseFloat(chip.textContent.replace('$',''));
    chip.classList.toggle('frequent', sorted.includes(val));
  });
}
renderPresets();

// ── F2: Transaction history persistence ─────────────────────────
const eposTxHistory = JSON.parse(localStorage.getItem('indx_epos_tx_history') || '[]');

function saveTransaction(usdAmt, indxAmt) {
  eposTxHistory.unshift({
    usd: usdAmt,
    indx: indxAmt,
    ts: Date.now(),
    merchant: merchantName || localStorage.getItem('indx_epos_merchant_name') || 'Merchant'
  });
  localStorage.setItem('indx_epos_tx_history', JSON.stringify(eposTxHistory.slice(0,20)));
  // Track for presets
  freqAmounts[usdAmt] = (freqAmounts[usdAmt] || 0) + 1;
  localStorage.setItem('indx_epos_freq_amounts', JSON.stringify(freqAmounts));
  renderPresets();
}

function openHistorySheet() {
  const list = document.getElementById('hsList');
  const sub = document.getElementById('hsSubLabel');
  if (eposTxHistory.length === 0) {
    list.innerHTML = '<div class="hs-empty">No transactions yet. Accept your first payment.</div>';
    sub.textContent = 'No transactions yet';
  } else {
    sub.textContent = eposTxHistory.length + ' transaction' + (eposTxHistory.length === 1 ? '' : 's');
    list.innerHTML = eposTxHistory.map(tx => {
      const d = new Date(tx.ts);
      const timeStr = d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      return `<div class="hs-item">
        <div class="hs-icon">💰</div>
        <div class="hs-info">
          <div class="hs-amt">+$${parseFloat(tx.usd).toFixed(2)} received</div>
          <div class="hs-detail">${parseFloat(tx.indx).toFixed(2)} INDX · 98/2 Law applied</div>
        </div>
        <div class="hs-time">${timeStr}</div>
      </div>`;
    }).join('');
  }
  document.getElementById('historyOverlay').classList.add('open');
  document.getElementById('historySheet').classList.add('open');
}

function closeHistorySheet() {
  document.getElementById('historyOverlay').classList.remove('open');
  document.getElementById('historySheet').classList.remove('open');
}

function goStep(n) {
  document.querySelectorAll('.screen').forEach((s,i) => {
    s.classList.toggle('active', i === n);
  });
  document.querySelectorAll('.step-dot').forEach((d,i) => {
    d.classList.remove('active','done');
    if (i === n) d.classList.add('active');
    else if (i < n) d.classList.add('done');
  });
  currentStep = n;

  if (n === 2) {
    document.getElementById('topbarTitle').textContent = 'Enter Amount';
    document.getElementById('topbarBadge').textContent = 'ePOS Active';
  } else if (n === 3) {
    document.getElementById('topbarTitle').textContent = 'Invoice QR';
    document.getElementById('topbarBadge').textContent = 'Awaiting Payment';
    startPaymentTimer();
  } else if (n === 4) {
    document.getElementById('topbarTitle').textContent = 'Payment Received';
    document.getElementById('topbarBadge').textContent = '✓ Confirmed';
  }
}

function activateTerminal() {
  merchantName = document.getElementById('merchantName').value.trim() || 'your business';
  const phone = document.getElementById('merchantPhone').value.trim();

  if (!merchantName || merchantName === 'your business') {
    showToast('Enter your name or business name to continue');
    return;
  }
  if (!phone) {
    showToast('Enter your mobile number to continue');
    return;
  }

  showToast('⚡ Activating your terminal...');
  const domainInput = document.getElementById('merchantDomain');
  if (!domainInput.value) {
    const slug = merchantName.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,12);
    domainInput.value = slug + '.IN$DEX';
  }

  // Store in session
  sessionStorage.setItem('merchant_name', merchantName);
  sessionStorage.setItem('merchant_domain', domainInput.value.toLowerCase());
  // F4: persist for auto-fill
  localStorage.setItem('indx_epos_merchant_name', merchantName);
  localStorage.setItem('indx_epos_merchant_domain', domainInput.value.toLowerCase());
  const phoneVal = document.getElementById('merchantPhone').value.trim();
  if (phoneVal) localStorage.setItem('indx_epos_merchant_phone', phoneVal);

  setTimeout(() => {
    showToast('✅ Terminal activated! You\'re ready to accept payments.');
    setTimeout(() => goStep(2), 800);
  }, 1200);
}

// NUMPAD
function numPress(v) {
  if (amountStr === '0') amountStr = '';
  if (amountStr.includes('.') && amountStr.split('.')[1].length >= 2) return;
  if (amountStr.length >= 7) return;
  amountStr += v;
  updateAmountDisplay();
}

function numBack() {
  amountStr = amountStr.slice(0,-1);
  updateAmountDisplay();
}

function numClear() {
  amountStr = '';
  updateAmountDisplay();
}

function updateAmountDisplay() {
  const val = amountStr || '0';
  document.getElementById('amountDisplay').textContent = val;
  const usdAmt = parseFloat(val) || 0;
  const indxAmt = usdAmt / INDX_PRICE;
  document.getElementById('amountIndx').textContent = '≈ ' + indxAmt.toFixed(2) + ' INDX';
  document.getElementById('chargeBtn').disabled = usdAmt <= 0;
}

function generateInvoice() {
  const usdAmt = parseFloat(amountStr) || 0;
  if (usdAmt <= 0) {
    // F3: Shake animation
    const dispEl = document.querySelector('.amount-display');
    if (dispEl) { dispEl.classList.add('shake'); setTimeout(() => dispEl.classList.remove('shake'), 400); }
    showToast('Enter an amount first');
    return;
  }

  const indxAmt = usdAmt / INDX_PRICE;
  document.getElementById('invoiceAmount').textContent = '$' + usdAmt.toFixed(2);
  document.getElementById('invoiceIndx').textContent = '≈ ' + indxAmt.toFixed(2) + ' INDX';

  const domain = sessionStorage.getItem('merchant_domain') || (merchantName.toLowerCase().replace(/[^a-z0-9]/g,'') + '.IN$DEX');
  document.getElementById('qrDomainLabel').textContent = domain;

  earnedIndx = indxAmt * 0.98; // 98/2 law
  goStep(3);
}

let paymentTimer;
function startPaymentTimer() {
  clearTimeout(paymentTimer);
  // Demo: auto-complete after 3.5 seconds
  paymentTimer = setTimeout(confirmPayment, 3500);
}

function confirmPayment() {
  const usdAmt = parseFloat(amountStr) || 0;
  const received98 = (usdAmt * 0.98).toFixed(2);
  const totalIndx = (earnedIndx).toFixed(2);
  const totalBalIndx = (parseFloat(sessionStorage.getItem('merchant_balance') || '0') + earnedIndx).toFixed(2);

  document.getElementById('confirmedAmount').textContent = '$' + received98;
  document.getElementById('confirmedIndx').textContent = totalIndx + ' INDX credited to your wallet';
  document.getElementById('confirmedBalance').textContent = totalBalIndx + ' INDX';
  document.getElementById('confirmedBalUsd').textContent = '≈ $' + (parseFloat(totalBalIndx) * INDX_PRICE).toFixed(2) + ' USD';

  const isFirst = !sessionStorage.getItem('merchant_first_payment');
  if (isFirst) {
    sessionStorage.setItem('merchant_first_payment', '1');
    document.getElementById('confirmedMsg').textContent = 'This is a simulated payment — no real payment rail is connected yet, so nothing actually moved. Once IN$DEX launches, your phone becomes a real sovereign payment terminal.';
  } else {
    const cname = fromName ? (fromName.charAt(0).toUpperCase() + fromName.slice(1)) : 'Your customer';
    document.getElementById('confirmedMsg').textContent = 'Simulated: ' + cname + '\'s payment would arrive in full, with 2% to the Civilisation Fund — but no real payment rail is connected yet, so nothing actually moved.';
  }

  sessionStorage.setItem('merchant_balance', totalBalIndx);
  saveTransaction(usdAmt, totalIndx);
  goStep(4);
}

function goToDashboard() {
  // If they already have a citizen session, go to dashboard; otherwise go to biometric KYC
  if (sessionStorage.getItem('citizen_id')) {
    window.location.href = 'citizen-dashboard.html';
  } else {
    window.location.href = 'biometric-kyc.html?source=epos&merchant=1';
  }
}

function acceptAnother() {
  amountStr = '';
  updateAmountDisplay();
  goStep(2);
}

function handleBack() {
  if (currentStep > 0 && currentStep < 4) {
    goStep(currentStep - 1);
  } else {
    history.back();
  }
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── ONBOARD THIS CUSTOMER ─────────────────────────────────────────
const _merchantSlug = (sessionStorage.getItem('citizen_name') || 'merchant').toLowerCase().replace(/\s+/g,'');
const _onboardUrl = 'https://imagenationdex.com/join-chooser.html?ref=' + _merchantSlug + '.indx';

function openOnboardSheet() {
  document.getElementById('onboardOverlay').classList.add('show');
  document.getElementById('onboardSheet').classList.add('show');
  // Generate QR if not yet done
  const wrap = document.getElementById('osQrCanvas');
  if (!wrap.querySelector('canvas') && !wrap.querySelector('img')) {
    if (window.QRCode) {
      new QRCode(wrap, { text: _onboardUrl, width: 200, height: 200, colorDark:'#000', colorLight:'#fff', correctLevel: QRCode.CorrectLevel.H });
    }
  }
  document.getElementById('osLinkUrl').textContent = _onboardUrl;
}

function closeOnboardSheet() {
  document.getElementById('onboardOverlay').classList.remove('show');
  document.getElementById('onboardSheet').classList.remove('show');
}

function copyOnboardLink() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(_onboardUrl).then(() => showToast('✓ Onboard link copied'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = _onboardUrl; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('✓ Link copied');
  }
}

function onboardWhatsApp() {
  const msg = 'Join me on IN\$DEX — your sovereign wallet with just your phone number. No bank needed. Tap here: ' + _onboardUrl;
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}

function onboardSMS() {
  const msg = 'Join me on IN\$DEX — sovereign wallet with just your phone number, no bank needed: ' + _onboardUrl;
  window.location.href = 'sms:?body=' + encodeURIComponent(msg);
}

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { this.value=this.value.toLowerCase(); }


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
    }, { capture: true, passive: false }); })(EV.input);

})();
