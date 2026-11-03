
    const INDX_PRICE_USD = 0.24;
    const ARCHIVE_KEY = 'indx_cultural_archive';
    const ELDER_KEY = 'indx_elder_reviews';

    let selectedAssetType = 'Song / Music';

    // ── GOD MODE: LIVE CONFIDENCE METER ──
    const CONFIDENCE_SIGNALS = {
      sacred: { words: ['sacred','spiritual','secret','ceremony only','initiation'], label: 'Sacred', color: 'var(--red)' },
      elder: { words: ['ancestor','grandfather','grandmother','tribe','community','village','council'], label: 'Elder Review', color: 'var(--purple)' },
      family: { words: ['family','passed down','inherited','relative'], label: 'Family-Owned', color: 'var(--cyan)' },
      restricted: { words: ['restricted','not public','private','closed'], label: 'Restricted', color: 'var(--red)' }
    };

    function updateConfidence() {
      const desc = (document.getElementById('assetDesc').value || '').toLowerCase();
      const owner = (document.getElementById('ownerDesc').value || '').toLowerCase();
      const combined = desc + ' ' + owner;
      const meter = document.getElementById('confidenceMeter');
      const guessEl = document.getElementById('confidenceGuess');
      const fillEl = document.getElementById('confidenceFill');

      if (!combined.trim()) { meter.classList.remove('show'); return; }

      let bestKey = null, bestHits = 0;
      Object.keys(CONFIDENCE_SIGNALS).forEach(key => {
        const hits = CONFIDENCE_SIGNALS[key].words.filter(w => combined.includes(w)).length;
        if (hits > bestHits) { bestHits = hits; bestKey = key; }
      });

      meter.classList.add('show');
      if (!bestKey) {
        guessEl.textContent = 'Likely Public';
        fillEl.style.width = '20%';
        fillEl.style.background = 'linear-gradient(90deg, var(--gold), var(--green))';
      } else {
        const sig = CONFIDENCE_SIGNALS[bestKey];
        const pct = Math.min(100, 30 + bestHits * 25);
        guessEl.textContent = 'Likely ' + sig.label;
        fillEl.style.width = pct + '%';
        fillEl.style.background = sig.color;
      }
    }

    // ── GOD MODE: ELDER REVIEW TRACKER ──
    function getElderReviews() {
      try { return JSON.parse(localStorage.getItem(ELDER_KEY) || '[]'); } catch(e) { return []; }
    }

    function refreshElderBadge() {
      const badge = document.getElementById('elderReviewBadge');
      if (badge) badge.textContent = String(getElderReviews().length);
    }

    function renderElderTracker() {
      const reviews = getElderReviews();
      const list = document.getElementById('elderTrackerList');
      if (!reviews.length) {
        list.innerHTML = '<div style="text-align:center;padding:24px 10px;color:var(--muted);font-size:13px;">No elder review requests submitted yet.</div>';
        return;
      }
      list.innerHTML = reviews.map(r => `
        <div class="tracker-item">
          <div class="tracker-item-top">
            <span class="tracker-item-name">${r.name}</span>
            <span class="tracker-status">${(r.status || 'submitted').replace('_',' ')}</span>
          </div>
          <div class="tracker-item-meta">${r.intent ? r.intent.substring(0,80) : ''}${r.intent && r.intent.length > 80 ? '…' : ''} · Submitted ${new Date(r.ts).toLocaleDateString()}</div>
        </div>
      `).join('');
    }

    function openElderTracker() {
      renderElderTracker();
      document.getElementById('trackerOverlay').classList.add('open');
      document.getElementById('trackerSheet').classList.add('open');
    }

    function closeElderTracker() {
      document.getElementById('trackerOverlay').classList.remove('open');
      document.getElementById('trackerSheet').classList.remove('open');
    }

    // ── GOD MODE: ARCHIVE DELETE ──
    let pendingDeleteIndex = null;

    function requestDeleteAsset(index) {
      pendingDeleteIndex = index;
      const archive = getArchive();
      const asset = archive[index];
      document.getElementById('deleteConfirmText').textContent = asset
        ? `Remove "${asset.desc.substring(0,60)}" from your local Cultural Archive? This cannot be undone.`
        : 'This will remove the asset from your local Cultural Archive. This cannot be undone.';
      document.getElementById('deleteConfirmOverlay').classList.add('open');
      document.getElementById('deleteConfirmSheet').classList.add('open');
    }

    function cancelDeleteAsset() {
      pendingDeleteIndex = null;
      document.getElementById('deleteConfirmOverlay').classList.remove('open');
      document.getElementById('deleteConfirmSheet').classList.remove('open');
    }

    function confirmDeleteAsset() {
      if (pendingDeleteIndex === null) { cancelDeleteAsset(); return; }
      const archive = getArchive();
      archive.splice(pendingDeleteIndex, 1);
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
      cancelDeleteAsset();
      renderArchive();
      showToast('Removed from Cultural Archive');
    }

    // ── TABS ──
    function switchTab(id) {
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + id).classList.add('active');
      event.target.classList.add('active');
      if (id === 'archive') renderArchive();
    }

    function selectAssetType(el) {
      document.querySelectorAll('.asset-type-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      selectedAssetType = el.textContent.replace(/\n/g,'').trim();
    }

    // ── CLASSIFY ──
    const CLASSIFICATIONS = {
      'Song / Music': {
        ceremony: { level:'elder', title:'Elder-Approved Required', cls:'elder', badge:'elder', commerce:'Elder review required' },
        family: { level:'community', title:'Community-Owned', cls:'community', badge:'community', commerce:'Community permission required' },
        personal: { level:'public', title:'Publicly Shareable', cls:'public', badge:'public', commerce:'Commercially approved' },
        unknown: { level:'unknown', title:'Unknown Origin — Paused', cls:'restricted', badge:'restricted', commerce:'Paused pending classification' }
      }
    };

    function classifyAsset() {
      const desc = document.getElementById('assetDesc').value.trim();
      const owner = document.getElementById('ownerDesc').value.trim();
      if (!desc) { showToast('Describe your cultural asset first.'); return; }

      // Intelligent classification based on description keywords
      let level, cls, title, rules;

      const descLower = (desc + ' ' + owner).toLowerCase();
      if (descLower.includes('sacred') || descLower.includes('spiritual') || descLower.includes('secret') || descLower.includes('ceremony only') || descLower.includes('initiation')) {
        level = 'sacred'; cls = 'sacred'; title = 'Sacred — Cannot Be Commercialised';
        rules = [
          { icon:'⛔', text:'<strong>Commercial use:</strong> Not permitted under any circumstances.' },
          { icon:'🔒', text:'<strong>Digital sharing:</strong> Requires spiritual guidance and community consent.' },
          { icon:'📚', text:'<strong>Educational use:</strong> Only with explicit permission from spiritual holders.' },
          { icon:'🌺', text:'<strong>Archive:</strong> Private digital archive available for the rightful holders only.' },
          { icon:'🛡️', text:'<strong>SIINDEX protection:</strong> Planned — not live yet. This classification is a personal record today; it doesn\'t yet block marketplace listings automatically.' }
        ];
      } else if (descLower.includes('ancestor') || descLower.includes('grandfather') || descLower.includes('grandmother') || descLower.includes('tribe') || descLower.includes('community') || descLower.includes('village') || descLower.includes('council')) {
        level = 'elder'; cls = 'elder'; title = 'Elder Review Required';
        rules = [
          { icon:'🌺', text:'<strong>Commercial use:</strong> Elder or community approval required before any sale, listing, or licensing.' },
          { icon:'📖', text:'<strong>Educational use:</strong> Allowed with attribution and community notification.' },
          { icon:'🌏', text:'<strong>Public sharing:</strong> Allowed with proper attribution and classification label.' },
          { icon:'💰', text:'<strong>Revenue sharing:</strong> If commercial use is approved, a revenue-sharing arrangement with the community is expected.' },
          { icon:'⏱️', text:'<strong>Review timeline:</strong> Planned target of 7–30 days once a live elder/community review pipeline exists. Today, submitting a request only saves it to your device — nothing is routed to a reviewer yet, so commercial activity isn\'t paused automatically.' }
        ];
      } else if (descLower.includes('family') || descLower.includes('passed down') || descLower.includes('inherited') || descLower.includes('relative')) {
        level = 'family'; cls = 'community'; title = 'Family-Owned Cultural Asset';
        rules = [
          { icon:'👨‍👩‍👧', text:'<strong>Ownership:</strong> This knowledge belongs to your family lineage.' },
          { icon:'💼', text:'<strong>Commercial use:</strong> Permitted if you are a rightful family holder. Consider revenue sharing with other family members.' },
          { icon:'📢', text:'<strong>Public sharing:</strong> Permitted with family knowledge and attribution.' },
          { icon:'🌺', text:'<strong>Elder check:</strong> If elders in your family hold authority over this knowledge, their approval is recommended.' },
          { icon:'🏷️', text:'<strong>Attribution:</strong> Always attribute to your family or lineage when sharing publicly.' }
        ];
      } else if (descLower.includes('restricted') || descLower.includes('not public') || descLower.includes('private') || descLower.includes('closed')) {
        level = 'restricted'; cls = 'restricted'; title = 'Restricted Cultural Asset';
        rules = [
          { icon:'⛔', text:'<strong>Commercial use:</strong> Not permitted. Asset is restricted to defined group members.' },
          { icon:'📚', text:'<strong>Educational use:</strong> Permitted only within the defined community or learning context.' },
          { icon:'🔒', text:'<strong>Public sharing:</strong> Not permitted.' },
          { icon:'📝', text:'<strong>Archive:</strong> Private archive available for documentation purposes.' },
          { icon:'🛡️', text:'<strong>SIINDEX protection:</strong> Planned — not live yet. This classification is a personal record today; it doesn\'t yet block marketplace listings automatically.' }
        ];
      } else {
        level = 'public'; cls = 'public'; title = 'Publicly Shareable';
        rules = [
          { icon:'✅', text:'<strong>Commercial use:</strong> Approved. You can sell, license, and list this on the IN$DEX marketplace.' },
          { icon:'📢', text:'<strong>Public sharing:</strong> Freely shareable on all platforms.' },
          { icon:'📚', text:'<strong>Educational use:</strong> Fully permitted.' },
          { icon:'🏷️', text:'<strong>Attribution:</strong> Always attribute the cultural origin if it comes from a tradition rather than purely original creation.' },
          { icon:'🌺', text:'<strong>Recommendation:</strong> Even for public assets, include attribution and cultural context to build trust and respect.' }
        ];
      }

      const resultHTML = `
        <div class="cl-status-card ${cls}">
          <span class="cl-status-badge ${cls === 'family' ? 'community' : cls}">${level === 'sacred' ? '⚫ Sacred' : level === 'elder' ? '🌺 Elder Review Required' : level === 'family' ? '👨‍👩‍👧 Family-Owned' : level === 'restricted' ? '🔒 Restricted' : '✅ Public'}</span>
          <div class="cl-status-title">${title}</div>
          <div class="cl-status-desc">Based on your description, SIINDEX has classified this as a <strong>${title}</strong> cultural asset. Review the rules below carefully before sharing or listing.</div>
          <div class="cl-rules-grid">${rules.map(r => `<div class="cl-rule"><span class="cl-rule-icon">${r.icon}</span><div class="cl-rule-text">${r.text}</div></div>`).join('')}</div>
        </div>
        <button style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(255,184,0,0.25);background:rgba(255,184,0,0.06);color:var(--gold);font-size:13px;font-weight:700;cursor:pointer;" data-action="h_4" data-args="${JSON.stringify(["$event",desc.substring(0,60),selectedAssetType,title,cls]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">💾 Save to My Cultural Archive</button>
      `;

      const resultEl = document.getElementById('clResult');
      resultEl.innerHTML = resultHTML;
      resultEl.classList.add('show');
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ── ARCHIVE ──
    function getArchive() {
      try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch(e) { return []; }
    }

    function saveToArchive(desc, type, title, cls) {
      const archive = getArchive();
      const entry = { desc, type, title, cls, ts: Date.now(), elderStatus: 'not_required' };
      if (cls === 'elder') entry.elderStatus = 'pending';
      archive.unshift(entry);
      if (archive.length > 20) archive.pop();
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
      showToast('Saved to Cultural Archive ✓');
    }

    // GOD MODE PATCH
    let archiveFilter = 'all';

    // GOD MODE PATCH
    function setArchiveFilter(cls) {
      archiveFilter = cls;
      renderArchive();
    }

    // GOD MODE PATCH
    function renderArchive() {
      const archive = getArchive();
      const list = document.getElementById('archiveList');
      const statsEl = document.getElementById('archiveStats');
      refreshElderBadge();
      if (!archive.length) {
        if (statsEl) statsEl.innerHTML = '';
        list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--muted);font-size:13px;">No assets classified yet.<br>Use the Classify tab to register your first cultural asset.</div>';
        return;
      }
      const icons = { 'Song / Music':'🎵', 'Visual Art':'🎨', 'Story / Oral':'📖', 'Dance / Ceremony':'💃', 'Plant / Remedy':'🌿', 'Craft / Object':'🏺' };
      const colors = { public:'rgba(0,229,160,0.12)', community:'rgba(255,184,0,0.12)', elder:'rgba(139,63,232,0.12)', restricted:'rgba(255,77,109,0.12)', sacred:'rgba(255,255,255,0.06)' };
      const textColors = { public:'var(--green)', community:'var(--gold)', elder:'var(--purple)', restricted:'var(--red)', sacred:'var(--text)' };

      if (statsEl) {
        const counts = archive.reduce((acc, a) => { acc[a.cls] = (acc[a.cls] || 0) + 1; return acc; }, {});
        const chips = [{ key:'all', label:`All (${archive.length})` }]
          .concat(Object.keys(counts).map(k => ({ key:k, label:`${k[0].toUpperCase()+k.slice(1)} (${counts[k]})` })));
        statsEl.innerHTML = chips.map(c => `<button class="archive-chip${archiveFilter===c.key?' active':''}" data-action="h_5" data-args="${JSON.stringify(["$event",c.key]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${c.label}</button>`).join('');
      }

      const filtered = archiveFilter === 'all' ? archive : archive.filter(a => a.cls === archiveFilter);
      if (!filtered.length) {
        list.innerHTML = '<div style="text-align:center;padding:30px 20px;color:var(--muted);font-size:13px;">No assets match this filter.</div>';
        return;
      }
      list.innerHTML = filtered.map(a => {
        const realIndex = archive.indexOf(a);
        return `
        <div class="saved-asset">
          <span class="saved-asset-icon">${icons[a.type] || '🌺'}</span>
          <div class="saved-asset-info">
            <div class="saved-asset-name">${a.desc}</div>
            <div class="saved-asset-meta">${a.type} · ${new Date(a.ts).toLocaleDateString()}${a.elderStatus === 'pending' ? ' · Elder review pending' : ''}</div>
          </div>
          <span class="saved-asset-level" style="background:${colors[a.cls]||colors.public};color:${textColors[a.cls]||textColors.public}">${a.title.split(' ')[0]}</span>
          <button class="saved-asset-del" data-action="h_6" data-args="${JSON.stringify(["$event",realIndex]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" aria-label="Remove asset">🗑</button>
        </div>
      `;
      }).join('');
    }

    // ── ELDER REVIEW ──
    function submitElderReview() {
      const name = document.getElementById('elderAssetName').value.trim();
      const relation = document.getElementById('elderRelation').value.trim();
      const intent = document.getElementById('elderIntent').value.trim();
      if (!name || !relation || !intent) { showToast('Please fill in all required fields.'); return; }

      const reviews = JSON.parse(localStorage.getItem(ELDER_KEY) || '[]');
      reviews.unshift({ name, relation, intent, contact: document.getElementById('elderContact').value.trim(), ts: Date.now(), status: 'submitted' });
      localStorage.setItem(ELDER_KEY, JSON.stringify(reviews));

      document.getElementById('elderSheetSub').textContent = `Your review request for "${name}" is saved on this device. There's no live elder/community review pipeline yet, so it hasn't been sent to anyone — this is a personal placeholder until that ships.`;
      document.getElementById('elderOverlay').classList.add('open');
      document.getElementById('elderSheet').classList.add('open');

      document.getElementById('elderAssetName').value = '';
      document.getElementById('elderRelation').value = '';
      document.getElementById('elderIntent').value = '';
      document.getElementById('elderContact').value = '';
    }

    function closeElder() {
      document.getElementById('elderOverlay').classList.remove('open');
      document.getElementById('elderSheet').classList.remove('open');
    }

    // ── BROADCAST KIT ──
    function toggleBK(id) {
      document.getElementById('bk-' + id).classList.toggle('expanded');
    }

    function copyBK(cardId) {
      const text = document.querySelector('#' + cardId + ' .bk-content-text')?.textContent || '';
      const attr = document.querySelector('#' + cardId + ' .bk-attribution')?.textContent || '';
      navigator.clipboard.writeText(text + '\n\n---\n' + attr).then(() => showToast('Copied ✓'));
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    document.addEventListener('DOMContentLoaded', () => {
      renderArchive();
      // GOD MODE PATCH
      refreshElderBadge();
    });

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { if(event.target===this)closeElder(); }
function h_2(event) { if(event.target===this)closeElderTracker(); }
function h_3(event) { if(event.target===this)cancelDeleteAsset(); }
function h_4(event, __p0, __p1, __p2, __p3) { saveToArchive(String(__p0), String(__p1), String(__p2), String(__p3)); }
function h_5(event, __p0) { setArchiveFilter(String(__p0)); }
function h_6(event, __p0) { event.stopPropagation();requestDeleteAsset(__p0); }


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
