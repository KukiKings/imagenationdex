
  // ── SUPABASE CLIENT ──
  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // Turnstile: send the OTP with a captcha token. IndxCaptcha.options() consumes the token and resets the widget after every attempt.
  // On captcha_failed, retry once with a fresh token. On sitekey-secret-mismatch, stop (dashboard secret does not match the site key).
  async function otpSend(payload) {
    const go = async () => sb.auth.signInWithOtp({ ...payload, options: window.IndxCaptcha ? await IndxCaptcha.options(payload.options || {}) : (payload.options || {}) });
    const why = (e) => e ? ((e.code || '') + ' ' + (e.message || '')) : '';
    let r = await go();
    if (r.error && /sitekey-secret-mismatch/i.test(why(r.error))) { console.error('[captcha] sitekey-secret-mismatch: Supabase secret does not match the Turnstile site key'); return r; }
    if (r.error && /captcha/i.test(why(r.error))) r = await go();
    return r;
  }


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
  // Fire immediately (not gated on DOMContentLoaded — this flow has no single init
  // point). Resolves well before the face-scan/portal-activation step where the
  // gated RPCs below actually fire, in the rare case a session already exists.
  initRealSession();

  let selectedGoal = null;

  // ── GOAL SELECTION ──
  function selectGoal(el) {
    document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedGoal = { goal: el.dataset.goal, emoji: el.dataset.emoji, label: el.dataset.label };
    document.getElementById('btn1').disabled = false;
  }

  // ── SCREEN NAVIGATION ──
  function goToScreen(n, reverse = false) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active', 'reverse');
    });
    const target = document.getElementById('screen' + n);
    if (reverse) target.classList.add('reverse');
    target.classList.add('active');
    updateProgress(n);

    if (n === 2 && selectedGoal) {
      document.getElementById('goalTagText').textContent = selectedGoal.label;
      document.querySelector('.goal-tag-emoji').textContent = selectedGoal.emoji;
      updateFirstSteps(selectedGoal.goal);
    }
  }

  function updateProgress(n) {
    const fills = { 1: '16%', 2: '40%', 3: '70%', 4: '100%' };
    document.getElementById('progressFill').style.width = fills[n] || '16%';
    ['pl1','pl2','pl3','pl4'].forEach((id, i) => {
      document.getElementById(id).classList.toggle('active', i + 1 === n);
    });
  }

  // ── DOMAIN AVAILABILITY (live check) ──
  // check_domain_available(p_domain) takes the BARE name (no suffix) and appends .IN$DEX itself.
  // create_onboarding_citizen takes the FULL string (slug + '.IN$DEX') in web3_domain. Two formats.
  let domainCheck = { slug: '', ok: false };
  function currentSlug() {
    const name = document.getElementById('nameInput').value.trim();
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'sovereign';
  }
  function setDomainStatus(html, color) {
    const st = document.getElementById('domainStatus');
    if (!st) return;
    st.style.display = html ? 'block' : 'none';
    st.style.color = color || '';
    st.innerHTML = html || '';
  }

  // ── DOMAIN PREVIEW ──
  function updateDomain() {
    const name = document.getElementById('nameInput').value.trim();
    const domainEl = document.getElementById('domainName');
    const errEl = document.getElementById('domainError');
    // Clear any domain collision error when user edits
    if (errEl) { errEl.style.display = 'none'; }
    if (domainCheck.slug !== currentSlug()) { domainCheck = { slug: '', ok: false }; setDomainStatus(''); }
    if (name.length > 0) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'sovereign';
      domainEl.innerHTML = slug + '<span>.IN$DEX</span>';
      domainEl.classList.remove('placeholder');
      domainEl.style.color = ''; // reset red from collision state
    } else {
      domainEl.innerHTML = 'yourname<span>.IN$DEX</span>';
      domainEl.classList.add('placeholder');
      domainEl.style.color = '';
    }
    checkIdentityForm();
  }

  function checkIdentityForm() {
    const name = document.getElementById('nameInput').value.trim();
    const contact = document.getElementById('contactInput').value.trim();
    const valid = name.length > 1 && contact.length > 4 && domainCheck.ok && domainCheck.slug === currentSlug();
    document.getElementById('btn2').disabled = !valid;
  }

  async function checkDomainAvailability() {
    const name = document.getElementById('nameInput').value.trim();
    if (name.length < 2) { return; }
    const slug = currentSlug();
    if (domainCheck.ok && domainCheck.slug === slug) { return; }
    domainCheck = { slug: '', ok: false };
    checkIdentityForm();
    setDomainStatus('Checking ' + slug + '.IN$DEX\u2026', 'var(--text-muted)');
    try {
      const { data, error } = await sb.rpc('check_domain_available', { p_domain: slug });
      if (currentSlug() !== slug) { return; } // name changed while the check was running
      if (error || typeof data !== 'boolean') {
        setDomainStatus('Could not check availability \u2014 click out of the name box to try again.', 'var(--red)');
        return;
      }
      if (data) {
        domainCheck = { slug, ok: true };
        setDomainStatus('\u2713 ' + slug + '.IN$DEX is available', 'var(--green)');
        checkIdentityForm();
        return;
      }
      // Taken: find up to two alternatives that are actually available.
      const alts = [];
      for (const n of ['1', '2', '3', '4', '5']) {
        if (alts.length >= 2) break;
        const cand = slug.slice(0, 20 - n.length) + n;
        try {
          const r = await sb.rpc('check_domain_available', { p_domain: cand });
          if (currentSlug() !== slug) { return; }
          if (!r.error && r.data === true) alts.push(cand);
        } catch (e) { /* skip this candidate */ }
      }
      const tryText = alts.length
        ? ' Try: ' + alts.map(a => '<em style="color:#00D4FF;">' + a + '.IN$DEX</em>').join(' or ') + ' \u2014 edit your name above.'
        : ' Edit your name above to try another.';
      setDomainStatus('\u2717 <strong>' + slug + '.IN$DEX is already claimed.</strong>' + tryText, 'var(--red)');
    } catch (e) {
      if (currentSlug() !== slug) { return; }
      setDomainStatus('Could not check availability \u2014 click out of the name box to try again.', 'var(--red)');
    }
  }

  // ── FIRST STEPS BY GOAL ──
  function updateFirstSteps(goal) {
    const steps = {
      earn: [
        ['Turn on notifications', 'Never miss a payment or reward 30 seconds'],
        ['Run a Light Node', 'Earn INDX passively your phone does the work'],
        ['Refer one person', 'Share your portal link. INDX rewards are planned for Phase 2. No token exists.'],
      ],
      trade: [
        ['Turn on notifications', 'Get instant alerts on new offers and price moves'],
        ['Browse the marketplace', 'Explore digital assets and real-world items near you'],
        ['Make your first trade', 'Buy or sell P2P settled in seconds on Solana'],
      ],
      build: [
        ['Turn on notifications', 'Know the moment a buyer messages you instantly'],
        ['Set up your storefront', 'Name it, describe it, go live in minutes'],
        ['Activate SovereignPay', 'Accept payments keep 98%, always'],
      ],
    };
    const s = steps[goal] || steps.earn;
    document.getElementById('fs1Title').textContent = s[0][0];
    document.getElementById('fs1Desc').textContent = s[0][1];
    document.getElementById('fs2Title').textContent = s[1][0];
    document.getElementById('fs2Desc').textContent = s[1][1];
    document.getElementById('fs3Title').textContent = s[2][0];
    document.getElementById('fs3Desc').textContent = s[2][1];
  }

  // ── ACTIVATE PORTAL (4.2s loading) ──
  // Tier 0 KYC — added 2026-09-04. Previously activatePortal() went straight from the
  // identity form to create_onboarding_citizen with zero verification: any phone or email
  // typed here was accepted and written straight to citizens.phone_number/email. This is
  // the app's primary, most-linked signup entry point (index.html's featured card,
  // home-v3.html, sms-claim.html's onward redirect, etc.) — per the 2026-07-27 founder
  // decision "Tier 0 is phone + contact + OTP only", it needed the same real Supabase Auth
  // OTP mechanism already proven in join.html/biometric-kyc.html/quickstart-onboarding.html,
  // not another parallel implementation of it.
  let onboardOtpContact = '';
  let onboardOtpIsPhone = false;
  let optionalEmail = null; // set only if the citizen enters one on the optional email step

  function activatePortal() {
    const name = document.getElementById('nameInput').value.trim();
    optionalEmail = null;
    if (!(domainCheck.ok && domainCheck.slug === currentSlug())) { checkDomainAvailability(); return; }
    const rawContact = document.getElementById('contactInput').value.trim();
    onboardOtpIsPhone = rawContact.startsWith('+') || /^[\d\s\-()+]+$/.test(rawContact);
    // Same normalization as quickstart-onboarding.html's e164Phone() / login.html's
    // sendOTP() (2026-09-04 fix) — strip everything but digits, then a leading 0, so the
    // string sent to signInWithOtp matches what Supabase Auth actually verifies and what
    // every other screen expects in citizens.phone_number.
    onboardOtpContact = onboardOtpIsPhone
      ? '+' + rawContact.replace(/\D/g, '').replace(/^0+/, '')
      : rawContact;

    if (!name || !onboardOtpContact || (onboardOtpIsPhone && onboardOtpContact.length < 6)) {
      checkIdentityForm();
      return;
    }

    const btn = document.getElementById('btn2');
    btn.disabled = true; btn.textContent = 'Sending code…';

    (async () => {
      try {
        const { error } = onboardOtpIsPhone
          ? await otpSend({ phone: onboardOtpContact })
          : await otpSend({ email: onboardOtpContact });
        if (error) {
          const errEl = document.getElementById('domainError');
          if (errEl) { errEl.style.display = 'block'; errEl.textContent = error.message || 'Could not send a verification code — try again.'; }
          btn.disabled = false; btn.textContent = 'Activate My Portal →';
          return;
        }
      } catch (e) {
        const errEl = document.getElementById('domainError');
        if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Could not send a verification code — try again.'; }
        btn.disabled = false; btn.textContent = 'Activate My Portal →';
        return;
      }
      btn.disabled = false; btn.textContent = 'Activate My Portal →';
      document.getElementById('otpOverlaySub').textContent =
        (onboardOtpIsPhone ? 'We sent a real 6-digit code to ' : 'We sent a real 6-digit code to ') + onboardOtpContact + '.';
      document.getElementById('otpOverlayError').textContent = '';
      for (let i = 0; i < 6; i++) document.getElementById('oflow' + i).value = '';
      document.getElementById('otpOverlayBtn').disabled = true;
      document.getElementById('otpOverlay').classList.add('active');
      document.getElementById('oflow0').focus();
    })();
  }

  function onboardOtpInput(idx) {
    const el = document.getElementById('oflow' + idx);
    if (el.value && idx < 5) document.getElementById('oflow' + (idx + 1)).focus();
    const code = [0,1,2,3,4,5].map(i => document.getElementById('oflow' + i).value).join('');
    document.getElementById('otpOverlayBtn').disabled = code.length < 6;
    document.getElementById('otpOverlayError').textContent = '';
  }

  async function resendOnboardOtp() {
    const resendBtn = document.getElementById('otpOverlayResend');
    resendBtn.disabled = true;
    try {
      const { error } = onboardOtpIsPhone
        ? await otpSend({ phone: onboardOtpContact })
        : await otpSend({ email: onboardOtpContact });
      document.getElementById('otpOverlayError').textContent = error ? (error.message || 'Could not resend — try again.') : '';
      if (!error) document.getElementById('otpOverlayError').style.color = 'var(--green)';
      if (!error) document.getElementById('otpOverlayError').textContent = 'New code sent';
    } catch (e) {
      document.getElementById('otpOverlayError').textContent = 'Could not resend — try again.';
    }
    setTimeout(() => { resendBtn.disabled = false; }, 3000);
  }

  function cancelOnboardOtp() {
    document.getElementById('otpOverlay').classList.remove('active');
  }

  async function verifyOnboardOtp() {
    const token = [0,1,2,3,4,5].map(i => document.getElementById('oflow' + i).value).join('');
    const btn = document.getElementById('otpOverlayBtn');
    btn.disabled = true; btn.textContent = 'Verifying…';
    try {
      const { error } = onboardOtpIsPhone
        ? await sb.auth.verifyOtp({ phone: onboardOtpContact, token, type: 'sms' })
        : await sb.auth.verifyOtp({ email: onboardOtpContact, token, type: 'email' });
      if (error) {
        document.getElementById('otpOverlayError').style.color = 'var(--red)';
        document.getElementById('otpOverlayError').textContent = 'Invalid code — try again';
        btn.disabled = false; btn.textContent = 'Verify →';
        return;
      }
    } catch (e) {
      document.getElementById('otpOverlayError').style.color = 'var(--red)';
      document.getElementById('otpOverlayError').textContent = 'Verification failed — try again';
      btn.disabled = false; btn.textContent = 'Verify →';
      return;
    }
    btn.textContent = 'Verify →';
    document.getElementById('otpOverlay').classList.remove('active');
    if (onboardOtpIsPhone) { openOptionalEmailStep(); }
    else { completeActivation(onboardOtpContact, onboardOtpIsPhone); }
  }

  // ── OPTIONAL EMAIL STEP (phone sign-ups only; an email sign-up already has one) ──
  function openOptionalEmailStep() {
    document.getElementById('optEmailInput').value = '';
    document.getElementById('emailOverlayError').textContent = '';
    document.getElementById('emailContinueBtn').disabled = true;
    document.getElementById('emailOverlay').classList.add('active');
    document.getElementById('optEmailInput').focus();
  }
  function onOptEmailInput() {
    const v = document.getElementById('optEmailInput').value.trim();
    document.getElementById('emailContinueBtn').disabled = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    document.getElementById('emailOverlayError').textContent = '';
  }
  function submitOptionalEmail() {
    const v = document.getElementById('optEmailInput').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      document.getElementById('emailOverlayError').textContent = 'Enter a valid email or tap Skip.';
      return;
    }
    optionalEmail = v;
    document.getElementById('emailOverlay').classList.remove('active');
    completeActivation(onboardOtpContact, onboardOtpIsPhone);
  }
  function skipOptionalEmail() {
    optionalEmail = null;
    document.getElementById('emailOverlay').classList.remove('active');
    completeActivation(onboardOtpContact, onboardOtpIsPhone);
  }

  function completeActivation(contact, isPhone) {
    const name = document.getElementById('nameInput').value.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'sovereign';

    // Set portal domain
    document.getElementById('portalDomain').innerHTML = slug + '<span>.IN$DEX</span>';
    document.getElementById('portalSubtitle').textContent = name + ' · Sovereign Republic';

    // Show overlay
    document.getElementById('loadingOverlay').classList.add('active');

    // Animate steps
    const steps = ['ls1','ls2','ls3','ls4','ls5'];
    const icons = ['⟳','⟳','⟳','⟳','⟳'];
    const doneIcon = '✓';
    const durations = [700, 900, 800, 900, 900]; // ~4.2s total
    const labels = ['Registering your sovereign identity','Creating your MPC wallet','Minting your .IN$DEX domain','Depositing Genesis bonus','Activating your embassy'];

    // Timer countdown
    const startTime = Date.now();
    const total = 4200;
    const timerEl = document.getElementById('loadingTimer');
    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (total - elapsed) / 1000);
      timerEl.textContent = remaining.toFixed(1) + 's';
      if (elapsed >= total) clearInterval(timerInterval);
    }, 50);

    let delay = 0;
    steps.forEach((id, i) => {
      setTimeout(() => {
        // Previous step done
        if (i > 0) {
          const prev = document.getElementById(steps[i-1]);
          prev.classList.remove('active-step');
          prev.classList.add('done');
          prev.querySelector('.ls-icon').textContent = doneIcon;
        }
        // Current step active
        const el = document.getElementById(id);
        el.classList.add('active-step');
        el.querySelector('.ls-icon').textContent = '⟳';
      }, delay);
      delay += durations[i];
    });

    // Final: all done → switch to screen 3
    setTimeout(() => {
      const last = document.getElementById(steps[steps.length-1]);
      last.classList.remove('active-step');
      last.classList.add('done');
      last.querySelector('.ls-icon').textContent = doneIcon;

      setTimeout(async () => {
        document.getElementById('loadingOverlay').classList.remove('active');
        // Reset loading steps for reuse
        steps.forEach(id => {
          const el = document.getElementById(id);
          el.classList.remove('done','active-step');
          el.querySelector('.ls-icon').textContent = '○';
        });

        // ── SUPABASE INSERT create citizen record ──
        // FIXED 2026-09-04: contact/isPhone used to be re-read from the DOM and
        // recomputed right here, disconnected from whatever (if anything) had actually
        // been OTP-verified. Now passed in directly from verifyOnboardOtp() — this is
        // the exact same string that was just sent to signInWithOtp and checked by
        // verifyOtp, so what gets written below is guaranteed to be the verified value.
        try {
          // Check for referral code in URL params, falling back to one applied via
          // the QR-scan / manual-entry flow below (applyReferralCode() stores it in
          // sessionStorage under the same 'referral_code' key detectReferral() uses
          // for a ?ref= link, so either path lands here identically).
          const urlRef = new URLSearchParams(window.location.search).get('ref') || sessionStorage.getItem('referral_code') || '';

          // Routed through create_onboarding_citizen(), not a raw insert —
          // this flow never authenticates, so it always runs as the 'anon'
          // role, which has no auth.uid() and can never pass any SELECT
          // policy on citizens. A raw insert().select() was guaranteed to
          // throw "violates row-level security policy" on every signup. The
          // RPC inserts server-side and returns the id directly. Reward
          // fields granted after via claim_genesis_signup_bonus_anon() —
          // found + fixed 19 Jul 2026.
          const onboardPayload = {
            citizen_name: name,
            phone_number: isPhone ? contact : null,
            web3_domain: slug + '.IN$DEX', // FULL string; the availability check used the bare slug
            referred_by: urlRef || null
          };
          // email: the verified email contact, or the optional email from the email step.
          // If neither exists the key is omitted.
          if (!isPhone) onboardPayload.email = contact;
          else if (optionalEmail) onboardPayload.email = optionalEmail;
          const { data: created, error: rpcError } = await sb.rpc('create_onboarding_citizen', { p_payload: onboardPayload });
          const data = created && created.success ? { id: created.id } : null;
          const error = created && !created.success ? { code: created.reason === 'duplicate' ? '23505' : 'unknown', message: created.reason, details: created.detail } : rpcError;
          // Real Supabase Auth session now exists (verifyOnboardOtp()'s verifyOtp() call
          // succeeded before this ever runs) — link it so future RLS-gated calls (transfer_indx
          // etc.) work for this citizen. link_citizen_auth_by_id self-heals phone_number from
          // auth.users.phone too. Non-fatal if it fails.
          if (data?.id) { try { await sb.rpc('link_citizen_auth_by_id', { p_citizen_id: data.id }); } catch (linkErr) { /* non-fatal */ } }
          // NOTE (2026-07-27): claim_genesis_signup_bonus_anon is being changed to write a
          // pending_review row to recognition_ledger instead of crediting spendable
          // indx_balance directly. NOTE 2026-07-29: the referenced migration draft is NOT
          // on disk anywhere in this repo, and no recognition_ledger table or
          // indx_quarantine_floor column exists in Supabase (verified by query). This
          // comment describes intended future work, not something staged or applied —
          // do not assume the migration exists. Once that
          // migration is applied, this RPC call no longer makes 50 INDX spendable; it only
          // records eligibility. Do not re-introduce a hardcoded '50' balance below.
          if (data?.id) await sb.rpc('claim_genesis_signup_bonus_anon', { p_citizen_id: data.id });

          if (data?.id) {
            sessionStorage.setItem('citizen_id', data.id);
            sessionStorage.setItem('citizen_name', name);
            sessionStorage.setItem('citizen_wisdom', '25');
            sessionStorage.setItem('citizen_balance', '0');
            sessionStorage.setItem('citizen_genesis_recognition_pending', '50');
            sessionStorage.setItem('citizen_web3_domain', slug + '.IN$DEX');
            sessionStorage.setItem('citizen_genesis', 'true');

            // Complete referral attribution if citizen arrived via ref link
            if (urlRef) {
              try {
                await fetch('https://zljgthfzbalsunuoohcd.supabase.co/rest/v1/rpc/complete_referral', {
                  method: 'POST',
                  headers: rpcHeaders(),
                  body: JSON.stringify({ p_referral_code: urlRef, p_referred_citizen_id: data.id })
                });
              } catch(e) { /* non-critical — attribution is best-effort */ }
            }

            // Fulfil an instant-onboard.html pledge, if this citizen arrived via one.
            // Separate mechanism from the ?ref= referral system above (distinct URL
            // param, distinct table) — this one actually moves INDX from whoever sent
            // the invite, atomically, only once this account is confirmed real.
            const urlInstant = new URLSearchParams(window.location.search).get('instant') || '';
            if (urlInstant) {
              try {
                const fRes = await fetch('https://zljgthfzbalsunuoohcd.supabase.co/rest/v1/rpc/fulfill_instant_invite', {
                  method: 'POST',
                  headers: rpcHeaders(),
                  body: JSON.stringify({ p_invite_code: urlInstant, p_new_citizen_id: data.id })
                });
                const fBody = await fRes.json();
                if (fBody?.success && fBody?.payment_sent) {
                  // Reflect the arrived payment in this device's own session so the
                  // rest of the app (balance display etc.) is correct immediately —
                  // it was already written for real server-side above. Base is 0
                  // (Genesis recognition is pending, not spendable — see note above);
                  // the instant-invite amount IS real, already-spendable indx_balance
                  // moved from an existing citizen, so it's the only thing added here.
                  const newBal = Number(fBody.amount_indx || 0);
                  sessionStorage.setItem('citizen_balance', String(newBal));
                } else {
                  // No silent failure here either. sms-claim.html told this citizen
                  // "the INDX lands immediately" -- that only holds if the sender's
                  // balance still covered it at claim time (fulfill_instant_invite
                  // checks this for real and can legitimately return payment_sent:
                  // false), or the invite could have been claimed/expired by someone
                  // else in the gap between sms-claim.html's status check and this
                  // call. Either way the citizen followed a real gift link and got
                  // a real account but no money -- say so instead of leaving
                  // citizen_balance at its 0 default with no explanation.
                  const reason = fBody?.success
                    ? "the sender's balance no longer covered it at claim time"
                    // FIXED 2026-09 (Approval Gateway wiring): fulfill_instant_invite
                    // is now gated on the referrer's approval (agent_registry
                    // risk_class=3) -- a pending_approval response is neither
                    // "already claimed" nor "expired", it just hasn't cleared yet.
                    : fBody?.pending_approval ? 'the sender needs to approve it first — check back soon'
                    : fBody?.reason === 'already_used' ? 'it was already claimed'
                    : fBody?.reason === 'expired' ? 'it expired'
                    : 'it could not be completed';
                  const giftBanner = document.createElement('div');
                  giftBanner.style.cssText = 'position:fixed;top:16px;left:16px;right:16px;max-width:398px;margin:0 auto;background:rgba(255,184,0,0.12);border:1px solid rgba(255,184,0,0.35);border-radius:12px;padding:12px 16px;font-size:13px;color:#FFB800;z-index:500;text-align:center;';
                  giftBanner.textContent = 'Your account is real, but the gift you followed here didn’t come through — ' + reason + '. No INDX was added.';
                  document.body.appendChild(giftBanner);
                  setTimeout(() => giftBanner.remove(), 8000);
                }
              } catch(e) { console.error('[onboarding-flow] instant invite fulfillment failed (non-critical, account still created):', e); }
            }
          }

          // ── DUPLICATE HANDLING ──
          if (error?.code === '23505') {
            const detail = error.message || error.details || '';
            const isDomainCollision = detail.includes('web3_domain') || (!isPhone);

            if (isDomainCollision) {
              // Domain taken — suggest a numbered variant and send back to screen 2
              const suggestion = slug.replace(/\d+$/, '') + (parseInt((slug.match(/\d+$/) || ['1'])[0]) + 1 || 2);
              const errEl = document.getElementById('domainError');
              if (errEl) {
                errEl.style.display = 'block';
                errEl.innerHTML = `<strong>${slug}.IN$DEX is already claimed.</strong><br>Try: <em style="color:#00D4FF;">${suggestion}.IN$DEX</em> — edit your name below.`;
              }
              // Update the domain hero to show the taken state
              const domainEl = document.getElementById('domainName');
              if (domainEl) {
                domainEl.innerHTML = slug + '<span>.IN$DEX</span>';
                domainEl.style.color = '#FF4D6D';
              }
              goToScreen(2, true);
              return; // skip goToScreen(3)
            }

            // Duplicate phone — look up existing citizen and carry on
            if (isPhone) {
              const { data: existing } = await sb
                .from('citizens').select('id, citizen_name')
                .eq('phone_number', contact).single();
              if (existing?.id) {
                sessionStorage.setItem('citizen_id', existing.id);
                sessionStorage.setItem('citizen_name', existing.citizen_name || name);
              }
            }
          }
        } catch(e) {
          // No silent failure — citizen must know their account wasn't saved to the network.
          console.error('[onboarding] citizen insert failed:', e);
          const banner = document.createElement('div');
          banner.style.cssText = 'position:fixed;top:16px;left:16px;right:16px;max-width:398px;margin:0 auto;background:rgba(255,77,109,0.12);border:1px solid rgba(255,77,109,0.35);border-radius:12px;padding:12px 16px;font-size:13px;color:#FF4D6D;z-index:500;text-align:center;';
          banner.textContent = 'We could not connect to the network to save your account. Your portal will still work, but re-open this page when you have signal to finish registration.';
          document.body.appendChild(banner);
          setTimeout(() => banner.remove(), 8000);
        }

        goToScreen(4);
      }, 400);
    }, delay);
  }

  // ── FACE SCAN + CPT MINT ── ORPHANED FROM PRIMARY FLOW (2026-07-27) ──
  // These functions are no longer called from screen2 (which now calls activatePortal()
  // directly per the Tier 0 correction above). Kept for a possible future Tier 1 build,
  // NOT deleted per founder instruction to preserve/mark rather than silently remove.
  // The CPT "mint" sequence below (startSelfCptMint/activateCmoStage) is simulated
  // (setTimeout/Math.random progress bars) and was never wired to a real Solana mint —
  // do not present it as live if this is ever reconnected without a real mint pipeline.
  let _selfName = '';
  let _selfSlug = '';
  let _fssGuidanceInterval = null;
  let _fssNodeInterval = null;

  const FSS_GUIDANCE = [
    'Position your face in the oval',
    'Hold still…',
    'Good lighting detected ✓',
    'Mapping facial geometry…',
    'Iris pattern captured ✓',
    'Liveness confirmed ✓',
    'Perfect — processing now…',
  ];
  let _fssGuidanceIdx = 0;

  function goToFaceScan() {
    const name = document.getElementById('nameInput').value.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'sovereign';
    _selfName = name;
    _selfSlug = slug;
    document.getElementById('portalDomain').innerHTML = slug + '<span>.IN$DEX</span>';
    document.getElementById('portalSubtitle').textContent = name + ' · Sovereign Republic';
    document.getElementById('cmoDomain').textContent = slug + '.IN$DEX';
    goToScreen(3);
  }

  function startSelfPrivacyConsent() {
    let c = document.getElementById('selfPrivacyOverlay');
    if (!c) {
      c = document.createElement('div');
      c.id = 'selfPrivacyOverlay';
      c.style.cssText = 'position:fixed;inset:0;background:rgba(9,10,16,0.96);z-index:210;display:flex;align-items:flex-end;justify-content:center;';
      c.innerHTML = `<div style="background:#12141F;border-radius:24px 24px 0 0;padding:28px 24px 44px;width:100%;max-width:430px;">
        <div style="width:40px;height:4px;background:#2A2D38;border-radius:2px;margin:0 auto 20px;"></div>
        <div style="font-size:22px;text-align:center;margin-bottom:10px;">🔐</div>
        <div style="font-size:18px;font-weight:900;text-align:center;margin-bottom:8px;">Face scan consent</div>
        <div style="font-size:13px;color:#6B7080;text-align:center;line-height:1.6;margin-bottom:20px;">Your face is <strong style="color:#EAEAEA;">never uploaded or stored</strong>. It is converted into a mathematical proof on your device only. The proof — not your photo — Citizen Proof Token is planned for Phase 2. No token is minted today.</div>
        <div style="background:#0A1F18;border:1px solid rgba(0,229,160,0.2);border-radius:12px;padding:12px 14px;margin-bottom:20px;">
          <div style="font-size:11px;color:#00E5A0;font-weight:700;margin-bottom:6px;">What happens to your face scan:</div>
          <div style="font-size:11px;color:#6B7080;line-height:1.6;">✓ Converted to 80 nodal measurements on-device<br>✓ Turned into a ZK proof — the photo is discarded<br>✓ Face verification is a preview. No NFT is minted and no proof is written on-chain.<br>✓ Your face data never leaves this device</div>
        </div>
        <button data-action="acceptSelfPrivacyAndScan" style="width:100%;padding:16px;border-radius:14px;background:linear-gradient(135deg,#00D4FF,#8B3FE8);border:none;color:#000;font-size:15px;font-weight:900;cursor:pointer;margin-bottom:10px;">I understand — Start face scan →</button>
        <button data-action="h_9" data-args="[&quot;$event&quot;]" style="width:100%;padding:13px;border-radius:12px;background:none;border:1px solid #2A2D38;color:#6B7080;font-size:13px;font-weight:700;cursor:pointer;">Cancel</button>
      </div>`;
      document.body.appendChild(c);
    }
  }

  function acceptSelfPrivacyAndScan() {
    document.getElementById('selfPrivacyOverlay').remove();
    document.getElementById('btn3').disabled = true;
    document.getElementById('fssStats').style.opacity = '1';
    document.getElementById('fssScanLine').style.display = 'block';
    document.getElementById('fssAvatar').style.opacity = '0.15';
    // Cycle guidance
    _fssGuidanceIdx = 0;
    _fssGuidanceInterval = setInterval(() => {
      if (_fssGuidanceIdx >= FSS_GUIDANCE.length) { clearInterval(_fssGuidanceInterval); return; }
      document.getElementById('fssGuidance').textContent = FSS_GUIDANCE[_fssGuidanceIdx++];
    }, 700);
    // Count nodes 0 → 80
    let nodes = 0;
    document.getElementById('fssNodes').textContent = '0';
    document.getElementById('fssIris').textContent = '–';
    document.getElementById('fssLiveness').textContent = '–';
    _fssNodeInterval = setInterval(() => {
      nodes += Math.ceil(Math.random() * 8);
      if (nodes >= 80) { nodes = 80; clearInterval(_fssNodeInterval); }
      document.getElementById('fssNodes').textContent = nodes;
      if (nodes > 40) document.getElementById('fssIris').textContent = '✓';
      if (nodes >= 80) document.getElementById('fssLiveness').textContent = '✓';
    }, 120);
    // Fire CPT mint after 5s
    setTimeout(() => {
      clearInterval(_fssGuidanceInterval);
      document.getElementById('fssGuidance').textContent = 'Scan complete ✓ — minting your CPT…';
      setTimeout(startSelfCptMint, 600);
    }, 5000);
  }

  function startSelfCptMint() {
    document.getElementById('cptMintOverlay').classList.add('show');
    activateCmoStage(1, () => activateCmoStage(2, () => activateCmoStage(3, () => {
      // Reveal CPT card
      document.getElementById('cmoCptCard').style.display = 'block';
      setTimeout(() => {
        document.getElementById('cptMintOverlay').classList.remove('show');
        // Reset face scan for potential reuse
        document.getElementById('btn3').disabled = false;
        document.getElementById('fssStats').style.opacity = '0.3';
        document.getElementById('fssScanLine').style.display = 'none';
        document.getElementById('fssAvatar').style.opacity = '1';
        document.getElementById('fssNodes').textContent = '0';
        document.getElementById('fssIris').textContent = '–';
        document.getElementById('fssLiveness').textContent = '–';
        document.getElementById('fssGuidance').textContent = 'Position your face in the oval';
        document.getElementById('cmoCptCard').style.display = 'none';
        [1,2,3].forEach(i => {
          document.getElementById('cmoFill'+i).style.width = '0%';
          document.getElementById('cmoPct'+i).textContent = '0%';
        });
        // Proceed to activatePortal
        activatePortal();
      }, 2200);
    })));
  }

  function activateCmoStage(n, cb) {
    const fillEl = document.getElementById('cmoFill'+n);
    const pctEl = document.getElementById('cmoPct'+n);
    const duration = [1200, 1000, 1600][n-1];
    const startTime = Date.now();
    const tick = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startTime) / duration) * 100);
      fillEl.style.width = pct + '%';
      pctEl.textContent = Math.round(pct) + '%';
      if (pct >= 100) { clearInterval(tick); if (cb) setTimeout(cb, 200); }
    }, 30);
  }

  // ── STEP TAP ──
  function stepTap(n) {
    const routes = {
      earn:  ['referral.html', 'light-node.html',          'marketplace.html'],
      trade: ['marketplace.html', 'marketplace.html',       'marketplace.html'],
      build: ['my-listings.html', 'sovereignpay.html',      'sovereignpay.html'],
    };
    const goal = selectedGoal ? selectedGoal.goal : 'earn';
    const r = routes[goal] || routes.earn;
    // Step 2 always goes to notifications setup first (param tells notifications-setup to route to create-pin next)
    if (n === 1) { window.location.href = 'notifications-setup.html?from=onboarding'; return; }
    if (r[n - 1]) window.location.href = r[n - 1];
  }

  // ── FAQ TOGGLE ──
  function toggleFaq(toggleEl) {
    const body = toggleEl.nextElementSibling;
    const chevron = toggleEl.querySelector('.faq-chevron');
    const open = body.classList.toggle('open');
    chevron.classList.toggle('open', open);
  }

  // ── ENTER PORTAL ──
  function enterPortal() {
    document.querySelector('.portal-badge').innerHTML = '<div class="portal-badge-dot"></div> ENTERING PORTAL…';
    // Pass the user's chosen name to dashboard
    const name = document.getElementById('nameInput')?.value?.trim() || '';
    const dest = 'create-pin.html' + (name ? '?name=' + encodeURIComponent(name) : '');
    setTimeout(() => { window.location.href = dest; }, 800);
  }

  // ══════════════════════════════════════════════
  // GOD MODE ADDITIONS — onboarding-flow
  // ══════════════════════════════════════════════
  const INDX_PRICE_USD = 0.24;

  // F1: Persist goal selection to localStorage — restore on return visit
  (function restoreGoalFromStorage() {
    const saved = localStorage.getItem('indx_onboarding_goal');
    if (saved) {
      try {
        const g = JSON.parse(saved);
        const card = document.querySelector(`.goal-card[data-goal="${g.goal}"]`);
        if (card) {
          selectGoal(card);
        }
      } catch(e) {}
    }
  })();

  // Override selectGoal to also persist
  const _origSelectGoal = selectGoal;
  selectGoal = function(el) {
    _origSelectGoal(el);
    localStorage.setItem('indx_onboarding_goal', JSON.stringify({
      goal: el.dataset.goal,
      emoji: el.dataset.emoji,
      label: el.dataset.label
    }));
  };

  // F2: Enhanced domain availability check — debounced with taken-list
  const KNOWN_TAKEN_DOMAINS = ['maria','admin','indx','sol','sovereign','test','index','john','james','alice','bob'];
  let _domainDebounce = null;
  const _origUpdateDomain = updateDomain;
  updateDomain = function() {
    _origUpdateDomain();
    // Additional availability check
    const name = document.getElementById('nameInput').value.trim();
    if (name.length < 2) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    if (!slug) return;
    clearTimeout(_domainDebounce);
    _domainDebounce = setTimeout(() => {
      const taken = KNOWN_TAKEN_DOMAINS.includes(slug);
      const errEl = document.getElementById('domainError');
      if (taken && errEl) {
        errEl.style.display = 'block';
        const suggestion = slug + '2';
        errEl.innerHTML = `<strong>${slug}.IN$DEX may already be taken.</strong><br>Try: <em style="color:#00D4FF;">${suggestion}.IN$DEX</em>`;
      }
    }, 600);
  };

  // Corrected 2026-07-25: previously started at a fabricated 12,847 and drifted upward forever
  // (1-3 more "citizens" every 8-18s, persisted in localStorage so it never resets) with zero real
  // backing. Now pulls the real Supabase citizen count, same source used site-wide.
  (function initCitizenCounter() {
    const el = document.getElementById('counterNum');
    if (!el) return;
    (async () => {
      try {
        const { data } = await sb.rpc('get_waitlist_count');
        if (typeof data === 'number' && data >= 0) el.textContent = data.toLocaleString();
      } catch (e) {}
    })();
  })();

  // F4: Auto-detect referral code from URL and show banner
  (function detectReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      sessionStorage.setItem('referral_code', ref);
      const banner = document.getElementById('referralBanner');
      if (banner) banner.classList.add('show');
    }
  })();

  // ══════════════════════════════════════════════
  // QR REFERRAL SCAN — additive convenience only.
  // Lets a citizen scan (or type) an invite/referral code instead of needing a
  // ?ref= link. It only ever writes sessionStorage('referral_code') — the exact
  // same value completeActivation() above already reads for a URL-based referral
  // — so it can only prefill that one field. It never touches, bypasses, or runs
  // before signInWithOtp/verifyOtp; identity verification is untouched.
  //
  // Feature-detects the standard BarcodeDetector API (no external CDN dependency
  // added). When it — or camera access — isn't available, this drops straight to
  // manual code entry so there is never a scan button that can't do anything.
  // There is no fabricated "scan success": a code is only applied when the real
  // BarcodeDetector actually decodes a QR code, or the citizen types one in.
  // ══════════════════════════════════════════════
  let _qrStream = null;
  let _qrDetector = null;
  let _qrScanTimer = null;

  function openReferralQrScan() {
    document.getElementById('qrScanOverlay').classList.add('active');
    document.getElementById('qrManualError').textContent = '';
    document.getElementById('qrManualInput').value = sessionStorage.getItem('referral_code') || '';
    document.getElementById('qrScanSub').textContent = 'Point your camera at the QR code your friend shared, or enter their code below.';

    const hasBarcodeDetector = 'BarcodeDetector' in window;
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    if (hasBarcodeDetector && hasCamera) {
      document.getElementById('qrManualWrap').classList.remove('active');
      document.getElementById('qrToggleManualBtn').style.display = 'block';
      document.getElementById('qrToggleManualBtn').textContent = 'Type it in instead';
      startQrCamera();
    } else {
      // No live-scanning path on this device/browser — go straight to manual entry
      // rather than showing a camera control that could never work.
      document.getElementById('qrScanSub').textContent = "QR scanning isn't supported on this device — enter the invite code below.";
      document.getElementById('qrVideoWrap').classList.remove('active');
      document.getElementById('qrManualWrap').classList.add('active');
      document.getElementById('qrToggleManualBtn').style.display = 'none';
    }
  }

  function toggleQrManualEntry() {
    const manual = document.getElementById('qrManualWrap');
    const showing = manual.classList.toggle('active');
    document.getElementById('qrToggleManualBtn').textContent = showing ? 'Use camera instead' : 'Type it in instead';
    if (showing) {
      stopQrCamera();
      document.getElementById('qrVideoWrap').classList.remove('active');
      document.getElementById('qrScanStatus').textContent = '';
    } else {
      startQrCamera();
    }
  }

  async function startQrCamera() {
    const statusEl = document.getElementById('qrScanStatus');
    try {
      _qrStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch (e) {
      // Camera denied or unavailable — fall back to manual entry. Never leave a
      // scan UI showing with nothing actually happening.
      statusEl.textContent = '';
      document.getElementById('qrScanSub').textContent = 'Camera unavailable — enter the invite code below instead.';
      document.getElementById('qrVideoWrap').classList.remove('active');
      document.getElementById('qrManualWrap').classList.add('active');
      document.getElementById('qrToggleManualBtn').style.display = 'none';
      return;
    }

    const video = document.getElementById('qrVideo');
    video.srcObject = _qrStream;
    try { await video.play(); } catch (e) { /* some browsers autoplay muted video without a play() promise resolving cleanly */ }
    document.getElementById('qrVideoWrap').classList.add('active');
    statusEl.textContent = 'Looking for a QR code…';

    try {
      _qrDetector = new BarcodeDetector({ formats: ['qr_code'] });
    } catch (e) {
      stopQrCamera();
      document.getElementById('qrVideoWrap').classList.remove('active');
      document.getElementById('qrManualWrap').classList.add('active');
      document.getElementById('qrToggleManualBtn').style.display = 'none';
      document.getElementById('qrScanSub').textContent = "QR scanning isn't supported on this device — enter the invite code below.";
      return;
    }

    const scanFrame = async () => {
      if (!_qrStream) return; // camera was stopped (overlay closed / fallback taken)
      try {
        const codes = await _qrDetector.detect(video);
        if (codes && codes.length > 0 && codes[0].rawValue) {
          const raw = codes[0].rawValue;
          stopQrCamera();
          document.getElementById('qrVideoWrap').classList.remove('active');
          processScannedReferralValue(raw);
          return;
        }
      } catch (e) { /* a single failed detect() call on one frame isn't fatal — keep scanning */ }
      _qrScanTimer = setTimeout(scanFrame, 250);
    };
    scanFrame();
  }

  function stopQrCamera() {
    if (_qrScanTimer) { clearTimeout(_qrScanTimer); _qrScanTimer = null; }
    if (_qrStream) { _qrStream.getTracks().forEach(t => t.stop()); _qrStream = null; }
    _qrDetector = null;
  }

  function processScannedReferralValue(raw) {
    let code = String(raw).trim();
    // A shared invite QR is usually a link like https://…/onboarding-flow.html?ref=MARIA50 —
    // pull the ref param out when it's a URL; otherwise treat the decoded text as the code itself.
    try {
      const url = new URL(raw);
      const refParam = url.searchParams.get('ref');
      if (refParam) code = refParam;
    } catch (e) { /* not a URL — use the decoded text as-is */ }
    applyReferralCode(code);
  }

  function applyManualReferralCode() {
    const input = document.getElementById('qrManualInput');
    const code = (input.value || '').trim();
    if (!code) {
      document.getElementById('qrManualError').textContent = 'Enter a code first, or cancel.';
      return;
    }
    applyReferralCode(code);
  }

  function applyReferralCode(rawCode) {
    // Same character-class sanitisation as the domain slug elsewhere in this file.
    const code = String(rawCode).trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
    if (!code) {
      document.getElementById('qrManualError').textContent = "That code didn't look right — try again.";
      return;
    }
    sessionStorage.setItem('referral_code', code);
    stopQrCamera();
    document.getElementById('qrScanOverlay').classList.remove('active');

    const banner = document.getElementById('referralBanner');
    if (banner) {
      const textEl = banner.querySelector('div:last-child');
      if (textEl) textEl.innerHTML = `<strong style="color:var(--cyan);">Invite code applied: ${code}.</strong> Complete onboarding to unlock your welcome bonus.`;
      banner.classList.add('show');
    }
    const link = document.getElementById('referralQrLink');
    if (link) {
      link.innerHTML = `<div class="qr-scan-link-icon">✅</div><div><strong style="color:var(--green);">Invite code applied:</strong> ${code} — tap to change.</div>`;
    }
  }

  function closeQrScanOverlay() {
    stopQrCamera();
    document.getElementById('qrScanOverlay').classList.remove('active');
  }

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { this.style.display='none';this.nextSibling.style.display='inline'; }
function h_2(event) { window.location.href='marketplace.html'; }
function h_3(event) { window.location.href='data-vault.html'; }
function h_4(event) { window.location.href='feed.html'; }
function h_5(event) { window.location.href='staking.html'; }
function h_6(event) { window.location.href='referral.html'; }
function h_7(event) { window.location.href='light-node.html'; }
function h_8(event) { window.location.href='nft-marketplace.html'; }
function h_9(event) { document.getElementById('selfPrivacyOverlay').remove(); }


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
    }, true); })(EV.error);
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
    }, false); })(EV.blur);
  // Images that failed before this script ran miss the native error event: replay it once.
  document.querySelectorAll('img[data-error-action]').forEach(function (img) { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) img.dispatchEvent(new Event('error')); });
})();
