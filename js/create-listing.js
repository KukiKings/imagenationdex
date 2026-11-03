
  const SUPA_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const INDX_PRICE = 0.24;

  let selectedCat = '';
  let selectedCond = '';
  let publishedListingId = null;
  let deliveryOpts = { pickup: true, sovereign: false, post: false };

  function updateTitle() {
    document.getElementById('titleCount').textContent = document.getElementById('titleInput').value.length;
  }
  function updateDesc() {
    document.getElementById('descCount').textContent = document.getElementById('descInput').value.length;
  }

  function selectCat(el, name) {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    selectedCat = name;
  }

  function selectCond(el, name) {
    document.querySelectorAll('.cond-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    selectedCond = name;
  }

  function toggleDelivery(key) {
    deliveryOpts[key] = !deliveryOpts[key];
    const el = document.getElementById('del-' + key);
    el.classList.toggle('active', deliveryOpts[key]);
    el.querySelector('.del-check').textContent = deliveryOpts[key] ? '✓' : '';
  }

  function calcPrice() {
    const usd = parseFloat(document.getElementById('audInput').value) || 0;
    const indx = +(usd / INDX_PRICE).toFixed(2);
    document.getElementById('indxPreview').textContent = indx.toLocaleString();
    document.getElementById('indxInput').value = indx || '';
    document.getElementById('audPreview').textContent = usd.toFixed(2);
  }

  function calcPriceFromIndx() {
    const indx = parseFloat(document.getElementById('indxInput').value) || 0;
    const usd = +(indx * INDX_PRICE).toFixed(2);
    document.getElementById('audPreview').textContent = usd.toFixed(2);
    document.getElementById('audInput').value = usd || '';
    document.getElementById('indxPreview').textContent = indx.toLocaleString();
  }

  // Hidden file input for real photo capture
  const _fileInput = document.createElement('input');
  _fileInput.type = 'file';
  _fileInput.accept = 'image/*';
  _fileInput.capture = 'environment'; // prefer rear camera on mobile
  _fileInput.style.display = 'none';
  document.body.appendChild(_fileInput);
  let _activeSlot = 0;
  const _photoData = {}; // slot index → base64 data URL

  function triggerUpload(idx) {
    const slot = document.getElementById('slot' + idx);
    if (slot.classList.contains('has-img')) return;
    _activeSlot = idx;
    _fileInput.value = '';
    _fileInput.onchange = () => {
      const file = _fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        _photoData[idx] = dataUrl;
        slot.innerHTML = '';
        const img = document.createElement('img');
        img.src = dataUrl;
        slot.appendChild(img);
        if (idx === 0) {
          const badge = document.createElement('div');
          badge.className = 'photo-main-badge';
          badge.textContent = 'Main';
          slot.appendChild(badge);
        }
        const x = document.createElement('div');
        x.className = 'remove-x';
        x.textContent = '✕';
        x.onclick = (ev) => removePhoto(ev, idx);
        slot.appendChild(x);
        slot.classList.add('has-img');
      };
      reader.readAsDataURL(file);
    };
    _fileInput.click();
  }

  function removePhoto(e, idx) {
    e.stopPropagation();
    const slot = document.getElementById('slot' + idx);
    slot.innerHTML = idx === 0 ? `<div class="add-icon">📷</div><div class="add-label">Main photo</div>` : `<div class="add-icon">＋</div>`;
    slot.classList.remove('has-img');
    slot.onclick = () => triggerUpload(idx);
  }

  async function publishListing() {
    const title    = document.getElementById('titleInput').value.trim();
    const desc     = document.getElementById('descInput').value.trim();
    const indxVal  = parseFloat(document.getElementById('indxInput').value) || 0;
    const usdVal   = parseFloat(document.getElementById('audInput').value) || 0;

    if (!title)    { showToast('Add a title for your listing'); return; }
    if (!indxVal)  { showToast('Set a price for your listing'); return; }
    if (!selectedCat)  { showToast('Choose a category'); return; }
    if (!selectedCond) { showToast('Select item condition'); return; }

    const sellerId = sessionStorage.getItem('citizen_id');
    if (!sellerId) { showToast('Please log in to post a listing'); return; }

    const btn = document.getElementById('publishBtn');
    btn.textContent = 'Publishing…';
    btn.disabled = true;

    try {
      const res = await fetch(`${SUPA_URL}/rest/v1/rpc/create_listing`, {
        method: 'POST',
        headers: {
          apikey: SUPA_KEY,
          Authorization: 'Bearer ' + SUPA_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_seller_id:  sellerId,
          p_title:      title,
          p_description: desc || selectedCond + ' · ' + (Object.keys(deliveryOpts).filter(k => deliveryOpts[k]).join(', ')),
          p_price_indx: indxVal,
          p_category:   selectedCat,
          p_image_url:  _photoData[0] || null  // base64 main photo; Supabase Storage upload in Phase 2
        })
      });

      const data = await res.json();
      if (data && data.success) {
        publishedListingId = data.listing_id;
        // Wisdom award now happens INSIDE create_listing itself (via award_wisdom_internal,
        // keyed to this listing's real id) -- it's atomic with listing creation and works
        // for every seller, not just ones with a real auth.uid() session. The RPC returns
        // the resulting score directly, so no separate client-side award_wisdom call is
        // needed here anymore. (A redundant call used to live here -- it double-awarded
        // wisdom once create_listing started succeeding reliably. Removed.)
        if (data.new_wisdom != null) sessionStorage.setItem('citizen_wisdom', String(data.new_wisdom));

        document.getElementById('successSub').textContent =
          `"${title}" is live at ${indxVal} INDX ($${usdVal.toFixed(2)}). You keep 98% of every sale.`;
        document.getElementById('successOverlay').classList.add('show');
      } else {
        showToast(data?.error || 'Could not publish. Try again.');
        btn.textContent = 'Publish Listing';
        btn.disabled = false;
      }
    } catch(e) {
      showToast('Connection error. Check your network.');
      btn.textContent = 'Publish Listing';
      btn.disabled = false;
    }
  }

  function saveDraft() {
    showToast('Draft saved ✓');
  }

  function viewListing() {
    if (publishedListingId) {
      window.location.href = 'listing-detail.html?id=' + publishedListingId;
    } else {
      window.location.href = 'my-listings.html';
    }
  }

  function createAnother() {
    document.getElementById('successOverlay').classList.remove('show');
    document.getElementById('publishBtn').textContent = 'Publish Listing';
    document.getElementById('publishBtn').disabled = false;
    document.getElementById('titleInput').value = '';
    document.getElementById('descInput').value = '';
    document.getElementById('audInput').value = '';
    document.getElementById('indxInput').value = '';
    document.getElementById('titleCount').textContent = '0';
    document.getElementById('descCount').textContent = '0';
    document.querySelectorAll('.cat-pill,.cond-btn').forEach(el => el.classList.remove('active'));
    selectedCat = ''; selectedCond = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

  /* ── GOD MODE — CREATE-LISTING ── */
  const INDX_PRICE_USD = 0.24;
  let gmQty = 1;

  // ── Feature 1: Full draft auto-save ──────────────────────────────
  function gmAutoSave() {
    const draft = {
      title:    document.getElementById('titleInput').value,
      desc:     document.getElementById('descInput').value,
      usd:      document.getElementById('audInput').value,
      indx:     document.getElementById('indxInput').value,
      cat:      selectedCat,
      cond:     selectedCond,
      delivery: deliveryOpts,
      location: document.getElementById('locationInput').value,
      tags:     document.getElementById('tagsInput').value,
      qty:      gmQty,
      negotiable: document.getElementById('negotiableToggle').checked,
      ts: Date.now()
    };
    localStorage.setItem('indx_listing_draft', JSON.stringify(draft));
    gmCheckReadiness();
  }
  function gmLoadDraft() {
    const raw = localStorage.getItem('indx_listing_draft');
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d.title)    { document.getElementById('titleInput').value = d.title; updateTitle(); }
      if (d.desc)     { document.getElementById('descInput').value = d.desc; updateDesc(); }
      if (d.usd)      { document.getElementById('audInput').value = d.usd; }
      if (d.indx)     { document.getElementById('indxInput').value = d.indx; }
      if (d.indx)     { document.getElementById('indxPreview').textContent = parseFloat(d.indx).toLocaleString(); }
      if (d.usd)      { document.getElementById('audPreview').textContent = parseFloat(d.usd).toFixed(2); }
      if (d.location) { document.getElementById('locationInput').value = d.location; }
      if (d.tags)     { document.getElementById('tagsInput').value = d.tags; }
      if (d.qty)      { gmQty = d.qty; document.getElementById('qtyVal').textContent = d.qty; }
      if (d.negotiable) { document.getElementById('negotiableToggle').checked = true; }
      if (d.cat) {
        document.querySelectorAll('.cat-pill').forEach(p => {
          if (p.querySelector('.cat-name').textContent === d.cat) { p.classList.add('active'); selectedCat = d.cat; }
        });
        gmUpdateTagChips(d.cat);
      }
      if (d.cond) {
        document.querySelectorAll('.cond-btn').forEach(b => {
          if (b.textContent.includes(d.cond)) { b.classList.add('active'); selectedCond = d.cond; }
        });
      }
      if (d.delivery) {
        Object.keys(d.delivery).forEach(k => {
          deliveryOpts[k] = d.delivery[k];
          const el = document.getElementById('del-' + k);
          if (el) { el.classList.toggle('active', d.delivery[k]); el.querySelector('.del-check').textContent = d.delivery[k] ? '✓' : ''; }
        });
      }
      showToast('✓ Draft restored');
    } catch(e) {}
    gmCheckReadiness();
  }
  function gmSaveNegotiable() { gmAutoSave(); }

  // ── Feature 2: Quantity stepper ───────────────────────────────────
  function gmQtyChange(delta) {
    gmQty = Math.max(1, Math.min(99, gmQty + delta));
    document.getElementById('qtyVal').textContent = gmQty;
    gmAutoSave();
  }

  // ── Feature 3: Category-aware tag suggestions ─────────────────────
  const GM_TAG_MAP = {
    Electronics: ['phone','charger','laptop','tablet','headphones','cable','camera','gaming'],
    Clothing:    ['vintage','handmade','women','men','kids','shoes','jacket','sustainable'],
    Food:        ['organic','homemade','fresh','local','vegan','gluten-free','pacific','traditional'],
    Services:    ['repair','cleaning','design','delivery','tutoring','photography','cooking','gardening'],
    Crafts:      ['handmade','art','pottery','weaving','jewellery','painting','carved','pacific'],
    Other:       ['collectible','rare','gift','bundle','new','vintage','limited','unique']
  };
  function gmUpdateTagChips(cat) {
    const chips = document.getElementById('tagChips');
    if (!chips) return;
    const tags = GM_TAG_MAP[cat] || [];
    const currentTags = document.getElementById('tagsInput').value.split(',').map(t => t.trim().toLowerCase());
    chips.innerHTML = tags.map(t => {
      const used = currentTags.includes(t.toLowerCase());
      return `<div class="tag-chip ${used ? 'used' : ''}" data-action="h_3" data-args="${JSON.stringify(["$event",t]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" data-tag="${t}">+ ${t}</div>`;
    }).join('');
  }
  function gmAddTag(tag) {
    const input = document.getElementById('tagsInput');
    const current = input.value.trim();
    const tags = current ? current.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (!tags.includes(tag)) { tags.push(tag); input.value = tags.join(', '); }
    gmUpdateTagChips(selectedCat);
    gmAutoSave();
  }

  // ── Feature 4: Publish readiness checklist ────────────────────────
  function gmCheckReadiness() {
    const checks = {
      photo:    Object.keys(_photoData).length > 0,
      title:    document.getElementById('titleInput').value.trim().length >= 5,
      price:    parseFloat(document.getElementById('indxInput').value) > 0,
      category: !!selectedCat,
      condition: !!selectedCond,
      desc:     document.getElementById('descInput').value.trim().length >= 10
    };
    const keys = Object.keys(checks);
    const done = keys.filter(k => checks[k]).length;
    const pct = Math.round((done / keys.length) * 100);
    document.getElementById('readinessFill').style.width = pct + '%';
    document.getElementById('readinessPct').textContent = pct + '%';
    const labels = { photo:'Photo', title:'Title', price:'Price', category:'Category', condition:'Condition', desc:'Description' };
    keys.forEach(k => {
      const el = document.getElementById('r-' + k);
      if (!el) return;
      el.classList.toggle('done', checks[k]);
      el.querySelector('.r-dot').textContent = checks[k] ? '✓' : '';
    });
    const btn = document.getElementById('publishBtn');
    if (pct === 100 && !btn.classList.contains('ready')) { btn.classList.add('ready'); }
    // GOD MODE PATCH — run SIINDEX review when title + desc are filled
    if (checks.title && checks.desc) gmSIINDEXReview();
  }

  // ── Feature 5: SIINDEX listing quality review ─────────────────────
  let siReviewTimer;
  function gmSIINDEXReview() {
    clearTimeout(siReviewTimer);
    siReviewTimer = setTimeout(() => {
      const title = document.getElementById('titleInput').value.trim();
      const desc  = document.getElementById('descInput').value.trim();
      const indx  = parseFloat(document.getElementById('indxInput').value) || 0;
      const items = [];
      // Title check
      if (title.length < 20) {
        items.push({ cls:'warn', icon:'⚠️', msg:'Title is short — add brand, size, or model for 4× more views.' });
      } else {
        items.push({ cls:'good', icon:'✓', msg:'Title looks strong — specific titles rank higher in search.' });
      }
      // Description check
      if (desc.length < 60) {
        items.push({ cls:'warn', icon:'⚠️', msg:'Description is brief — mention condition, dimensions, or why you\'re selling.' });
      } else {
        items.push({ cls:'good', icon:'✓', msg:'Description is detailed — buyers will have fewer questions.' });
      }
      // Price check
      if (indx > 0) {
        items.push({ cls:'good', icon:'✓', msg:`Price set at ${indx} INDX ($${(indx * INDX_PRICE_USD).toFixed(2)}) — you keep 98% on every sale.` });
      } else {
        items.push({ cls:'warn', icon:'⚠️', msg:'Add a price — listings without a price get 70% fewer inquiries.' });
      }
      const panel = document.getElementById('siReviewPanel');
      const list  = document.getElementById('siReviewItems');
      list.innerHTML = items.map(i => `<div class="si-review-item ${i.cls}"><span class="si-review-icon">${i.icon}</span>${i.msg}</div>`).join('');
      panel.classList.add('show');
    }, 800);
  }

  // ── Feature 6: Live listing preview ──────────────────────────────
  function gmOpenPreview() {
    const title = document.getElementById('titleInput').value.trim() || 'Your listing title';
    const indx  = parseFloat(document.getElementById('indxInput').value) || 0;
    const usd   = (indx * INDX_PRICE_USD).toFixed(2);
    document.getElementById('previewTitleText').textContent = title;
    document.getElementById('previewPriceINDX').textContent = indx + ' INDX';
    document.getElementById('previewPriceUSD').textContent = '$' + usd;
    // Photo
    const imgBox = document.getElementById('previewImgBox');
    if (_photoData[0]) {
      imgBox.innerHTML = `<img src="${_photoData[0]}" alt="listing photo">`;
    } else {
      imgBox.innerHTML = '📷';
    }
    // Meta badges
    const meta = [];
    if (selectedCond) meta.push(selectedCond);
    if (selectedCat)  meta.push(selectedCat);
    if (gmQty > 1)    meta.push('Qty: ' + gmQty);
    if (document.getElementById('negotiableToggle').checked) meta.push('Negotiable');
    document.getElementById('previewMeta').innerHTML = meta.map(m => `<div class="preview-badge">${m}</div>`).join('');
    document.getElementById('previewOverlay').classList.add('open');
    document.getElementById('previewSheet').classList.add('open');
  }
  function gmClosePreview() {
    document.getElementById('previewOverlay').classList.remove('open');
    document.getElementById('previewSheet').classList.remove('open');
  }

  // ── Feature 7: Photo quality tip ─────────────────────────────────
  let tipShown = false;
  function gmShowPhotoTip() {
    if (tipShown || localStorage.getItem('indx_listing_tip_shown')) return;
    const tip = document.getElementById('photoTipToast');
    tip.classList.add('show');
    tipShown = true;
    localStorage.setItem('indx_listing_tip_shown', '1');
    setTimeout(() => tip.classList.remove('show'), 5000);
  }

  // ── Feature 8: Share listing post-publish ────────────────────────
  function gmShareListing() {
    const title = document.getElementById('successSub').textContent.split('"')[1] || 'my listing';
    const url   = publishedListingId
      ? `https://www.imagenationdex.com/listing-detail.html?id=${publishedListingId}`
      : 'https://www.imagenationdex.com/p2p-marketplace.html';
    const text  = `Check out "${title}" on IN$DEX Marketplace — pay with INDX, keep 98%.`;
    if (navigator.share) {
      navigator.share({ title: 'IN$DEX Listing', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('🔗 Listing link copied!')).catch(() => showToast('🔗 ' + url));
    }
  }

  // ── GOD MODE PATCH — wire auto-save + photo tip to existing functions ──

  // GOD MODE PATCH — intercept selectCat to trigger tag chips + auto-save
  const _origSelectCat = selectCat;
  selectCat = function(el, name) {
    _origSelectCat(el, name);
    gmUpdateTagChips(name);
    gmAutoSave();
  };

  // GOD MODE PATCH — intercept selectCond
  const _origSelectCond = selectCond;
  selectCond = function(el, name) {
    _origSelectCond(el, name);
    gmAutoSave();
  };

  // GOD MODE PATCH — intercept triggerUpload to show photo tip + check readiness
  const _origTriggerUpload = triggerUpload;
  triggerUpload = function(idx) {
    gmShowPhotoTip();
    _origTriggerUpload(idx);
    setTimeout(gmCheckReadiness, 500);
  };

  // GOD MODE PATCH — wire auto-save on key input fields
  document.addEventListener('DOMContentLoaded', () => {
    ['titleInput','descInput','audInput','indxInput','locationInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', gmAutoSave);
    });
    // GOD MODE PATCH — intercept createAnother to clear draft
    const _origCreateAnother = createAnother;
    window.createAnother = function() {
      _origCreateAnother();
      localStorage.removeItem('indx_listing_draft');
      localStorage.removeItem('indx_listing_tip_shown');
      document.getElementById('siReviewPanel').classList.remove('show');
      document.getElementById('tagChips').innerHTML = '';
      gmQty = 1; document.getElementById('qtyVal').textContent = '1';
      document.getElementById('negotiableToggle').checked = false;
      gmCheckReadiness();
    };
    gmLoadDraft();
  });

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.history.back(); }
function h_2(event) { window.location.href='my-listings.html'; }
function h_3(event, __p0) { gmAddTag(String(__p0)); }


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
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, true); })(EV.change);

})();
