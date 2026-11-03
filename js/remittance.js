
const SUPABASE_URL      = 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const citizenId = sessionStorage.getItem('citizen_id');
const citizenName = sessionStorage.getItem('citizen_name') || 'citizen';
const INDX_PRICE = 0.24;

// AU corridors — Cook Islands first (origin story market)
const corridors={
  '🇦🇺→🇨🇰':{rate:1.65,curr:'NZD',flag:'🇨🇰'},
  '🇦🇺→🇻🇺':{rate:119.50,curr:'VUV',flag:'🇻🇺'},
  '🇦🇺→🇫🇯':{rate:2.27,curr:'FJD',flag:'🇫🇯'},
  '🇦🇺→🇼🇸':{rate:2.73,curr:'WST',flag:'🇼🇸'},
  '🇦🇺→🇹🇴':{rate:2.38,curr:'TOP',flag:'🇹🇴'},
  '🇦🇺→🇵🇬':{rate:3.85,curr:'PGK',flag:'🇵🇬'},
  '🇦🇺→🇵🇭':{rate:56.20,curr:'PHP',flag:'🇵🇭'},
  '🇦🇺→🇮🇳':{rate:83.50,curr:'INR',flag:'🇮🇳'},
  '🇦🇺→🇳🇬':{rate:1580,curr:'NGN',flag:'🇳🇬'}
};
// NZ corridors — Cook Islands first (80K Cook Islanders in NZ vs 28K in AU)
const nzCorridors={
  '🇳🇿→🇨🇰':{rate:1.65,curr:'NZD',flag:'🇨🇰'},
  '🇳🇿→🇼🇸':{rate:2.73,curr:'WST',flag:'🇼🇸'},
  '🇳🇿→🇹🇴':{rate:2.38,curr:'TOP',flag:'🇹🇴'},
  '🇳🇿→🇫🇯':{rate:2.27,curr:'FJD',flag:'🇫🇯'},
  '🇳🇿→🇻🇺':{rate:119.50,curr:'VUV',flag:'🇻🇺'},
  '🇳🇿→🇵🇭':{rate:56.20,curr:'PHP',flag:'🇵🇭'},
  '🇳🇿→🇮🇳':{rate:83.50,curr:'INR',flag:'🇮🇳'}
};
// Western Union actual fee rates per corridor (documented)
const wuFee={
  '🇦🇺→🇨🇰':0.060,'🇳🇿→🇨🇰':0.060,
  '🇦🇺→🇻🇺':0.065,'🇳🇿→🇻🇺':0.065,
  '🇦🇺→🇫🇯':0.058,'🇳🇿→🇫🇯':0.058,
  '🇦🇺→🇼🇸':0.072,'🇳🇿→🇼🇸':0.072,
  '🇦🇺→🇹🇴':0.093,'🇳🇿→🇹🇴':0.093,  // 9.3% — highest Pacific corridor
  '🇦🇺→🇵🇬':0.068,
  '🇦🇺→🇵🇭':0.055,'🇳🇿→🇵🇭':0.055,
  '🇦🇺→🇮🇳':0.050,'🇳🇿→🇮🇳':0.050,
  '🇦🇺→🇳🇬':0.080
};
// Corridor-specific notes (shown when active)
const corridorNotes={
  '🇦🇺→🇹🇴':'💡 Western Union charges 9.3% to Tonga — the highest fee corridor in the Pacific. IN$DEX: 0.8% flat. That\'s an extra $85 back in your pocket on every $1,000.',
  '🇳🇿→🇹🇴':'💡 Western Union charges 9.3% to Tonga — the highest fee corridor in the Pacific. IN$DEX: 0.8% flat. That\'s an extra $85 back in your pocket on every $1,000.',
  '🇦🇺→🇨🇰':'🌴 Cook Islands — the origin of IN$DEX. One girl couldn\'t make change for $50. Now she can receive money in 45 seconds, no bank needed.',
  '🇳🇿→🇨🇰':'🌴 80,000 Cook Islanders live in New Zealand. IN$DEX was built for this corridor.'
};
let fromRegion = 'AU';
let activeKey = '🇦🇺→🇨🇰';
let curr = corridors[activeKey];

