
const SUPABASE_URL      = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const citizenId   = sessionStorage.getItem('citizen_id');
const citizenName = sessionStorage.getItem('citizen_name');

// FIXED 2026-09-10 (screen audit): CONTACTS used to be 4 hardcoded demo names (Jake Nuku,
// Ana Reyes, Sione Fale, Maria Lima) rendered under "Recent" and marked "✓ Verified" on match
// or on any typed string over 5 chars — none of that was ever checked against a real citizen.
// Same class of issue already fixed in remittance.html ("recipients are rendered only from
// what this citizen has actually saved") and qr-scanner.html (FIX 2026-08-30, dropped the fake
// "✓ Verified" badge — "recipient is checked when you tap Send"). Recent contacts now come only
// from this citizen's own real send history (logPayment(), written after a real transfer_indx
// call), and unmatched input is shown as unverified rather than falsely "Verified".
const RECENT_COLORS = ['linear-gradient(135deg,#0099BB,#00D4FF)','linear-gradient(135deg,#8B5CF6,#2563EB)','linear-gradient(135deg,#FFD700,#FFA500)','linear-gradient(135deg,#2ECC71,#16A34A)'];
function getRecentRecipients() {
  let h = [];
  try { h = JSON.parse(localStorage.getItem('indx_pay_hist') || '[]'); } catch(e) {}
  const seen = new Set(), out = [];
  for (const p of h) {
    if (seen.has(p.domain)) continue;
    seen.add(p.domain);
    out.push(p);
    if (out.length >= 4) break;
  }
  return out;
}

const INDX_PRICE_USD = 0.24;
let requestVal = '0';
let recipientFound = false;
let recurringOn = false;
let recurFreq = 'Daily';

