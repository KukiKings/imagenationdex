
// GOD MODE: live search/filter, follow persistence, send-confirm sheet, feed stats
// AUDIT 2026-09-10: INDX_PRICE_USD is a hardcoded internal planning estimate, not a live
// price feed — there is no live INDX token or exchange yet. Used only to render the
// preview stat pill and the illustrative $-conversion in the SovToken send sheet, both
// now labeled "estimate, not live" in the UI. Do not wire this to real balances/payouts
// without replacing it with a real price source.
const INDX_PRICE_USD = 0.24;
const FOLLOWS_KEY = 'indx_pacificfirst_follows';
let lastFocusedEl = null;
let sendSheetContext = null;

function getFollows(){
  try{ return JSON.parse(localStorage.getItem(FOLLOWS_KEY) || '[]'); }catch(e){ return []; }
}
function saveFollows(list){ localStorage.setItem(FOLLOWS_KEY, JSON.stringify(list)); }

function toggleFollow(btn, name){
  let follows = getFollows();
  const idx = follows.indexOf(name);
  if(idx===-1){
    follows.push(name);
    showToast(name+' followed');
  } else {
    follows.splice(idx,1);
    showToast(name+' unfollowed');
  }
  saveFollows(follows);
  renderFollowState();
}

function toggleFollowByName(name){
  const btn = document.querySelector('.action-follow[data-creator="'+name+'"]');
  if(btn){ toggleFollow(btn, name); return; }
  const follows = getFollows().filter(n=>n!==name);
  saveFollows(follows);
  renderFollowState();
}

function renderFollowState(){
  const follows = getFollows();
  const valEl = document.getElementById('followCountVal');
  if(valEl) valEl.textContent = follows.length;
  document.querySelectorAll('.action-follow').forEach(btn=>{
    const name = btn.dataset.creator;
    if(!name) return;
    const isFollowing = follows.includes(name);
    btn.textContent = isFollowing ? '✓ Following' : '+ Follow';
    btn.classList.toggle('following', isFollowing);
  });
  const listEl = document.getElementById('followsList');
  if(listEl){
    listEl.innerHTML = follows.length===0
      ? '<div class="follow-list-empty">You haven\'t followed any creators yet.</div>'
      : follows.map(n=>'<div class="follow-list-item"><span>'+n+'</span><button class="unfollow-btn" data-action="h_1" data-args="[&quot;$event&quot;,' + indxJ(n) + ']">Unfollow</button></div>').join('');
  }
}

