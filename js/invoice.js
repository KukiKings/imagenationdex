
let lineCount=2,nftOn=false;

function toggleNFT(){
  nftOn=!nftOn;
  const t=document.getElementById('nftToggle');
  const k=t.querySelector('.tog-knob');
  t.style.background=nftOn?'var(--purple)':'var(--surface3)';
  k.style.right=nftOn?'3px':'auto';k.style.left=nftOn?'auto':'3px';
  document.getElementById('mintBtn').style.display=nftOn?'block':'none';
  document.getElementById('nftChipRow').style.display=nftOn?'block':'none';
}

function addLine(){
  const id=lineCount++;
  const d=document.getElementById('lineItems');
  const div=document.createElement('div');div.className='line-item';div.id='li'+id;
  div.innerHTML=`<input class="li-input" type="text" placeholder="Service / product" data-input-action="updateTotals">
    <input class="li-input" type="number" placeholder="1" value="1" data-input-action="updateTotals" style="text-align:center;">
    <input class="li-input" type="number" placeholder="0.00" data-input-action="updateTotals" style="text-align:right;">
    <button class="li-del" data-action="h_2" data-args="${JSON.stringify(["$event",id]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">×</button>`;
  d.appendChild(div);
}

function removeLine(id){
  const el=document.getElementById('li'+id);
  if(el)el.remove();updateTotals();
}

function updateTotals(){
  let sub=0;
  document.querySelectorAll('#lineItems .line-item').forEach(row=>{
    const inputs=row.querySelectorAll('input');
    const qty=parseFloat(inputs[1]?.value)||0;
    const rate=parseFloat(inputs[2]?.value)||0;
    sub+=qty*rate;
  });
  const fee=sub*0.008;const total=sub+fee;
  const curr=document.getElementById('currency').value;
  const rate=curr==='INDX'?0.24:1;
  document.getElementById('subtotal').textContent=sub.toFixed(2);
  document.getElementById('platformFee').textContent=fee.toFixed(2);
  document.getElementById('totalAmt').textContent=total.toFixed(2)+' '+curr;
  document.getElementById('audEquiv').textContent='USD equivalent: $'+(total*rate).toFixed(2);
  document.getElementById('prevTotal').textContent=total.toFixed(2)+' '+curr;
  updatePreview();
}

function updatePreview(){
  const fn=document.getElementById('fromName').value||'Your name';
  const fd=document.getElementById('fromDomain').value.toLowerCase();
  const tn=document.getElementById('toName').value||'';
  const dd=document.getElementById('dueDate').value;
  const inv=document.getElementById('invNum').value;
  document.getElementById('prevFrom').textContent=fd?`${fn} · ${fd}`:fn;
  document.getElementById('prevTo').textContent=tn;
  document.getElementById('prevDue').textContent=dd||'';
  document.getElementById('prevInvNum').textContent=inv;
  // GOD MODE PATCH: keep due-date status badge live as the user edits
  updateDueStatus();
}

function invoiceText(){
  const fn=document.getElementById('fromName').value||'Your name';
  const fd=document.getElementById('fromDomain').value;
  const tn=document.getElementById('toName').value||'Client';
  const inv=document.getElementById('invNum').value;
  const due=document.getElementById('dueDate').value;
  const total=document.getElementById('prevTotal').textContent;
  const lines=[];
  document.querySelectorAll('#lineItems .line-item').forEach(row=>{
    const inputs=row.querySelectorAll('input');
    const desc=inputs[0]?.value||'';
    const qty=inputs[1]?.value||'';
    const rate=inputs[2]?.value||'';
    if(desc) lines.push(`  ${desc} × ${qty} — ${rate}`);
  });
  return `Invoice ${inv}\nFrom: ${fn}${fd?' ('+fd+')':''}\nTo: ${tn}\nDue: ${due}\n\n${lines.join('\n')}\n\nTotal due: ${total}`;
}
function mintNFT(){showToast('Preview only — no Solana NFT minting is connected yet.');}
async function shareInvoice(){
  const text=invoiceText();
  try{ await navigator.clipboard.writeText(text); showToast('Invoice text copied — paste it to send to your client.'); }
  catch(e){ showToast('Could not access clipboard — select and copy the preview manually.'); }
}
function exportPDF(){ showToast('Opening print dialog — choose "Save as PDF".'); setTimeout(()=>window.print(),400); }
function sendInvoice(){showToast('No email/delivery is connected yet — use "Copy invoice text" and send it yourself.');}
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.style.opacity='1';setTimeout(()=>t.style.opacity='0',2500);}