// ── RECURRING TOGGLE ──────────────────────────────────────────────────
function toggleRecurring() {
  recurringOn = !recurringOn;
  const pill = document.getElementById('recurToggle');
  const freqs = document.getElementById('recurFreqs');
  const sub   = document.getElementById('recurSub');
  pill.classList.toggle('on', recurringOn);
  freqs.classList.toggle('show', recurringOn);
  sub.textContent = recurringOn ? 'Recurring · ' + recurFreq : 'One-time payment';
  const btn = document.getElementById('sendBtn');
  if (btn && !btn.disabled) {
    btn.textContent = recurringOn ? 'Schedule Recurring →' : 'Send Payment →';
  }
}
function selectFreq(el, freq) {
  document.querySelectorAll('.rf-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  recurFreq = freq;
  document.getElementById('recurSub').textContent = 'Recurring · ' + freq;
}

// ── CONTACT SEARCH ────────────────────────────────────────────────────
function filterContacts(q) {
  const ql = q.trim().toLowerCase();
  const all = getRecentRecipients();
  const filtered = !ql ? all : all.filter(c =>
    c.name.toLowerCase().includes(ql) || c.domain.toLowerCase().includes(ql)
  );
  document.getElementById('recentContacts').innerHTML = filtered.map((c,i) => `
    <div class="recent-item" data-action="h_9" data-args="${JSON.stringify(["$event",c.domain,c.name]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
      <div class="ri-avatar" style="background:${RECENT_COLORS[i % RECENT_COLORS.length]}">${c.name[0]}</div>
      <div class="ri-body">
        <div class="ri-name">${c.name}</div>
        <div class="ri-domain">${c.domain}.IN$DEX</div>
      </div>
      <div class="ri-action">Send →</div>
    </div>
  `).join('') || '<div style="padding:14px;font-size:13px;color:var(--text-muted);">No contacts found</div>';
}

// ── PAYMENT HISTORY ───────────────────────────────────────────────────
function logPayment(name, domain, amt) {
  let h = JSON.parse(localStorage.getItem('indx_pay_hist') || '[]');
  h.unshift({ name, domain, amt, ts: Date.now() });
  localStorage.setItem('indx_pay_hist', JSON.stringify(h.slice(0, 15)));
  renderPayHistory();
}
function renderPayHistory() {
  const h = JSON.parse(localStorage.getItem('indx_pay_hist') || '[]');
  const section = document.getElementById('payHistSection');
  const list = document.getElementById('payHistList');
  if (!h.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = h.slice(0, 5).map(p => {
    const d = new Date(p.ts);
    const label = d.toLocaleDateString('en-AU', { day:'numeric', month:'short' }) + ' · ' + d.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' });
    return `<div class="pay-hist-item">
      <div class="phi-avatar">${p.name[0]}</div>
      <div class="phi-body">
        <div class="phi-name">${p.name}</div>
        <div class="phi-time">${label}</div>
      </div>
      <div class="phi-amt">-${p.amt} INDX</div>
    </div>`;
  }).join('');
}

// ── PAYMENT CONFIRM SHEET ─────────────────────────────────────────────
function openPayConfirm() {
  const amt    = parseFloat(document.getElementById('sendAmount').value) || 0;
  const name   = document.getElementById('rpName').textContent;
  const domain = document.getElementById('rpDomain').textContent.split('.IN$DEX')[0];
  const note   = document.getElementById('sendNote').value.trim();
  const fee    = amt * 0.02;
  const recv   = amt * 0.98;
  const usdAmt = (amt * INDX_PRICE_USD).toFixed(2);
  const bankFee = (amt * INDX_PRICE_USD * 0.065).toFixed(2); // ~6.5% typical bank fee
  document.getElementById('pcsFrom').textContent = amt + ' INDX  ≈ $' + usdAmt;
  document.getElementById('pcsTo').textContent = name + ' receives ' + recv.toFixed(3) + ' INDX';
  document.getElementById('pcsRows').innerHTML = `
    <div class="pcs-row"><span class="pcs-label">To</span><span class="pcs-val">${name} · ${domain}.IN$DEX</span></div>
    <div class="pcs-row"><span class="pcs-label">Civilisation Fund (2%)</span><span class="pcs-val">${fee.toFixed(4)} INDX</span></div>
    <div class="pcs-row"><span class="pcs-label">Network Fee</span><span class="pcs-val" style="color:var(--green)">~$0.00025</span></div>
    ${note ? '<div class="pcs-row"><span class="pcs-label">Note</span><span class="pcs-val" style="font-style:italic;">' + note + '</span></div>' : ''}
    ${recurringOn ? '<div class="pcs-row"><span class="pcs-label">Recurring</span><span class="pcs-val" style="color:var(--cyan)">Every ' + recurFreq + '</span></div>' : ''}
  `;
  document.getElementById('pcsSavings').textContent = '💚 Saves ~$' + bankFee + ' vs bank wire — 98% stays with the recipient';
  document.getElementById('payOverlay').classList.add('open');
  document.getElementById('payConfirmSheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closePayConfirm() {
  document.getElementById('payOverlay').classList.remove('open');
  document.getElementById('payConfirmSheet').classList.remove('open');
  document.body.style.overflow = '';
}
// Renamed original confirmSend → executePayment, openPayConfirm now gates it
async function executePayment() {
  closePayConfirm();
  const amt    = parseFloat(document.getElementById('sendAmount').value) || 0;
  const name   = document.getElementById('rpName').textContent;
  const domain = document.getElementById('rpDomain').textContent.split('.IN$DEX')[0];
  const note   = document.getElementById('sendNote').value.trim();
  const btn    = document.getElementById('sendBtn');

  if (!citizenId) {
    // No citizen session — forward to onboarding instead of faking a transfer
    // that never happened (same convention as pay.html's joinAndPay()).
    const dest = new URL('onboarding-flow.html', window.location.href);
    dest.searchParams.set('after_join', 'sovereignpay.html');
    window.location.href = dest.toString();
    return;
  }

  btn.textContent = 'Sending…'; btn.disabled = true;
  try {
    const cleanDomain = domain.toLowerCase().replace(/\.indx$/i, '') + '.IN$DEX';
    const rpcArgs = {
      p_sender_id:          citizenId,
      p_recipient_address:  cleanDomain,
      p_amount:             amt,
      p_note:               note || null
    };
    const { data, error } = await sb.rpc('transfer_indx', rpcArgs);
    if (error) throw error;
    // Approval Gateway: must be checked before the generic failure branch below —
    // see comment on #gateOverlay above.
    if (data && data.pending_approval) {
      _lastSendArgs = { rpcArgs, name, domain };
      btn.textContent = 'Send Payment →'; btn.disabled = false;
      await showTransferGate(data.intent_id);
      return;
    }
    if (data && !data.success) throw new Error(data.error || data.message || 'Transfer failed');
    showPaymentSuccess(data, name, domain, amt);
  } catch(e) {
    showToast('❌ ' + (e.message || 'Transfer failed. Try again.'));
  } finally {
    btn.textContent = 'Send Payment →'; btn.disabled = false;
    updateSendBtn();
  }
}

function showPaymentSuccess(data, name, domain, amt) {
  if (data && data.new_balance !== undefined) {
    sessionStorage.setItem('citizen_balance', data.new_balance);
    const balEl = document.querySelector('.br-val');
    if (balEl) balEl.textContent = parseFloat(data.new_balance).toFixed(2) + ' INDX';
  }
  logPayment(name, domain, amt);
  // Real transaction id from transfer_indx — never a fabricated hash.
  const txRef = data && data.tx_id ? String(data.tx_id) : null;
  document.getElementById('successTitle').textContent = 'Sent!';
  document.getElementById('successSub').textContent = amt + ' INDX sent to ' + name + '. Sent instantly. Zero bank needed.';
  document.getElementById('successTx').textContent = txRef ? (txRef.slice(0,4) + '…' + txRef.slice(-4)) : '—';
  document.getElementById('successOverlay').classList.add('active');
}

// ── Approval Gateway sheet — see comment above #gateOverlay ──
let _lastSendArgs = null;

async function showTransferGate(intentId) {
  let cardData = null;
  try {
    const { data } = await sb.rpc('get_action_intent_card', { p_intent_id: intentId });
    cardData = data;
  } catch (e) {}
  document.getElementById('gateText').textContent =
    (cardData && !cardData.error && cardData.data_involved) ? cardData.data_involved
      : 'This transfer needs your explicit approval before it can complete.';
  document.getElementById('gateApproveBtn').dataset.intentId = intentId;
  document.getElementById('gateOverlay').classList.add('open');
  document.getElementById('gateSheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGateSheet() {
  document.getElementById('gateOverlay').classList.remove('open');
  document.getElementById('gateSheet').classList.remove('open');
  document.body.style.overflow = '';
}

async function approveGateAndResend() {
  const gbtn = document.getElementById('gateApproveBtn');
  const intentId = gbtn.dataset.intentId;
  gbtn.disabled = true; gbtn.textContent = 'Approving…';
  try {
    const { data: grant } = await sb.rpc('grant_intent_approval', { p_intent_id: intentId, p_level: 1, p_method: 'citizen_app_confirm' });
    if (!grant || !grant.success) throw new Error('Approval could not be recorded.');
    closeGateSheet();
    if (_lastSendArgs) {
      // Re-run the identical transfer_indx call — the terms-hash match clears
      // the gate server-side and the transfer executes for real this time.
      const btn = document.getElementById('sendBtn');
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const { data, error } = await sb.rpc('transfer_indx', _lastSendArgs.rpcArgs);
        if (error) throw error;
        if (!data || data.success === false) throw new Error((data && (data.error || data.message)) || 'Transfer failed — nothing was sent.');
        showPaymentSuccess(data, _lastSendArgs.name, _lastSendArgs.domain, _lastSendArgs.rpcArgs.p_amount);
      } catch (e) {
        showToast('❌ ' + (e.message || 'Transfer failed. Try again.'));
      } finally {
        btn.disabled = false; btn.textContent = 'Send Payment →';
        updateSendBtn();
      }
    }
  } catch (e) {
    showToast(e.message || 'Approval failed. Try again.');
  } finally {
    gbtn.disabled = false; gbtn.textContent = 'Approve & Send';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Load balance from session
  const bal = parseFloat(sessionStorage.getItem('citizen_balance') || '50');
  const balEl = document.querySelector('.br-val');
  const balUsdEl = document.querySelector('.br-usd');
  if (balEl) balEl.textContent = bal.toLocaleString(undefined, {maximumFractionDigits:2}) + ' INDX';
  if (balUsdEl) balUsdEl.textContent = '≈ $' + (bal * INDX_PRICE_USD).toFixed(2) + ' USD';

  renderRecent();
  renderPayHistory();
  // Pre-fill from QR scanner redirect: ?to=username&amount=X&note=Y
  const params = new URLSearchParams(window.location.search);
  const toParam = params.get('to');
  const amtParam = params.get('amount');
  const noteParam = params.get('note');
  if (toParam) {
    const domain = toParam.replace(/\.IN\$DEX$/i, '').toLowerCase();
    fillRecipient(domain, domain.charAt(0).toUpperCase() + domain.slice(1));
    // activate send tab
    document.querySelectorAll('.mode-tab')[0].click();
  }
  if (amtParam) {
    const input = document.getElementById('sendAmount');
    if (input) { input.value = parseFloat(amtParam) || ''; calcSendUSD(); }
  }
  if (noteParam) {
    const noteEl = document.getElementById('noteInput');
    if (noteEl) noteEl.value = decodeURIComponent(noteParam);
  }
  // Clean URL without reload
  if (toParam || amtParam) {
    window.history.replaceState({}, '', window.location.pathname);
  }
});

function renderRecent() {
  const list = getRecentRecipients();
  const el = document.getElementById('recentContacts');
  if (!list.length) {
    el.innerHTML = '<div style="padding:14px;font-size:13px;color:var(--text-muted);">No recent contacts yet — send your first payment to save one here.</div>';
    return;
  }
  el.innerHTML = list.map((c,i) => `
    <div class="recent-item" data-action="h_9" data-args="${JSON.stringify(["$event",c.domain,c.name]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
      <div class="ri-avatar" style="background:${RECENT_COLORS[i % RECENT_COLORS.length]}">${c.name[0]}</div>
      <div class="ri-body">
        <div class="ri-name">${c.name}</div>
        <div class="ri-domain">${c.domain}.IN$DEX</div>
      </div>
      <div class="ri-action">Send →</div>
    </div>
  `).join('');
}

function setMode(el, mode) {
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel' + mode.charAt(0).toUpperCase() + mode.slice(1)).classList.add('active');
}

// ── SEND ──
let lookupTimer;
function lookupRecipient(val) {
  const preview = document.getElementById('recipientPreview');
  clearTimeout(lookupTimer);
  if (!val.includes('.') && val.length < 3) { preview.classList.remove('visible'); recipientFound = false; updateSendBtn(); return; }
  lookupTimer = setTimeout(() => {
    const slug = val.replace('.IN$DEX','').replace('.insdex','').toLowerCase();
    const contact = getRecentRecipients().find(c => c.domain.includes(slug) || slug.includes(c.domain));
    if (contact || val.length > 5) {
      const name = contact?.name || (slug.charAt(0).toUpperCase() + slug.slice(1));
      const domain = contact?.domain || slug;
      document.getElementById('rpAvatar').textContent = name[0];
      document.getElementById('rpName').textContent = name;
      // Only a match against this citizen's own real send history counts as known — anything
      // else is unverified client-side; transfer_indx is the real check, at send time.
      document.getElementById('rpDomain').textContent = domain + '.IN$DEX · ' + (contact ? '✓ Sent before' : 'unverified — checked when you send');
      preview.classList.add('visible');
      recipientFound = true;
    } else {
      preview.classList.remove('visible');
      recipientFound = false;
    }
    updateSendBtn();
  }, 500);
}

function fillRecipient(domain, name, statusLabel) {
  document.getElementById('recipientInput').value = domain + '.IN$DEX';
  document.getElementById('rpAvatar').textContent = name[0];
  document.getElementById('rpName').textContent = name;
  document.getElementById('rpDomain').textContent = domain + '.IN$DEX · ' + (statusLabel || 'unverified — checked when you send');
  document.getElementById('recipientPreview').classList.add('visible');
  recipientFound = true;
  updateSendBtn();
}

function calcSendUSD() {
  const amt = parseFloat(document.getElementById('sendAmount').value) || 0;
  const usd = amt * INDX_PRICE_USD;
  document.getElementById('sendUSD').innerHTML = '≈ <span>$' + usd.toFixed(2) + ' USD</span>';
  const fee = amt * 0.02;
  const recv = amt * 0.98;
  document.getElementById('feeAmt').textContent = amt > 0 ? amt + ' INDX' : '';
  document.getElementById('feeCivil').textContent = amt > 0 ? fee.toFixed(3) + ' INDX' : '';
  document.getElementById('feeRecv').textContent = amt > 0 ? recv.toFixed(3) + ' INDX' : '';
  updateSendBtn();
}

function setSendAmt(val) {
  document.getElementById('sendAmount').value = val;
  calcSendUSD();
}
function setMax() { setSendAmt(50); }

function updateSendBtn() {
  const amt = parseFloat(document.getElementById('sendAmount').value) || 0;
  const btn = document.getElementById('sendBtn');
  btn.disabled = !(recipientFound && amt > 0);
  if (recipientFound && amt > 0) {
    btn.textContent = 'Send ' + amt + ' INDX →';
  } else {
    btn.textContent = 'Send Payment →';
  }
}


// ── REQUEST / KEYPAD ──
function keypad(key) {
  if (key === 'del') {
    requestVal = requestVal.slice(0,-1) || '0';
  } else if (key === '.' && requestVal.includes('.')) {
    return;
  } else if (requestVal === '0' && key !== '.') {
    requestVal = key;
  } else {
    if (requestVal.includes('.') && requestVal.split('.')[1].length >= 2) return;
    requestVal += key;
  }
  document.getElementById('requestDisplay').textContent = requestVal;
  const usd = (parseFloat(requestVal) || 0) * INDX_PRICE_USD;
  document.getElementById('requestUSD').textContent = '≈ $' + usd.toFixed(2) + ' USD';
}

function generateRequest() {
  const amt = parseFloat(requestVal) || 0;
  if (amt <= 0) { showToast('Enter an amount first'); return; }
  const note = document.getElementById('requestNote').value.trim();
  document.getElementById('qrAmount').textContent = amt + ' INDX';
  document.getElementById('qrLabel').textContent = note || 'Payment Request';
  document.getElementById('requestLinkText').textContent = 'pay.insdex.com/mariasantos/' + amt;
  document.getElementById('requestResult').style.display = 'block';
  document.getElementById('requestResult').scrollIntoView({ behavior:'smooth' });
}

function copyRequestLink() {
  const link = document.getElementById('requestLinkText').textContent;
  navigator.clipboard?.writeText('https://' + link).catch(()=>{});
  showToast('✓ Payment link copied');
}

function shareRequest() {
  const amt = requestVal;
  const link = 'https://pay.insdex.com/mariasantos/' + amt;
  const note = document.getElementById('requestNote').value.trim();
  if (navigator.share) {
    navigator.share({ title:'Payment Request IN$DEX', text: (note || 'Payment request') + ': ' + amt + ' INDX', url: link });
  } else {
    copyRequestLink();
  }
}

function closeSuccess() {
  document.getElementById('successOverlay').classList.remove('active');
  document.getElementById('sendAmount').value = '';
  document.getElementById('recipientInput').value = '';
  document.getElementById('recipientPreview').classList.remove('visible');
  recipientFound = false;
  calcSendUSD();
}

// DEAD CODE — FABRICATION WARNING (flagged 2026-09-10 screen audit): randomTx() is not called
// anywhere in this file (showPaymentSuccess() uses the real data.tx_id from transfer_indx, or
// '—' when absent — see its comment above). Do NOT wire this back in as a tx-id fallback: it
// generates a fake Math.random() hash and would fabricate a transaction that never happened,
// exactly the class of issue this audit exists to catch. Left here only because other dead
// code in this codebase is marked rather than silently deleted, per gotchas.md.
function randomTx() {
  const c = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
  const r = n => Array.from({length:n}, () => c[Math.floor(Math.random()*c.length)]).join('');
  return r(4) + '…' + r(4);
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ══ GOD MODE JS ══════════════════════════════════════════════
// Feature 1: Cybertron hex canvas
(function initPayCanvas() {
  const cv = document.getElementById('cyberCanvasPay');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const COLORS = ['#00D4FF','#2B35D8','#8B3FE8','#00E5A0','#FFB800'];
  let W, H, pts;
  const FRAME_MS = 1000/22, N = 22;
  let lastT = 0;
  function resize() {
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
    pts = Array.from({length:N}, () => ({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-0.5)*0.45, vy:(Math.random()-0.5)*0.45,
      r:2+Math.random()*2.2,
      color:COLORS[Math.floor(Math.random()*COLORS.length)],
      phase:Math.random()*Math.PI*2
    }));
  }
  window.addEventListener('resize', resize);
  resize();
  function draw(ts) {
    requestAnimationFrame(draw);
    if (ts - lastT < FRAME_MS) return;
    lastT = ts;
    ctx.clearRect(0,0,W,H);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.phase += 0.02;
      if (p.x<0||p.x>W) p.vx*=-1;
      if (p.y<0||p.y>H) p.vy*=-1;
      const op = 0.16 + 0.11*Math.sin(p.phase);
      ctx.save(); ctx.translate(p.x,p.y);
      ctx.beginPath();
      for (let i=0;i<6;i++){
        const a=i*Math.PI/3-Math.PI/6;
        i===0?ctx.moveTo(p.r*Math.cos(a),p.r*Math.sin(a)):ctx.lineTo(p.r*Math.cos(a),p.r*Math.sin(a));
      }
      ctx.closePath();
      ctx.fillStyle=p.color+Math.round(op*255).toString(16).padStart(2,'0');
      ctx.fill(); ctx.restore();
    });
    for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++){
      const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);
      if (d<125){
        ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
        ctx.strokeStyle=`rgba(0,212,255,${(1-d/125)*0.11})`; ctx.lineWidth=0.5; ctx.stroke();
      }
    }
  }
  requestAnimationFrame(draw);
})();

