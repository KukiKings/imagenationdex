
  const SUPABASE_URL      = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const INDX_PRICE = 0.24;
  const citizenId   = sessionStorage.getItem('citizen_id');
  const citizenName = sessionStorage.getItem('citizen_name') || 'citizen';

  function loadBalance() {
    const bal = parseFloat(sessionStorage.getItem('citizen_balance') || '0');
    const usd = (bal * INDX_PRICE).toFixed(2);
    document.getElementById('cardIndxBal').textContent = bal.toLocaleString() + ' INDX';
    document.getElementById('cardUsdBal').textContent = '≈ $' + parseFloat(usd).toLocaleString() + ' USD';
    // FIXED 2026-07-25: drive the Pay-by-QR sheet's "available" figure off the same
    // real balance instead of the old hardcoded "$434.00 available" — see gotchas.md
    const payQrAvailable = document.getElementById('payQrAvailable');
    if (payQrAvailable) payQrAvailable.textContent = '$' + parseFloat(usd).toLocaleString() + ' available';
  }

  // Real transaction history, read from the citizen's own rows (RLS-scoped
  // to auth.uid()). Replaces the old fake hardcoded list — this table has no
  // sender_id/recipient_id/type/note columns, only the fields queried below.
  let txHistoryData = [];
  const TX_ICONS = { atm: '🏧', bill: '🧾', send: '📤', withdraw: '💵', receive: '📥', default: '💳' };

  function describeTx(tx) {
    const meta = tx.metadata || {};
    if (meta.atm_withdrawal) return { desc: 'Cardless ATM Withdrawal', icon: TX_ICONS.atm };
    if (meta.bill_pay) return { desc: 'Bill Payment' + (meta.category ? ' · ' + meta.category[0].toUpperCase() + meta.category.slice(1) : ''), icon: TX_ICONS.bill };
    if (tx.memo) return { desc: tx.memo, icon: TX_ICONS[tx.direction] || TX_ICONS.default };
    if (tx.direction === 'withdraw') return { desc: 'Withdrawal', icon: TX_ICONS.withdraw };
    if (tx.direction === 'send') return { desc: 'Sent INDX', icon: TX_ICONS.send };
    if (tx.direction === 'receive') return { desc: 'Received INDX', icon: TX_ICONS.receive };
    return { desc: tx.direction || 'Transaction', icon: TX_ICONS.default };
  }

  async function loadTxHistory() {
    const container = document.getElementById('txHistoryList');
    if (!container) return;
    if (!citizenId) {
      container.innerHTML = '<div style="padding:16px 0;text-align:center;color:var(--text-muted);font-size:13px;">Log in to see your real transaction history.</div>';
      return;
    }
    try {
      const { data, error } = await sb
        .from('transactions')
        .select('id, created_at, direction, amount_indx, amount_usd, memo, status, corridor, token, tx_hash, metadata')
        .eq('citizen_id', citizenId)
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      txHistoryData = data || [];
      if (!txHistoryData.length) {
        container.innerHTML = '<div style="padding:16px 0;text-align:center;color:var(--text-muted);font-size:13px;">No real transactions yet.</div>';
        return;
      }
      container.innerHTML = txHistoryData.map((tx, idx) => {
        const { desc, icon } = describeTx(tx);
        const isCredit = tx.direction === 'receive';
        const usd = tx.amount_usd != null ? parseFloat(tx.amount_usd) : parseFloat(tx.amount_indx || 0) * INDX_PRICE;
        const date = new Date(tx.created_at).toLocaleDateString('en-AU', { day:'2-digit', month:'short' });
        return `
        <div class="tx-item" data-idx="${idx}">
          <div class="tx-icon" style="background:rgba(${isCredit ? '0,229,160' : '107,112,128'},0.12);">${icon}</div>
          <div class="tx-body">
            <div class="tx-desc">${desc}</div>
            <div class="tx-meta">${date} · ${tx.status || 'pending'}${tx.corridor ? ' · ' + tx.corridor : ''}</div>
          </div>
          <div class="tx-amount ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : '−'}$${usd.toFixed(2)}</div>
        </div>`;
      }).join('');
      initReceiptTaps();
      initDisputeLinks();
    } catch (e) {
      container.innerHTML = '<div style="padding:16px 0;text-align:center;color:var(--text-muted);font-size:13px;">Could not load transaction history right now.</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadBalance();
    loadTxHistory();
    // GOD MODE PATCH — God Mode 2 initializers
    initWisdomTier();
    // GOD MODE PATCH — Research-5 initializers
    initZeroState();
    initDomainCard();
    initMerchantBoost();
  });

  // ── RESEARCH-5: ZERO-STATE ACTIVATION BANNER ─────────────────────
  function initZeroState() {
    // Show zero-state if no USDC balance recorded and citizen is new
    const bal      = parseFloat(sessionStorage.getItem('citizen_balance') || '0');
    const hasTopUp = localStorage.getItem('indx_card_topped_up');
    const banner   = document.getElementById('zeroStateBanner');
    if (!banner) return;
    if (bal === 0 && !hasTopUp) {
      banner.style.display = 'block';
      // Scroll to top so new citizen sees it immediately
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Pre-fill amount from URL param if coming from zero-state shortcut
    const params = new URLSearchParams(window.location.search);
    if (params.get('firstTopUp')) { banner.style.display = 'block'; }
  }

  // ── RESEARCH-5: NUMBERLESS CARD REVEAL ───────────────────────────
  let cardRevealed = false;
  function toggleCardNumberReveal(e) {
    e.stopPropagation(); // don't flip card
    cardRevealed = !cardRevealed;
    const numEl  = document.getElementById('cardNumberRevealed');
    const domEl  = document.getElementById('cardDomainDisplay');
    const btn    = document.getElementById('revealCardBtn');
    if (!numEl || !domEl || !btn) return;
    if (cardRevealed) {
      numEl.style.display = 'block';
      domEl.style.opacity = '0.5';
      btn.textContent = 'HIDE NUMBER';
      showToast('🔒 Card number visible. Hide it when done.');
      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (cardRevealed) toggleCardNumberReveal({ stopPropagation: () => {} });
      }, 10000);
    } else {
      numEl.style.display = 'none';
      domEl.style.opacity = '1';
      btn.textContent = 'REVEAL NUMBER';
    }
  }

  function initDomainCard() {
    // Set domain from sessionStorage if available
    const domain = sessionStorage.getItem('citizen_web3_domain') || 'arthur.IN$DEX';
    const d1 = document.getElementById('cardDomainDisplay');
    const d2 = document.getElementById('cardDomainSmall');
    if (d1) d1.textContent = domain;
    if (d2) d2.textContent = domain;
    // Update setType to also update domain display
    const origSetType = window.setType;
    window.setType = function(t) {
      origSetType(t);
    };
  }

  // ── RESEARCH-5: MERCHANT CASHBACK BOOST INDICATOR ────────────────
  function initMerchantBoost() {
    // Check URL param or sessionStorage for merchant context
    const params = new URLSearchParams(window.location.search);
    const merchantDomain = params.get('merchant') || sessionStorage.getItem('last_merchant_domain') || '';
    const isIndxMerchant = merchantDomain.includes('.IN$DEX') || params.get('indxMerchant') === '1';
    const boostStrip     = document.getElementById('merchantBoostStrip');
    const nonMerchantInfo= document.getElementById('nonMerchantBoostInfo');
    if (!boostStrip) return;
    if (isIndxMerchant) {
      const tier   = TIER_CONFIG.find(t => parseInt(sessionStorage.getItem('citizen_wisdom') || '75') >= t.min) || TIER_CONFIG[0];
      const rate   = tier.merchantCashback;
      boostStrip.style.display = 'flex';
      if (nonMerchantInfo) nonMerchantInfo.style.display = 'none';
      document.getElementById('merchantBoostText').textContent = 'You\'re earning ' + rate + ' cashback here — spend at IN$DEX merchants to maximise rewards';
      document.getElementById('merchantBoostRate').textContent = rate;
    }
  }

  // ── GOD MODE 2: WISDOM SCORE TIER ENGINE ─────────────────────────
  const TIER_CONFIG = [
    { min:0,   max:99,  label:'Tier 1 Citizen',       cls:'t1', cashback:'1%',   atm:'$500',   merchantCashback:'2%'  },
    { min:100, max:199, label:'Tier 2 Established',   cls:'t2', cashback:'2.5%', atm:'$2,000', merchantCashback:'5%'  },
    { min:200, max:999, label:'Tier 3 Sovereign Elder',cls:'t3', cashback:'5%',  atm:'$5,000', merchantCashback:'10%' },
  ];
  function initWisdomTier() {
    const score = parseInt(sessionStorage.getItem('citizen_wisdom') || '75');
    const tier  = TIER_CONFIG.find(t => score >= t.min && score <= t.max) || TIER_CONFIG[0];
    const next  = TIER_CONFIG[TIER_CONFIG.indexOf(tier) + 1];
    const progress = next ? Math.round(((score - tier.min) / (next.min - tier.min)) * 100) : 100;
    ['wtDot','wtTierLabel','wtScorePill','wtStatVal','wtProgressFill'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.className = el.className.replace(/\bt[123]\b/g, '').trim() + ' ' + tier.cls; }
    });
    const dot   = document.getElementById('wtDot');   if(dot)   dot.className   = 'wt-tier-dot ' + tier.cls;
    const lbl   = document.getElementById('wtTierLabel'); if(lbl) { lbl.textContent = tier.label; lbl.className = 'wt-tier-label ' + tier.cls; }
    const pill  = document.getElementById('wtScorePill'); if(pill){ pill.textContent = 'Score ' + score; pill.className = 'wt-score-pill ' + tier.cls; }
    const cb    = document.getElementById('wtCashbackRate'); if(cb)  { cb.textContent = tier.cashback; cb.className = 'wt-stat-val ' + tier.cls; }
    const atm   = document.getElementById('wtAtmLimit');     if(atm) { atm.textContent = tier.atm; atm.className = 'wt-stat-val ' + tier.cls; }
    const fill  = document.getElementById('wtProgressFill'); if(fill){ fill.style.width = progress + '%'; fill.className = 'wt-progress-fill ' + tier.cls; }
    const toNxt = document.getElementById('wtToNext');
    if(toNxt) toNxt.textContent = next ? (next.min - score) + ' pts' : 'MAX';
    const pLbl  = document.getElementById('wtProgressLabel');
    if(pLbl) pLbl.textContent = next ? score + ' / ' + next.min + ' to ' + next.label.split(' ')[1] : 'Sovereign Elder — Maximum tier';
    const mLbl  = document.getElementById('wtMaxLabel');
    if(mLbl) mLbl.textContent = next ? next.label + ' → ' + next.cashback + ' cashback' : '🏆 Max rewards unlocked';
  }

  // ── TRANSACTION RECEIPT SHEET — real fields only, no invented cashback/PQSI/rate-lock per-tx claims ──
  let activeReceiptIdx = 0;
  function showReceiptSheet(idx) {
    activeReceiptIdx = idx;
    const tx = txHistoryData[idx];
    if (!tx) return;
    const { desc } = describeTx(tx);
    const date = new Date(tx.created_at).toLocaleString('en-AU', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    document.getElementById('receiptMerchant').textContent = desc;
    document.getElementById('receiptDate').textContent = date + (tx.corridor ? ' · ' + tx.corridor : '');
    const usd = tx.amount_usd != null ? parseFloat(tx.amount_usd) : parseFloat(tx.amount_indx || 0) * INDX_PRICE;
    const lines = [
      `<div class="receipt-line"><span class="rl-label">Direction</span><span class="rl-value">${tx.direction || '—'}</span></div>`,
      `<div class="receipt-line"><span class="rl-label">Amount</span><span class="rl-value">$${usd.toFixed(2)} USD</span></div>`,
      `<div class="receipt-line"><span class="rl-label">INDX amount</span><span class="rl-value cyan">${parseFloat(tx.amount_indx || 0).toFixed(2)} INDX</span></div>`,
      `<div class="receipt-line"><span class="rl-label">Status</span><span class="rl-value ${tx.status === 'complete' ? 'green' : ''}">${tx.status || 'pending'}</span></div>`,
    ];
    if (tx.tx_hash) lines.push(`<div class="receipt-line"><span class="rl-label">On-chain reference</span><span class="rl-value" style="font-size:11px;color:var(--text-muted);">${tx.tx_hash}</span></div>`);
    lines.push(`<div class="receipt-line"><span class="rl-label">Civilisation Fund</span><span class="rl-value" style="font-size:11px;color:var(--text-muted);">98% to you, 2% to the Fund — the 98/2 Law</span></div>`);
    document.getElementById('receiptLines').innerHTML = lines.join('');
    document.getElementById('receiptOverlay').classList.add('show');
  }
  function openReceiptDispute() {
    const tx = txHistoryData[activeReceiptIdx];
    const { desc } = describeTx(tx || {});
    hideSheet();
    setTimeout(() => openDisputeSheet(desc || 'Transaction', ''), 200);
  }
  function initReceiptTaps() {
    document.querySelectorAll('.tx-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('dispute-link')) return;
        const idx = parseInt(item.dataset.idx, 10);
        showReceiptSheet(idx);
      });
    });
  }

  // ── DISPUTE ────────────────────────────────────────────────────────
  // Not connected to a live backend for card/ATM/P2P transactions yet
  // (the disputes RPCs on file are for marketplace buyer/seller listings).
  const DISPUTE_REASONS = [
    'I didn\'t make this transaction',
    'Wrong amount charged',
    'Merchant never delivered',
    'Duplicate charge',
    'Other'
  ];
  let selectedDisputeReason = 0;

  function initDisputeLinks() {
    document.querySelectorAll('.tx-item').forEach((item) => {
      const meta = item.querySelector('.tx-meta');
      const desc = item.querySelector('.tx-desc');
      const amt  = item.querySelector('.tx-amount');
      if (!meta || !desc || meta.nextElementSibling?.classList?.contains('dispute-link')) return;
      const btn = document.createElement('button');
      btn.className = 'dispute-link';
      btn.textContent = '⚑ Dispute';
      btn.onclick = (e) => { e.stopPropagation(); openDisputeSheet(desc.textContent, amt ? amt.textContent : ''); };
      meta.insertAdjacentElement('afterend', btn);
    });
  }

  function openDisputeSheet(desc, amt) {
    document.getElementById('disputeTxDesc').textContent = desc;
    document.getElementById('disputeTxAmount').textContent = amt;
    selectedDisputeReason = 0;
    const list = document.getElementById('disputeReasonList');
    list.innerHTML = DISPUTE_REASONS.map((r, i) =>
      `<div data-action="h_11" data-args="${JSON.stringify(["$event",i]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" id="dr${i}" style="padding:12px 14px;border-radius:10px;border:1px solid ${i===0 ? 'var(--cyan)' : 'var(--border)'};background:${i===0 ? 'rgba(0,212,255,0.08)' : 'var(--surface2)'};font-size:13px;font-weight:700;color:${i===0 ? 'var(--cyan)' : 'var(--text-muted)'};cursor:pointer;margin-bottom:6px;">${r}</div>`
    ).join('');
    document.getElementById('disputeOverlay').classList.add('show');
  }

  function selectDisputeReason(i) {
    selectedDisputeReason = i;
    DISPUTE_REASONS.forEach((_, idx) => {
      const el = document.getElementById('dr' + idx);
      if (!el) return;
      const sel = idx === i;
      el.style.borderColor = sel ? 'var(--cyan)' : 'var(--border)';
      el.style.background   = sel ? 'rgba(0,212,255,0.08)' : 'var(--surface2)';
      el.style.color        = sel ? 'var(--cyan)' : 'var(--text-muted)';
    });
  }

  function submitDispute() {
    hideSheet();
    showToast('⚠ Dispute reporting isn\'t connected to a live backend yet. Email imagenationdex@gmail.com with your reference and we\'ll follow up.');
  }

  // ── AUTO TOP-UP ───────────────────────────────────────────────────
  let atuOn = false;
  function toggleAutoTopup() {
    atuOn = !atuOn;
    const toggle = document.getElementById('atuToggle');
    const config = document.getElementById('atuConfig');
    const sub    = document.getElementById('atuSub');
    toggle.classList.toggle('on', atuOn);
    config.classList.toggle('show', atuOn);
    sub.textContent = atuOn
      ? 'Preview enabled (not live yet). When live: SIINDEX tops up $50.00 from your INDX wallet when your balance drops below $20.00.'
      : 'Preview only — not connected to a live backend yet. When live, SIINDEX will top up your card automatically when your balance drops below the threshold.';
    showToast(atuOn ? '⚡ Auto top-up preview enabled — not wired to a live backend yet.' : 'Auto top-up preview disabled.');
  }

  let frozen = false;
  let flipped = false;
  let cardType = 'virtual';

  function flipCard() {
    flipped = !flipped;
    document.getElementById('card3d').classList.toggle('flipped', flipped);
  }

  function setType(t) {
    cardType = t;
    document.getElementById('pillVirtual').classList.toggle('active', t === 'virtual');
    document.getElementById('pillPhysical').classList.toggle('active', t === 'physical');
  }

  async function toggleFreeze() {
    if (!citizenId) { showToast('No citizen session found — please log in'); return; }
    const btn = document.getElementById('freezeBtn');
    const nextFrozen = !frozen;
    btn.disabled = true;
    try {
      // FIXED 2026-09 (Approval Gateway wiring): this used to await the RPC and
      // update the UI unconditionally, never checking the response body. That was
      // harmless while set_card_freeze always succeeded, but the unfreeze direction
      // is now gated (agent_registry risk_class=3) and can come back as a normal
      // 200 {success:false, pending_approval:true} instead of actually unfreezing —
      // showing "Card unfrozen" in that case would tell the citizen something false.
      const { data, error } = await sb.rpc('set_card_freeze', { p_citizen_id: citizenId, p_frozen: nextFrozen });
      if (error) throw error;
      if (!data || data.success === false) {
        if (data && data.pending_approval) {
          showToast('👆 Unfreezing needs your approval first — check Approvals, then try again.');
        } else {
          showToast('Could not update card — try again');
        }
        return;
      }
      frozen = nextFrozen;
      const dot = document.getElementById('csDot');
      const label = document.getElementById('csLabel');
      dot.classList.toggle('frozen', frozen);
      label.textContent = frozen ? 'Card Frozen' : 'Card not issued — pre-launch';
      btn.textContent = frozen ? 'Unfreeze' : 'Freeze';
      btn.classList.toggle('frozen', frozen);
      showToast(frozen ? '🔒 Card frozen on your account. Tap Unfreeze to reactivate.' : '✅ Card unfrozen. Ready to spend.');
    } catch (e) {
      showToast('Could not update your card status right now — please try again');
    } finally {
      btn.disabled = false;
    }
  }

  function showOrderSheet() { document.getElementById('orderOverlay').classList.add('show'); }
  function showQR() { document.getElementById('qrOverlay').classList.add('show'); }
  function showATM() { window.location.href = 'card-atm-withdrawal.html'; }
  function showEFTPOSSheet() { document.getElementById('eftposOverlay').classList.add('show'); }
  function showNoTerminalSheet() { document.getElementById('noTerminalOverlay').classList.add('show'); }

  function hideSheet(e) {
    if (!e || e.target.classList.contains('overlay') || e.target.classList.contains('sheet-btn')) {
      document.querySelectorAll('.overlay').forEach(o => o.classList.remove('show'));
    }
  }

  let toastTimeout;
  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#22263A;border:1px solid #2A2D38;color:#EAEAEA;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;z-index:999;max-width:360px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { t.style.opacity = '0'; }, 3000);
  }

  /* ══════════════════════════════════════════════════════════════
     CYBERTRON GOD MODE — Living Card JS
     Feature 2: 3D Tilt (touch + gyroscope)
     Feature 4: Particle Spark Burst on tap
  ══════════════════════════════════════════════════════════════ */

  (function initCybertronCard() {
    const cardEl = document.getElementById('card3d');
    if (!cardEl) return;

    /* ── Feature 2A: Touch tilt ── */
    let tiltActive = false;
    let tiltRaf = null;
    let targetRX = 0, targetRY = 0;
    let currentRX = 0, currentRY = 0;

    function applyTilt() {
      currentRX += (targetRX - currentRX) * 0.14;
      currentRY += (targetRY - currentRY) * 0.14;
      const d = Math.abs(currentRX - targetRX) + Math.abs(currentRY - targetRY);
      cardEl.style.transform = `perspective(1200px) rotateX(${currentRX.toFixed(2)}deg) rotateY(${currentRY.toFixed(2)}deg)`;
      if (d > 0.05 || tiltActive) tiltRaf = requestAnimationFrame(applyTilt);
      else { cardEl.style.transform = ''; tiltRaf = null; }
    }

    cardEl.addEventListener('touchstart', function(e) {
      tiltActive = true;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
    }, { passive: true });

    cardEl.addEventListener('touchmove', function(e) {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const rect = cardEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (touch.clientX - cx) / (rect.width / 2);   // -1 to +1
      const dy = (touch.clientY - cy) / (rect.height / 2);  // -1 to +1
      targetRY =  dx * 12;   // tilt left-right
      targetRX = -dy * 8;    // tilt up-down
    }, { passive: true });

    cardEl.addEventListener('touchend', function() {
      tiltActive = false;
      targetRX = 0;
      targetRY = 0;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
    }, { passive: true });

    /* ── Feature 2B: Gyroscope ambient tilt ── */
    let gyroGranted = false;
    function handleOrientation(e) {
      if (!gyroGranted) return;
      // beta = front-back tilt (-90 to 90), gamma = left-right tilt (-90 to 90)
      const beta  = Math.max(-30, Math.min(30, e.beta  || 0));
      const gamma = Math.max(-30, Math.min(30, e.gamma || 0));
      targetRX = (beta  / 30) * 4;   // ±4° gentle ambient
      targetRY = (gamma / 30) * 6;   // ±6° gentle ambient
      if (!tiltActive && !tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
    }

    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ — request on first tap
        cardEl.addEventListener('click', function reqGyro() {
          DeviceOrientationEvent.requestPermission().then(function(state) {
            if (state === 'granted') {
              gyroGranted = true;
              window.addEventListener('deviceorientation', handleOrientation, { passive: true });
            }
          }).catch(function(){});
          cardEl.removeEventListener('click', reqGyro);
        }, { once: true });
      } else {
        // Android / older iOS — no permission needed
        gyroGranted = true;
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
      }
    }

    /* ── Feature 4: Particle Spark Burst on tap ── */
    const sparkCanvas = document.getElementById('cardSparkCanvas');
    if (!sparkCanvas) return;

    function resizeSpark() {
      const rect = cardEl.getBoundingClientRect();
      sparkCanvas.width  = rect.width;
      sparkCanvas.height = rect.height;
    }
    resizeSpark();
    window.addEventListener('resize', resizeSpark, { passive: true });

    const sparkCtx = sparkCanvas.getContext('2d');
    const SPARK_COLORS = [
      'rgba(0,212,255,',   // cyan
      'rgba(139,63,232,',  // purple
      'rgba(0,229,160,',   // green
      'rgba(255,184,0,',   // gold
      'rgba(255,255,255,'  // white flare
    ];

    let sparks = [];
    let sparkRaf = null;

    function spawnSparks(localX, localY) {
      const count = 10 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const angle  = Math.random() * Math.PI * 2;
        const speed  = 1.8 + Math.random() * 4.2;
        const color  = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
        const size   = 1.5 + Math.random() * 2.5;
        sparks.push({
          x: localX, y: localY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          decay: 0.038 + Math.random() * 0.025,
          size, color
        });
      }
      if (!sparkRaf) sparkRaf = requestAnimationFrame(runSparks);
    }

    function runSparks() {
      sparkCtx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
      sparks = sparks.filter(function(s) {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.12;   // gravity
        s.life -= s.decay;
        if (s.life <= 0) return false;
        sparkCtx.beginPath();
        sparkCtx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        sparkCtx.fillStyle = s.color + s.life.toFixed(2) + ')';
        sparkCtx.fill();
        // trail
        sparkCtx.beginPath();
        sparkCtx.arc(s.x - s.vx * 1.5, s.y - s.vy * 1.5, s.size * s.life * 0.5, 0, Math.PI * 2);
        sparkCtx.fillStyle = s.color + (s.life * 0.4).toFixed(2) + ')';
        sparkCtx.fill();
        return true;
      });
      if (sparks.length > 0) sparkRaf = requestAnimationFrame(runSparks);
      else sparkRaf = null;
    }

    // Fire sparks on touch tap (not drag)
    let touchStartX = 0, touchStartY = 0;
    cardEl.addEventListener('touchstart', function(e) {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    cardEl.addEventListener('touchend', function(e) {
      if (e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.sqrt(dx*dx + dy*dy) > 10) return; // was a drag, not a tap
      const rect = sparkCanvas.getBoundingClientRect();
      const lx = e.changedTouches[0].clientX - rect.left;
      const ly = e.changedTouches[0].clientY - rect.top;
      spawnSparks(lx, ly);
    }, { passive: true });

    // Also fire on mouse click (desktop preview)
    cardEl.addEventListener('click', function(e) {
      const rect = sparkCanvas.getBoundingClientRect();
      spawnSparks(e.clientX - rect.left, e.clientY - rect.top);
    });

  })();


