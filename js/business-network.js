const STAGES = [
  { key:'prospect', label:'Prospect', color:'#8892B0', dot:'#8892B0' },
  { key:'outreach', label:'Outreach', color:'#00D4FF', dot:'#00D4FF' },
  { key:'talks',    label:'In Talks', color:'#FFB800', dot:'#FFB800' },
  { key:'active',   label:'Active Partner', color:'#00E5A0', dot:'#00E5A0' }
];

const PLATFORM_LABELS = {
  linkedin: '💼 LinkedIn',
  twitter: '𝕏 Twitter / X',
  youtube: '▶ YouTube',
  indx: '⬡ IN$DEX'
};

const INITIALS_BG = {
  partner: 'linear-gradient(135deg,#2B35D8,#00D4FF)',
  investor: 'linear-gradient(135deg,#FFB800,#FF4D6D)',
  influencer: 'linear-gradient(135deg,#8B3FE8,#2B35D8)',
  creator: 'linear-gradient(135deg,#00E5A0,#2B35D8)',
  protocol: 'linear-gradient(135deg,#00D4FF,#2B35D8)'
};

// Pre-seeded contacts
let contacts = JSON.parse(localStorage.getItem('bn_contacts') || 'null') || [
  { id:1, name:'Rahul Menon', handle:'@rahulmenon_defi', platform:'linkedin', type:'investor', stage:'talks', note:'Follow up after whitepaper v2 release', added:'Jun 10, 2026' },
  { id:2, name:'Pacific Wave Media', handle:'@pacificwavemedia', platform:'youtube', type:'influencer', stage:'outreach', note:'Sent collab proposal — awaiting reply', added:'Jun 14, 2026' },
  { id:3, name:'Lena Kato', handle:'@lena.kato.sol', platform:'indx', type:'creator', stage:'active', note:'Genesis Creator Partnership — live', added:'May 28, 2026' },
  { id:4, name:'Solana Foundation', handle:'@solana', platform:'twitter', type:'partner', stage:'prospect', note:'Submit to ecosystem grants program', added:'Jun 18, 2026' },
  { id:5, name:'Tino Faleolo', handle:'@tinofaleolo', platform:'youtube', type:'influencer', stage:'talks', note:'Discussing Pacific First content deal', added:'Jun 20, 2026' },
  { id:6, name:'DeFi Daily Podcast', handle:'@defidailypod', platform:'twitter', type:'influencer', stage:'outreach', note:'Guest appearance pitch sent', added:'Jun 21, 2026' }
];

let selectedPlat = 'linkedin';
let selectedTag = 'partner';
let selectedStage = 'prospect';
let activeContact = null;
let currentFilter = 'all';
let searchQuery = '';
let sortMode = 'default';
let pinnedIds = JSON.parse(localStorage.getItem('bn_pinned') || '[]');

function saveContacts() {
  localStorage.setItem('bn_contacts', JSON.stringify(contacts));
}

function savePinned() {
  localStorage.setItem('bn_pinned', JSON.stringify(pinnedIds));
}

function isPinned(id) {
  return pinnedIds.includes(id);
}

function togglePin(id) {
  if (isPinned(id)) {
    pinnedIds = pinnedIds.filter(x => x !== id);
  } else {
    pinnedIds.push(id);
  }
  savePinned();
  renderPipeline();
  const c = contacts.find(x => x.id === id);
  if (c) showToast(isPinned(id) ? '📌 Pinned ' + c.name : '📍 Unpinned ' + c.name);
}

function matchesSearch(c, q) {
  if (!q) return true;
  const hay = (c.name + ' ' + c.handle + ' ' + c.note).toLowerCase();
  return hay.includes(q.toLowerCase());
}

function applySort(list) {
  const sorted = list.slice();
  if (sortMode === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortMode === 'newest') {
    sorted.sort((a, b) => (b.id > a.id ? 1 : -1));
  } else if (sortMode === 'oldest') {
    sorted.sort((a, b) => (a.id > b.id ? 1 : -1));
  }
  return sorted;
}

function setSortMode(val) {
  sortMode = val;
  renderPipeline();
}

function handleSearch(val) {
  searchQuery = val;
  document.getElementById('searchClearBtn').classList.toggle('show', !!val);
  renderPipeline();
}

function clearSearch() {
  searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchClearBtn').classList.remove('show');
  renderPipeline();
}

function chipKeydown(e, el) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    el.click();
  }
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
}

function renderSiindexTip() {
  const el = document.getElementById('siindexTipText');
  if (!el) return;
  const talksCount = contacts.filter(c => c.stage === 'talks').length;
  if (talksCount > 0) {
    el.textContent = `${talksCount} contact${talksCount === 1 ? '' : 's'} in "In Talks" — worth a follow-up. (Automatic reminders aren't live yet — I can't nudge you after 7 days on my own.) Tap any contact to log a note or advance the pipeline.`;
  } else {
    el.textContent = 'Tap any contact to log a note or advance the pipeline.';
  }
}

