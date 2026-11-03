
  let currentTab = 'glossary';

  function switchTab(name) {
    currentTab = name;
    ['glossary','faq'].forEach(t => {
      document.getElementById('tab-'+t).classList.toggle('active', t===name);
      document.getElementById('panel-'+t).style.display = t===name ? 'block' : 'none';
    });
    document.getElementById('helpSearch').value = '';
    document.getElementById('noResults').style.display = 'none';
    document.querySelectorAll('.gloss-item, .faq-item').forEach(i => i.style.display = '');
    document.querySelectorAll('.alpha-label').forEach(l => l.style.display = '');
  }

  function toggleFAQ(el) {
    const chevron = el.querySelector('.faq-chevron');
    const answer = el.nextElementSibling;
    const isOpen = answer.classList.contains('open');
    document.querySelectorAll('.faq-a.open').forEach(a => {
      a.classList.remove('open');
      a.previousElementSibling.querySelector('.faq-chevron').classList.remove('open');
      // GOD MODE PATCH: keep aria-expanded in sync when closing
      a.previousElementSibling.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      answer.classList.add('open'); chevron.classList.add('open');
      // GOD MODE PATCH: aria state + recently-viewed tracking on open
      el.setAttribute('aria-expanded', 'true');
      const trailing = el.lastElementChild;
      let label = '';
      el.childNodes.forEach(n => { if (n !== trailing) label += n.textContent; });
      trackRecentlyViewed(label.trim(), 'faq');
    }
  }

  function filterHelp() {
    const q = document.getElementById('helpSearch').value.toLowerCase().trim();
    let hasResults = false;

    if (!q) {
      document.querySelectorAll('.gloss-item, .faq-item, .alpha-label').forEach(i => i.style.display = '');
      document.getElementById('noResults').style.display = 'none';
      document.getElementById('wizardSection').style.display = 'block';
      document.getElementById('tabBar').style.display = 'flex';
      document.getElementById('panel-glossary').style.display = currentTab==='glossary'?'block':'none';
      document.getElementById('panel-faq').style.display = currentTab==='faq'?'block':'none';
      // GOD MODE PATCH: clear any search highlighting
      document.querySelectorAll('.faq-q, .gloss-term').forEach(el => refreshHighlight(el, ''));
      return;
    }

    document.getElementById('wizardSection').style.display = 'none';
    document.getElementById('tabBar').style.display = 'none';
    document.getElementById('panel-glossary').style.display = 'block';
    document.getElementById('panel-faq').style.display = 'block';

    document.querySelectorAll('.gloss-item').forEach(item => {
      const match = item.textContent.toLowerCase().includes(q);
      item.style.display = match ? 'block' : 'none';
      if (match) hasResults = true;
    });
    document.querySelectorAll('.alpha-label').forEach(label => {
      // hide alpha label if no siblings visible
      let next = label.nextElementSibling;
      let anyVisible = false;
      while (next && !next.classList.contains('alpha-label')) {
        if (next.style.display !== 'none') anyVisible = true;
        next = next.nextElementSibling;
      }
      label.style.display = anyVisible ? 'block' : 'none';
    });
    document.querySelectorAll('.faq-item').forEach(item => {
      const match = item.textContent.toLowerCase().includes(q);
      item.style.display = match ? 'block' : 'none';
      if (match) hasResults = true;
    });

    document.getElementById('noResults').style.display = hasResults ? 'none' : 'block';

    // GOD MODE PATCH: highlight the matched substring in visible terms/questions
    document.querySelectorAll('.gloss-term').forEach(el => refreshHighlight(el, q));
    document.querySelectorAll('.faq-q').forEach(el => refreshHighlight(el, q));
  }

  // ── GOD MODE: search-term highlighting helper ──
  // Operates only on the leading text of an element, preserving its trailing
  // badge/chevron <span> (faq-chevron or gloss-tag) which must never be wiped.
  function refreshHighlight(el, query) {
    const trailing = el.lastElementChild;
    if (!trailing) return;
    if (el.dataset.origText === undefined) {
      let leading = '';
      el.childNodes.forEach(n => { if (n !== trailing) leading += n.textContent; });
      el.dataset.origText = leading;
    }
    const orig = el.dataset.origText;
    Array.from(el.childNodes).forEach(n => { if (n !== trailing) el.removeChild(n); });
    const q = (query || '').toLowerCase();
    const idx = q ? orig.toLowerCase().indexOf(q) : -1;
    if (idx === -1) {
      el.insertBefore(document.createTextNode(orig), trailing);
      return;
    }
    const before = orig.slice(0, idx);
    const matchText = orig.slice(idx, idx + q.length);
    const after = orig.slice(idx + q.length);
    el.insertBefore(document.createTextNode(before), trailing);
    const mark = document.createElement('mark');
    mark.className = 'hl-match';
    mark.textContent = matchText;
    el.insertBefore(mark, trailing);
    el.insertBefore(document.createTextNode(after), trailing);
  }

  // ── GOD MODE: recently viewed (localStorage: indx_help_recent) ──
  function trackRecentlyViewed(label, kind) {
    if (!label) return;
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem('indx_help_recent') || '[]'); } catch (e) { recent = []; }
    recent = recent.filter(r => r.label !== label);
    recent.unshift({ label: label, kind: kind });
    recent = recent.slice(0, 6);
    localStorage.setItem('indx_help_recent', JSON.stringify(recent));
    renderRecentStrip();
  }

  function renderRecentStrip() {
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem('indx_help_recent') || '[]'); } catch (e) { recent = []; }
    const strip = document.getElementById('recentStrip');
    const chips = document.getElementById('recentChips');
    if (!strip || !chips) return;
    if (!recent.length) { strip.style.display = 'none'; return; }
    chips.innerHTML = recent.map((r, i) =>
      '<div class="recent-chip" tabindex="0" role="button" data-action="h_15" data-args="[&quot;$event&quot;,' + indxJ(i) + ']" ' +
      'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();reopenRecent(' + i + ');}">' +
      (r.kind === 'faq' ? '❓ ' : '📖 ') + r.label + '</div>'
    ).join('');
    strip.style.display = 'block';
  }

  function reopenRecent(idx) {
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem('indx_help_recent') || '[]'); } catch (e) { recent = []; }
    const entry = recent[idx];
    if (!entry) return;
    if (entry.kind === 'faq') {
      switchTab('faq');
      const match = Array.from(document.querySelectorAll('.faq-q')).find(el => {
        const trailing = el.lastElementChild;
        let text = '';
        el.childNodes.forEach(n => { if (n !== trailing) text += n.textContent; });
        return text.trim() === entry.label;
      });
      if (match) {
        match.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (!match.nextElementSibling.classList.contains('open')) toggleFAQ(match);
      }
    } else {
      switchTab('glossary');
      const match = Array.from(document.querySelectorAll('.gloss-term')).find(el => {
        const trailing = el.lastElementChild;
        let text = '';
        el.childNodes.forEach(n => { if (n !== trailing) text += n.textContent; });
        return text.trim() === entry.label;
      });
      if (match) match.closest('.gloss-item').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ── GOD MODE: FAQ helpfulness feedback (localStorage: indx_help_votes) ──
  function getFAQVotes() {
    try { return JSON.parse(localStorage.getItem('indx_help_votes') || '{}'); } catch (e) { return {}; }
  }

  function injectFAQFeedback() {
    document.querySelectorAll('.faq-item').forEach((item, idx) => {
      const answer = item.querySelector('.faq-a');
      if (!answer || answer.querySelector('.faq-feedback')) return;
      const fbId = 'faq-fb-' + idx;
      const row = document.createElement('div');
      row.className = 'faq-feedback';
      row.dataset.faqId = fbId;
      row.innerHTML =
        '<span class="fb-label">Helpful?</span>' +
        '<button type="button" class="fb-btn" data-dir="up" aria-label="Yes, this was helpful" data-action="h_16" data-args="[&quot;$event&quot;,' + indxJ(fbId) + ']">👍</button>' +
        '<button type="button" class="fb-btn" data-dir="down" aria-label="No, not helpful" data-action="h_17" data-args="[&quot;$event&quot;,' + indxJ(fbId) + ']">👎</button>' +
        '<span class="fb-thanks" style="display:none;">Thanks for the feedback!</span>';
      answer.appendChild(row);
      const votes = getFAQVotes();
      const mine = votes[fbId] && votes[fbId].mine;
      if (mine) row.querySelector('[data-dir="' + mine + '"]').classList.add(mine === 'up' ? 'voted-up' : 'voted-down');
    });
  }

  function voteFAQ(btn, fbId, dir) {
    const votes = getFAQVotes();
    const entry = votes[fbId] || { up: 0, down: 0, mine: null };
    if (entry.mine === dir) return; // already recorded this vote, no-op
    if (entry.mine === 'up') entry.up = Math.max(0, entry.up - 1);
    if (entry.mine === 'down') entry.down = Math.max(0, entry.down - 1);
    entry[dir] = (entry[dir] || 0) + 1;
    entry.mine = dir;
    votes[fbId] = entry;
    localStorage.setItem('indx_help_votes', JSON.stringify(votes));

    const row = btn.closest('.faq-feedback');
    row.querySelectorAll('.fb-btn').forEach(b => b.classList.remove('voted-up', 'voted-down'));
    btn.classList.add(dir === 'up' ? 'voted-up' : 'voted-down');
    const thanks = row.querySelector('.fb-thanks');
    thanks.style.display = 'inline';
    setTimeout(() => { thanks.style.display = 'none'; }, 2200);
    computeHelpfulBadges();
  }

  function computeHelpfulBadges() {
    const votes = getFAQVotes();
    document.querySelectorAll('.faq-helpful-badge').forEach(b => b.remove());
    let bestId = null, bestScore = 0;
    Object.keys(votes).forEach(id => {
      const v = votes[id];
      const score = (v.up || 0) - (v.down || 0);
      if (score > bestScore) { bestScore = score; bestId = id; }
    });
    if (bestId) {
      const row = document.querySelector('.faq-feedback[data-faq-id="' + bestId + '"]');
      const q = row && row.closest('.faq-item').querySelector('.faq-q');
      if (q && !q.querySelector('.faq-helpful-badge')) {
        const badge = document.createElement('span');
        badge.className = 'faq-helpful-badge';
        // AUDIT 2026-09-10: was "Most helpful" — votes are localStorage on this device only,
        // never aggregated across citizens, so a cross-FAQ ranking label fabricated a community
        // consensus signal from one person's clicks. Relabelled to describe only what's true.
        badge.textContent = 'You found this helpful';
        q.insertBefore(badge, q.querySelector('.faq-chevron'));
      }
    }
  }

  // ── GOD MODE: keyboard accessibility for FAQ accordion + glossary links ──
  function enhanceFAQAccessibility() {
    document.querySelectorAll('.faq-q').forEach(q => {
      q.setAttribute('tabindex', '0');
      q.setAttribute('role', 'button');
      q.setAttribute('aria-expanded', 'false');
      q.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFAQ(q); }
      });
    });
    document.querySelectorAll('.gloss-link').forEach(link => {
      link.setAttribute('tabindex', '0');
      link.setAttribute('role', 'link');
      link.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); link.click(); }
      });
    });
  }

  // GOD MODE: track glossary deep-link clicks into "recently viewed"
  document.addEventListener('click', function (e) {
    const link = e.target.closest('.gloss-link');
    if (!link) return;
    const term = link.closest('.gloss-item') && link.closest('.gloss-item').querySelector('.gloss-term');
    if (!term) return;
    const trailing = term.lastElementChild;
    let label = '';
    term.childNodes.forEach(n => { if (n !== trailing) label += n.textContent; });
    trackRecentlyViewed(label.trim(), 'glossary');
  });

  document.addEventListener('DOMContentLoaded', function () {
    enhanceFAQAccessibility();
    injectFAQFeedback();
    computeHelpfulBadges();
    renderRecentStrip();
  });

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.history.back(); }
function h_2(event) { window.location.href='order-status.html'; }
function h_3(event) { window.location.href='security-settings.html'; }
function h_4(event) { window.location.href='governance.html'; }
function h_5(event) { window.location.href='token-detail.html'; }
function h_6(event) { window.location.href='light-node.html'; }
function h_7(event) { window.location.href='sovereign-support.html'; }
function h_8(event) { window.location.href='sovereign-verify.html'; }
function h_9(event) { window.location.href='staking.html'; }
function h_10(event) { window.location.href='wisdom-score.html'; }
function h_11(event) { window.location.href='p2p-chat.html'; }
function h_12(event) { window.location.href='citizen-dashboard.html'; }
function h_13(event) { window.location.href='marketplace.html'; }
function h_14(event) { window.location.href='search.html'; }
function h_15(event, __p0) { reopenRecent(__p0); }
function h_16(event, __p0) { voteFAQ(this,String(__p0),'up'); }
function h_17(event, __p0) { voteFAQ(this,String(__p0),'down'); }


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
    }, { capture: true, passive: false }); })(EV.input);

})();