// GOD MODE: invoice drafts/history, smart defaults, live due-date status, confirm-to-clear
const DRAFTS_KEY='indx_invoice_drafts';
const CLIENTS_KEY='indx_invoice_recent_clients';

function getDrafts(){ try{ return JSON.parse(localStorage.getItem(DRAFTS_KEY)||'[]'); }catch(e){ return []; } }
function getRecentClients(){ try{ return JSON.parse(localStorage.getItem(CLIENTS_KEY)||'[]'); }catch(e){ return []; } }

function loadSmartDefaults(){
  const name=sessionStorage.getItem('citizen_name')||'';
  const domain=sessionStorage.getItem('citizen_web3_domain')||'';
  const fromNameEl=document.getElementById('fromName');
  const fromDomainEl=document.getElementById('fromDomain');
  if(name && !fromNameEl.value) fromNameEl.value=name;
  if(domain && !fromDomainEl.value) fromDomainEl.value=domain;
  renderRecentClients();
}

function renderRecentClients(){
  const wrap=document.getElementById('recentClients');
  const clients=getRecentClients();
  if(!clients.length){ wrap.style.display='none'; wrap.innerHTML=''; return; }
  wrap.style.display='flex';
  wrap.innerHTML=clients.map((c,i)=>`<div class="recent-chip" data-action="h_3" data-args="${JSON.stringify(["$event",i]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${(c.name||c.domain||'Client').replace(/</g,'')}</div>`).join('');
}

function fillClient(i){
  const c=getRecentClients()[i];
  if(!c) return;
  document.getElementById('toName').value=c.name||'';
  document.getElementById('toDomain').value=c.domain||'';
  updatePreview();
  showToast('Filled client from recent history.');
}

function saveRecentClient(){
  const name=document.getElementById('toName').value.trim();
  const domain=document.getElementById('toDomain').value.trim();
  if(!name && !domain) return;
  let clients=getRecentClients().filter(c=>c.name!==name || c.domain!==domain);
  clients.unshift({name,domain});
  clients=clients.slice(0,5);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  renderRecentClients();
}

function updateDueStatus(){
  const dueVal=document.getElementById('dueDate').value;
  const badge=document.getElementById('invStatusBadge');
  const cd=document.getElementById('dueCountdown');
  if(!badge||!cd) return;
  if(!dueVal){ cd.textContent=''; return; }
  const due=new Date(dueVal+'T23:59:59');
  const now=new Date();
  const diffDays=Math.ceil((due-now)/864e5);
  badge.classList.remove('status-soon','status-overdue');
  if(diffDays<0){
    badge.textContent='OVERDUE';
    badge.classList.add('status-overdue');
    cd.textContent=`Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays)===1?'':'s'}`;
    cd.className='due-countdown overdue';
  } else if(diffDays<=2){
    badge.textContent='DUE SOON';
    badge.classList.add('status-soon');
    cd.textContent=diffDays===0?'Due today':`Due in ${diffDays} day${diffDays===1?'':'s'}`;
    cd.className='due-countdown soon';
  } else {
    badge.textContent='UNPAID';
    cd.textContent=`Due in ${diffDays} days`;
    cd.className='due-countdown ok';
  }
}

function saveDraft(){
  const drafts=getDrafts();
  const items=[];
  document.querySelectorAll('#lineItems .line-item').forEach(row=>{
    const inputs=row.querySelectorAll('input');
    items.push({desc:inputs[0]?.value||'',qty:inputs[1]?.value||'',rate:inputs[2]?.value||''});
  });
  const draft={
    id:Date.now(),
    invNum:document.getElementById('invNum').value||'INV',
    fromName:document.getElementById('fromName').value,
    fromDomain:document.getElementById('fromDomain').value,
    toName:document.getElementById('toName').value,
    toDomain:document.getElementById('toDomain').value,
    dueDate:document.getElementById('dueDate').value,
    currency:document.getElementById('currency').value,
    items,
    total:document.getElementById('totalAmt').textContent,
    savedAt:new Date().toISOString()
  };
  drafts.unshift(draft);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0,20)));
  saveRecentClient();
  showToast('Draft saved to this device.');
  renderHistory();
}