function renderPipelineSummary() {
  const summary = document.getElementById('pipelineSummary');
  summary.innerHTML = STAGES.map(s => {
    const count = contacts.filter(c => c.stage === s.key).length;
    return `<div class="pipe-box" tabindex="0" role="button" aria-label="Jump to ${s.label} stage" data-action="scrollToStage" data-args='["${s.key}"]' data-key-action="scrollToStage" data-key-args='["${s.key}"]'>
      <div class="pipe-dot" style="background:${s.dot};"></div>
      <div class="pipe-count" style="color:${s.color};">${count}</div>
      <div class="pipe-label">${s.label}</div>
    </div>`;
  }).join('');
}

function renderPinnedSection() {
  const section = document.getElementById('pinnedSection');
  const pinned = contacts.filter(c => isPinned(c.id) && matchesSearch(c, searchQuery) && (currentFilter === 'all' || c.type === currentFilter));
  if (pinned.length === 0) { section.style.display = 'none'; section.innerHTML = ''; return; }
  section.style.display = 'block';
  section.innerHTML = `<div class="pinned-header">📌 Pinned</div>${applySort(pinned).map(c => contactCard(c)).join('')}`;
}

function renderPipeline() {
  let filtered = currentFilter === 'all'
    ? contacts
    : contacts.filter(c => c.type === currentFilter);

  filtered = filtered.filter(c => matchesSearch(c, searchQuery));

  renderPinnedSection();

  const view = document.getElementById('pipelineView');

  if (filtered.length === 0) {
    view.innerHTML = `<div class="search-empty">No connections match "${searchQuery}".</div>`;
    return;
  }

  view.innerHTML = STAGES.map(s => {
    const stageContacts = applySort(filtered.filter(c => c.stage === s.key));
    if (stageContacts.length === 0) return '';
    return `<div class="pipeline-stage" id="stage-${s.key}">
      <div class="stage-header">
        <div class="stage-dot" style="background:${s.dot};"></div>
        <div class="stage-name" style="color:${s.color};">${s.label}</div>
        <div class="stage-count">${stageContacts.length}</div>
      </div>
      ${stageContacts.map(c => contactCard(c)).join('')}
    </div>`;
  }).join('');
}

function contactCard(c) {
  const bg = INITIALS_BG[c.type] || INITIALS_BG.partner;
  const pinned = isPinned(c.id);
  return `<div class="contact-card" tabindex="0" role="button" aria-label="View ${c.name}" data-action="openDetail" data-args='[${c.id}]' data-key-action="openDetail" data-key-args='[${c.id}]'>
    <div class="contact-top">
      <div class="contact-avatar" style="background:${bg};">${getInitials(c.name)}</div>
      <div class="contact-info">
        <div class="contact-name">${c.name}</div>
        <div class="contact-handle">${c.handle}</div>
      </div>
      <button class="pin-btn ${pinned ? 'pinned' : ''}" aria-label="${pinned ? 'Unpin' : 'Pin'} ${c.name}" data-stop data-action="togglePin" data-args='[${c.id}]'>${pinned ? '★' : '☆'}</button>
      <div class="contact-tags">
        <span class="tag ${c.type}">${c.type}</span>
        <span class="tag ${c.platform}">${c.platform === 'indx' ? 'IN$DEX' : c.platform}</span>
      </div>
    </div>
    <div class="contact-bottom">
      <div class="contact-notes">${c.note}</div>
      <button class="contact-action-btn outline" data-stop data-action="openDetail" data-args='[${c.id}]'>View →</button>
    </div>
  </div>`;
}

function filterContacts(el, type) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentFilter = type;
  renderPipeline();
}

