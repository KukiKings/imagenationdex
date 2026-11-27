/*
 * December presentation mode. FOR THE COOK ISLANDS PILOT ONLY.
 *
 * Active only on speak-to-siindex.html when the URL has ?mode=december. Without it this file does nothing.
 *
 * What it does when active:
 *  1. Locked response map. A typed or chip question that matches one of the seven locked Settlement-path
 *     sentences gets exactly that text: written form on screen (one-pager), spoken form out loud (Cut 7).
 *  2. The two privacy-pill demo questions ("What is live today?", "How tall is the Eiffel Tower?") are NOT
 *     intercepted. They run the normal path so the pill states stay exactly as in DECEMBER-2026-DELIVERY-LOCK.md.
 *  3. Anything else goes through a spawn gate. At most one tier-1 skill from ALLOW may be named per question.
 *     Nothing in the browser runs a skill: the seam below returns null unless a reviewed runtime is supplied
 *     as window.SIINDEX_DECEMBER_SKILL_RUNTIME. Any text it returns is accepted only if it is a sentence from
 *     the locked corpus and is not marked "cannot be confirmed". Otherwise the fixed fallback line is spoken.
 *  4. Every gate decision is appended to an in-memory log (window.SIINDEX_DECEMBER_LOG, read-only view) with the
 *     experience-log fields from siindex-operating/SPAWNING-MODEL.md. Nothing is stored or sent. The log is
 *     not a source and grants no powers.
 *
 * Not claimed here: progressive KYC, Cook Islands corridor readiness, non-custodial Samsung Wallet,
 * USDC confidential transfers, any specific fee figure.
 * Voice: reuses the existing SIINDEXVoice unlock and speak. No new audio path. Mic is disabled in this mode
 * because speech is transcribed server-side before this script could check it.
 */