/// FIXED 2026-07-25: was fabricated data — Feature 3 randomly walked a fake "live settlement"
// number every 2.2s, and Feature 4 accumulated a fake "Civilisation Fund today" total from an
// invented DAILY=1200 INDX/day estimate with zero real citizens or transactions behind it. Both
// loops removed; the settlement line above is now a static factual claim and the fund label shows
// an honest pre-launch state instead — see gotchas.md.

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }
function h_2(event) { window.location.href='qr-scanner.html'; }
function h_3(event) { window.location.href='receipt.html?type=payment'; }
function h_4(event) { window.location.href='citizen-dashboard.html'; }
function h_5(event) { window.location.href='marketplace.html'; }
function h_6(event) { window.location.href='portfolio.html'; }
function h_7(event) { window.location.href='feed.html'; }
function h_8(event) { window.location.href='profile.html'; }
function h_9(event, __p0, __p1) { fillRecipient(String(__p0),String(__p1),'✓ Sent before'); }


// ── Delegated dispatcher ──────────────────────────────────────────────────
// Replaces inline on* attributes (CSP phase: no inline handlers).
// Markup carries data-action / data-args (click) or data-<event>-action / data-<event>-args.
// JSON args: "$this" = element, "$event" = event (currentTarget = matched element),
// "$value" = element.value, "$checked" = element.checked.
function indxJ(v) { return JSON.stringify(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
(function () {
  const EV = { click: ['click', 'action', 'args', true], input: ['input', 'inputAction', 'inputArgs', true], change: ['change', 'changeAction', 'changeArgs', true],
    submit: ['submit', 'submitAction', 'submitArgs', true], keydown: ['keydown', 'keydownAction', 'keydownArgs', true], keyup: ['keyup', 'keyupAction', 'keyupArgs', true],
    keypress: ['keypress', 'keypressAction', 'keypressArgs', true], dblclick: ['dblclick', 'dblclickAction', 'dblclickArgs', true],
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
    }, false); })(EV.click);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, false); })(EV.input);

})();