function trapFocus(sheet){
  const focusable = sheet.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
  if(focusable.length) focusable[0].focus();
  function handler(e){
    if(e.key==='Escape'){
      document.querySelectorAll('.bottom-sheet.open').forEach(s=>s.classList.remove('open'));
      document.querySelectorAll('.sheet-overlay.open').forEach(o=>o.classList.remove('open'));
      document.removeEventListener('keydown', handler);
      if(lastFocusedEl) lastFocusedEl.focus();
      return;
    }
    if(e.key!=='Tab' || !focusable.length) return;
    const first=focusable[0], last=focusable[focusable.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', handler);
}

function openFollowsSheet(){
  lastFocusedEl = document.activeElement;
  renderFollowState();
  document.getElementById('followsSheet').classList.add('open');
  document.getElementById('followsSheetOverlay').classList.add('open');
  trapFocus(document.getElementById('followsSheet'));
}
function closeFollowsSheet(){
  document.getElementById('followsSheet').classList.remove('open');
  document.getElementById('followsSheetOverlay').classList.remove('open');
  if(lastFocusedEl) lastFocusedEl.focus();
}

function openSendSheet(name, nation, avatar){
  lastFocusedEl = document.activeElement;
  sendSheetContext = {name:name, nation:nation};
  document.getElementById('sendSheetName').textContent = name;
  document.getElementById('sendSheetNation').textContent = nation;
  document.getElementById('sendSheetAvatar').textContent = avatar || '🌊';
  const balance = parseFloat(sessionStorage.getItem('citizen_balance') || '0') || 0;
  document.getElementById('sendSheetBalance').textContent = 'Your balance: '+balance.toLocaleString()+' INDX';
  document.getElementById('sendSheetAmount').value = '';
  document.getElementById('sendSheetUsd').textContent = '≈ $0.00 USD';
  document.getElementById('sendSheet').classList.add('open');
  document.getElementById('sendSheetOverlay').classList.add('open');
  trapFocus(document.getElementById('sendSheet'));
}
function closeSendSheet(){
  document.getElementById('sendSheet').classList.remove('open');
  document.getElementById('sendSheetOverlay').classList.remove('open');
  if(lastFocusedEl) lastFocusedEl.focus();
}
function updateSendConversion(){
  const amt = parseFloat(document.getElementById('sendSheetAmount').value) || 0;
  const usd = amt * INDX_PRICE_USD;
  document.getElementById('sendSheetUsd').textContent = '≈ $'+usd.toFixed(2)+' USD';
}
function confirmSendSovToken(){
  if(!sendSheetContext) return;
  sessionStorage.setItem('sovtoken_recipient_name', sendSheetContext.name);
  sessionStorage.setItem('sovtoken_recipient_nation', sendSheetContext.nation);
  const amt = document.getElementById('sendSheetAmount').value;
  if(amt) sessionStorage.setItem('sovtoken_recipient_amount', amt);
  location.href='sovtokens.html';
}

function showToast(msg){
  const t = document.getElementById('godModeToast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(function(){ t.classList.remove('show'); }, 2200);
}

function getCleanLabel(el){
  const clone = el.cloneNode(true);
  const flag = clone.querySelector('.nation-flag');
  if(flag) flag.remove();
  return clone.textContent.replace(/^[^\w]+/,'').trim();
}

function filterFeed(){
  const searchInputEl = document.getElementById('searchInput');
  const searchTerm = (searchInputEl ? searchInputEl.value : '').toLowerCase().trim();
  const activeFilterEl = document.querySelector('.filter-chip.active');
  const activeNationEl = document.querySelector('.nation-pill.active');
  const filterLabel = activeFilterEl ? getCleanLabel(activeFilterEl) : 'All';
  const nationLabel = activeNationEl ? getCleanLabel(activeNationEl) : 'All Nations';
  const cards = document.querySelectorAll('.creator-card');
  let visibleCount = 0;
  let totalIndx = 0;
  cards.forEach(function(card){
    const cardFormat = card.dataset.format || '';
    const cardNation = card.dataset.nation || '';
    const cardText = card.textContent.toLowerCase();
    const matchesFilter = filterLabel==='All' || cardFormat===filterLabel;
    const matchesNation = nationLabel==='All Nations' || cardNation===nationLabel;
    const matchesSearch = !searchTerm || cardText.includes(searchTerm);
    const visible = matchesFilter && matchesNation && matchesSearch;
    card.style.display = visible ? '' : 'none';
    if(visible){
      visibleCount++;
      const earnEl = card.querySelector('.card-stat-earn');
      if(earnEl){
        const m = earnEl.textContent.match(/[\d.]+/);
        if(m) totalIndx += parseFloat(m[0]);
      }
    }
  });
  document.querySelectorAll('.feed').forEach(function(feedEl){
    const anyVisible = Array.prototype.some.call(feedEl.querySelectorAll('.creator-card'), function(c){ return c.style.display!=='none'; });
    feedEl.style.display = anyVisible ? '' : 'none';
    const divider = feedEl.previousElementSibling;
    if(divider && divider.classList.contains('section-divider')) divider.style.display = anyVisible ? '' : 'none';
  });
  const emptyState = document.getElementById('emptyState');
  if(emptyState) emptyState.style.display = visibleCount===0 ? 'block' : 'none';
  updateFeedSummary(visibleCount, totalIndx);
}

function updateFeedSummary(count, total){
  const el = document.getElementById('feedSummary');
  if(!el) return;
  el.textContent = count===0 ? '' : ('📊 '+count+' creator'+(count===1?'':'s')+' shown · '+total.toFixed(1)+' INDX earned today (visible, example data)');
}

// GOD MODE PATCH: now also re-filters the feed after switching the active chip
function setFilter(el){document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));el.classList.add('active');filterFeed();}
// GOD MODE PATCH: now also re-filters the feed after switching the active nation pill
function setNation(el){document.querySelectorAll('.nation-pill').forEach(p=>p.classList.remove('active'));el.classList.add('active');filterFeed();}

document.addEventListener('DOMContentLoaded', function(){
  renderFollowState();
  filterFeed();
});

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event, __p0) { toggleFollowByName(String(__p0)); }


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
    }, false); })(EV.input);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, false); })(EV.click);

})();