function scrollToStage(key) {
  const el = document.getElementById('stage-' + key);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openAddSheet() {
  document.getElementById('addSheetOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeAddSheet() {
  document.getElementById('addSheetOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function selectPlat(el, val) {
  document.querySelectorAll('.plat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active'); selectedPlat = val;
}
function selectTag(el, val) {
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active'); selectedTag = val;
}
function selectStage(el, val) {
  document.querySelectorAll('.stage-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active'); selectedStage = val;
}

function addContact() {
  const name = document.getElementById('newName').value.trim();
  const handle = document.getElementById('newHandle').value.trim();
  const note = document.getElementById('newNote').value.trim();
  if (!name) { showToast('⚠️ Enter a name'); return; }
  const newC = {
    id: Date.now(),
    name, handle: handle || '—',
    platform: selectedPlat, type: selectedTag,
    stage: selectedStage,
    note: note || 'No note yet.',
    added: new Date().toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })
  };
  contacts.unshift(newC);
  saveContacts();
  closeAddSheet();
  document.getElementById('newName').value = '';
  document.getElementById('newHandle').value = '';
  document.getElementById('newNote').value = '';
  renderPipelineSummary();
  renderPipeline();
  renderSiindexTip();
  showToast('✅ ' + name + ' added to network');
}

function openDetail(id) {
  const c = contacts.find(x => x.id === id);
  if (!c) return;
  activeContact = c;
  const bg = INITIALS_BG[c.type] || INITIALS_BG.partner;
  const stage = STAGES.find(s => s.key === c.stage);
  document.getElementById('detailAvatar').style.background = bg;
  document.getElementById('detailAvatar').textContent = getInitials(c.name);
  document.getElementById('detailName').textContent = c.name;
  document.getElementById('detailHandle').textContent = c.handle;
  document.getElementById('detailPlatform').textContent = PLATFORM_LABELS[c.platform] || c.platform;
  document.getElementById('detailStage').textContent = stage ? stage.label : c.stage;
  document.getElementById('detailStage').style.color = stage ? stage.color : 'var(--text)';
  document.getElementById('detailAdded').textContent = c.added;
  document.getElementById('detailNote').textContent = c.note;
  document.getElementById('detailTags').innerHTML =
    `<span class="tag ${c.type}">${c.type}</span><span class="tag ${c.platform}">${c.platform === 'indx' ? 'IN$DEX' : c.platform}</span>`;
  document.getElementById('detailOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeDetail() {
  document.getElementById('detailOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function advanceStage() {
  if (!activeContact) return;
  const idx = STAGES.findIndex(s => s.key === activeContact.stage);
  if (idx >= STAGES.length - 1) { showToast('🎉 Already an Active Partner!'); return; }
  activeContact.stage = STAGES[idx + 1].key;
  const ci = contacts.findIndex(x => x.id === activeContact.id);
  if (ci !== -1) contacts[ci] = activeContact;
  saveContacts();
  renderPipelineSummary();
  renderPipeline();
  renderSiindexTip();
  openDetail(activeContact.id);
  showToast('⬆️ Moved to ' + STAGES[idx+1].label);
}

function showToast(msg) {
  const t = document.getElementById('bnToast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._bnToastTimer);
  window._bnToastTimer = setTimeout(() => { t.style.display = 'none'; }, 3000);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (document.getElementById('detailOverlay').classList.contains('active')) closeDetail();
    if (document.getElementById('addSheetOverlay').classList.contains('active')) closeAddSheet();
  }
});

// Init
renderPipelineSummary();
renderPipeline();
renderSiindexTip();

// Navigation helpers for converted history.back() / window.location.href handlers.
function goTo(url) { window.location.href = url; }
function goBack() { history.back(); }

// ── Delegated dispatcher ──────────────────────────────────────────────────
// Replaces inline on* attributes (CSP phase: no inline handlers).
// Markup carries data-<kind>action="fn" + data-<kind>args='[...]'. JSON args:
// "$this" = element, "$event" = event (currentTarget = matched element), "$value" = element.value.
// data-stop = event.stopPropagation() equivalent: ancestors' actions do not fire.
function indxDispatch(e, actionKey, argsKey, gate) {
  for (let el = e.target; el && el !== document; el = el.parentElement) {
    const name = el.dataset && el.dataset[actionKey];
    if (name) {
      const fn = window[name];
      let args = null;
      if (typeof fn === 'function') {
        try { args = el.dataset[argsKey] ? JSON.parse(el.dataset[argsKey]) : []; } catch (_) { args = null; }
      }
      if (args && (!gate || gate(e))) {
        if (gate) e.preventDefault();
        const ev = new Proxy(e, { get(t, k) { if (k === 'currentTarget') return el; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
        fn.apply(el, args.map(function (a) { return a === '$this' ? el : a === '$event' ? ev : a === '$value' ? el.value : a; }));
      }
    }
    if (e.type === 'click' && el.dataset && el.dataset.stop !== undefined) break;
    if (e.cancelBubble) break;
  }
}
const indxEnterSpace = function (e) { return e.key === 'Enter' || e.key === ' '; };
document.addEventListener('click', function (e) { indxDispatch(e, 'action', 'args'); });
document.addEventListener('input', function (e) { indxDispatch(e, 'inputAction', 'inputArgs'); });
document.addEventListener('change', function (e) { indxDispatch(e, 'changeAction', 'changeArgs'); });
document.addEventListener('keydown', function (e) {
  indxDispatch(e, 'keydownAction', 'keydownArgs');
  indxDispatch(e, 'keyAction', 'keyArgs', indxEnterSpace);
});
