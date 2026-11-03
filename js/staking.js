
  // ── SUPABASE CLIENT ──
  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // APY ranges per lock tier (canonical tokenomics-v1.md)
  const APY_RANGES = { flex:{low:3,high:5}, '30':{low:4,high:7}, '90':{low:6,high:9}, '365':{low:9,high:13} };

  let selectedLock = { key:'30', apy:5.5, label:'30-day lock' };
  let currentTab = 'stake';
  const citizenId = sessionStorage.getItem('citizen_id');
  let stakingPositions = [];
  let availBal = 0;

  // ── REAL AUTH FIX (God Mode R3) ──────────────────────────────────────
  // Found 2026-07-23: every RPC call in this file (stake_indx, get_staking_positions,
  // claim_staking_rewards, unstake_position, award_wisdom) sent the anon key as the
  // Bearer token. Those functions correctly have EXECUTE revoked from anon (per
  // gotcha #84's remediation), so every single one of those calls has been getting a
  // silent 42501 permission-denied from PostgREST — swallowed by generic catch blocks
  // and shown as vague "Connection error" / empty state, never actually reaching the
  // function body. Real fix: use the citizen's real Supabase Auth access_token (which
  // resolves auth.uid() correctly) when a genuine session exists, so authenticated
  // grants + RLS actually apply. Falls back to the anon key otherwise — identical to
  // prior behavior, so nothing regresses for the common case where no real session
  // exists yet (sessionStorage-only citizen identity, same root blocker as elsewhere).
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

  function formatK(n) {
    n = Number(n) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toFixed(n < 10 ? 2 : 0);
  }

  function switchTab(tab) {
    currentTab = tab;
    ['stake','mystakes','rewards'].forEach(t => {
      document.getElementById('tab-' + t).classList.toggle('active', t === tab);
      const panel = document.getElementById('panel-' + t);
      if (panel) panel.style.display = t === tab ? (t === 'stake' ? 'block' : (t === 'mystakes' ? 'flex' : 'block')) : 'none';
    });
    document.getElementById('stakeBar').style.display = tab === 'stake' ? 'block' : 'none';
    if (tab === 'rewards') buildRewardHistory();
  }
  // Fix flex for mystakes
  document.getElementById('panel-mystakes').style.flexDirection = 'column';

  function selectLock(key, apy, label) {
    selectedLock = { key, apy, label };
    document.querySelectorAll('.lp').forEach(el => {
      el.classList.remove('active');
      el.querySelector('.lp-check').textContent = '';
    });
    const el = document.getElementById('lp-' + key);
    el.classList.add('active');
    el.querySelector('.lp-check').textContent = '✓';
    updateProjection();
  }

  function setAmount(val) {
    document.getElementById('stakeInput').value = val;
    updateProjection();
  }
  function setMax() { setAmount(availBal); }

  function updateProjection() {
    const amt = parseFloat(document.getElementById('stakeInput').value) || 0;
    const apy = selectedLock.apy / 100;
    const days = selectedLock.key === 'flex' ? 30 : parseInt(selectedLock.key);
    const daily = (amt * apy) / 365;
    const monthly = daily * 30;
    const total = (amt * apy * days) / 365;
    document.getElementById('projAmt').textContent = amt.toLocaleString() + ' INDX';
    document.getElementById('projApy').textContent = selectedLock.apy + '%';
    document.getElementById('projDaily').textContent = daily.toFixed(2) + ' INDX';
    document.getElementById('projMonthly').textContent = monthly.toFixed(2) + ' INDX';
    document.getElementById('projTotal').textContent = '+' + total.toFixed(2) + ' INDX';
    document.getElementById('stakeUsd').textContent = '≈ $' + (amt * 0.24).toFixed(2);
    // Compound row
    const compoundReturn = amt * Math.pow(1 + apy / 365, days) - amt;
    const cr = document.getElementById('projCompound');
    if (cr) cr.textContent = compoundOn ? '+' + compoundReturn.toFixed(2) + ' INDX ✨' : '(compounding off)';
    if (cr) cr.style.color = compoundOn ? '#FFB800' : 'var(--text-muted)';
    // Refresh calc
    if (typeof updateCalc === 'function') updateCalc();
  }

  function openStakeConfirm() {
    const amt = parseFloat(document.getElementById('stakeInput').value) || 0;
    if (amt <= 0) { showToast('Enter an amount to stake'); return; }
    if (amt > availBal) { showToast('Insufficient INDX balance'); return; }
    const apy = selectedLock.apy / 100;
    const days = selectedLock.key === 'flex' ? 30 : parseInt(selectedLock.key);
    const total = (amt * apy * days) / 365;
    document.getElementById('cfAmt').textContent = amt.toLocaleString() + ' INDX';
    document.getElementById('cfLock').textContent = selectedLock.label;
    document.getElementById('cfApy').textContent = selectedLock.apy + '%';
    document.getElementById('cfReturn').textContent = '+' + total.toFixed(2) + ' INDX';
    document.getElementById('confirmOverlay').classList.add('show');
    trapFocus(document.getElementById('confirmCard')); // GOD MODE PATCH R3 — accessibility
  }

  async function executeStake() {
    const card = document.getElementById('confirmCard');
    const amt = parseFloat(document.getElementById('stakeInput').value) || 0;
    if (amt <= 0) return;

    if (!citizenId) {
      document.getElementById('confirmOverlay').classList.remove('show');
      showToast('Log in to stake — your INDX is waiting.');
      return;
    }

    card.innerHTML = `<div style="padding:20px 0;"><div style="font-size:42px;margin-bottom:14px;">⚡</div><div style="font-size:16px;font-weight:700;margin-bottom:6px;">Staking…</div><div style="font-size:13px;color:var(--text-muted)">Locking INDX on Solana</div></div>`;

    // ── Real atomic stake via stake_indx RPC ──
    // Previously this did a raw client-side INSERT into staking_positions
    // wrapped in a try/catch that swallowed failures silently, then
    // unconditionally deducted the client-side balance and showed "Staked!"
    // regardless of whether the insert (or the real balance) actually
    // existed. stake_indx() locks the citizen row, checks the real balance,
    // debits it, and creates the position in one atomic transaction —
    // fixed 2026-07-16 along with a pre-existing schema bug in the RPC
    // itself (citizens.updated_at doesn't exist) that would have made this
    // fail every time even after being wired up correctly.
    const range = APY_RANGES[selectedLock.key] || { low: 4, high: 7 };
    let stakeResult;
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/stake_indx', {
        method: 'POST',
        headers: rpcHeaders(),
        body: JSON.stringify({
          p_citizen_id: citizenId,
          p_amount_indx: amt,
          p_lock_period: selectedLock.key,
          p_apy_low: range.low,
          p_apy_high: range.high,
          p_auto_compound: compoundOn
        })
      });
      stakeResult = await res.json();
    } catch(e) {
      stakeResult = { success: false, error: 'Connection error' };
    }

    // Approval Gateway: stake_indx is risk_class >= 3 in agent_registry, so a first call can
    // come back a normal 200 {success:false, pending_approval:true, intent_id} instead of
    // executing. Show what SIINDEX needs approved, then on explicit approve, grant it and
    // retry the exact same stake — request_action_approval() matches it by terms hash.
    if (stakeResult && stakeResult.pending_approval) {
      await showStakeApprovalGate(stakeResult.intent_id, { p_citizen_id: citizenId, p_amount_indx: amt, p_lock_period: selectedLock.key, p_apy_low: range.low, p_apy_high: range.high, p_auto_compound: compoundOn }, amt, range);
      return;
    }

    if (!stakeResult || !stakeResult.success) {
      document.getElementById('confirmOverlay').classList.remove('show');
      // ACCOUNT_FROZEN arrives as stakeResult.message (a raw Postgres exception), not .error.
      const raw = stakeResult?.error || stakeResult?.message || 'Could not complete stake. Try again.';
      const msg = String(raw).includes('ACCOUNT_FROZEN')
        ? 'Your account is frozen — staking is blocked. Unfreeze it from Emergency Freeze, or contact support.'
        : raw;
      showToast(msg);
      return; // do not deduct balance or claim success on a real failure
    }

    const positionId = stakeResult.position_id;

    // Cache to localStorage for My Stakes tab (available without auth)
    try {
      const cached = JSON.parse(localStorage.getItem('staking_positions') || '[]');
      cached.unshift({
        citizen_id: citizenId, amount_indx: amt, lock_period: selectedLock.key,
        apy_low: range.low, apy_high: range.high, auto_compound: compoundOn,
        status: 'active', started_at: new Date().toISOString(), id: positionId
      });
      localStorage.setItem('staking_positions', JSON.stringify(cached.slice(0, 10)));
    } catch(e) {}

    // Real balance from the RPC response, not an optimistic client guess
    sessionStorage.setItem('citizen_balance', String(stakeResult.new_balance));
    await refreshBalance();
    await loadStakingData();

    // Wisdom (+8) is now awarded INSIDE stake_indx itself (via award_wisdom_internal,
    // keyed to this position's real id) -- atomic with the stake and works for every
    // citizen, not only ones with a real auth.uid() session. Previously this page made
    // a separate client-side call to the public, auth-gated award_wisdom RPC, which
    // silently no-op'd for any citizen without a real session.
    if (stakeResult.new_wisdom != null) sessionStorage.setItem('citizen_wisdom', String(stakeResult.new_wisdom));

    setTimeout(() => {
      card.innerHTML = `
        <div style="padding:8px;">
          <div style="font-size:48px;margin-bottom:14px;">✅</div>
          <div style="font-size:20px;font-weight:800;margin-bottom:8px;">Staked!</div>
          <div style="font-size:14px;color:var(--text-muted);line-height:1.6;margin-bottom:22px;">${amt} INDX locked · Est. ${range.low}–${range.high}% yield · Rewards distributed daily.</div>
          <button data-action="h_6" data-args="[&quot;$event&quot;]" style="width:100%;padding:14px;border-radius:12px;background:var(--cyan);border:none;color:#000;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;">View My Stakes</button>
          <button data-action="h_4" data-args="[&quot;$event&quot;]" style="width:100%;padding:14px;border-radius:12px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:15px;cursor:pointer;">Stake More</button>
        </div>`;
    }, 2000);
  }

  async function showStakeApprovalGate(intentId, stakeBody, amt, range) {
    const card = document.getElementById('confirmCard');
    let detail = 'Stake ' + amt + ' INDX needs your explicit approval before it can complete.';
    try {
      const cardRes = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_action_intent_card', {
        method: 'POST', headers: rpcHeaders(), body: JSON.stringify({ p_intent_id: intentId })
      });
      const cardBody = await cardRes.json();
      if (cardBody && !cardBody.error && cardBody.data_involved) detail = cardBody.data_involved;
    } catch (e) {}

    card.innerHTML = `
      <div style="padding:8px;">
        <div style="font-size:42px;margin-bottom:14px;">👆</div>
        <div style="font-size:18px;font-weight:800;margin-bottom:8px;">Approval required</div>
        <div style="font-size:14px;color:var(--text-muted);line-height:1.6;margin-bottom:22px;">${detail}</div>
        <button id="stakeGateApproveBtn" style="width:100%;padding:14px;border-radius:12px;background:var(--cyan);border:none;color:#000;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;">Approve &amp; Stake</button>
        <button data-action="h_4" data-args="[&quot;$event&quot;]" style="width:100%;padding:14px;border-radius:12px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:15px;cursor:pointer;">Cancel</button>
      </div>`;

    document.getElementById('stakeGateApproveBtn').onclick = async function () {
      card.innerHTML = `<div style="padding:20px 0;"><div style="font-size:42px;margin-bottom:14px;">⚡</div><div style="font-size:16px;font-weight:700;margin-bottom:6px;">Recording approval…</div></div>`;
      try {
        const grantRes = await fetch(SUPABASE_URL + '/rest/v1/rpc/grant_intent_approval', {
          method: 'POST', headers: rpcHeaders(),
          body: JSON.stringify({ p_intent_id: intentId, p_level: 1, p_method: 'citizen_app_confirm' })
        });
        const grant = await grantRes.json();
        if (!grant || !grant.success) throw new Error('Approval could not be recorded.');

        const retryRes = await fetch(SUPABASE_URL + '/rest/v1/rpc/stake_indx', {
          method: 'POST', headers: rpcHeaders(), body: JSON.stringify(stakeBody)
        });
        const retryData = await retryRes.json();
        if (retryData?.pending_approval) throw new Error('Approval did not clear — please try again.');
        if (!retryData || !retryData.success) {
          const raw = retryData?.error || retryData?.message || 'Could not complete stake. Try again.';
          throw new Error(String(raw).includes('ACCOUNT_FROZEN') ? 'Your account is frozen — staking is blocked.' : raw);
        }

        sessionStorage.setItem('citizen_balance', String(retryData.new_balance));
        if (retryData.new_wisdom != null) sessionStorage.setItem('citizen_wisdom', String(retryData.new_wisdom));
        await refreshBalance();
        await loadStakingData();

        try {
          const cached = JSON.parse(localStorage.getItem('staking_positions') || '[]');
          cached.unshift({
            citizen_id: citizenId, amount_indx: amt, lock_period: stakeBody.p_lock_period,
            apy_low: range.low, apy_high: range.high, auto_compound: stakeBody.p_auto_compound,
            status: 'active', started_at: new Date().toISOString(), id: retryData.position_id
          });
          localStorage.setItem('staking_positions', JSON.stringify(cached.slice(0, 10)));
        } catch (e) {}

        card.innerHTML = `
          <div style="padding:8px;">
            <div style="font-size:48px;margin-bottom:14px;">✅</div>
            <div style="font-size:20px;font-weight:800;margin-bottom:8px;">Staked!</div>
            <div style="font-size:14px;color:var(--text-muted);line-height:1.6;margin-bottom:22px;">${amt} INDX locked · Est. ${range.low}–${range.high}% yield · Rewards distributed daily.</div>
            <button data-action="h_6" data-args="[&quot;$event&quot;]" style="width:100%;padding:14px;border-radius:12px;background:var(--cyan);border:none;color:#000;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;">View My Stakes</button>
            <button data-action="h_4" data-args="[&quot;$event&quot;]" style="width:100%;padding:14px;border-radius:12px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:15px;cursor:pointer;">Stake More</button>
          </div>`;
      } catch (e) {
        document.getElementById('confirmOverlay').classList.remove('show');
        showToast(e?.message || 'Approval failed. Try again.');
      }
    };
  }

  // ── REAL BALANCE ─────────────────────────────────────────────────────
  async function refreshBalance() {
    if (!citizenId) { availBal = 0; const el = document.getElementById('availBalVal'); if (el) el.textContent = '0'; return; }
    let bal = parseFloat(sessionStorage.getItem('citizen_balance'));
    if (isNaN(bal)) {
      try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/citizens?id=eq.' + encodeURIComponent(citizenId) + '&select=indx_balance', { headers: rpcHeaders() });
        const rows = await res.json();
        bal = rows?.[0]?.indx_balance != null ? Number(rows[0].indx_balance) : 0;
        sessionStorage.setItem('citizen_balance', String(bal));
      } catch (e) { bal = 0; }
    }
    availBal = bal;
    const el = document.getElementById('availBalVal');
    if (el) el.textContent = bal.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  // ── REAL STAKING POSITIONS ───────────────────────────────────────────
  async function loadStakingData() {
    // Platform-wide stats — public, no auth required
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_staking_stats', { method: 'POST', headers: rpcHeaders(), body: '{}' });
      const stats = await res.json();
      if (stats) {
        const s1 = document.getElementById('heroStaked'); if (s1) s1.textContent = formatK(stats.total_staked);
        const s2 = document.getElementById('heroStakers'); if (s2) s2.textContent = Number(stats.total_stakers).toLocaleString();
        const s3 = document.getElementById('heroRewardsPaid'); if (s3) s3.textContent = formatK(stats.total_rewards_paid);
      }
    } catch (e) { /* non-critical */ }

    if (!citizenId) { stakingPositions = []; renderMyStakes(); return; }
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_staking_positions', {
        method: 'POST', headers: rpcHeaders(), body: JSON.stringify({ p_citizen_id: citizenId })
      });
      stakingPositions = (await res.json()) || [];
    } catch (e) { stakingPositions = []; }
    renderMyStakes();
  }

  function renderMyStakes() {
    const container = document.getElementById('stakesContainer');
    const emptyState = document.getElementById('stakesEmptyState');
    if (!container) return;

    const totalStaked = stakingPositions.reduce((sum, p) => sum + Number(p.amount_indx || 0), 0);
    const totalClaimed = stakingPositions.reduce((sum, p) => sum + Number(p.rewards_claimed || 0), 0);
    const totalAccrued = stakingPositions.reduce((sum, p) => sum + Number(p.accrued_unclaimed || 0), 0);
    const ssStaked = document.getElementById('ssTotalStaked'); if (ssStaked) ssStaked.textContent = totalStaked.toLocaleString(undefined, { maximumFractionDigits: 0 });
    const ssEarned = document.getElementById('ssTotalEarned'); if (ssEarned) ssEarned.textContent = (totalClaimed + totalAccrued).toFixed(2) + ' INDX';
    const ssPos = document.getElementById('ssPositions'); if (ssPos) ssPos.textContent = stakingPositions.length;
    const claimBtn = document.getElementById('ssClaimAllBtn'); if (claimBtn) claimBtn.textContent = '⚡ Claim All Rewards — ' + totalAccrued.toFixed(2) + ' INDX';

    if (!stakingPositions.length) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      startNextUnlockCountdown(); // GOD MODE PATCH R3 — hides the strip when there's nothing to count down to
      updateStakingStreak();
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    const now = Date.now();
    container.innerHTML = stakingPositions.map(function(p) {
      const started = new Date(p.started_at).getTime();
      const unlocks = p.unlocks_at ? new Date(p.unlocks_at).getTime() : null;
      const isFlex = p.lock_period === 'flex';
      const isLocked = !isFlex && unlocks && unlocks > now;
      const totalMs = unlocks ? (unlocks - started) : 0;
      const pct = totalMs > 0 ? Math.min(100, Math.max(0, ((now - started) / totalMs) * 100)) : 100;
      const midApy = (Number(p.apy_low) + Number(p.apy_high)) / 2;
      const accrued = Number(p.accrued_unclaimed || 0);
      const daysLeft = unlocks ? Math.max(0, Math.ceil((unlocks - now) / 86400000)) : 0;
      const countdownTxt = isLocked ? (daysLeft + (daysLeft === 1 ? ' day left' : ' days left')) : (isFlex ? 'Unstake anytime' : 'Unlocked ✓');
      const unlockDateTxt = unlocks ? ('Unlocks ' + new Date(unlocks).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })) : '';
      const statusBadge = isLocked ? '<div class="si-status status-locked">🔒 LOCKED</div>' : '<div class="si-status status-active">ACTIVE</div>';
      const actionBtn = accrued > 0.000001
        ? '<div class="si-btn claim" data-action="h_7" data-args="[&quot;$event&quot;,' + indxJ(p.id) + ']">Claim ' + accrued.toFixed(2) + ' INDX</div>'
        : '<div class="si-btn" style="opacity:0.5;">Nothing to claim</div>';
      const unstakeBtn = isLocked
        ? '<div class="si-btn" data-action="h_8" data-args="[&quot;$event&quot;,' + indxJ(p.id) + ']">Early Unstake</div>'
        : '<div class="si-btn" data-action="h_8" data-args="[&quot;$event&quot;,' + indxJ(p.id) + ']">Unstake</div>';
      // Restake (God Mode R3): only offered on matured/flexible positions — one tap
      // closes the position and re-opens it under the same real terms.
      const restakeBtn = !isLocked
        ? '<div class="si-btn restake" data-action="h_9" data-args="[&quot;$event&quot;,' + indxJ(p.id) + ']">🔄 Restake</div>'
        : '';
      return '' +
        '<div class="stake-item">' +
          '<div class="si-top"><div><span class="si-amount">' + Number(p.amount_indx).toLocaleString() + '</span><span class="si-ticker">INDX</span></div>' + statusBadge + '</div>' +
          '<div class="si-progress"><div class="si-progress-fill" style="width:' + pct.toFixed(0) + '%"></div></div>' +
          '<div class="si-meta"><span>' + (isFlex ? 'Flexible' : p.lock_period + '-day lock') + ' · Est. ' + midApy.toFixed(1) + '%</span><span>' + countdownTxt + '</span></div>' +
          '<div class="unlock-date">' + unlockDateTxt + '</div>' +
          '<div class="si-rewards"><div><div class="si-rewards-label">Earned so far</div><div class="si-rewards-val">+' + accrued.toFixed(4) + ' INDX</div></div>' +
          '<div style="text-align:right"><div class="si-rewards-label">Claimed to date</div><div class="si-rewards-val">+' + Number(p.rewards_claimed || 0).toFixed(2) + ' INDX</div></div></div>' +
          '<div class="si-actions">' + actionBtn + unstakeBtn + restakeBtn + '</div>' +
        '</div>';
    }).join('');
    if (typeof injectLiveTickers === 'function') injectLiveTickers();
    startNextUnlockCountdown(); // GOD MODE PATCH R3 — live countdown to nearest real unlock
    updateStakingStreak(); // real streak from earliest actual position, not a fabricated anchor
  }

  async function claimRewards(positionId) {
    if (!citizenId) { showToast('Sign in to claim rewards'); return; }
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/claim_staking_rewards', {
        method: 'POST', headers: rpcHeaders(), body: JSON.stringify({ p_citizen_id: citizenId, p_position_id: positionId })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast((data?.message || '').includes('NOTHING_TO_CLAIM') ? 'Nothing to claim yet — rewards still accruing' : 'Claim failed — try again');
        return;
      }
      const bal = parseFloat(sessionStorage.getItem('citizen_balance') || '0');
      sessionStorage.setItem('citizen_balance', (bal + Number(data.claimed_indx)).toFixed(4));
      showToast('+' + Number(data.claimed_indx).toFixed(2) + ' INDX claimed to your wallet ✓');
      await refreshBalance();
      await loadStakingData();
    } catch (e) { showToast('Claim failed — connection error'); }
  }

  async function claimAll() {
    if (!citizenId) { showToast('Sign in to claim rewards'); return; }
    const claimable = stakingPositions.filter(function(p) { return Number(p.accrued_unclaimed || 0) > 0.000001; });
    if (!claimable.length) { showToast('Nothing to claim right now'); return; }
    let total = 0;
    for (const p of claimable) {
      try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/claim_staking_rewards', {
          method: 'POST', headers: rpcHeaders(), body: JSON.stringify({ p_citizen_id: citizenId, p_position_id: p.id })
        });
        const data = await res.json();
        if (res.ok && data?.claimed_indx) total += Number(data.claimed_indx);
      } catch (e) { /* skip and continue */ }
    }
    if (total > 0) {
      const bal = parseFloat(sessionStorage.getItem('citizen_balance') || '0');
      sessionStorage.setItem('citizen_balance', (bal + total).toFixed(4));
      showToast('✅ ' + total.toFixed(2) + ' INDX claimed to your wallet');
    } else {
      showToast('Nothing to claim right now');
    }
    await refreshBalance();
    await loadStakingData();
  }

  // ── UNSTAKE (real, covers both early-with-penalty and normal at-maturity/flex) ──
  function handleUnstakeClick(positionId) {
    if (!citizenId) { showToast('Sign in to unstake'); return; }
    const p = stakingPositions.find(function(x) { return x.id === positionId; });
    if (!p) return;
    const unlocks = p.unlocks_at ? new Date(p.unlocks_at).getTime() : null;
    const isEarly = p.lock_period !== 'flex' && unlocks && unlocks > Date.now();
    openUnstakeSheet(p, isEarly);
  }

  function openUnstakeSheet(p, isEarly) {
    const principal = Number(p.amount_indx);
    const accrued = Number(p.accrued_unclaimed || 0);
    const penalty = isEarly ? principal * 0.02 : 0;
    const receive = isEarly ? (principal - penalty) : (principal + accrued);
    _euStakeData = { positionId: p.id, principal, penalty, earned: accrued, isEarly };

    document.getElementById('euTitle').textContent = isEarly ? '⚠️ Early Unstake' : 'Confirm Unstake';
    document.getElementById('euSub').textContent = isEarly
      ? 'Your position is still locked. Unstaking early incurs a 2% penalty on principal and forfeits unclaimed rewards.'
      : 'Your position is unlocked. Principal plus earned rewards will be returned to your balance.';
    document.getElementById('euPrincipal').textContent = principal.toFixed(0) + ' INDX';
    document.getElementById('euPenaltyRow').style.display = isEarly ? 'flex' : 'none';
    document.getElementById('euPenalty').textContent = '−' + penalty.toFixed(2) + ' INDX';
    document.getElementById('euRewards').textContent = '+' + accrued.toFixed(4) + ' INDX';
    document.getElementById('euForfeitedRow').style.display = isEarly ? 'flex' : 'none';
    document.getElementById('euForfeited').textContent = '−' + accrued.toFixed(4) + ' INDX';
    document.getElementById('euReceive').textContent = receive.toFixed(2) + ' INDX';
    document.getElementById('euConfirmBtn').textContent = isEarly ? 'Confirm Early Unstake — pay penalty' : 'Confirm Unstake';

    const ov = document.getElementById('euOverlay');
    if (ov) ov.classList.add('show');
    trapFocus(document.querySelector('#euOverlay .eu-sheet')); // GOD MODE PATCH R3 — accessibility
  }

  async function confirmUnstakeAction() {
    const { positionId, isEarly } = _euStakeData;
    closeEarlyUnstakeSheet();
    if (!citizenId || !positionId) return;
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/unstake_position', {
        method: 'POST', headers: rpcHeaders(),
        body: JSON.stringify({ p_citizen_id: citizenId, p_position_id: positionId, p_accept_early_penalty: !!isEarly })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast((data?.message || '').includes('STILL_LOCKED') ? 'Position still locked' : 'Unstake failed — try again');
        return;
      }
      const bal = parseFloat(sessionStorage.getItem('citizen_balance') || '0');
      sessionStorage.setItem('citizen_balance', (bal + Number(data.payout_indx)).toFixed(4));
      showToast(data.was_early
        ? 'Unstaked early — ' + Number(data.payout_indx).toFixed(2) + ' INDX received (2% penalty applied)'
        : '✅ ' + Number(data.payout_indx).toFixed(2) + ' INDX unstaked to your wallet');
      await refreshBalance();
      await loadStakingData();
    } catch (e) { showToast('Unstake failed — connection error'); }
  }

  // ── AUTO-COMPOUND TOGGLE (stake panel) ──────────────────────────────
  let compoundOn = true; // default ON for new stakes

  function toggleCompound() {
    compoundOn = !compoundOn;
    const t = document.getElementById('compoundToggle');
    const k = document.getElementById('compoundKnob');
    const b = document.getElementById('compoundBadge');
    if (compoundOn) {
      t.style.background = 'var(--green)';
      k.style.left = 'auto'; k.style.right = '4px';
      b.textContent = '✓ Compounding ON rewards reinvest automatically every 24h';
      b.style.color = 'var(--green)';
      b.style.borderColor = 'rgba(0,229,160,0.2)';
      b.style.background = 'rgba(0,229,160,0.07)';
    } else {
      t.style.background = 'var(--surface3)';
      k.style.right = 'auto'; k.style.left = '4px';
      b.textContent = '✗ Compounding OFF rewards accumulate, claim manually';
      b.style.color = 'var(--text-muted)';
      b.style.borderColor = 'var(--border)';
      b.style.background = 'var(--surface)';
    }
    updateProjection();
    showToast(compoundOn ? '🔄 Auto-Compound enabled rewards reinvest daily' : 'Compounding off rewards will wait to be claimed');
  }

  // ── COMPOUND TOGGLE ON EXISTING STAKES ──────────────────────────────
  function toggleStakeCompound(toggleId, labelId) {
    const t = document.getElementById(toggleId);
    const l = document.getElementById(labelId);
    const isOn = t.style.background === 'var(--green)' || t.dataset.on === '1';
    const nowOn = !isOn;
    t.dataset.on = nowOn ? '1' : '0';
    const k = t.querySelector('div');
    if (nowOn) {
      t.style.background = 'var(--green)';
      k.style.left = 'auto'; k.style.right = '3px';
      l.textContent = 'ON rewards reinvest every 24h ✓';
      l.style.color = 'var(--green)';
    } else {
      t.style.background = 'var(--surface3)';
      k.style.right = 'auto'; k.style.left = '3px';
      l.textContent = 'OFF rewards wait to be claimed';
      l.style.color = 'var(--text-muted)';
    }
    showToast(nowOn ? '🔄 Compounding ON for this stake' : 'Compounding turned off');
  }

  // Initialise real data on load
  document.addEventListener('DOMContentLoaded', async function() {
    await initRealSession(); // GOD MODE PATCH R3 — resolve real access token before any RPC call
    refreshBalance();
    loadStakingData(); // also drives the real staking streak via renderMyStakes() -> updateStakingStreak()
    renderWsProgress(); // real Wisdom Score ring/milestones from sessionStorage citizen_wisdom
  });

  // ── COMPOUND CALCULATOR ──────────────────────────────────────────────
  let calcYears = 1;

  function setCalcYear(y) {
    calcYears = y;
    ['1','3','5','10'].forEach(n => {
      const el = document.getElementById('cy' + n);
      el.style.background = n == y ? 'var(--cyan)' : 'var(--surface2)';
      el.style.color = n == y ? '#000' : 'var(--text-muted)';
    });
    updateCalc();
  }

  function updateCalc() {
    const amt = parseFloat(document.getElementById('stakeInput').value) || 500;
    const apy = selectedLock.apy / 100;
    const n = calcYears * 365; // days
    const simple = amt + (amt * apy * calcYears);
    const compound = amt * Math.pow((1 + apy / 365), n);
    const diff = compound - simple;
    document.getElementById('simpleTotal').textContent = simple.toFixed(0) + ' INDX';
    document.getElementById('compoundTotal').textContent = compound.toFixed(0) + ' INDX';
    document.getElementById('calcDiff').textContent = '+' + diff.toFixed(0) + ' INDX';
    // Bar = diff as % of simple
    const pct = Math.min((diff / simple) * 100 * 3, 95);
    document.getElementById('calcBar').style.width = pct + '%';
  }

  let _rewardHistoryItems = [];

  async function buildRewardHistory() {
    const wrap = document.getElementById('rewardHistory');
    if (!citizenId) {
      wrap.innerHTML = '<div style="padding:20px 16px;text-align:center;font-size:13px;color:var(--text-muted);">Sign in to see your reward history.</div>';
      setAllTimeRewards(0);
      _rewardHistoryItems = [];
      drawRewardsSparkline();
      return;
    }
    try {
      const url = SUPABASE_URL + '/rest/v1/transactions?citizen_id=eq.' + encodeURIComponent(citizenId)
        + '&memo=in.(Staking reward claim,Unstake at maturity,"Early unstake, 2% penalty applied")'
        + '&order=created_at.desc&limit=10&select=amount_indx,memo,created_at';
      const res = await fetch(url, { headers: rpcHeaders() });
      const rows = (await res.json()) || [];
      _rewardHistoryItems = rows;
      if (!rows.length) {
        wrap.innerHTML = '<div style="padding:20px 16px;text-align:center;font-size:13px;color:var(--text-muted);">No reward activity yet. Claims and unstakes will show up here.</div>';
        setAllTimeRewards(0);
        drawRewardsSparkline();
        return;
      }
      let runningTotal = 0;
      const totalDesc = rows.reduce((sum, r) => sum + Number(r.amount_indx || 0), 0);
      const rowsHtml = rows.map(function(r) {
        const amt = Number(r.amount_indx || 0);
        const usd = (amt * 0.24).toFixed(3);
        const d = new Date(r.created_at);
        const dateStr = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
        return '' +
          '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border);">' +
            '<div><div style="font-size:13px;font-weight:600;">' + r.memo + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">' + dateStr + '</div></div>' +
            '<div style="text-align:right;"><div style="font-size:14px;font-weight:700;color:var(--green);">+' + amt.toFixed(2) + ' INDX</div>' +
            '<div style="font-size:11px;color:var(--text-muted);">≈ $' + usd + '</div></div>' +
          '</div>';
      });
      wrap.innerHTML = rowsHtml.join('');
      setAllTimeRewards(totalDesc);
      drawRewardsSparkline();
    } catch (e) {
      wrap.innerHTML = '<div style="padding:20px 16px;text-align:center;font-size:13px;color:var(--text-muted);">Could not load reward history — try again.</div>';
    }
  }

  function setAllTimeRewards(total) {
    const totalIndx = stakingPositions.reduce((s, p) => s + Number(p.rewards_claimed || 0) + Number(p.accrued_unclaimed || 0), 0);
    const val = document.querySelector('#panel-rewards [style*="font-size:36px"]');
    if (val) val.textContent = '+' + totalIndx.toFixed(2) + ' INDX';
    const usd = document.querySelector('#panel-rewards [style*="font-size:13px;color:var(--text-muted)"]');
    if (usd) usd.textContent = '≈ $' + (totalIndx * 0.24).toFixed(2) + ' earned from staking';
    const totalRow = document.querySelector('.rc-total-val');
    if (totalRow) totalRow.textContent = '+' + total.toFixed(2) + ' INDX';
  }

  const TIPS = {
    yield: { title: 'Sovereign Yield', body: 'Stake INDX to earn passive interest. Est. ranges: 3–5% (flex) · 4–7% (30d) · 6–9% (90d) · 9–13% (365d). Requires Wisdom Score 100. Your staked INDX stays in a non-custodial smart contract only you can withdraw.', link: 'help.html' },
    ws: { title: 'Wisdom Score', body: 'Your reputation score (0–200) earned by trading, verifying, voting, and referring. WS 100 is required to unlock Sovereign Yield.', link: 'wisdom-score.html' }
  };
  function showTip(key) {
    const tip = TIPS[key]; if (!tip) return;
    if (key === 'ws') {
      const s = parseInt(sessionStorage.getItem('citizen_wisdom') || '0');
      tip.body = TIPS.ws.body + (s >= 100 ? ' You currently have WS ' + s + ' Sovereign Yield unlocked.' : ' You currently have WS ' + s + ' — ' + (100 - s) + ' points to go.');
    }
    let el = document.getElementById('tipOverlay');
    if (!el) { el = document.createElement('div'); el.id = 'tipOverlay'; el.style.cssText = 'position:fixed;inset:0;z-index:999;display:flex;align-items:flex-end;justify-content:center;padding:0 0 90px;background:rgba(0,0,0,0.55);'; el.onclick = hideTip; document.body.appendChild(el); }
    el.innerHTML = `<div data-action="h_5" data-args="[&quot;$event&quot;]" style="background:#1A1D25;border:1px solid #2A2D38;border-radius:18px 18px 14px 14px;padding:20px;max-width:390px;width:calc(100% - 32px);"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><div style="font-size:14px;font-weight:800;color:#00D4FF;">${tip.title}</div><div data-action="hideTip" style="width:28px;height:28px;border-radius:50%;background:#22252F;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;color:#6B7080;">✕</div></div><div style="font-size:13px;color:#EAEAEA;line-height:1.7;margin-bottom:14px;">${tip.body}</div><a href="${tip.link}" style="display:block;text-align:center;padding:11px;background:#00D4FF;color:#090A10;font-size:13px;font-weight:800;border-radius:10px;text-decoration:none;">Learn more →</a></div>`;
    el.style.display = 'flex';
  }
  function hideTip() { const el = document.getElementById('tipOverlay'); if (el) el.style.display = 'none'; }

  let toastTimer;
  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:#1A1D25;border:1px solid #2A2D38;color:#EAEAEA;padding:10px 20px;border-radius:12px;font-size:14px;z-index:300;pointer-events:none;transition:opacity 0.3s;white-space:nowrap;'; document.body.appendChild(t); }
    t.textContent = msg; t.style.opacity = '1';
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.style.opacity = '0', 2400);
  }

  updateProjection();

  /* ═══════════════════════════════════════════════════════
     GOD MODE ROUND 2 JS — staking.html
  ═══════════════════════════════════════════════════════ */

  // Feature 1: Grand Sync countdown (TGE Feb 24 2026 AEST)
  (function initGrandSyncCountdown() {
    const TARGET = new Date('2027-02-24T00:00:00+11:00');
    const gsD = document.getElementById('gsD');
    const gsH = document.getElementById('gsH');
    const gsM = document.getElementById('gsM');
    const gsS = document.getElementById('gsS');
    function tick() {
      const ms = TARGET - Date.now();
      if (ms <= 0) {
        if (gsD) gsD.textContent = '0';
        if (gsH) gsH.textContent = '00';
        if (gsM) gsM.textContent = '00';
        if (gsS) gsS.textContent = '00';
        return;
      }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      if (gsD) gsD.textContent = d;
      if (gsH) gsH.textContent = String(h).padStart(2, '0');
      if (gsM) gsM.textContent = String(m).padStart(2, '0');
      if (gsS) gsS.textContent = String(s).padStart(2, '0');
    }
    tick();
    setInterval(tick, 1000);
  })();

  // Feature 2: Rewards cumulative sparkline — built from real transaction history
  function drawRewardsSparkline() {
    const canvas = document.getElementById('rewardsSparkline');
    if (!canvas) return;
    const items = (_rewardHistoryItems || []).slice().reverse(); // oldest→newest
    if (items.length < 2) {
      const ctx0 = canvas.getContext('2d');
      ctx0.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const W = wrap.clientWidth - 32;
    const H = 72;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Cumulative running totals from real reward history (oldest→newest)
    let running = 0;
    const data = items.map(function(i) { running += Number(i.amount_indx || 0); return running; });
    const labels = items.map(function(i) { return new Date(i.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); });
    const max = Math.max.apply(null, data) * 1.15;
    const pad = { t: 8, r: 6, b: 20, l: 38 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;

    const pts = data.map(function(v, i) {
      return { x: pad.l + (i / (data.length - 1)) * cw, y: pad.t + (1 - v / max) * ch };
    });

    // Gradient fill under line
    const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
    grad.addColorStop(0, 'rgba(0,229,160,0.22)');
    grad.addColorStop(1, 'rgba(0,229,160,0)');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H - pad.b);
    pts.forEach(function(p) { ctx.lineTo(p.x, p.y); });
    ctx.lineTo(pts[pts.length - 1].x, H - pad.b);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    pts.forEach(function(p, i) { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
    ctx.strokeStyle = 'rgba(0,229,160,0.9)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots
    pts.forEach(function(p, i) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === pts.length - 1 ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i === pts.length - 1 ? 'rgba(0,229,160,1)' : 'rgba(0,229,160,0.65)';
      ctx.fill();
    });

    // X axis labels
    ctx.font = '9px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(107,112,128,0.85)';
    ctx.textAlign = 'center';
    pts.forEach(function(p, i) {
      ctx.fillText(labels[i], p.x, H - 4);
    });

    // Y axis max label
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(107,112,128,0.7)';
    ctx.fillText(data[data.length - 1].toFixed(2), pad.l - 4, pad.t + 6);
    ctx.fillText('0.00', pad.l - 4, H - pad.b + 4);
  }

  // Feature 3: Early/normal unstake sheet — real state populated by openUnstakeSheet() above
  var _euStakeData = { positionId: null, principal: 0, penalty: 0, earned: 0, isEarly: false };

  function closeEarlyUnstakeSheet() {
    var ov = document.getElementById('euOverlay');
    if (ov) ov.classList.remove('show');
  }

  // Feature 4: Staking streak tracker + social share — computed from the real
  // earliest started_at among the citizen's actual staking_positions, not a
  // fabricated anchor date. Called from renderMyStakes() once real positions load.
  function updateStakingStreak() {
    var el = document.getElementById('streakDays');
    if (!el) return;
    if (!stakingPositions.length) { el.textContent = 'Stake INDX to start your streak'; return; }
    var earliest = null;
    stakingPositions.forEach(function(p) {
      var t = new Date(p.started_at).getTime();
      if (!isNaN(t) && (earliest === null || t < earliest)) earliest = t;
    });
    var days = earliest ? Math.max(0, Math.floor((Date.now() - earliest) / 86400000)) : 0;
    el.textContent = days + (days === 1 ? ' day staking streak' : ' day staking streak');
  }

  function shareStakingPosition() {
    var totalEl = document.getElementById('ssTotalStaked');
    var total = totalEl ? totalEl.textContent : '0';
    var text = '🔒 I’ve staked ' + total + ' INDX in IN$DEX earning Sovereign Yield\n🔗 indx.app/stake\n\n#INDX #SovereignYield #Web3';
    if (navigator.share) {
      navigator.share({ title: 'My IN$DEX Stake', text: text }).catch(function() {});
    } else {
      navigator.clipboard.writeText(text).then(function() {
        showToast('✓ Stake card copied — share it with your network');
      }).catch(function() { showToast('Could not copy — try manually'); });
    }
    try {
      var count = parseInt(localStorage.getItem('indx_stake_shares') || '0') + 1;
      localStorage.setItem('indx_stake_shares', String(count));
    } catch(e) {}
  }

  /* ═══════════════════════════════════════════════════════
     GOD MODE ROUND 3 JS — staking.html
  ═══════════════════════════════════════════════════════ */

  // Feature 1: Live next-unlock countdown — ticks every second against the
  // real soonest unlocks_at among stakingPositions, not a static day count.
  let _nextUnlockInterval = null;
  function computeNextUnlock() {
    const now = Date.now();
    let best = null;
    stakingPositions.forEach(function(p) {
      if (p.lock_period === 'flex' || !p.unlocks_at) return;
      const t = new Date(p.unlocks_at).getTime();
      if (t > now && (!best || t < best.t)) best = { t: t, amount: Number(p.amount_indx) };
    });
    return best;
  }
  function startNextUnlockCountdown() {
    const strip = document.getElementById('nextUnlockStrip');
    if (!strip) return;
    if (_nextUnlockInterval) { clearInterval(_nextUnlockInterval); _nextUnlockInterval = null; }
    function tick() {
      const next = computeNextUnlock();
      if (!next) { strip.style.display = 'none'; return; }
      const ms = next.t - Date.now();
      if (ms <= 0) { strip.style.display = 'none'; return; }
      strip.style.display = 'flex';
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      const cd = document.getElementById('nuCountdown');
      if (cd) cd.textContent = (d > 0 ? d + 'd ' : '') + String(h).padStart(2, '0') + 'h ' + String(m).padStart(2, '0') + 'm ' + String(s).padStart(2, '0') + 's';
      const am = document.getElementById('nuAmount');
      if (am) am.textContent = next.amount.toLocaleString() + ' INDX';
    }
    tick();
    _nextUnlockInterval = setInterval(tick, 1000);
  }

  // Feature 2: One-tap restake — closes a matured/flexible position for real via
  // unstake_position, then immediately re-opens it under the same real lock terms
  // via stake_indx. If the restake leg fails after the unstake succeeds, the payout
  // is already safely back in the citizen's real balance — never silently lost.
  async function restakePosition(positionId) {
    if (!citizenId) { showToast('Sign in to restake'); return; }
    const p = stakingPositions.find(function(x) { return x.id === positionId; });
    if (!p) return;
    const unlocks = p.unlocks_at ? new Date(p.unlocks_at).getTime() : null;
    const isLocked = p.lock_period !== 'flex' && unlocks && unlocks > Date.now();
    if (isLocked) { showToast('Still locked — restake unlocks with this position'); return; }
    showToast('Restaking…');
    try {
      const unstakeRes = await fetch(SUPABASE_URL + '/rest/v1/rpc/unstake_position', {
        method: 'POST', headers: rpcHeaders(),
        body: JSON.stringify({ p_citizen_id: citizenId, p_position_id: positionId, p_accept_early_penalty: false })
      });
      const unstakeData = await unstakeRes.json();
      if (!unstakeRes.ok || !unstakeData || !unstakeData.payout_indx) {
        showToast('Restake failed — could not close the position'); return;
      }
      const payout = Number(unstakeData.payout_indx);
      const range = APY_RANGES[p.lock_period] || APY_RANGES['30'];
      const stakeRes = await fetch(SUPABASE_URL + '/rest/v1/rpc/stake_indx', {
        method: 'POST', headers: rpcHeaders(),
        body: JSON.stringify({ p_citizen_id: citizenId, p_amount_indx: payout, p_lock_period: p.lock_period, p_apy_low: range.low, p_apy_high: range.high, p_auto_compound: true })
      });
      const stakeData = await stakeRes.json();
      if (!stakeRes.ok || !stakeData || !stakeData.success) {
        showToast(payout.toFixed(2) + ' INDX closed but restake failed — it is back in your balance');
        await refreshBalance(); await loadStakingData();
        return;
      }
      sessionStorage.setItem('citizen_balance', String(stakeData.new_balance));
      showToast('🔄 Restaked ' + payout.toFixed(2) + ' INDX — same ' + (p.lock_period === 'flex' ? 'flexible' : p.lock_period + '-day') + ' terms');
      await refreshBalance(); await loadStakingData();
    } catch (e) { showToast('Restake failed — connection error'); }
  }

  // Feature 3: Reward history CSV export — built from the same real
  // _rewardHistoryItems rows already rendered in the Rewards tab.
  function exportRewardHistory() {
    if (!_rewardHistoryItems || !_rewardHistoryItems.length) { showToast('No reward history to export yet'); return; }
    const header = 'Date,Type,Amount INDX,Amount USD\n';
    const rows = _rewardHistoryItems.map(function(r) {
      const amt = Number(r.amount_indx || 0);
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      const memo = '"' + String(r.memo || '').replace(/"/g, '""') + '"';
      return [d, memo, amt.toFixed(4), (amt * 0.24).toFixed(4)].join(',');
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'indx-staking-rewards-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('⬇ Reward history exported');
  }

  // Feature 4: Keyboard accessibility — Escape closes whichever sheet/overlay is
  // open, and Tab is trapped inside it so focus can't silently leave to page content.
  function handleGlobalEscape(e) {
    if (e.key !== 'Escape') return;
    const confirmOv = document.getElementById('confirmOverlay');
    if (confirmOv && confirmOv.classList.contains('show')) { confirmOv.classList.remove('show'); return; }
    const euOv = document.getElementById('euOverlay');
    if (euOv && euOv.classList.contains('show')) { closeEarlyUnstakeSheet(); return; }
    const tipOv = document.getElementById('tipOverlay');
    if (tipOv && tipOv.style.display === 'flex') { hideTip(); return; }
  }
  document.addEventListener('keydown', handleGlobalEscape);

  function trapFocus(containerEl) {
    if (!containerEl) return;
    const focusables = containerEl.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    setTimeout(function() { first.focus(); }, 50);
    if (containerEl._trapHandler) containerEl.removeEventListener('keydown', containerEl._trapHandler);
    const handler = function(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    containerEl.addEventListener('keydown', handler);
    containerEl._trapHandler = handler;
  }

  /* ═══════════════════════════════════════════════════════
     GOD MODE JS — staking.html
  ═══════════════════════════════════════════════════════ */

  // Feature 1: Cybertron hex canvas
  (function initStakeCanvas() {
    const canvas = document.getElementById('cyberCanvasStake');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const COLS = ['rgba(0,212,255,','rgba(0,229,160,','rgba(139,63,232,'];
    const FRAME_MS = 1000/22;
    let pts = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize, {passive:true});
    for (let i = 0; i < 24; i++) {
      pts.push({ x:Math.random()*innerWidth, y:Math.random()*innerHeight,
        vx:(Math.random()-0.5)*0.45, vy:(Math.random()-0.5)*0.45,
        r:5+Math.random()*9, phase:Math.random()*Math.PI*2,
        c:COLS[Math.floor(Math.random()*COLS.length)], op:0.04+Math.random()*0.06 });
    }
    function hex(cx,cy,r){ ctx.beginPath(); for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6; i?ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a));} ctx.closePath(); }
    let lastT=0;
    function loop(t){
      if(t-lastT<FRAME_MS){requestAnimationFrame(loop);return;} lastT=t;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.phase+=0.018;
        if(p.x<-20)p.x=canvas.width+20; if(p.x>canvas.width+20)p.x=-20;
        if(p.y<-20)p.y=canvas.height+20; if(p.y>canvas.height+20)p.y=-20;
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[j].x-pts[i].x, dy=pts[j].y-pts[i].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<125){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=pts[i].c+(0.04*(1-d/125)).toFixed(3)+')'; ctx.lineWidth=0.7; ctx.stroke(); }
      }
      pts.forEach(p=>{
        const op=p.op*(0.64+0.36*Math.sin(p.phase));
        hex(p.x,p.y,p.r); ctx.fillStyle=p.c+op.toFixed(3)+')'; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,1.5,0,Math.PI*2); ctx.fillStyle=p.c+'0.85)'; ctx.fill();
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  // Feature 2: Live per-second yield ticker — re-injected after each real render,
  // driven by each position's actual amount/APY, not hardcoded stakes.
  function injectLiveTickers() {
    const cards = document.querySelectorAll('#stakesContainer .stake-item');
    stakingPositions.forEach(function(p, i) {
      const card = cards[i];
      if (!card) return;
      const rv = card.querySelector('.si-rewards-val');
      if (!rv || rv.parentNode.querySelector('.live-tick')) return;
      const midApy = (Number(p.apy_low) + Number(p.apy_high)) / 2 / 100;
      const perSec = (Number(p.amount_indx) * midApy) / 31536000;
      const tick = document.createElement('div');
      tick.className = 'live-tick';
      tick.innerHTML = '<div class="live-dot-g"></div><span style="font-variant-numeric:tabular-nums;">+' + perSec.toFixed(8) + ' INDX/s</span>';
      rv.parentNode.appendChild(tick);
    });
  }

  // Feature 3: WS ring animate + milestones toggle
  function toggleWsMilestones() {
    const m = document.getElementById('wsMilestones');
    const w = document.getElementById('wsRingWrap');
    if (!m) return;
    const isOpen = m.classList.toggle('open');
    if (w) w.classList.toggle('open-ms', isOpen);
  }
  // Real Wisdom Score ring + milestone list — driven by sessionStorage citizen_wisdom
  // (set from the real citizens.wisdom_score / award_wisdom RPC elsewhere in the app),
  // not a fabricated fixed score. Canonical gates per whitepaper Appendix A: 50/100/150/200.
  function renderWsProgress() {
    const score = parseInt(sessionStorage.getItem('citizen_wisdom') || '0');
    const arc = document.getElementById('wsRingArc');
    const textEl = document.getElementById('wsRingText');
    const labelEl = document.getElementById('wsRingLabel');
    const subEl = document.getElementById('wsRingSub');
    const gate = 100; // Sovereign Yield gate
    if (textEl) textEl.textContent = score;
    if (labelEl) labelEl.textContent = 'Wisdom Score: ' + score + ' / ' + gate;
    if (subEl) {
      const levelUpLink = '<span style="color:var(--cyan);font-weight:600;" data-action="h_3" data-args="[&quot;$event&quot;]">Level up →</span>';
      subEl.innerHTML = (score >= gate
        ? 'Sovereign Yield unlocked ✓ Tap for milestones. '
        : (gate - score) + ' points from Sovereign Yield. Tap for milestones. ') + levelUpLink;
    }
    if (arc) {
      const circ = 2 * Math.PI * 23; // r=23, C≈144.5
      const pct = Math.max(0, Math.min(1, score / gate));
      const filled = circ * (1 - pct);
      setTimeout(function() { arc.style.strokeDashoffset = filled.toFixed(1); }, 350);
    }

    // Canonical milestone list — matches whitepaper Appendix A exactly, no invented tiers/rewards
    const MILESTONES = [
      { threshold: 50,  label: 'Governor — governance voting unlocked' },
      { threshold: 100, label: 'Sovereign — Sovereign Yield + Staking unlocked' },
      { threshold: 150, label: 'Elder — Civilisation Fee reduced' },
      { threshold: 200, label: 'Sovereign Elder — maximum tier' }
    ];
    const track = document.getElementById('wsMilestones');
    if (track) {
      track.innerHTML = MILESTONES.map(function(m) {
        if (score >= m.threshold) {
          return '<div class="ws-ms-row ws-ms-done"><span class="ws-ms-badge done">WS ' + m.threshold + ' ✓</span><span>' + m.label + '</span></div>';
        }
        return '<div class="ws-ms-row"><span class="ws-ms-badge">WS ' + m.threshold + '</span><span>' + m.label + '</span></div>';
      }).join('');
    }
  }

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.history.back(); }
function h_2(event) { window.location.href='help.html'; }
function h_3(event) { event.stopPropagation();window.location.href='wisdom-score.html'; }
function h_4(event) { document.getElementById('confirmOverlay').classList.remove('show'); }
function h_5(event) { event.stopPropagation(); }
function h_6(event) { document.getElementById('confirmOverlay').classList.remove('show');switchTab('mystakes'); }
function h_7(event, __p0) { claimRewards(String(__p0)); }
function h_8(event, __p0) { handleUnstakeClick(String(__p0)); }
function h_9(event, __p0) { restakePosition(String(__p0)); }


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

})();
