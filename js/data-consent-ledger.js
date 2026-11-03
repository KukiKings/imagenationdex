function toggleDetail(card){
  const d=card.querySelector('.cc-detail');
  d.classList.toggle('open');
}
function filterCards(risk,tab){
  document.querySelectorAll('.ftab').forEach(t=>t.classList.remove('active'));
  tab.classList.add('active');
  document.querySelectorAll('.company-card').forEach(c=>{
    c.style.display = (risk==='all'||c.dataset.risk===risk) ? 'block' : 'none';
  });
  document.querySelectorAll('.list-group-label').forEach(g=>{
    g.style.display = (risk==='all'||g.dataset.group===risk) ? 'block' : 'none';
  });
}
function revokeCompany(name,e){
  e.stopPropagation();
  window.location.href='data-revocation.html?company='+encodeURIComponent(name);
}
function showAddSheet(){document.getElementById('addOverlay').classList.add('show');}
function hideAddSheet(e){if(e.target.id==='addOverlay')document.getElementById('addOverlay').classList.remove('show');}
function toggleCat(chip){chip.classList.toggle('selected');}
function addCompany(){
  // AUDIT 2026-08-28: this used to claim "Anchoring to Solana..." — there is no
  // on-chain anchoring wired up, and entries here aren't persisted anywhere real yet.
  const name=document.getElementById('addName').value.trim();
  if(!name){showToast('Enter company name');return;}
  showToast('✅ '+name+' added to this preview ledger. On-chain anchoring isn\'t live yet.');
  setTimeout(()=>document.getElementById('addOverlay').classList.remove('show'),1500);
}
let toastTimer;
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3200);}

// GOD MODE F4: SEARCH — real, filters real cards by company name
function searchCompanies(input){
  const q = input.value.trim().toLowerCase();
  document.getElementById('searchClear').classList.toggle('show', q.length > 0);
  const activeFtab = document.querySelector('.ftab.active');
  const riskFilter = activeFtab ? (activeFtab.textContent.match(/High Risk/) ? 'high' : activeFtab.textContent.match(/^Medium/) ? 'medium' : activeFtab.textContent.match(/^Low/) ? 'low' : activeFtab.textContent.match(/Revoked/) ? 'revoked' : 'all') : 'all';
  document.querySelectorAll('.company-card').forEach(c => {
    const name = c.querySelector('.cc-name').textContent.toLowerCase();
    const matchesSearch = !q || name.includes(q);
    const matchesRisk = riskFilter === 'all' || c.dataset.risk === riskFilter;
    c.style.display = (matchesSearch && matchesRisk) ? 'block' : 'none';
  });
  document.querySelectorAll('.list-group-label').forEach(g => {
    const anyVisible = Array.from(document.querySelectorAll(`.company-card[data-risk="${g.dataset.group}"]`)).some(c => c.style.display !== 'none');
    g.style.display = anyVisible ? 'block' : 'none';
  });
}
function clearSearch(){
  const input = document.getElementById('companySearch');
  input.value = '';
  searchCompanies(input);
}

// GOD MODE F3: SORT — real, reorders the actual DOM nodes so it affects what's on screen
function sortCards(mode, btn){
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const RISK_ORDER = { high: 0, medium: 1, low: 2, revoked: 3 };
  const section = document.querySelector('.list-section');
  const cards = Array.from(section.querySelectorAll('.company-card'));

  cards.sort((a, b) => {
    if (mode === 'risk') return (RISK_ORDER[a.dataset.risk] ?? 9) - (RISK_ORDER[b.dataset.risk] ?? 9);
    if (mode === 'active') return parseInt(a.dataset.activeDays || '9999') - parseInt(b.dataset.activeDays || '9999');
    if (mode === 'name') return a.querySelector('.cc-name').textContent.localeCompare(b.querySelector('.cc-name').textContent);
    return 0;
  });

  // Re-append in sorted order. Group labels only make sense for the default
  // risk sort, so hide them for active/name sort to avoid a misleading grouping.
  const groupLabels = Array.from(section.querySelectorAll('.list-group-label'));
  const siindexBar = section.querySelector('.siindex-bar');
  if (mode === 'risk') {
    groupLabels.forEach(g => g.style.display = 'block');
    const order = ['high','medium','low','revoked'];
    order.forEach(risk => {
      const label = groupLabels.find(g => g.dataset.group === risk);
      if (label) section.insertBefore(label, siindexBar);
      cards.filter(c => c.dataset.risk === risk).forEach(c => section.insertBefore(c, siindexBar));
    });
  } else {
    groupLabels.forEach(g => g.style.display = 'none');
    cards.forEach(c => section.insertBefore(c, siindexBar));
  }
}

// Navigation helper for the converted window.location.href handlers.
function goTo(url) { window.location.href = url; }

// ── Delegated dispatcher ──────────────────────────────────────────────────
// Replaces inline onclick/oninput attributes (CSP phase: no inline handlers).
// Markup carries data-action="fn" + data-args='[...]' (click) or data-input-action="fn" +
// data-input-args='[...]' (input). JSON args: "$this" = the element, "$event" = the event.
// Walks up from the target so nested actions fire inner-first like native bubbling, and
// stops once a handler calls stopPropagation().
function indxDispatch(e, actionKey, argsKey) {
  for (let el = e.target; el && el !== document; el = el.parentElement) {
    const name = el.dataset && el.dataset[actionKey];
    if (!name) continue;
    const fn = window[name];
    if (typeof fn !== 'function') continue;
    let args = [];
    try { args = el.dataset[argsKey] ? JSON.parse(el.dataset[argsKey]) : []; } catch (_) { continue; }
    const ev = new Proxy(e, { get(t, k) { if (k === 'currentTarget') return el; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
    fn.apply(el, args.map(function (a) { return a === '$this' ? el : a === '$event' ? ev : a; }));
    if (e.cancelBubble) break;
  }
}
document.addEventListener('click', function (e) { indxDispatch(e, 'action', 'args'); });
document.addEventListener('input', function (e) { indxDispatch(e, 'inputAction', 'inputArgs'); });
