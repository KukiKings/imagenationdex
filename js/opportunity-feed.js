
const INDX_PRICE_USD = 0.24;

// ── GOD MODE: MATCH REASON TOGGLE ──
function toggleWhy(btn) {
  const panel = btn.nextElementSibling;
  if (!panel) return;
  const open = panel.classList.toggle('open');
  btn.textContent = open ? '⚛️ Why SIINDEX chose this ▾' : '⚛️ Why SIINDEX chose this ›';
}

// ── GOD MODE: ACTION HISTORY ──
function logAction(type, label) {
  const log = JSON.parse(localStorage.getItem('indx_opp_history') || '[]');
  log.unshift({ type, label, ts: Date.now() });
  if (log.length > 40) log.pop();
  localStorage.setItem('indx_opp_history', JSON.stringify(log));
}

function openHistSheet() {
  const log = JSON.parse(localStorage.getItem('indx_opp_history') || '[]');
  const body = document.getElementById('histBody');
  if (!body) return;
  if (!log.length) {
    body.innerHTML = '<div class="gm-sheet-empty">No actions yet — your activity will appear here as you vote, apply, save, and dismiss opportunities.</div>';
  } else {
    const iconMap = { applied:'📋', voted:'🏛️', saved:'🔖', dismissed:'✕', rsvp:'🎤', started:'📚' };
    body.innerHTML = log.map(e => {
      const ago = fmtAgo(e.ts);
      return `<div class="hist-row"><div class="hist-icon">${iconMap[e.type]||'✦'}</div><div class="hist-body"><div class="hist-title">${e.label}</div><div class="hist-time">${ago}</div><span class="hist-badge ${e.type}">${e.type}</span></div></div>`;
    }).join('');
  }
  document.getElementById('histOverlay').classList.add('open');
  document.getElementById('histSheet').classList.add('open');
}

function closeHistSheet() {
  document.getElementById('histOverlay').classList.remove('open');
  document.getElementById('histSheet').classList.remove('open');
}

// ── GOD MODE: SAVED SHELF ──
function openSavedSheet() {
  const saved = JSON.parse(localStorage.getItem('indx_opp_saved_ideas') || '[]');
  const ideas = JSON.parse(localStorage.getItem('indx_opp_named_saves') || '[]');
  const body = document.getElementById('savedBody');
  if (!body) return;
  if (!ideas.length && !saved.length) {
    body.innerHTML = '<div class="gm-sheet-empty">Nothing saved yet. Use the Save button on opportunity cards to bookmark them here.</div>';
  } else {
    body.innerHTML = ideas.map(item => `
      <div class="saved-item">
        <div class="saved-item-body">
          <div class="saved-item-title">${item.title}</div>
          <div class="saved-item-time">${fmtAgo(item.ts)}</div>
        </div>
        <button class="saved-item-resume" data-action="h_4" data-args="${JSON.stringify(["$event",item.title]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">Resume →</button>
      </div>`).join('') || '<div class="gm-sheet-empty">Tap Save on any opportunity card to add it here.</div>';
  }
  document.getElementById('savedOverlay').classList.add('open');
  document.getElementById('savedSheet').classList.add('open');
}

function closeSavedSheet() {
  document.getElementById('savedOverlay').classList.remove('open');
  document.getElementById('savedSheet').classList.remove('open');
}

function fmtAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', function() {
  initGreeting();
  initCitizenName();
  staggerCards();
  initInsight();
  restoreScrollPosition();
});

// ── GREETING ──
function initGreeting() {
  const h = new Date().getHours();
  const greetEl = document.getElementById('ofGreetingTime');
  if (!greetEl) return;
  if (h < 12) greetEl.textContent = 'Good Morning';
  else if (h < 17) greetEl.textContent = 'Good Afternoon';
  else greetEl.textContent = 'Good Evening';
}

function initCitizenName() {
  const nameEl = document.getElementById('ofGreetingName');
  if (!nameEl) return;
  const stored = sessionStorage.getItem('citizen_name');
  if (stored && stored !== 'Citizen') nameEl.textContent = stored;
}

// ── DYNAMIC INSIGHT ──
const INSIGHTS = [
  'I found <strong>28 opportunities</strong> matching your profile today. Digital artwork demand is up <strong>34%</strong> this week across Pacific markets.',
  'Your reputation increased <strong>+2% this week</strong>. Three new buyers bookmarked your store. Now is the best time to add a new listing.',
  'Pacific heritage crafts are the <strong>#1 trending category</strong> today. Your skills match exactly. I have 12 buyer intros ready.',
  'Based on your activity pattern, <strong>Tuesday mornings</strong> are your highest-conversion window. I have five time-sensitive listings open right now.'
];

function initInsight() {
  const el = document.getElementById('siDailyInsight');
  if (!el) return;
  // Rotate insight based on day of week for consistency
  const idx = new Date().getDay() % INSIGHTS.length;
  el.innerHTML = INSIGHTS[idx];
}

// ── CARD STAGGER ──
function staggerCards() {
  const cards = document.querySelectorAll('.opp-card');
  cards.forEach((card, i) => {
    setTimeout(() => {
      requestAnimationFrame(() => card.classList.add('visible'));
    }, i * 80);
  });
}