function renderHistory(){
  const list=document.getElementById('historyList');
  const drafts=getDrafts();
  if(!drafts.length){ list.innerHTML='<div class="empty-history">No saved invoices yet. Tap 💾 to save one.</div>'; return; }
  list.innerHTML=drafts.map(d=>`
    <div class="history-item">
      <div class="history-info">
        <div class="history-inv">${d.invNum||'INV'} · ${d.total||''}</div>
        <div class="history-meta">${d.toName||'No client'} · ${new Date(d.savedAt).toLocaleDateString()}</div>
      </div>
      <div class="history-actions">
        <button class="btn-history-load" data-action="h_4" data-args="${JSON.stringify(["$event",d.id]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" aria-label="Load draft">↩︎</button>
        <button class="btn-history-del" data-action="h_5" data-args="${JSON.stringify(["$event",d.id]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" aria-label="Delete draft">🗑</button>
      </div>
    </div>
  `).join('');
}

function loadDraft(id){
  const draft=getDrafts().find(d=>d.id===id);
  if(!draft) return;
  document.getElementById('invNum').value=draft.invNum||'';
  document.getElementById('fromName').value=draft.fromName||'';
  document.getElementById('fromDomain').value=draft.fromDomain||'';
  document.getElementById('toName').value=draft.toName||'';
  document.getElementById('toDomain').value=draft.toDomain||'';
  document.getElementById('dueDate').value=draft.dueDate||'';
  document.getElementById('currency').value=draft.currency||'INDX';
  const wrap=document.getElementById('lineItems');
  wrap.innerHTML='';
  lineCount=0;
  (draft.items||[]).forEach(it=>{
    const id2=lineCount++;
    const div=document.createElement('div');div.className='line-item';div.id='li'+id2;
    div.innerHTML=`<input class="li-input" type="text" placeholder="Service / product" value="${(it.desc||'').replace(/"/g,'&quot;')}" data-input-action="updateTotals">
      <input class="li-input" type="number" placeholder="1" value="${it.qty||1}" data-input-action="updateTotals" style="text-align:center;">
      <input class="li-input" type="number" placeholder="0.00" value="${it.rate||''}" data-input-action="updateTotals" style="text-align:right;">
      <button class="li-del" data-action="h_2" data-args="${JSON.stringify(["$event",id2]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">×</button>`;
    wrap.appendChild(div);
  });
  if(!lineCount) addLine();
  updateTotals();
  closeHistory();
  showToast('Draft loaded.');
}

function deleteDraft(id){
  const drafts=getDrafts().filter(d=>d.id!==id);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  renderHistory();
  showToast('Draft deleted.');
}

function openHistory(){
  renderHistory();
  document.getElementById('historyOverlay').classList.add('open');
  document.getElementById('historySheet').classList.add('open');
}
function closeHistory(){
  document.getElementById('historyOverlay').classList.remove('open');
  document.getElementById('historySheet').classList.remove('open');
}

function requestNewInvoice(){
  document.getElementById('confirmOverlay').classList.add('open');
  document.getElementById('confirmBox').classList.add('open');
}
function cancelNewInvoice(){
  document.getElementById('confirmOverlay').classList.remove('open');
  document.getElementById('confirmBox').classList.remove('open');
}
function confirmNewInvoice(){
  document.getElementById('fromName').value='';
  document.getElementById('fromDomain').value='';
  document.getElementById('toName').value='';
  document.getElementById('toDomain').value='';
  document.getElementById('invNum').value='INV-0001';
  document.getElementById('dueDate').value=new Date(Date.now()+30*864e5).toISOString().split('T')[0];
  document.getElementById('currency').value='INDX';
  document.getElementById('lineItems').innerHTML='';
  lineCount=0;
  addLine();
  updateTotals();
  cancelNewInvoice();
  loadSmartDefaults();
  showToast('New invoice — form cleared.');
}

// init date
document.getElementById('dueDate').value=new Date(Date.now()+30*864e5).toISOString().split('T')[0];
updateTotals();
// GOD MODE PATCH: init smart defaults + live due-date status, refreshed every 60s
loadSmartDefaults();
updateDueStatus();
setInterval(updateDueStatus,60000);

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }
function h_2(event, __p0) { removeLine(__p0); }
function h_3(event, __p0) { fillClient(__p0); }
function h_4(event, __p0) { loadDraft(__p0); }
function h_5(event, __p0) { deleteDraft(__p0); }


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
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, false); })(EV.change);

})();
