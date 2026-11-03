
  let currentTab = 'bank';
  const INDX_PRICE_USD = 0.24; // USD per INDX
  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const citizenId = sessionStorage.getItem('citizen_id');

  // ── REAL AUTH FIX (God Mode) ──────────────────────────────────────────
  // Found 2026-07-23, same bug class already fixed in staking.html/card-freeze.html/
  // emergency-freeze.html/guardian-setup.html: this screen's withdraw_indx and
  // get_withdrawal_history RPC calls sent the anon key as their Bearer token, but
  // those functions correctly have EXECUTE revoked from anon (verified via
  // information_schema.role_routine_grants — empty result for both routine names)
  // — meaning every real citizen's withdrawal has been silently 403'ing while the
  // UI acted like it succeeded. Fixed the same way as the other screens: use the
  // real Supabase Auth access_token when a genuine session exists, anon key otherwise.
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

  // ── Real balance from Supabase (was sessionStorage guess with a fake 1250 default) ──
  let citizenBalance = 0;
  async function applyBalance() {
    const balEl = document.getElementById('balanceIndx');
    const audEl = document.getElementById('balanceAud');
    if (!citizenId) { if (balEl) balEl.textContent = '— INDX'; return; }
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/citizens?id=eq.' + citizenId + '&select=indx_balance', { headers: rpcHeaders() });
      const rows = await res.json();
      citizenBalance = rows && rows[0] ? parseFloat(rows[0].indx_balance) : 0;
    } catch (e) { citizenBalance = 0; }
    if (balEl) balEl.textContent = citizenBalance.toLocaleString(undefined,{maximumFractionDigits:2}) + ' INDX';
    if (audEl) audEl.textContent = '≈ $' + (citizenBalance * INDX_PRICE_USD).toFixed(2);
    document.querySelectorAll('.chip.max').forEach(c => {
      (function (__e) { __e.setAttribute('data-action', 'h_1'); __e.setAttribute('data-args', JSON.stringify(["$event",citizenBalance])); })(c);
    });
  }

  // ---- TAB SWITCHING ----
  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('content-' + tab).classList.add('active');

    // Update fee label
    document.getElementById('feeNetLabel').textContent = tab === 'bank' ? 'Bank processing' : '~Network fee';
    updateFees();
  }

  // ---- AMOUNT HELPERS ----
  function setAmount(tab, val) {
    const input = tab === 'bank' ? document.getElementById('bankAmount') : document.getElementById('cryptoAmount');
    input.value = val;
    updateFees();
    showToast('✓ ' + val + ' INDX selected');
  }

  function getAmount() {
    const id = currentTab === 'bank' ? 'bankAmount' : 'cryptoAmount';
    return parseFloat(document.getElementById(id).value) || 0;
  }

  // ---- FEE CALC ----
  function updateFees() {
    const amt = getAmount();
    const audId = currentTab === 'bank' ? 'bankAud' : 'cryptoAud';
    const audEl = document.getElementById(audId);

    if (amt > 0) {
      audEl.innerHTML = '≈ <span>$' + (amt * INDX_PRICE_USD).toFixed(2) + ' USD</span>';
    } else {
      audEl.innerHTML = '≈ <span>$0.00</span>';
    }

    if (amt <= 0) {
      document.getElementById('feeAmount').textContent = '';
      document.getElementById('feeCivil').textContent = '';
      document.getElementById('feeNet').textContent = '';
      document.getElementById('feeReceive').textContent = '';
      document.getElementById('confirmBtn').disabled = true;
      return;
    }

    const civil = amt * 0.02;
    const netFee = currentTab === 'bank' ? 0 : 0.0005;
    const receive = amt - civil - netFee;

    document.getElementById('feeAmount').textContent = amt.toFixed(2) + ' INDX';
    document.getElementById('feeCivil').textContent = '-' + civil.toFixed(4) + ' INDX';
    document.getElementById('feeNet').textContent = currentTab === 'bank' ? 'Free' : '~' + netFee + ' SOL';
    document.getElementById('feeReceive').textContent = currentTab === 'bank'
      ? '$' + (receive * INDX_PRICE_USD).toFixed(2) + ' USD'
      : receive.toFixed(4) + ' INDX';

    document.getElementById('confirmBtn').disabled = (amt > citizenBalance || amt <= 0);
  }

  // ---- SAVED ACCOUNTS ----
  let selectedSaved = 1;
  function selectSaved(n) {
    selectedSaved = n;
    document.querySelectorAll('.saved-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('saved' + n).classList.add('selected');
  }

  function showNewAccountForm() {
    const f = document.getElementById('newAccountForm');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
  }

  function formatBSB(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 3) v = v.slice(0,3) + '-' + v.slice(3);
    input.value = v;
  }

  // ---- NETWORK SELECTION ----
  function selectNet(el, net) {
    document.querySelectorAll('.net-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('cryptoToken').textContent = net;
  }

  // ---- WALLET ADDR ----
  function validateAddr() {
    const addr = document.getElementById('walletAddr').value.trim();
    const status = document.getElementById('addrStatus');
    if (addr.length === 0) { status.textContent = ''; return; }
    if (addr.length >= 32) {
      status.textContent = '✓ Address looks valid';
      status.style.color = 'var(--green)';
    } else {
      status.textContent = '⚠ Address too short';
      status.style.color = 'var(--red)';
    }
  }

  async function pasteAddr() {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('walletAddr').value = text;
      validateAddr();
    } catch {
      showToast('📋 Paste from clipboard manually');
    }
  }

  // ---- CONFIRM FLOW ----
  let pendingWithdraw = null;

  function openConfirmSheet() {
    const amt = getAmount();
    if (amt <= 0) return;
    if (!citizenId) { showToast('No citizen session found — please log in'); return; }

    const civil = amt * 0.02;
    const receive = amt - civil;

    let dest, recipientLabel, method;
    if (currentTab === 'bank') {
      const bsb = document.querySelector('#newAccountForm .form-input')?.value || '';
      const acc = document.querySelectorAll('#newAccountForm .form-input')[1]?.value || '';
      const bankName = document.querySelectorAll('#newAccountForm .form-input')[3]?.value || '';
      if (bsb && acc) {
        dest = bsb + ' ' + acc;
        recipientLabel = bankName || 'Bank account';
      } else {
        const bankNames = ['Commonwealth Bank ••4821 (example)', 'NAB Savings ••7392 (example)'];
        dest = bankNames[selectedSaved - 1];
        recipientLabel = dest;
      }
      method = 'bank';
    } else {
      const addr = document.getElementById('walletAddr').value.trim();
      if (addr.length < 32) {
        showToast('⚠️ Enter a valid wallet address first');
        return;
      }
      dest = addr;
      const net = document.getElementById('cryptoToken').textContent || 'SOL';
      recipientLabel = net + ' wallet ' + addr.slice(0,6) + '…' + addr.slice(-4);
      method = net.toLowerCase();
    }
    pendingWithdraw = { amt, dest, recipientLabel, method };

    document.getElementById('sheetAmount').textContent = amt.toFixed(2) + ' INDX';
    document.getElementById('sheetAmountSub').textContent = currentTab === 'bank'
      ? '≈ $' + (amt * INDX_PRICE_USD).toFixed(2) + ' USD to bank'
      : 'to crypto wallet';

    document.getElementById('sheetSubText').textContent = currentTab === 'bank'
      ? 'Real INDX debit now · bank settlement not automated yet'
      : 'Irreversible — double-check address';

    document.getElementById('sheetDetails').innerHTML = `
      <div class="confirm-row">
        <div class="lbl">To</div>
        <div class="val">${dest}</div>
      </div>
      <div class="confirm-row">
        <div class="lbl">2% Civil Fee</div>
        <div class="val" style="color:var(--red)">-${civil.toFixed(4)} INDX</div>
      </div>
      <div class="confirm-row">
        <div class="lbl">You receive</div>
        <div class="val" style="color:var(--green)">${currentTab === 'bank' ? '$' + (receive * INDX_PRICE_USD).toFixed(2) + ' USD' : receive.toFixed(4) + ' INDX'}</div>
      </div>
    `;

    document.getElementById('sheetDefault').style.display = 'block';
    document.getElementById('sheetProcessing').style.display = 'none';
    document.getElementById('sheetApproval').style.display = 'none';
    document.getElementById('sheetSuccess').style.display = 'none';
    document.getElementById('confirmOverlay').classList.add('open');
  }

  function closeSheet() {
    document.getElementById('confirmOverlay').classList.remove('open');
  }

  async function executeWithdraw() {
    if (!pendingWithdraw) return;
    document.getElementById('sheetDefault').style.display = 'none';
    document.getElementById('sheetProcessing').style.display = 'block';
    document.getElementById('processingSub').textContent = 'Debiting your real INDX balance…';

    try {
      const result = await rpc('withdraw_indx', {
        p_citizen_id: citizenId,
        p_amount: pendingWithdraw.amt,
        p_method: pendingWithdraw.method,
        p_destination: pendingWithdraw.dest,
        p_recipient_label: pendingWithdraw.recipientLabel
      });

      // withdraw_indx returns a normal 200 with {success:false, pending_approval:true, intent_id}
      // when the Approval Gateway holds this action for explicit citizen sign-off — that is not
      // a network failure, so it must not fall into the catch block below or show a fake success.
      if (result && result.pending_approval) {
        await handleApprovalGate(result.intent_id);
        return;
      }

      showSuccess(result);
      await applyBalance();
    } catch (e) {
      document.getElementById('sheetProcessing').style.display = 'none';
      document.getElementById('sheetDefault').style.display = 'block';
      const msg = e.message.includes('ACCOUNT_FROZEN') ? 'Your account is frozen — withdrawal blocked'
        : e.message.includes('Insufficient') ? "You don't have enough INDX for this withdrawal"
        : 'Withdrawal failed — please try again';
      showToast(msg);
    }
  }

  // Approval Gateway: withdraw_indx is risk_class >= 3 in agent_registry, so a first call
  // creates a pending citizen_intents row instead of executing. Show the citizen what SIINDEX
  // is asking approval for, then on explicit approve, grant it and retry the exact same
  // withdrawal — request_action_approval() matches it by terms hash and lets it through.
  async function handleApprovalGate(intentId) {
    document.getElementById('sheetProcessing').style.display = 'none';
    document.getElementById('sheetDefault').style.display = 'none';
    let card = null;
    try { card = await rpc('get_action_intent_card', { p_intent_id: intentId }); } catch (e) {}
    document.getElementById('approvalText').textContent =
      (card && !card.error && card.data_involved)
        ? card.data_involved
        : 'This withdrawal needs your explicit approval before it can complete.';
    document.getElementById('sheetApproval').style.display = 'block';

    document.getElementById('approveGateBtn').onclick = async function () {
      document.getElementById('sheetApproval').style.display = 'none';
      document.getElementById('sheetProcessing').style.display = 'block';
      document.getElementById('processingSub').textContent = 'Recording your approval…';
      try {
        const grant = await rpc('grant_intent_approval', { p_intent_id: intentId, p_level: 1, p_method: 'citizen_app_confirm' });
        if (!grant || !grant.success) throw new Error('Approval could not be recorded');
        const result2 = await rpc('withdraw_indx', {
          p_citizen_id: citizenId,
          p_amount: pendingWithdraw.amt,
          p_method: pendingWithdraw.method,
          p_destination: pendingWithdraw.dest,
          p_recipient_label: pendingWithdraw.recipientLabel
        });
        if (result2 && result2.pending_approval) throw new Error('Approval did not clear — please try again');
        showSuccess(result2);
        await applyBalance();
      } catch (e) {
        document.getElementById('sheetProcessing').style.display = 'none';
        document.getElementById('sheetDefault').style.display = 'block';
        showToast('Approval failed — please try again');
      }
    };

    document.getElementById('declineGateBtn').onclick = function () {
      document.getElementById('sheetApproval').style.display = 'none';
      document.getElementById('sheetDefault').style.display = 'block';
    };
  }

  function showSuccess(result) {
    document.getElementById('sheetProcessing').style.display = 'none';
    document.getElementById('sheetSuccess').style.display = 'block';

    const amt = pendingWithdraw ? pendingWithdraw.amt : getAmount();
    const dest = pendingWithdraw ? pendingWithdraw.recipientLabel : (currentTab === 'bank' ? 'your bank' : 'your crypto wallet');
    document.getElementById('successSubText').textContent =
      currentTab === 'bank'
        ? `$${(amt * INDX_PRICE_USD * 0.98).toFixed(2)} USD queued for ${dest} — real debit done, bank settlement pending (not automated yet).`
        : `${(amt * 0.98).toFixed(4)} INDX logged to ${dest} — real debit done, on-chain send is not automated yet.`;

    const hash = result && result.tx_id ? result.tx_id.slice(0,12) + '…' : '';
    document.getElementById('txHash').innerHTML = 'TX: <span>' + hash + '</span>';
  }

  // ---- TOAST ----
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  // Close sheet on backdrop tap
  document.getElementById('confirmOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeSheet();
  });

  // ── GOD MODE: FEATURE 2 — Crypto address book ──
  function loadAddrBook() {
    const saved = JSON.parse(localStorage.getItem('indx_withdraw_addr_book') || '[]');
    const list = document.getElementById('addrBookList');
    const bookEl = document.getElementById('addrBook');
    list.innerHTML = '';
    if (saved.length === 0) { bookEl.style.display = 'none'; return; }
    bookEl.style.display = 'block';
    saved.slice(-3).reverse().forEach(item => {
      const el = document.createElement('div');
      el.className = 'addr-book-item';
      el.innerHTML = `
        <div>
          <div class="addr-book-label">${item.label || 'Saved wallet'}</div>
          <div class="addr-book-addr">${item.addr.slice(0,12)}…${item.addr.slice(-6)}</div>
        </div>
        <div class="addr-book-use" data-action="h_10" data-args="${JSON.stringify(["$event",item.addr]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">Use →</div>
      `;
      list.appendChild(el);
    });
  }

  function useAddrBookItem(addr) {
    document.getElementById('walletAddr').value = addr;
    validateAddr();
    showToast('Address loaded');
  }

  function saveAddrToBook() {
    // Only save on blur of a valid address
    const addr = document.getElementById('walletAddr').value.trim();
    if (addr.length < 32) return;
    const saved = JSON.parse(localStorage.getItem('indx_withdraw_addr_book') || '[]');
    // Avoid duplicates
    if (!saved.find(i => i.addr === addr)) {
      saved.push({ addr, label: 'Wallet ' + (saved.length + 1) });
      if (saved.length > 5) saved.shift();
      localStorage.setItem('indx_withdraw_addr_book', JSON.stringify(saved));
      loadAddrBook();
    }
  }
  document.getElementById('walletAddr').addEventListener('blur', saveAddrToBook);

  // ── GOD MODE: FEATURE 3 — Copy TX hash ──
  function copyTxHash() {
    const hashEl = document.getElementById('txHash').querySelector('span');
    if (!hashEl) return;
    const hash = hashEl.textContent;
    navigator.clipboard.writeText(hash).then(() => {
      showToast('TX hash copied');
    }).catch(() => showToast('Copy: ' + hash));
  }

  // ── GOD MODE: FEATURE 4 — Swipe-to-confirm for crypto ──
  (function initSwipe() {
    const wrap = document.getElementById('swipeWrap');
    const thumb = document.getElementById('swipeThumb');
    const track = document.getElementById('swipeTrack');
    let startX = 0, isDragging = false;

    function getWrapWidth() { return wrap.clientWidth - 56; }

    function onStart(e) {
      isDragging = true;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
    }
    function onMove(e) {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const dx = Math.max(0, Math.min(clientX - startX, getWrapWidth() - 8));
      thumb.style.transform = 'translateX(' + dx + 'px)';
      const pct = dx / (getWrapWidth() - 8);
      track.style.opacity = 1 - pct;
      if (pct >= 0.95) completeSwipe();
    }
    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      const current = new WebKitCSSMatrix(getComputedStyle(thumb).transform).m41 || 0;
      if (current < (getWrapWidth() - 8) * 0.95) {
        thumb.style.transform = '';
        track.style.opacity = '';
      }
    }
    function completeSwipe() {
      isDragging = false;
      wrap.classList.add('confirmed');
      track.textContent = '✓ Confirmed';
      thumb.style.transform = 'translateX(' + (getWrapWidth() - 8) + 'px)';
      setTimeout(() => openConfirmSheet(), 300);
    }

    thumb.addEventListener('mousedown', onStart);
    thumb.addEventListener('touchstart', onStart, { passive:true });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive:true });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  })();

  // ── GOD MODE: FEATURE 5 — Cybertron Hex Canvas ──
  (function(){
    const cv = document.getElementById('cyberCanvasWd');
    const ctx = cv.getContext('2d');
    const N = 20;
    let W, H, nodes = [], lastT = 0;
    const FRAME_MS = 1000/22;
    function resize(){ W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    const HEX = ['#8B3FE8','#00D4FF','#2B35D8','#00E5A0'];
    for(let i=0;i<N;i++) nodes.push({x:Math.random()*1000,y:Math.random()*1000,vx:(Math.random()-0.5)*0.36,vy:(Math.random()-0.5)*0.36,r:Math.random()*5+3,c:HEX[i%HEX.length],phase:Math.random()*Math.PI*2});
    function hexPath(x,y,r){ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6;ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));}ctx.closePath();}
    function draw(ts){
      requestAnimationFrame(draw);
      if(ts-lastT<FRAME_MS) return; lastT=ts;
      ctx.clearRect(0,0,W,H);
      const sx=W/1000,sy=H/1000;
      nodes.forEach(n=>{
        n.x+=n.vx; n.y+=n.vy;
        if(n.x<0||n.x>1000) n.vx*=-1;
        if(n.y<0||n.y>1000) n.vy*=-1;
        n.phase+=0.012;
        const px=n.x*sx,py=n.y*sy;
        const alpha=0.15+0.08*Math.sin(n.phase);
        ctx.strokeStyle=n.c+'2A'; ctx.lineWidth=0.8;
        hexPath(px,py,n.r*1.6); ctx.stroke();
        ctx.fillStyle=n.c.replace('FF','')+(Math.floor(alpha*255).toString(16).padStart(2,'0'));
        hexPath(px,py,n.r*0.7); ctx.fill();
      });
      for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i],b=nodes[j];
        const dx=(a.x-b.x)*sx,dy=(a.y-b.y)*sy,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<160){ctx.strokeStyle=`rgba(139,63,232,${(1-dist/160)*0.07})`;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(a.x*sx,a.y*sy);ctx.lineTo(b.x*sx,b.y*sy);ctx.stroke();}
      }
    }
    requestAnimationFrame(draw);
  })();


  // ── GOD MODE: FEATURE 7 — Balance percentage indicators (patch updateFees) ──
  const _origUpdateFees = updateFees;
  updateFees = function(){
    _origUpdateFees();
    const amt = getAmount();
    const pct = Math.min(100, amt / citizenBalance * 100);
    const fill = document.getElementById('bankBalFill');
    const label = document.getElementById('bankBalPctLabel');
    const warn = document.getElementById('bankBalWarn');
    if(fill){ fill.style.width = pct.toFixed(1) + '%'; fill.style.background = pct > 80 ? 'linear-gradient(90deg,var(--gold),var(--red))' : 'linear-gradient(90deg,var(--cyan),var(--purple))'; }
    if(label){ label.textContent = pct.toFixed(0) + '% of balance'; }
    if(warn){
      if(amt > citizenBalance){ warn.textContent = '⚠ Exceeds balance'; warn.className = 'warn'; }
      else if(pct > 80){ warn.textContent = '⚠ Large withdrawal'; warn.className = 'warn'; }
      else{ warn.textContent = ''; warn.className = ''; }
    }
  };

  // ── Real withdrawal history (was localStorage-only) ──
  async function renderWdHist(){
    const list = document.getElementById('wdHistList');
    const empty = document.getElementById('wdHistEmpty');
    if (!citizenId) { empty.style.display=''; empty.textContent='Log in to see your real withdrawal history.'; return; }
    let hist = [];
    try { hist = await rpc('get_withdrawal_history', { p_citizen_id: citizenId, p_limit: 15 }); } catch (e) {}
    list.querySelectorAll('.wd-hist-item').forEach(e=>e.remove());
    if(!hist.length){ empty.style.display=''; empty.textContent='No withdrawals yet.'; return; }
    empty.style.display='none';
    hist.forEach(h=>{
      const el=document.createElement('div'); el.className='wd-hist-item';
      const d=new Date(h.created_at);
      const dateStr=d.toLocaleDateString('en-AU',{day:'numeric',month:'short'});
      const icon = h.method==='bank' ? '🏦' : '🔗';
      el.innerHTML=`<div class="wd-hist-icon">${icon}</div><div><div class="wd-hist-name">${dateStr}</div><div class="wd-hist-date">${h.method==='bank'?'Bank transfer':'Crypto send'} · ${h.status}</div></div><div class="wd-hist-right"><div class="wd-hist-indx">-${parseFloat(h.amount_indx).toFixed(2)} INDX</div><div class="wd-hist-usd">$${(h.amount_indx*0.24).toFixed(2)}</div></div>`;
      list.appendChild(el);
    });
  }
  // Refresh history after a successful withdrawal
  const _origExecWd = executeWithdraw;
  executeWithdraw = async function(){
    await _origExecWd();
    renderWdHist();
  };

  document.addEventListener('DOMContentLoaded', async function() {
    await initRealSession(); // GOD MODE PATCH — resolve real access token before any RPC call
    applyBalance();
    loadAddrBook();
    renderWdHist();
  });

  // Patch switchTab to show/hide swipe vs button
  const _origSwitchTab = switchTab;
  switchTab = function(tab) {
    _origSwitchTab(tab);
    const swipe = document.getElementById('swipeWrap');
    const btn = document.getElementById('confirmBtn');
    if (tab === 'crypto') {
      swipe.style.display = 'block';
      btn.style.display = 'none';
    } else {
      swipe.style.display = 'none';
      btn.style.display = 'flex';
    }
  };

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event, __p0) { setAmount(currentTab, __p0); }
function h_2(event) { window.history.back(); }
function h_3(event) { validateAddr();saveAddrToBook(); }
function h_4(event) { window.location.href='receipt.html?type=payment'; }
function h_5(event) { window.location.href='citizen-dashboard.html'; }
function h_6(event) { window.location.href='marketplace.html'; }
function h_7(event) { window.location.href='portfolio.html'; }
function h_8(event) { window.location.href='feed.html'; }
function h_9(event) { window.location.href='profile.html'; }
function h_10(event, __p0) { useAddrBookItem(String(__p0)); }


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
    }, true); })(EV.click);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, true); })(EV.input);

})();