(function () {
  'use strict';
  var params;
  try { params = new URLSearchParams(location.search); } catch (e) { return; }
  if (params.get('mode') !== 'december') return;

  var FALLBACK = 'That is not yet confirmed in the current pilot materials. I can show you the verified path instead.';
  var ALLOW = ['elite-mastery-roadmap', 'thinking-beyond-human-limits', 'forbidden-wisdom-decoder', 'multi-agent-verify'];

  // Seven locked sentences, in lock order. w = written form (one-pager), s = spoken form (Cut 7).
  var LOCKED = [
    { id: 'S1', re: /settlement layer|pilot.?preparation|are (payments|wallets) live|what stage/,
      w: ['IN$DEX is at pilot-preparation stage; payments and wallets are not live, and Solana is used as a settlement layer only.'],
      s: ['Index is at pilot-preparation stage; payments and wallets are not live, and Solana is used as a settlement layer only.'] },
    { id: 'S2', re: /attestation|\bsas\b|\bkyc\b/,
      w: ['The Solana Attestation Service is live on Solana mainnet and lets trusted issuers attach KYC-type attestations to a wallet.'],
      s: ['The Solana Attestation Service is live on Solana mainnet and lets trusted issuers attach K Y C type attestations to a wallet.'] },
    { id: 'S3', re: /sponsor|network fee|gas fee|hold sol|need sol|pay the fee/,
      w: ['A sponsor can pay the network fee.', 'For some fee-sponsorship methods the sender does not need to hold SOL.'],
      s: ['A sponsor can pay the network fee.', 'For some fee-sponsorship methods the sender does not need to hold SOL.'] },
    { id: 'S4', re: /confidential/,
      w: ['Confidential transfers are not available for USDC today, so the pilot does not rely on them.'],
      s: ['Confidential transfers are not available for U S D C today, so the pilot does not rely on them.'] },
    { id: 'S5', re: /travel rule|austrac|australia.*(rule|compliance)/,
      w: ["Australia's Travel Rule has applied to value transfers, including virtual asset service providers, since 31 March 2026."],
      s: ["Australia's Travel Rule has applied to value transfers, including virtual asset service providers, since the thirty-first of March, twenty twenty-six."] },
    { id: 'S6', re: /samsung/,
      w: ['Samsung Wallet added USDC on Solana for eligible US Galaxy users, with funds held by a licensed custodian.', 'Eligibility at launch was US residents.'],
      s: ['Samsung Wallet added U S D C on Solana for eligible U S Galaxy users, with funds held by a licensed custodian.', 'Eligibility at launch was U S residents.'] },
    { id: 'S7', re: /(cook islands|cook).*(wallet|mobile|ready|readiness)|mobile wallet/,
      w: ['Mobile wallet readiness for the Cook Islands is not yet confirmed.'],
      s: ['Mobile wallet readiness for the Cook Islands is not yet confirmed.'] },
    // Honest-status sentences, as written on the static Government & PM Q&A page and in the living public knowledge.
    { id: 'G1', re: /\baccounts?\b|domain issuance|issue (a )?domain|what (is|are) not live|not live/,
      w: ['Accounts, wallets, payments and domain issuance are not live.'],
      s: ['Accounts, wallets, payments and domain issuance are not live.'] },
    { id: 'G2', re: /registration|registered|incorporat|certificate/,
      w: ['Cook Islands registration is in progress; no Certificate of Incorporation exists yet.'],
      s: ['Cook Islands registration is in progress; no Certificate of Incorporation exists yet.'] },
    { id: 'G3', re: /pilot (target|date)|24 feb|launch date|when .*(pilot|launch|live)|february/,
      w: ['Pilot target 24 February 2027.'],
      s: ['Pilot target: the twenty-fourth of February, twenty twenty-seven.'] },
    { id: 'G4', re: /\bbank(ing|s)?\b|claim live|do you claim|live payments/,
      w: ['We do not claim live banking or payments today.'],
      s: ['We do not claim live banking or payments today.'] },
    { id: 'G5', re: /who (is|are) siindex|what is siindex|are you (an? )?(ai|artificial|synthetic)|artificial intelligence|synthetic intelligence|pqsi|pronounce|sinn? ?dex/,
      w: ['Synthetic Intelligence for IN$DEX (PQSI). Spoken Sin-dex. Not artificial intelligence.'],
      s: ['Synthetic Intelligence for Index, P Q S I. Spoken Sin-dex. Not artificial intelligence.'] }
  ];

  // Pill demo questions pass through untouched.
  var PASS = ['what is live today', 'what is live', 'how tall is the eiffel tower'];

  function norm(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9$ ]+/g, ' ').replace(/\s+/g, ' ').trim(); }

  var corpus = {};
  LOCKED.forEach(function (e) { e.w.concat(e.s).forEach(function (t) { corpus[norm(t)] = true; }); });

  var log = [];
  Object.defineProperty(window, 'SIINDEX_DECEMBER_LOG', { get: function () { return log.slice(); } });
  function record(skill, brief, summary, source, verdict) {
    log.push({ skill: skill, brief: brief, summary: summary, source: source, verdict: verdict, timestamp: new Date().toISOString() });
  }

  function match(q) {
    var n = norm(q);
    // Do-not-claim topics never match the locked map; they fall to the fallback line.
    if (/progressive|tiered|corridor|non.?custodial|self.?custod|\d+ ?(%|percent|cents?|dollars?)/.test(n)) return [];
    if (/\bfee[s]?\b.*\b(how much|cost|amount|price|percent|rate)\b|\b(how much|cost|price|percent|rate)\b.*\bfee/.test(n)) return [];
    return LOCKED.filter(function (e) { return e.re.test(n); });
  }

  function pickSkill(q) {
    var n = norm(q);
    if (/roadmap|step|how do i|get started|domain/.test(n)) return 'elite-mastery-roadmap';
    if (/unbanked|citizen|income|small|option/.test(n)) return 'thinking-beyond-human-limits';
    if (/pattern|lesser|remittance|hidden|assumption/.test(n)) return 'forbidden-wisdom-decoder';
    return 'multi-agent-verify';
  }

  // Seam. Returns null unless a reviewed runtime is supplied. Nothing runs here.
  function spawn(skill, brief) {
    var rt = window.SIINDEX_DECEMBER_SKILL_RUNTIME;
    if (ALLOW.indexOf(skill) < 0 || typeof rt !== 'function') return null;
    try { return rt(skill, brief) || null; } catch (e) { return null; }
  }

  function show(text) {
    var out = document.getElementById('out');
    if (out) out.textContent = text;
    if (window.SIINDEX_PRIVACY) SIINDEX_PRIVACY.answered('local');
  }
  function say(text) {
    if (!window.SIINDEXVoice) return;
    try { SIINDEXVoice.unlock(); SIINDEXVoice.speak(text); } catch (e) {}
  }

  function handle(q) {
    var n = norm(q);
    if (!n || PASS.indexOf(n) >= 0) return false;
    var hits = match(q);
    if (hits.length) {
      show(hits.map(function (e) { return e.w.join(' '); }).join(' '));
      say(hits.map(function (e) { return e.s.join(' '); }).join(' '));
      record('locked-map', q, 'Locked ' + hits.map(function (e) { return e.id; }).join('+') + ' spoken', 'one-pager, Cut 7', 'agree');
      return true;
    }
    var skill = pickSkill(q);
    var res = spawn(skill, q);
    var text = res && typeof res === 'object' ? res.text : res;
    var verdict = res && typeof res === 'object' ? res.verdict : '';
    if (text && verdict !== 'cannot be confirmed' && corpus[norm(text)]) {
      show(text); say(text);
      record(skill, q, 'Returned a locked-corpus sentence', 'one-pager, Cut 7', verdict || 'agree');
    } else {
      show(FALLBACK); say(FALLBACK);
      record(skill, q, 'No locked sentence available; fallback spoken', 'speculative', 'cannot be confirmed');
    }
    return true;
  }

  function stop(e) { e.preventDefault(); e.stopImmediatePropagation(); }
  function val() { var i = document.getElementById('q'); return i ? i.value : ''; }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#ask, #s4 .chip[data-q]') : null;
    if (!t) return;
    var q = t.id === 'ask' ? val() : t.getAttribute('data-q');
    if (t.id !== 'ask') { var i = document.getElementById('q'); if (i) i.value = q; }
    if (handle(q)) stop(e);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !e.target || e.target.id !== 'q') return;
    if (handle(val())) stop(e);
  }, true);

  // Single-screen flow: these links are suppressed only for the Cook Islands pilot (?mode=december).
  // Everything is spoken to SIINDEX on this one page, so Government & PM Q&A, Present, Operator, System Card,
  // Interview Mode and every other page link are removed. The static pages stay in the repo as internal reference.
  function suppressLinks() {
    function sweep() {
      var as = document.querySelectorAll('a[href]');
      for (var i = 0; i < as.length; i++) {
        var h = (as[i].getAttribute('href') || '').trim().toLowerCase();
        if (h.charAt(0) === '#' || h.indexOf('mailto:') === 0 || !as[i].parentNode) continue;
        if (as[i].classList.contains('brand')) {
          var sp = document.createElement('span'); sp.className = 'brand'; sp.textContent = as[i].textContent;
          as[i].parentNode.replaceChild(sp, as[i]);
        } else as[i].parentNode.removeChild(as[i]);
      }
      var bs = document.querySelectorAll('button,.chip');
      for (var j = 0; j < bs.length; j++) {
        if (/government\s*(&|and)?\s*(pm\s*)?q\s*&?\s*a/i.test(bs[j].textContent || '') && bs[j].parentNode) bs[j].parentNode.removeChild(bs[j]);
      }
    }
    sweep();
    new MutationObserver(sweep).observe(document.documentElement, { childList: true, subtree: true });
  }

  function ui() {
    suppressLinks();
    var mic = document.getElementById('mic');
    if (mic) { mic.disabled = true; mic.title = 'December mode: typed questions only'; }
    var st = document.createElement('style');
    st.textContent = '#s4 .chip[data-q="What is IN$DEX?"],#s4 .chip[data-q="Are you AI?"],#s4 .chip[data-q="Why the Cook Islands?"],' +
      '#s4 .chip[data-q="What is the company name?"],#s4 .chip[data-q="Can reporters interview SIINDEX?"],' +
      '[data-topic="cook"],[data-topic="mission"],[data-topic="interview"]{display:none!important}' +
      '#decBadge{position:fixed;right:8px;bottom:8px;z-index:9;font-size:.7rem;padding:.25rem .5rem;border-radius:6px;' +
      'background:rgba(0,0,0,.6);color:#d0a7ff;border:1px solid rgba(139,63,232,.4)}';
    document.head.appendChild(st);
    var b = document.createElement('div');
    b.id = 'decBadge';
    b.textContent = 'December mode · Cook Islands pilot only';
    document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui, { once: true }); else ui();
})();