function setFrom(region, el) {
  fromRegion = region;
  document.querySelectorAll('.from-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  const set = region==='NZ' ? nzCorridors : corridors;
  const row = document.getElementById('corridorRow');
  row.innerHTML = '';
  let first = true;
  for(const key of Object.keys(set)){
    const chip = document.createElement('div');
    chip.className = 'corridor-chip'+(first?' active':'');
    chip.textContent = key;
    const k = key;
    chip.onclick = function(){ selectCorridor(this,k); };
    row.appendChild(chip);
    if(first){ curr=set[key]; activeKey=key; first=false; }
  }
  updateFX();
}
function selectCorridor(el,key){
  document.querySelectorAll('.corridor-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  const set = fromRegion==='NZ' ? nzCorridors : corridors;
  curr=set[key]; activeKey=key;
  updateFX();
}
function updateFX(){
  const amt=parseFloat(document.getElementById('sendAmt').value)||0;
  const recv=amt*curr.rate*0.992;
  document.getElementById('fxRate').textContent=`1 USD = ${curr.rate.toLocaleString()} ${curr.curr}`;
  document.getElementById('theyGet').textContent=amt>0?`${recv.toLocaleString('en-AU',{maximumFractionDigits:0})} ${curr.curr}`:'';
  // Compare strip — all dynamic
  // NOTE: a "Wise" comparison row was removed here — it hardcoded a ~12% implied fee
  // (0.88 factor) attributed to a real, named competitor with no cited source. Wise's
  // actual published fees run roughly 0.3%-1.2% for AUD/NZD-class corridors, so the old
  // figure was a fabricated, materially wrong claim about a real company. The Western
  // Union figures below are attributed to World Bank RPW Q3 2025 (see .wb-attr note).
  const indxPer100=(100*curr.rate*0.992);
  const wuPct=wuFee[activeKey]||0.060;
  const wuPer100=(100*curr.rate*(1-wuPct));
  const bankPer100=(100*curr.rate*0.955);
  document.getElementById('indxComp').textContent=`${curr.curr} ${indxPer100.toLocaleString('en-AU',{maximumFractionDigits:0})}`;
  document.getElementById('wuComp').textContent=`${curr.curr} ${wuPer100.toLocaleString('en-AU',{maximumFractionDigits:0})}`;
  document.getElementById('bankComp').textContent=`${curr.curr} ${bankPer100.toLocaleString('en-AU',{maximumFractionDigits:0})}`;
  // WU bar width — proportional to how much less they get vs INDX
  document.getElementById('wuBar').style.width=Math.round((wuPer100/indxPer100)*97)+'%';
  document.getElementById('bankBar').style.width=Math.round((bankPer100/indxPer100)*97)+'%';
  // Corridor note
  const note=corridorNotes[activeKey]||'';
  const noteEl=document.getElementById('corridorNote');
  noteEl.textContent=note; noteEl.style.display=note?'block':'none';
}
function selectRec(el){
  document.querySelectorAll('.recipient-item').forEach(r=>r.classList.remove('selected'));
  el.classList.add('selected');
}

// HONESTY FIX — recipients are rendered only from what this citizen has actually saved
// (localStorage 'savedRecipients', written for real by saveRecipient() after a real send).
// No fabricated names/bank details are shown to a fresh account.
function escapeHtml(s){
  return String(s==null?'':s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function renderRecipients(){
  const list = document.getElementById('recipientList');
  const empty = document.getElementById('recipientEmpty');
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('savedRecipients') || '[]'); } catch(e){}
  if (!list || !empty) return;
  if (!saved.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  const bgs = ['rgba(0,212,255,0.15)','rgba(139,63,232,0.15)','rgba(0,229,160,0.12)','rgba(43,53,216,0.18)'];
  list.innerHTML = saved.map(function(r, i){
    return '<div class="recipient-item'+(i===0?' selected':'')+'" data-action="selectRec" data-args="[&quot;$this&quot;]" style="margin-top:'+(i===0?'0':'6px')+';">' +
      '<div class="ri-avatar" style="background:'+bgs[i%bgs.length]+';">👤</div>' +
      '<div><div class="ri-name">'+escapeHtml(r.name)+'</div><div class="ri-detail">'+escapeHtml(r.detail||'IN$DEX citizen')+'</div></div>' +
      '<div class="ri-check">✓</div></div>';
  }).join('');
}

let _lastSendArgs = null;

async function doSend(){
  const amt = parseFloat(document.getElementById('sendAmt').value)||0;
  if(amt<=0){showToast('Enter an amount to send');return;}
  const selected = document.querySelector('.recipient-item.selected');
  if(!selected){ showToast('Add a saved recipient, or send a Sovereign Link to someone new'); return; }
  const recName = selected.querySelector('.ri-name').textContent;
  const recDetail = selected.querySelector('.ri-detail').textContent;
  const indxAmt = amt / INDX_PRICE;
  const btn = document.getElementById('sendBtn');
  btn.disabled=true; btn.textContent='Sending…';
  if(!citizenId){
    // No citizen session — forward to onboarding instead of faking a transfer that
    // never happened (same convention as pay.html's joinAndPay()).
    const dest = new URL('onboarding-flow.html', window.location.href);
    dest.searchParams.set('after_join', 'remittance.html');
    window.location.href = dest.toString();
    return;
  }
  try{
    const domain = recName.toLowerCase().replace(/\s+/g,'').replace(/\.indx$/i,'') + '.IN$DEX';
    const rpcArgs = {
      p_sender_id:         citizenId,
      p_recipient_address: domain,
      p_amount:             indxAmt,
      p_note:              `Remittance to ${recName} · ${curr.curr}`
    };
    const {data,error} = await sb.rpc('transfer_indx', rpcArgs);
    if(error) throw error;
    // Approval Gateway: transfer_indx is risk_class>=3 in agent_registry (Session 100), so a
    // first call can come back a normal 200 {success:false, pending_approval:true, intent_id}
    // instead of sending -- must be checked before the generic failure branch below, or the
    // gate's message just shows as a dead-end red toast with no way to actually approve.
    if (data && data.pending_approval) {
      _lastSendArgs = { rpcArgs, amt, recName, recDetail, indxAmt };
      btn.disabled=false; btn.textContent='Send Money';
      await showTransferGate(data.intent_id);
      return;
    }
    // FIXED 2026-09-03: transfer_indx returns a normal 200 response with
    // success:false for expected rejections (recipient not found, self-send,
    // Tier 0 monthly limit) -- this used to only check the transport-level
    // `error` and always show the success screen regardless, faking a "sent"
    // confirmation for a transfer that never happened.
    if(!data || data.success===false){
      throw new Error((data && data.message) || 'Transfer failed — nothing was sent.');
    }
    if(data && data.new_balance!==undefined) sessionStorage.setItem('citizen_balance', data.new_balance);
    showSuccess(amt, recName, recDetail, indxAmt, data && data.tx_id);
  }catch(e){
    // ACCOUNT_FROZEN is a raw Postgres exception message, not something to show verbatim.
    const raw = e.message || 'Transfer failed';
    const msg = raw.includes('ACCOUNT_FROZEN') ? 'Your account is frozen — transfers are blocked. Unfreeze it from Emergency Freeze, or contact support.' : raw;
    showToast('❌ '+msg);
  }finally{
    btn.disabled=false; btn.textContent='Send Money';
  }
}

async function showTransferGate(intentId){
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
}

function closeGateSheet(){
  document.getElementById('gateOverlay').classList.remove('open');
}

async function approveGateAndResend(){
  const gbtn = document.getElementById('gateApproveBtn');
  const intentId = gbtn.dataset.intentId;
  gbtn.disabled = true; gbtn.textContent = 'Approving…';
  try {
    const { data: grant } = await sb.rpc('grant_intent_approval', { p_intent_id: intentId, p_level: 1, p_method: 'citizen_app_confirm' });
    if (!grant || !grant.success) throw new Error('Approval could not be recorded.');
    closeGateSheet();
    if (_lastSendArgs) {
      // Re-run doSend()'s own RPC call with the identical args — the terms-hash match
      // clears the gate server-side and the transfer executes for real this time.
      const btn = document.getElementById('sendBtn');
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const { data, error } = await sb.rpc('transfer_indx', _lastSendArgs.rpcArgs);
        if (error) throw error;
        if (!data || data.success === false) throw new Error((data && data.message) || 'Transfer failed — nothing was sent.');
        if (data.new_balance !== undefined) sessionStorage.setItem('citizen_balance', data.new_balance);
        showSuccess(_lastSendArgs.amt, _lastSendArgs.recName, _lastSendArgs.recDetail, _lastSendArgs.indxAmt, data.tx_id);
      } catch (e) {
        const raw = e.message || 'Transfer failed';
        const msg = raw.includes('ACCOUNT_FROZEN') ? 'Your account is frozen — transfers are blocked. Unfreeze it from Emergency Freeze, or contact support.' : raw;
        showToast('❌ ' + msg);
      } finally {
        btn.disabled = false; btn.textContent = 'Send Money';
      }
    }
  } catch (e) {
    showToast(e.message || 'Approval failed. Try again.');
  } finally {
    gbtn.disabled = false; gbtn.textContent = 'Approve & Send';
  }
}
// ── Remittance Agent — added 2026-09-04. Calls the separate remittance-agent edge
// function (not siindex-runtime). Only ever proposes {amount, currency, recipient_text} —
// never sends anything itself. sb.functions.invoke() attaches the current Supabase Auth
// session automatically, same as sb.rpc() elsewhere on this page. ──
function raLogMsg(role, text){
  const log = document.getElementById('raLog');
  const div = document.createElement('div');
  div.className = 'ra-msg ' + role;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}
function raLogProposal(text){
  const log = document.getElementById('raLog');
  const div = document.createElement('div');
  div.className = 'ra-proposal';
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}
function raAllCorridors(){
  const out = [];
  const add = (set, fromLabel) => Object.keys(set).forEach(k => {
    const c = set[k];
    out.push({ label: fromLabel + ' → ' + c.flag, from: fromLabel, to: c.curr, rate: c.rate });
  });
  add(corridors, 'AUD');
  add(nzCorridors, 'NZD');
  return out;
}
async function sendRaMessage(){
  const input = document.getElementById('raInput');
  const text = input.value.trim();
  if (!text) return;
  if (!citizenId) {
    raLogMsg('agent', 'Sign in to ask SIINDEX about a transfer.');
    return;
  }
  raLogMsg('me', text);
  input.value = '';
  const btn = document.getElementById('raSendBtn');
  btn.disabled = true; btn.textContent = '…';
  try {
    const { data, error } = await sb.functions.invoke('remittance-agent', {
      body: { message: text, corridors: raAllCorridors() }
    });
    if (error) {
      // supabase-js surfaces any non-2xx response as `error`, with the actual JSON body
      // (from remittance-agent's own json() responses) reachable via error.context.
      let reason = null;
      try { reason = (await error.context.json())?.error; } catch (e2) {}
      raLogMsg('agent', reason === 'not_authenticated' || reason === 'no_citizen_record'
        ? 'I can only help once you have a verified account — complete phone verification first.'
        : 'Could not reach the assistant — try again.');
      return;
    }
    if (data.error) {
      raLogMsg('agent', data.error === 'model_provider_not_configured'
        ? 'The assistant is not switched on yet — not live for this project.'
        : 'Could not reach the assistant — try again.');
      return;
    }
    if (data.reply) raLogMsg('agent', data.reply);
    if (data.proposal) {
      const p = data.proposal;
      raLogProposal('Proposed: ' + (p.currency || curr.curr || 'AUD') + ' ' + p.amount + ' to "' + p.recipient_text + '" — review below.');
      // Pre-fill the real amount field (same field doSend() reads) — never auto-sends.
      if (p.amount) document.getElementById('sendAmt').value = p.amount;
      updateFX();
      // Try to match an already-saved recipient by name (case-insensitive substring) so the
      // citizen doesn't have to re-select it — falls back to asking them to pick/add one.
      const items = Array.from(document.querySelectorAll('.recipient-item'));
      const needle = String(p.recipient_text || '').toLowerCase();
      const match = items.find(el => needle && el.querySelector('.ri-name').textContent.toLowerCase().includes(needle));
      if (match) {
        items.forEach(el => el.classList.remove('selected'));
        match.classList.add('selected');
        match.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        raLogMsg('agent', 'I don\'t see "' + p.recipient_text + '" in your saved recipients — pick one above or add them, then tap Send Money.');
      }
      document.getElementById('sendBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (data.account_frozen) raLogMsg('agent', 'Note: your account is currently frozen — sending will be blocked until you unfreeze it.');
  } catch (e) {
    raLogMsg('agent', 'Could not reach the assistant — try again.');
  } finally {
    btn.disabled = false; btn.textContent = 'Ask';
  }
}

let _lastSavings = null;
let _lastRecipient = null;

function showSuccess(amt, name, detail, indxAmt, txId){
  const recvLocal = (amt * curr.rate * 0.992).toLocaleString('en-AU',{maximumFractionDigits:0});
  // Real transaction id from transfer_indx when available — never a fabricated hash.
  const txRef = txId ? String(txId).slice(0,8) : null;

  document.getElementById('successMsg').innerHTML =
    `<strong>${recvLocal} ${curr.curr}</strong> sent to ${name}.<br>
     <span style="font-size:12px;color:rgba(240,242,255,0.4);">${txRef ? 'Ref: ' + txRef + ' · ' : ''}98/2 Civilisation Law applied</span>`;

  // Savings vs WU
  const wuPct = wuFee[activeKey] || 0.060;
  const savedAmt = (amt * (wuPct - 0.008)).toFixed(2);
  if(amt >= 5 && parseFloat(savedAmt) > 0.01){
    document.getElementById('savingsAmount').textContent = '$' + savedAmt + ' USD';
    document.getElementById('savingsDesc').textContent =
      `vs Western Union on this $${amt} transfer · World Bank RPW Q3 2025`;
    document.getElementById('savingsCard').style.display = 'block';
    _lastSavings = { amt, savedAmt, name, recvLocal, currency: curr.curr };
  } else {
    document.getElementById('savingsCard').style.display = 'none';
  }

  // Status trail — step 4. NOTE: no SMS provider is wired up yet (same gap as the
  // OTP flow in biometric-kyc.html), so this can't honestly claim "notified via SMS".
  // It shows what's actually true: the funds are in their account now.
  document.getElementById('stNotify').classList.remove('done');
  document.getElementById('notifyLabel').textContent = name + ' can view it now';
  setTimeout(() => document.getElementById('stNotify').classList.add('done'), 1500);

  // Save recipient prompt
  _lastRecipient = { name, detail };
  document.getElementById('saveRecipientName').textContent = name + ' — ' + detail;
  document.getElementById('saveRecipientCard').style.display = 'block';

  document.getElementById('successOverlay').style.display = 'block';
}

function resetSend(){
  document.getElementById('successOverlay').style.display = 'none';
  document.getElementById('savingsCard').style.display = 'none';
  document.getElementById('saveRecipientCard').style.display = 'none';
  document.getElementById('sendAmt').value = '';
  document.getElementById('sendBtn').disabled = false;
  document.getElementById('sendBtn').textContent = 'Send Money';
}

function shareSavings(){
  if(!_lastSavings) return;
  const { amt, savedAmt, name, recvLocal, currency } = _lastSavings;
  const msg = `I just sent ${recvLocal} ${currency} to ${name} via IN\$DEX and saved $${savedAmt} USD vs Western Union. `+
    `They charge up to 9.3% in the Pacific. IN\$DEX: 0.8% flat. Join me: https://imagenationdex.vercel.app`;
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}

function saveRecipient(){
  if(!_lastRecipient) return;
  const saved = JSON.parse(localStorage.getItem('savedRecipients') || '[]');
  const exists = saved.find(r => r.name === _lastRecipient.name);
  if(!exists) saved.push(_lastRecipient);
  localStorage.setItem('savedRecipients', JSON.stringify(saved));
  renderRecipients();
  document.getElementById('saveRecipientCard').style.display = 'none';
  showToast('✓ Saved — 1-tap sending next time');
}

function toggleRecurring(cb){
  document.getElementById('recurringOptions').style.display = cb.checked ? 'block' : 'none';
  if(cb.checked) showToast('✓ SIINDEX will repeat this transfer');
}
function updateRcrLabel(){}
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.style.opacity='1';setTimeout(()=>t.style.opacity='0',2500);}

// ── SOVEREIGN LINK FLOW ──
let _inviteLink = '';
let _inviteData = {};

function openInviteSheet() {
  const amt = parseFloat(document.getElementById('sendAmt').value) || 0;
  const recv = amt > 0 ? (amt * curr.rate * 0.992).toLocaleString('en-AU',{maximumFractionDigits:0}) : '—';
  document.getElementById('inviteAmtDisplay').textContent = amt > 0 ? '$'+amt+' USD' : '—';
  document.getElementById('inviteRecvDisplay').textContent = amt > 0 ? recv+' '+curr.curr : '—';
  document.getElementById('invitePhone').value = '';
  document.getElementById('inviteName').value = '';
  resetLinkBox();
  document.getElementById('inviteOverlay').classList.add('open');
}
function closeInviteSheet() {
  document.getElementById('inviteOverlay').classList.remove('open');
}
function resetLinkBox() {
  document.getElementById('linkBox').style.display = 'none';
  _inviteLink = '';
}
async function generateLink() {
  const phone = document.getElementById('invitePhone').value.trim();
  const name  = document.getElementById('inviteName').value.trim();
  if (!phone) { showToast('Enter their phone number'); return; }
  if (!citizenId) { showToast('You need an IN$DEX account first — this creates a real pledge from your balance.'); return; }
  const amt = parseFloat(document.getElementById('sendAmt').value) || 0;
  if (amt <= 0) { showToast('Enter an amount to send first'); return; }
  const indxAmt = amt / INDX_PRICE;
  const genBtn = document.getElementById('generateLinkBtn');
  genBtn.disabled = true;
  try {
    const { data, error } = await sb.rpc('create_instant_invite', { p_referrer_id: citizenId, p_amount_indx: indxAmt });
    if (error) throw error;
    _inviteLink = 'https://www.imagenationdex.com/onboarding-flow.html?instant=' + encodeURIComponent(data.invite_code);
    _inviteData = { phone, name: name || 'your contact', amt, currency: curr.curr };
    document.getElementById('linkUrl').textContent = _inviteLink;
    document.getElementById('linkBox').style.display = 'block';
  } catch (e) {
    showToast('Could not create a real invite link — check your connection and try again.');
  } finally {
    genBtn.disabled = false;
  }
}
function sendViaSMS() {
  if (!_inviteLink) return;
  const senderDisplay = sessionStorage.getItem('citizen_name') || 'Someone';
  const nameGreet = _inviteData.name !== 'your contact' ? 'Hi ' + _inviteData.name + '! ' : 'Hi! ';
  const msg = nameGreet + senderDisplay + ' is sending you money via IN$DEX. Tap this link to claim it with just your phone number — no bank account needed:\n\n' + _inviteLink;
  window.location.href = 'sms:' + _inviteData.phone + '?body=' + encodeURIComponent(msg);
  setTimeout(() => { closeInviteSheet(); addPendingRecipient(_inviteData); }, 800);
}
function copyLink() {
  if (!_inviteLink) return;
  const finish = () => { closeInviteSheet(); addPendingRecipient(_inviteData); };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(_inviteLink).then(() => { showToast('✓ Sovereign Link copied'); setTimeout(finish, 600); }).catch(fallback);
  } else { fallback(); }
  function fallback() {
    const ta = document.createElement('textarea');
    ta.value = _inviteLink;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('✓ Link copied'); setTimeout(finish, 600);
  }
}
function addPendingRecipient(data) {
  const existing = document.getElementById('pendingRecipient');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'pending-item'; el.id = 'pendingRecipient';
  el.innerHTML = '<div class="pending-dot"></div><div><div class="pending-name">⏳ Waiting for ' + data.name + '…</div><div class="pending-sub">Sovereign Link sent to ' + data.phone + ' · Expires in 72 hrs</div></div><div class="pending-cancel" data-action="cancelPending">Cancel</div>';
  const addRow = document.querySelector('[onclick="openInviteSheet()"]');
  if (addRow) addRow.parentNode.insertBefore(el, addRow);
}
function cancelPending() {
  const el = document.getElementById('pendingRecipient');
  if (el) { el.style.opacity='0'; el.style.transition='opacity 0.3s'; setTimeout(()=>el.remove(),300); }
  showToast('Invitation cancelled');
}

updateFX();

// ════════════════════════════════════════════════
// GOD MODE — REMITTANCE.HTML
// ════════════════════════════════════════════════
const INDX_PRICE_USD = 0.24;
const REMIT_DRAFT_KEY    = 'indx_remittance_draft';
const REMIT_SAVINGS_KEY  = 'indx_remittance_savings';

// 1. AMOUNT PERSISTENCE — restore last amount + corridor from localStorage
(function restoreLastSession() {
  try {
    const raw = localStorage.getItem(REMIT_DRAFT_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (Date.now() - (d.ts || 0) > 7 * 24 * 3600 * 1000) { localStorage.removeItem(REMIT_DRAFT_KEY); return; }
    if (d.amt > 0) {
      document.getElementById('sendAmt').value = d.amt;
      updateFX();
    }
    if (d.activeKey) {
      const set = (d.fromRegion === 'NZ') ? nzCorridors : corridors;
      const chips = document.querySelectorAll('.corridor-chip');
      chips.forEach(c => {
        if (c.textContent.trim() === d.activeKey) {
          c.click();
        }
      });
    }
  } catch(e) {}
})();

function persistRemitState() {
  const amt = parseFloat(document.getElementById('sendAmt').value) || 0;
  const draft = { amt, activeKey, fromRegion, ts: Date.now() };
  localStorage.setItem(REMIT_DRAFT_KEY, JSON.stringify(draft));
}
document.getElementById('sendAmt').addEventListener('input', persistRemitState);

// 2. CUMULATIVE SAVINGS COUNTER
function loadSavingsCounter() {
  try {
    const total = parseFloat(localStorage.getItem(REMIT_SAVINGS_KEY) || '0');
    if (total >= 0.01) {
      document.getElementById('savingsCounterAmt').textContent = '$' + total.toFixed(2) + ' USD';
      document.getElementById('savingsCounter').classList.add('show');
    }
  } catch(e) {}
}
function addToSavings(amt) {
  try {
    const prev = parseFloat(localStorage.getItem(REMIT_SAVINGS_KEY) || '0');
    localStorage.setItem(REMIT_SAVINGS_KEY, (prev + amt).toFixed(2));
    loadSavingsCounter();
  } catch(e) {}
}

// Patch showSuccess to add savings to cumulative total
const origShowSuccess = showSuccess;
window.showSuccess = function(amt, name, detail, indxAmt) {
  origShowSuccess(amt, name, detail, indxAmt);
  const wuPct = wuFee[activeKey] || 0.060;
  const savedAmt = parseFloat((amt * (wuPct - 0.008)).toFixed(2));
  if (savedAmt > 0) addToSavings(savedAmt);
  persistRemitState();
};

// 3. SMART CORRIDOR AUTO-SUGGEST — match saved recipients' country
(function suggestCorridorFromSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem('savedRecipients') || '[]');
    if (!saved.length) return;
    // Country keywords to corridor key mappings
    const countryMap = {
      'Philippines':  '🇦🇺→🇵🇭', 'GCash': '🇦🇺→🇵🇭', 'Manila': '🇦🇺→🇵🇭',
      'Fiji':         '🇦🇺→🇫🇯', 'M-PAiSA': '🇦🇺→🇫🇯',
      'Samoa':        '🇦🇺→🇼🇸', 'MyCash': '🇦🇺→🇼🇸',
      'Tonga':        '🇦🇺→🇹🇴',
      'India':        '🇦🇺→🇮🇳',
      'Cook':         '🇦🇺→🇨🇰',
    };
    const last = saved[0];
    const detail = (last.detail || '').toLowerCase();
    const name   = (last.name   || '').toLowerCase();
    for (const [keyword, key] of Object.entries(countryMap)) {
      if (detail.includes(keyword.toLowerCase()) || name.includes(keyword.toLowerCase())) {
        // Auto-click the matching corridor chip
        const chips = document.querySelectorAll('.corridor-chip');
        chips.forEach(c => {
          if (c.textContent.trim() === key) {
            c.click();
            showToast('Corridor matched to ' + last.name);
          }
        });
        break;
      }
    }
  } catch(e) {}
})();

// 4. QUICK PRESETS
function setPreset(amt, el) {
  document.getElementById('sendAmt').value = amt;
  document.querySelectorAll('.qp-chip').forEach(c => c.classList.remove('qp-active'));
  el.classList.add('qp-active');
  updateFX();
  persistRemitState();
}
function clearPresets() {
  document.querySelectorAll('.qp-chip').forEach(c => c.classList.remove('qp-active'));
}

loadSavingsCounter();
renderRecipients();

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }
function h_2(event) { updateFX();clearPresets(); }
function h_3(event) { if(event.key==='Enter')sendRaMessage(); }
function h_4(event) { window.location.href='verifiable-receipt-nft.html'; }
function h_5(event) { document.getElementById('saveRecipientCard').style.display='none'; }
function h_6(event) { window.location.href='citizen-dashboard.html'; }
function h_7(event) { if(event.target===this)closeInviteSheet(); }
function h_8(event) { if(event.target===this)closeGateSheet(); }


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
    }, false); })(EV.keydown);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, false); })(EV.change);

})();
