
const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const citizenId = sessionStorage.getItem('citizen_id');

let _realAccessToken = null;
async function initRealSession() {
  try {
    const { data } = await sb.auth.getSession();
    if (data && data.session && data.session.access_token) _realAccessToken = data.session.access_token;
  } catch (e) { /* stay on anon key */ }
}
function rpcHeaders() {
  return { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + (_realAccessToken || SUPABASE_ANON_KEY), 'Content-Type': 'application/json' };
}

async function rpc(name, body) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + name, {
    method: 'POST', headers: rpcHeaders(), body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

let selectedReason = null;
let selectedResolution = null;
let evidenceItems = [];
let myOrders = [];
let myDisputes = [];
let disputeFilterState = 'all';
let _pendingDisputeOrder = null;
let _pendingDisputeDesc = '';

// ── GOD MODE: draft autosave, review/confirm step, dispute stats, status filters ──
function saveDraft() {
  const orderId = document.getElementById('orderSelect')?.value || '';
  const desc = document.getElementById('descInput')?.value.trim() || '';
  if (!orderId || orderId === 'demo' || (!selectedReason && !desc && !selectedResolution)) return;
  const draft = { orderId, reason: selectedReason, resolution: selectedResolution, desc, evidenceCount: evidenceItems.length || 0, ts: Date.now() };
  localStorage.setItem('indx_dispute_draft', JSON.stringify(draft));
}

function checkForDraft() {
  let draft = null;
  try { draft = JSON.parse(localStorage.getItem('indx_dispute_draft') || 'null'); } catch (e) {}
  if (!draft || !draft.orderId) return;
  const order = (myOrders || []).find(o => o.id === draft.orderId);
  if (!order) { localStorage.removeItem('indx_dispute_draft'); return; }
  document.getElementById('draftBannerText').textContent = `You have an unfinished dispute draft for "${order.title}".`;
  document.getElementById('draftBanner').style.display = 'flex';
}

function restoreDraft() {
  let draft = null;
  try { draft = JSON.parse(localStorage.getItem('indx_dispute_draft') || 'null'); } catch (e) {}
  if (!draft) return;
  const sel = document.getElementById('orderSelect');
  sel.value = draft.orderId;
  onOrderChange();
  for (let i = 0; i < (draft.evidenceCount || 0); i++) addEvidence();
  if (draft.reason) {
    document.querySelectorAll('#reasonChips .reason-chip').forEach(c => { if (c.textContent === draft.reason) selectReason(c); });
  }
  if (draft.resolution) {
    document.querySelectorAll('#resolutionChips .reason-chip').forEach(c => { if (c.textContent === draft.resolution) selectResolution(c); });
  }
  document.getElementById('descInput').value = draft.desc || '';
  validateForm();
  document.getElementById('draftBanner').style.display = 'none';
  showToast('Draft restored');
}

function discardDraft() {
  localStorage.removeItem('indx_dispute_draft');
  document.getElementById('draftBanner').style.display = 'none';
}

function openReviewSheet(order, desc) {
  _pendingDisputeOrder = order;
  _pendingDisputeDesc = desc;
  document.getElementById('revOrder').textContent = order.title || '—';
  document.getElementById('revReason').textContent = selectedReason || 'Other';
  document.getElementById('revResolution').textContent = selectedResolution || 'Not specified';
  document.getElementById('revEvidence').textContent = evidenceItems.length + (evidenceItems.length === 1 ? ' item' : ' items');
  document.getElementById('revDesc').textContent = desc || '';
  document.getElementById('reviewOverlay').classList.add('open');
  document.getElementById('reviewSheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeReviewSheet() {
  document.getElementById('reviewOverlay').classList.remove('open');
  document.getElementById('reviewSheet').classList.remove('open');
  document.body.style.overflow = '';
}

function confirmSubmitDispute() {
  if (!_pendingDisputeOrder) return;
  doSubmitDispute(_pendingDisputeOrder, _pendingDisputeDesc);
}

function updateDisputeStats(disputes) {
  const STATUS_CATEGORY = { open: 'open', evidence: 'review', mediation: 'review',
    resolved_buyer: 'resolved', resolved_seller: 'resolved', withdrawn: 'resolved' };
  let openCount = 0, resolvedCount = 0;
  (disputes || []).forEach(d => {
    const cat = STATUS_CATEGORY[d.status] || 'open';
    if (cat === 'open' || cat === 'review') openCount++;
    if (cat === 'resolved') resolvedCount++;
  });
  const total = (disputes || []).length;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statOpen').textContent = openCount;
  document.getElementById('statResolved').textContent = resolvedCount;
  localStorage.setItem('indx_dispute_stats_cache', JSON.stringify({ total, open: openCount, resolved: resolvedCount }));
}

function paintCachedDisputeStats() {
  try {
    const cached = JSON.parse(localStorage.getItem('indx_dispute_stats_cache') || 'null');
    if (cached && cached.total > 0) {
      document.getElementById('statTotal').textContent = cached.total;
      document.getElementById('statOpen').textContent = cached.open || 0;
      document.getElementById('statResolved').textContent = cached.resolved || 0;
      document.getElementById('disputeStats').style.display = 'flex';
      document.getElementById('disputeFilterBar').style.display = 'flex';
    }
  } catch (e) {}
}

function renderDisputesList() {
  const list = document.getElementById('disputesList');
  const STATUS_LABEL = { open: ['OPEN','open'], evidence: ['EVIDENCE ADDED','review'], mediation: ['IN MEDIATION','review'],
    resolved_buyer: ['RESOLVED (BUYER)','resolved'], resolved_seller: ['RESOLVED (SELLER)','resolved'], withdrawn: ['WITHDRAWN','resolved'] };
  const filtered = (myDisputes || []).filter(d => {
    if (disputeFilterState === 'all') return true;
    const cls = (STATUS_LABEL[d.status] || [d.status.toUpperCase(), 'open'])[1];
    return cls === disputeFilterState;
  });
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">No matching disputes</div><div class="empty-desc">Try a different filter.</div></div>';
    return;
  }
  list.innerHTML = filtered.map(d => {
    const [label, cls] = STATUS_LABEL[d.status] || [d.status.toUpperCase(), 'open'];
    const opened = new Date(d.opened_at).toLocaleDateString();
    return `<div class="dispute-card" data-action="h_8" data-args="${JSON.stringify(["$event",d.id]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
      <div class="dispute-top">
        <span class="d-status ${cls}">${label}</span>
        <div class="d-body">
          <div class="d-title">${(d.reason || '').split(':')[0]}</div>
          <div class="d-meta">Opened ${opened}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterDisputes(cat, el) {
  disputeFilterState = cat;
  document.querySelectorAll('#disputeFilterBar .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderDisputesList();
}
// ── END GOD MODE ──

function switchTab(el, tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['Open','Active','How'].forEach(t => document.getElementById('panel' + t).style.display = 'none');
  document.getElementById('panel' + tab.charAt(0).toUpperCase() + tab.slice(1)).style.display = 'block';
}

async function loadOrders() {
  const sel = document.getElementById('orderSelect');
  if (!citizenId) {
    sel.innerHTML = '<option value="demo">Log in to see your orders</option>';
    return;
  }
  try {
    myOrders = await rpc('get_my_purchases', { p_citizen_id: citizenId });
  } catch (e) { myOrders = []; }

  if (!myOrders || myOrders.length === 0) {
    sel.innerHTML = '<option value="demo">No recent orders</option>';
  } else {
    sel.innerHTML = '<option value="">Select an order</option>' + myOrders.map(o =>
      `<option value="${o.id}">Order · ${o.title} · ${o.price_indx} INDX</option>`
    ).join('');
  }
  onOrderChange();
  // GOD MODE PATCH: surface any saved draft once orders are loaded
  checkForDraft();
}

function onOrderChange() {
  const v = document.getElementById('orderSelect').value;
  document.getElementById('disputeForm').style.display = (v && v !== 'demo') ? 'block' : 'none';
  document.getElementById('noOrderMsg').style.display = v === 'demo' ? 'block' : 'none';
  validateForm();
}

function selectReason(el) {
  document.querySelectorAll('#reasonChips .reason-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedReason = el.textContent;
  validateForm();
}

function selectResolution(el) {
  document.querySelectorAll('#resolutionChips .reason-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedResolution = el.textContent;
  validateForm();
}

const EVIDENCE_EMOJIS = ['📸','🖼️','📄','📋','💬'];
let evidenceCount = 0;
function addEvidence() {
  if (evidenceCount >= 5) { showToast('Maximum 5 evidence items'); return; }
  evidenceCount++;
  const emoji = EVIDENCE_EMOJIS[evidenceCount - 1] || '📎';
  const id = 'ev_' + evidenceCount;
  evidenceItems.push(id);
  const wrap = document.getElementById('evidencePreviews');
  const div = document.createElement('div');
  div.className = 'evidence-thumb';
  div.id = id;
  div.innerHTML = emoji + '<div class="remove" data-action="h_9" data-args="[&quot;$event&quot;,' + indxJ(id) + ']">✕</div>';
  wrap.appendChild(div);
  validateForm();
}

function removeEvidence(id) {
  document.getElementById(id)?.remove();
  evidenceItems = evidenceItems.filter(e => e !== id);
  validateForm();
}

function validateForm() {
  const order = document.getElementById('orderSelect').value;
  const desc = document.getElementById('descInput').value.trim();
  document.getElementById('submitBtn').disabled = !(order && order !== 'demo' && selectedReason && desc.length > 10);
  // GOD MODE PATCH: persist the in-progress dispute as a recoverable draft
  saveDraft();
}

// GOD MODE PATCH: submitDispute now opens a review/confirm sheet instead of submitting immediately
function submitDispute() {
  const orderId = document.getElementById('orderSelect').value;
  const order = myOrders.find(o => o.id === orderId);
  const desc = document.getElementById('descInput').value.trim();
  if (!citizenId || !order) { showToast('Could not identify the order — try again.'); return; }
  openReviewSheet(order, desc);
}

async function doSubmitDispute(order, desc) {
  const btn = document.getElementById('reviewConfirmBtn');
  btn.disabled = true; btn.textContent = 'Opening…';
  try {
    const reasonText = (selectedReason || 'Other') + ': ' + desc + (selectedResolution ? ' [Preferred resolution: ' + selectedResolution + ']' : '');
    const dispute = await rpc('open_dispute', {
      p_buyer_id: citizenId, p_seller_id: order.seller_id, p_listing_id: order.id, p_reason: reasonText,
    });
    if (evidenceItems.length > 0) {
      await rpc('add_dispute_evidence', { p_dispute_id: dispute.id, p_actor_id: citizenId, p_detail: { items: evidenceItems.length } });
    }
    localStorage.removeItem('indx_dispute_draft');
    closeReviewSheet();
    document.getElementById('successDetail').textContent = `Dispute #${dispute.id.slice(0,8)} opened for "${order.title}". Your evidence and reason are saved to the record.`;
    document.getElementById('successOverlay').classList.add('show');
  } catch (e) {
    showToast('Could not open dispute: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Confirm & Open Dispute';
  }
}

function contactSeller() {
  showToast('Not connected yet — no in-app seller chat exists. Reach out to them directly for now.');
}

async function loadDisputes() {
  const list = document.getElementById('disputesList');
  if (!citizenId) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔒</div><div class="empty-title">Log in to see your disputes</div></div>';
    return;
  }
  try {
    myDisputes = await rpc('get_my_disputes', { p_citizen_id: citizenId });
  } catch (e) { myDisputes = []; }

  if (!myDisputes || myDisputes.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🛡️</div><div class="empty-title">No disputes</div><div class="empty-desc">Any dispute you open will show up here with its real status.</div></div>';
    document.getElementById('disputeStats').style.display = 'none';
    document.getElementById('disputeFilterBar').style.display = 'none';
    localStorage.setItem('indx_dispute_stats_cache', JSON.stringify({ total: 0, open: 0, resolved: 0 }));
    return;
  }

  // GOD MODE PATCH: paint the stats bar + filter bar and render through the filterable renderer
  updateDisputeStats(myDisputes);
  document.getElementById('disputeStats').style.display = 'flex';
  document.getElementById('disputeFilterBar').style.display = 'flex';
  renderDisputesList();
}

function openDetailSheet(disputeId) {
  const d = myDisputes.find(x => x.id === disputeId);
  if (!d) return;
  document.getElementById('dsTitle').textContent = 'Dispute #' + disputeId.slice(0,8);
  document.getElementById('dsStatus').textContent = d.status.replace('_',' ');
  document.getElementById('dsReason').innerHTML = '<strong>Issue:</strong> ' + d.reason;
  document.getElementById('dsOpened').textContent = new Date(d.opened_at).toLocaleString();
  const resWrap = document.getElementById('dsResolutionWrap');
  if (d.resolved_at) {
    resWrap.style.display = 'block';
    document.getElementById('dsResolutionNote').textContent = d.resolution_note || d.status;
  } else {
    resWrap.style.display = 'none';
  }
  document.getElementById('overlay').classList.add('open');
  document.getElementById('detailSheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetailSheet() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('detailSheet').classList.remove('open');
  document.body.style.overflow = '';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2500);
}

(async function initDispute() {
  await initRealSession();
  loadOrders();
  loadDisputes();
  // GOD MODE PATCH: paint cached dispute stats instantly while the live fetch is in flight
  paintCachedDisputeStats();
})();

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.history.back(); }
function h_2(event) { document.getElementById('successOverlay').classList.remove('show');switchTab(document.querySelectorAll('.tab')[1],'active');loadDisputes(); }
function h_3(event) { document.getElementById('successOverlay').classList.remove('show'); }
function h_4(event) { window.location.href='citizen-dashboard.html'; }
function h_5(event) { window.location.href='marketplace.html'; }
function h_6(event) { window.location.href='portfolio.html'; }
function h_7(event) { window.location.href='profile.html'; }
function h_8(event, __p0) { openDetailSheet(String(__p0)); }
function h_9(event, __p0) { removeEvidence(String(__p0)); }


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
    }, false); })(EV.change);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, false); })(EV.input);

})();
