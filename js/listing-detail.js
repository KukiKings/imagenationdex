
  // ── SIMPLE MODE ──
  (function() {
    const simple = localStorage.getItem('simpleMode') !== '0';
    if (!simple) return;

    // Show step indicator
    const steps = document.getElementById('simpleSteps');
    if (steps) steps.style.display = 'block';

    // Update price label: "= about $75"
    const priceIndx = document.getElementById('priceIndxLabel');
    if (priceIndx) priceIndx.textContent = '= about $75';

    // Update buy button
    const buyBtn = document.getElementById('buyNowBtn');
    if (buyBtn) {
      buyBtn.textContent = '🛒 Buy This Item';
      buyBtn.style.fontSize = '16px';
      buyBtn.style.fontWeight = '900';
    }

    // Simplify safety box
    const safetyTitle = document.getElementById('safetyTitle');
    const safetyTips = document.getElementById('safetyTips');
    if (safetyTitle) safetyTitle.textContent = '🛡️ Your money is protected';
    if (safetyTips) safetyTips.innerHTML = `
      <li>Your money is held safely until your item arrives</li>
      <li>If your item doesn't arrive, you get a full refund</li>
      <li>A digital receipt is saved forever as proof</li>
      <li>Never pay outside of IN$DEX</li>`;

    // Simplify confirm overlay
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmSub = document.getElementById('confirmSub');
    const confirmFeeRow = document.getElementById('confirmFeeRow');
    const confirmPayBtn = document.getElementById('confirmPayBtn');
    if (confirmTitle) confirmTitle.textContent = 'Are you sure you want to buy this?';
    if (confirmSub) confirmSub.innerHTML = '✅ Your money is held safely until your item arrives';
    if (confirmFeeRow) { const lbl = confirmFeeRow.querySelector('span:first-child'); if (lbl) lbl.textContent = 'Small fee (2%)'; }
    if (confirmPayBtn) confirmPayBtn.textContent = '💳 Pay now $75.00';
  })();

  // Gallery swipe
  let gCurrent = 0, gTotal = 4, gTX = 0;
  function gTouchStart(e) { gTX = e.touches[0].clientX; }
  function gTouchEnd(e) {
    const dx = gTX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) {
      if (dx > 0 && gCurrent < gTotal-1) gCurrent++;
      else if (dx < 0 && gCurrent > 0) gCurrent--;
      document.getElementById('galleryTrack').style.transform = `translateX(-${gCurrent * 100}%)`;
      document.querySelectorAll('.dot').forEach((d,i) => d.classList.toggle('active', i === gCurrent));
    }
  }

  let wishlisted = false;
  // GOD MODE PATCH: persist wishlist state to localStorage instead of only in-memory
  function toggleWishlist() {
    wishlisted = !wishlisted;
    document.getElementById('wishlistBtn').textContent = wishlisted ? '❤️' : '🤍';
    let saved = godLoadSavedItems();
    if (wishlisted) { if (!saved.includes(LISTING_ID)) saved.push(LISTING_ID); }
    else { saved = saved.filter(id => id !== LISTING_ID); }
    godSaveItems(saved);
    godUpdateSavedPill();
    showToast(wishlisted ? 'Added to wishlist' : 'Removed from wishlist');
  }

  function shareListing() { showToast('Share link copied ✓'); }

  function expandDesc() {
    document.getElementById('descText').innerHTML += '<br><br>The koru spiral motif represents new life, growth, strength, and peace central values of IN$DEX. Each piece takes approximately 3 weeks to complete from clay to finished glaze.';
    document.querySelector('.desc-more').style.display = 'none';
  }

  // GOD MODE PATCH: capture trigger for focus return, render offer history, focus input, trap focus
  function openOffer() {
    godLastFocused = document.activeElement;
    document.getElementById('offerSheet').classList.add('open');
    godRenderOfferHistory();
    document.getElementById('offerWarnBox').style.display = 'none';
    setTimeout(() => { const inp = document.getElementById('offerInput'); if (inp) inp.focus(); }, 300);
    godTrapFocus(document.querySelector('.offer-sheet'));
  }
  function closeOffer(e) {
    if (e.target === document.getElementById('offerSheet')) {
      document.getElementById('offerSheet').classList.remove('open');
      // GOD MODE PATCH: return focus to the element that opened the sheet
      if (godLastFocused) { godLastFocused.focus(); godLastFocused = null; }
    }
  }
  // GOD MODE PATCH: also check for a duplicate/non-improved offer and show an inline warning
  function updateOfferIndx() {
    const aud = parseFloat(document.getElementById('offerInput').value) || 0;
    document.getElementById('offerIndx').textContent = Math.round(aud / INDX_PRICE_USD).toLocaleString();
    const warnBox = document.getElementById('offerWarnBox');
    if (!warnBox) return;
    const dup = aud > 0 ? godCheckDuplicateOffer(aud) : null;
    if (dup) { warnBox.style.display = 'flex'; warnBox.textContent = `⚠️ ${dup}This won't beat your last offer.`; }
    else { warnBox.style.display = 'none'; }
  }
  // GOD MODE PATCH: persist the offer to this listing's offer history
  function sendOffer() {
    const aud = document.getElementById('offerInput').value;
    if (!aud) { showToast('Enter an offer amount'); return; }
    const amount = parseFloat(aud);
    const list = godLoadOfferHistory();
    list.push({ amount: amount, date: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) });
    godSaveOfferHistory(list);
    document.getElementById('offerSheet').classList.remove('open');
    if (godLastFocused) { godLastFocused.focus(); godLastFocused = null; }
    showToast(`Offer of $${amount.toFixed(2)} sent to Kiri ✓`);
  }

  function messageSellerDirect() {
    showToast('Opening chat with Kiri…');
    setTimeout(() => window.location.href = 'p2p-chat.html', 800);
  }

  // GOD MODE PATCH: capture trigger for focus return, trap focus within the confirm card
  function openBuyConfirm() {
    godLastFocused = document.activeElement;
    document.getElementById('buyOverlay').classList.add('show');
    godTrapFocus(document.getElementById('confirmCard'));
  }

  function processPurchase() {
    const card = document.getElementById('confirmCard');
    card.innerHTML = `
      <div style="text-align:center;padding:16px 0;">
        <div style="font-size:42px;margin-bottom:14px;animation:spin 1s linear infinite">⚡</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:6px;">Processing…</div>
        <div style="font-size:13px;color:var(--text-muted)">Locking INDX in escrow</div>
      </div>`;
    setTimeout(() => {
      card.innerHTML = `
        <div class="success-inner">
          <div class="success-icon">🎉</div>
          <div class="success-title">Purchase Complete!</div>
          <div class="success-sub">153 INDX locked in escrow. Kiri has been notified. Your NFT receipt is minting on Solana.</div>
          <div class="success-actions">
            <button class="btn-primary" data-action="h_4" data-args="[&quot;$event&quot;]">View NFT Receipt</button>
            <button class="btn-secondary" data-action="h_5" data-args="[&quot;$event&quot;]">Transaction History</button>
            <button class="btn-secondary" data-action="h_3" data-args="[&quot;$event&quot;]">Back to Listing</button>
          </div>
        </div>`;
    }, 2200);
  }

  // ── GOD MODE: SAVED ITEMS, PRICE INSIGHT, OFFER HISTORY, ACCESSIBILITY ──
  const LISTING_ID = new URLSearchParams(location.search).get('listing') || 'ceramic-coffee-set';
  const LISTING_PRICE_AUD = 75.00;
  const INDX_PRICE_USD = 0.24;
  let godLastFocused = null;

  // Saved items persistence (data persistence)
  function godLoadSavedItems() {
    return JSON.parse(localStorage.getItem('indx_listingdetail_saved') || '[]');
  }
  function godSaveItems(list) {
    localStorage.setItem('indx_listingdetail_saved', JSON.stringify(list));
  }
  function godUpdateSavedPill() {
    const saved = godLoadSavedItems();
    const pill = document.getElementById('savedCountPill');
    if (!pill) return;
    if (saved.length > 0) {
      pill.style.display = 'inline-flex';
      pill.textContent = `❤️ ${saved.length} saved item${saved.length === 1 ? '' : 's'}`;
    } else {
      pill.style.display = 'none';
    }
  }
  function godSyncWishlistState() {
    const saved = godLoadSavedItems();
    wishlisted = saved.includes(LISTING_ID);
    const btn = document.getElementById('wishlistBtn');
    if (btn) btn.textContent = wishlisted ? '❤️' : '🤍';
    godUpdateSavedPill();
  }

  // Price comparison insight (information density) — computed from real prices already in the DOM
  function godShowPriceComparison() {
    const banner = document.getElementById('priceCompareBanner');
    if (!banner) return;
    const simPrices = Array.from(document.querySelectorAll('.sim-price'))
      .map(el => parseFloat(el.textContent.replace(/[^0-9.]/g, '')))
      .filter(n => !isNaN(n));
    if (simPrices.length === 0) return;
    const avg = simPrices.reduce((a, b) => a + b, 0) / simPrices.length;
    const diffPct = Math.round(((LISTING_PRICE_AUD - avg) / avg) * 100);
    banner.style.display = 'flex';
    if (diffPct <= 0) {
      banner.classList.add('below');
      banner.textContent = `📉 ${Math.abs(diffPct)}% below similar listings avg $${avg.toFixed(2)}`;
    } else {
      banner.classList.add('above');
      banner.textContent = `📈 ${diffPct}% above similar listings avg $${avg.toFixed(2)}`;
    }
  }

  // Offer history + duplicate-offer safety (data persistence + confirmation safety)
  function godLoadOfferHistory() {
    const all = JSON.parse(localStorage.getItem('indx_listingdetail_offers') || '{}');
    return all[LISTING_ID] || [];
  }
  function godSaveOfferHistory(list) {
    const all = JSON.parse(localStorage.getItem('indx_listingdetail_offers') || '{}');
    all[LISTING_ID] = list;
    localStorage.setItem('indx_listingdetail_offers', JSON.stringify(all));
  }
  function godRenderOfferHistory() {
    const wrap = document.getElementById('offerHistoryWrap');
    const itemsEl = document.getElementById('offerHistoryItems');
    const list = godLoadOfferHistory();
    if (!wrap || !itemsEl) return;
    if (list.length === 0) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    itemsEl.innerHTML = list.slice(-3).reverse().map(o =>
      `<div class="offer-history-item"><span>$${o.amount.toFixed(2)}</span><span>${o.date}</span></div>`
    ).join('');
  }
  function godCheckDuplicateOffer(amount) {
    const list = godLoadOfferHistory();
    if (list.length === 0) return null;
    const last = list[list.length - 1];
    if (amount <= last.amount) return `You already offered $${last.amount.toFixed(2)}. `;
    return null;
  }

  // Accessibility: focus trap + Escape-to-close for sheets/overlays
  function godTrapFocus(container) {
    if (!container) return;
    const focusables = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusables.length === 0) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    container.addEventListener('keydown', function godFocusTrapHandler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    const offerSheet = document.getElementById('offerSheet');
    const buyOverlay = document.getElementById('buyOverlay');
    if (offerSheet && offerSheet.classList.contains('open')) {
      offerSheet.classList.remove('open');
      if (godLastFocused) { godLastFocused.focus(); godLastFocused = null; }
    } else if (buyOverlay && buyOverlay.classList.contains('show')) {
      buyOverlay.classList.remove('show');
      if (godLastFocused) { godLastFocused.focus(); godLastFocused = null; }
    }
  });

  // Init — runs after all declarations above have executed (script tag is last in body)
  godSyncWishlistState();
  godShowPriceComparison();

  let toastTimer;
  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:#1A1D25;border:1px solid #2A2D38;color:#EAEAEA;padding:10px 20px;border-radius:12px;font-size:14px;z-index:300;pointer-events:none;transition:opacity 0.3s;white-space:nowrap;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.style.opacity = '0', 2400);
  }

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.history.back(); }
function h_2(event) { window.location.href='citizen-profile.html?citizen=kiri'; }
function h_3(event) { document.getElementById('buyOverlay').classList.remove('show'); }
function h_4(event) { window.location.href='receipt.html'; }
function h_5(event) { window.location.href='history.html'; }


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
    }, { capture: true, passive: false }); })(EV.touchstart);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.touchend);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, { capture: true, passive: false }); })(EV.input);

})();