// ── FILTER ──
function setOFFilter(el, filter) {
  document.querySelectorAll('.of-filter').forEach(f => f.classList.remove('active'));
  el.classList.add('active');

  const cards = document.querySelectorAll('.opp-card');
  let visible = 0;
  cards.forEach(card => {
    const cf = card.dataset.filter || 'all';
    const show = (filter === 'all') || (cf === filter);
    card.style.display = show ? 'block' : 'none';
    if (show) visible++;
  });

  // Update section counts
  document.getElementById('ofActTodayCount').textContent =
    filter === 'all' ? '3 opportunities' : visible + ' found';
}

// ── CARD ACTIONS ──
function ofCardAction(action, toast) {
  ofShowToast(toast || 'Opening...');
  // In production: route to relevant screen
  const routes = {
    'list-now': 'merchant-coach.html',
    'view-buyers': 'marketplace.html',
    'view-collabs': 'marketplace.html',
    'apply-grant': 'merchant-coach.html',
    'view-grant': 'merchant-coach.html',
    'start-course': 'merchant-coach.html',
    'explore-idea': 'merchant-coach.html',
    'save-idea': null,
    'vote-now': 'marketplace.html',
    'read-proposal': 'marketplace.html',
    'apply-speaker': 'feed.html',
    'rsvp-event': null,
    'meet-mentees': 'siindex-avatar.html'
  };

  if (action === 'save-idea') {
    const ideas = JSON.parse(localStorage.getItem('indx_opp_named_saves') || '[]');
    ideas.unshift({ title: 'Digital Pacific Pattern Library', ts: Date.now() });
    if (ideas.length > 20) ideas.pop();
    localStorage.setItem('indx_opp_named_saves', JSON.stringify(ideas));
    logAction('saved', 'Digital Pacific Pattern Library');
    return;
  }
  if (action === 'rsvp-event') {
    localStorage.setItem('indx_opp_event_rsvp', '1');
    logAction('rsvp', 'Pacific Maker Summit — Sat 12 Jul');
    return;
  }
  // Log all other actions
  const labelMap = {
    'list-now':'Create a Listing','view-buyers':'View Buyer Insights','view-collabs':'View Collaboration Requests',
    'apply-grant':'Apply for Pacific Creator Grant','view-grant':'View Grant Details',
    'start-course':'Started: Pricing for Maximum Conversions','explore-idea':'Explore Print-on-Demand Idea',
    'vote-now':'Voted: Creator Royalty Standard v2','read-proposal':'Read Governance Proposal',
    'apply-speaker':'Applied to Speak — Pacific Maker Summit','meet-mentees':'Meet Mentees'
  };
  const typeMap = {
    'apply-grant':'applied','vote-now':'voted','start-course':'started',
    'apply-speaker':'applied','list-now':'applied','meet-mentees':'applied'
  };
  if (labelMap[action]) logAction(typeMap[action]||'applied', labelMap[action]);
}

function ofDismissCard(btn) {
  const card = btn.closest('.opp-card');
  if (!card) return;
  card.style.transition = 'all 0.3s ease';
  card.style.opacity = '0';
  card.style.transform = 'translateX(40px) scale(0.96)';
  card.style.maxHeight = card.offsetHeight + 'px';
  setTimeout(() => {
    card.style.maxHeight = '0';
    card.style.margin = '0';
    card.style.padding = '0';
    card.style.overflow = 'hidden';
  }, 280);
  const cardTitle = card.querySelector('.opp-card-title')?.textContent || 'Opportunity';
  ofShowToast('Dismissed — won\'t show again today');
  logAction('dismissed', cardTitle);

  // Persist dismissal
  const dismissed = JSON.parse(localStorage.getItem('indx_opp_dismissed') || '[]');
  dismissed.push({ ts: Date.now(), title: cardTitle });
  localStorage.setItem('indx_opp_dismissed', JSON.stringify(dismissed));
}

// ── PILLAR TAP ──
function ofPillarTap(pillar) {
  const routes = {
    'Learn': 'sovereign-academy.html',
    'Create': 'creator-studio.html',
    'Earn': 'marketplace.html',
    'Own': 'data-vault.html',
    'Govern': 'governance.html',
    'Legacy': 'indx-legacy-vault.html'
  };
  ofShowToast('Opening ' + pillar + ' pillar...');
  setTimeout(() => {
    if (routes[pillar]) window.location.href = routes[pillar];
  }, 600);
}

// ── TOAST ──
let ofToastTimer = null;
function ofShowToast(msg) {
  const el = document.getElementById('ofToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  if (ofToastTimer) clearTimeout(ofToastTimer);
  ofToastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── SCROLL PERSISTENCE ──
function restoreScrollPosition() {
  const saved = localStorage.getItem('indx_opp_scroll');
  if (saved) window.scrollTo(0, parseInt(saved, 10));
}

window.addEventListener('scroll', () => {
  localStorage.setItem('indx_opp_scroll', String(window.scrollY));
}, { passive: true });

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.location.href='siindex-avatar.html'; }
function h_2(event) { window.location.href='marketplace.html'; }
function h_3(event) { window.location.href='feed.html'; }
function h_4(event, __p0) { closeSavedSheet();ofShowToast('Loading __p0...'); }


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

})();
