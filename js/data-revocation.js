
let selectedCompany = '';
let selectedCategories = [];
let currentStep = 1;

// ── GOD MODE ADDITIONS ──
let confirmSheetTrigger = null;

function renderRecentCompanies() {
  let list; try { list = JSON.parse(localStorage.getItem('indx_revocation_previews')||'[]'); } catch(e) { list = []; }
  const seen = new Set();
  const recents = [];
  list.forEach(p=>{
    if(!seen.has(p.company)) { seen.add(p.company); recents.push(p.company); }
  });
  const wrap = document.getElementById('recentCompaniesWrap');
  const wrapList = document.getElementById('recentCompaniesList');
  if(!wrap || !wrapList) return;
  if(!recents.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  wrapList.innerHTML = recents.slice(0,5).map(c=>`<div class="recent-chip" data-action="h_2" data-args="${JSON.stringify(["$event",c]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${c}</div>`).join('');
}

function quickSelectCompany(name) {
  document.querySelectorAll('.company-option').forEach(o=>o.classList.remove('selected'));
  let matched = false;
  document.querySelectorAll('.company-option').forEach(o=>{
    if(o.querySelector('.co-name').textContent===name) { o.classList.add('selected'); matched = true; }
  });
  selectedCompany = name;
  if(!matched) { document.getElementById('customCompany').value = name; }
  showToast('Selected ' + name);
}

function openConfirmSheet() {
  document.getElementById('confirmSummaryCompany').textContent = selectedCompany || '—';
  document.getElementById('confirmSummaryScope').textContent = selectedCategories.join(', ') || '—';
  document.getElementById('confirmAckCheckbox').checked = false;
  updateConfirmBtn();
  document.getElementById('confirmSheetOverlay').classList.add('show');
  document.getElementById('confirmSheet').classList.add('show');
  confirmSheetTrigger = document.activeElement;
  document.addEventListener('keydown', confirmSheetKeyHandler);
  setTimeout(()=>{ const cb = document.getElementById('confirmAckCheckbox'); if(cb) cb.focus(); }, 50);
}

function closeConfirmSheet() {
  document.getElementById('confirmSheetOverlay').classList.remove('show');
  document.getElementById('confirmSheet').classList.remove('show');
  document.removeEventListener('keydown', confirmSheetKeyHandler);
  if(confirmSheetTrigger && confirmSheetTrigger.focus) confirmSheetTrigger.focus();
}

function updateConfirmBtn() {
  const cb = document.getElementById('confirmAckCheckbox');
  document.getElementById('confirmSaveBtn').disabled = !(cb && cb.checked);
}

function confirmAndSend() {
  closeConfirmSheet();
  sendRevocation();
}

function confirmSheetKeyHandler(e) {
  if(e.key === 'Escape') { closeConfirmSheet(); return; }
  if(e.key === 'Tab') {
    const sheet = document.getElementById('confirmSheet');
    const focusable = sheet.querySelectorAll('button:not([disabled]), input, [tabindex]');
    if(!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length-1];
    if(e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

function deletePreview(ts) {
  let list; try { list = JSON.parse(localStorage.getItem('indx_revocation_previews')||'[]'); } catch(e) { list = []; }
  list = list.filter(p=>p.ts !== ts);
  localStorage.setItem('indx_revocation_previews', JSON.stringify(list));
  renderTracking();
  showToast('Preview removed');
}

// Pre-fill from URL param
const params = new URLSearchParams(window.location.search);
const preCompany = params.get('company');
if(preCompany) {
  setTimeout(()=>{
    document.querySelectorAll('.company-option').forEach(o=>{
      if(o.querySelector('.co-name').textContent===preCompany) {
        o.click();
        setTimeout(()=>goToStep2(), 300);
      }
    });
    if(!selectedCompany) {
      document.getElementById('customCompany').value = preCompany;
      selectedCompany = preCompany;
    }
  }, 100);
}

function selectCompany(el, name, icon, risk) {
  document.querySelectorAll('.company-option').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
  selectedCompany = name;
}

function goToStep2() {
  const custom = document.getElementById('customCompany').value.trim();
  if(custom) selectedCompany = custom;
  if(!selectedCompany) { showToast('Select or enter a company name'); return; }
  document.getElementById('s2company').textContent = selectedCompany;
  goStep(2);
}

function goStep(n) {
  document.querySelectorAll('.screen').forEach((s,i)=>s.classList.toggle('active', i===n-1));
  currentStep = n;
  [1,2,3].forEach(i=>{
    const num = document.getElementById('sn'+i);
    const lbl = document.getElementById('sl'+i);
    num.className = 'si-num' + (i<n?' done':i===n?' active':'');
    lbl.className = 'si-label' + (i===n?' active':'');
    if(i<n) num.textContent='✓'; else num.textContent=i;
  });
}

function toggleAllData(chip) {
  chip.classList.toggle('selected');
  const isAll = chip.classList.contains('selected');
  document.getElementById('allDataWarning').classList.toggle('show', isAll);
  if(isAll) {
    document.querySelectorAll('.cat-chip:not(.all-data)').forEach(c=>c.classList.add('selected'));
  }
}

function toggleCat(chip) {
  chip.classList.toggle('selected');
  const selected = document.querySelectorAll('.cat-chip.selected:not(.all-data)').length;
  const total = document.querySelectorAll('.cat-chip:not(.all-data)').length;
  const allChip = document.querySelector('.cat-chip.all-data');
  if(selected < total) allChip.classList.remove('selected');
}

function goToStep3() {
  selectedCategories = [];
  document.querySelectorAll('.cat-chip.selected').forEach(c=>{
    const text = c.textContent.replace(/^[^\s]+\s/,'');
    selectedCategories.push(text);
  });
  if(selectedCategories.length===0){showToast('Select at least one data category');return;}
  const citizen = sessionStorage.getItem('citizen_name') || 'Arthur Henry';
  // BUGFIX 2026-08-05: canonical key first — was falling through to AJ's placeholder
  // domain on a real citizen's revocation certificate.
  const domain = sessionStorage.getItem('citizen_web3_domain') || sessionStorage.getItem('citizen_domain') || 'arthur.IN$DEX';
  document.getElementById('certCitizen').textContent = citizen;
  document.getElementById('certDomain').textContent = domain;
  document.getElementById('certDate').textContent = new Date().toLocaleString();
  document.getElementById('certCompany').textContent = selectedCompany;
  document.getElementById('certScope').textContent = selectedCategories.join(', ');
  goStep(3);
}

function sendRevocation() {
  const overlay = document.getElementById('sendingOverlay');
  const steps = document.getElementById('sendingSteps');
  const success = document.getElementById('successCard');
  overlay.classList.add('show');
  steps.style.display='block'; success.classList.remove('show');
  const s1=document.getElementById('ss1'),s2=document.getElementById('ss2'),s3=document.getElementById('ss3'),s4=document.getElementById('ss4');
  [s2,s3,s4].forEach(s=>s.classList.remove('active','done'));
  setTimeout(()=>{s1.className='send-step done';s2.className='send-step active';},900);
  setTimeout(()=>{s2.className='send-step done';s3.className='send-step active';},1800);
  setTimeout(()=>{s3.className='send-step done';s4.className='send-step active';},2700);
  setTimeout(()=>{s4.className='send-step done';},3400);
  setTimeout(()=>{
    steps.style.display='none';
    document.getElementById('successSub').textContent = `Nothing was actually sent to ${selectedCompany} — this feature isn't connected to any company compliance system yet. Saved as a local preview only.`;
    success.classList.add('show');
    savePreview();
  }, 4000);
}

function savePreview() {
  let list; try { list = JSON.parse(localStorage.getItem('indx_revocation_previews')||'[]'); } catch(e) { list = []; }
  list.unshift({ company: selectedCompany, categories: selectedCategories, ts: Date.now() });
  localStorage.setItem('indx_revocation_previews', JSON.stringify(list.slice(0,10)));
  renderTracking();
}

// GOD MODE PATCH: added stats bar, per-card delete button, and recent-companies refresh
function renderTracking() {
  let list; try { list = JSON.parse(localStorage.getItem('indx_revocation_previews')||'[]'); } catch(e) { list = []; }
  document.querySelector('.ttab:nth-child(2)').textContent = 'Sent (' + list.length + ')';
  const empty = document.getElementById('trackingEmpty');
  const container = document.getElementById('trackingPreviewList');
  const statsBar = document.getElementById('trackingStatsBar');
  if (!list.length) { empty.style.display='block'; container.innerHTML=''; if(statsBar) statsBar.style.display='none'; renderRecentCompanies(); return; }
  empty.style.display='none';
  if(statsBar) {
    statsBar.style.display = 'flex';
    const companies = new Set(list.map(p=>p.company));
    const catCounts = {};
    list.forEach(p=>(p.categories||[]).forEach(c=>{ catCounts[c] = (catCounts[c]||0) + 1; }));
    let topCat = '—', topCount = 0;
    Object.keys(catCounts).forEach(c=>{ if(catCounts[c] > topCount) { topCount = catCounts[c]; topCat = c; } });
    document.getElementById('statTotal').textContent = list.length;
    document.getElementById('statCompanies').textContent = companies.size;
    document.getElementById('statTopCategory').textContent = topCat;
  }
  container.innerHTML = list.map(p => `
    <div class="track-card">
      <button class="track-delete" data-action="h_3" data-args="${JSON.stringify(["$event",p.ts]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" aria-label="Delete preview">×</button>
      <div class="tc-top">
        <div>
          <div class="tc-company">${p.company}</div>
          <div class="tc-date">Saved ${new Date(p.ts).toLocaleDateString()}</div>
        </div>
        <div class="tc-status" style="background:rgba(255,184,0,0.1);color:var(--gold);">Preview only</div>
      </div>
      <div class="tc-scope">Scope: ${p.categories.join(', ')} · Not actually sent — no company compliance system connected</div>
    </div>`).join('');
  renderRecentCompanies();
}
renderTracking();

function showView(view, tab) {
  document.querySelectorAll('.ttab').forEach(t=>t.classList.remove('active'));
  tab.classList.add('active');
  document.getElementById('composeView').style.display = view==='compose'?'block':'none';
  document.getElementById('trackingView').style.display = view==='tracking'?'block':'none';
}

let toastTimer;
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3200);}

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.location.href='data-revocation.html'; }
function h_2(event, __p0) { quickSelectCompany(String(__p0)); }
function h_3(event, __p0) { deletePreview(__p0); }


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
    }, { capture: true, passive: false }); })(EV.change);

})();