// ── REAL SCANNABLE PAY QRs (fake SVGs replaced 2026-07-14, x39c doctrine) ──
// Encodes https://www.imagenationdex.com/pay/<slug> → vercel route → pay.html?to=slug
(function () {
  if (typeof QRCode === 'undefined') return;
  var rawDomain = sessionStorage.getItem('citizen_web3_domain') || 'arthur.IN$DEX';
  var slug = rawDomain.toLowerCase().replace(/\.in\$dex$/,'').replace(/[^a-z0-9]/g,'') || 'arthur';
  var displayDomain = slug + '.IN$DEX';
  var payUrl = 'https://www.imagenationdex.com/pay/' + slug;
  ['payQrCaption','terminalQrCaption'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = displayDomain;
  });
  ['payQr','terminalQr'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    new QRCode(el, {
      text: payUrl, width: 160, height: 160,
      colorDark: '#0A0A1F', colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.H
    });
  });
})();

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }
function h_2(event) { window.location.href='card-top-up.html'; }
function h_3(event) { window.location.href='card-top-up.html?amount=10'; }
function h_4(event) { window.location.href='card-top-up.html?amount=50'; }
function h_5(event) { window.location.href='card-top-up.html?amount=100'; }
function h_6(event) { window.location.href='withdraw.html'; }
function h_7(event) { window.location.href='deposit.html'; }
function h_8(event) { showToast('🍎 Apple Pay setup launches in app v1.0'); hideSheet(); }
function h_9(event) { showToast('🔵 Google Pay setup launches in app v1.0'); hideSheet(); }
function h_10(event) { window.location.href='merchant-epos.html?demo=1&from=arthur'; }
function h_11(event, __p0) { selectDisputeReason(__p0); }


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

})();
