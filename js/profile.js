
  let selectedAvatar = '👤';

  // ── INIT FROM sessionStorage ──
  (function initProfile() {
    const name    = sessionStorage.getItem('citizen_name') || 'Sovereign';
    const domain  = sessionStorage.getItem('citizen_web3_domain') || '';
    const wisdom  = parseInt(sessionStorage.getItem('citizen_wisdom') || '0');
    const genesis = sessionStorage.getItem('citizen_genesis') === 'true';

    const slug = domain ? domain.replace('.indx','').replace('.IN$DEX','') : name.toLowerCase().replace(/[^a-z0-9]/g,'');
    const displayDomain = slug + '.IN$DEX';

    // Hero
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileDomain').textContent = displayDomain;

    // Wisdom card
    document.querySelector('.wisdom-score-num').innerHTML = wisdom + ' <span>/ 200</span>';
    const pct = Math.min(100, Math.round((wisdom / 200) * 100));
    setTimeout(() => { document.getElementById('wisdomFill').style.width = pct + '%'; }, 300);
    [50,100,150,200].forEach(gate => {
      const el = document.getElementById('gate' + gate + 'dot');
      if (el && wisdom >= gate) el.classList.add('reached');
    });

    // Title based on wisdom gate
    const title = wisdom >= 200 ? 'Sovereign Elder' : wisdom >= 150 ? 'Elder' : wisdom >= 100 ? 'Sovereign' : wisdom >= 50 ? 'Governor' : 'Citizen';
    document.querySelector('.badge.citizen') && (document.querySelector('.badge.citizen').textContent = '🏛️ ' + title);
    if (!genesis) document.querySelector('.badge.genesis') && (document.querySelector('.badge.genesis').style.display = 'none');

    // Stats row
    const bal = parseInt(sessionStorage.getItem('citizen_balance') || '0');
    document.getElementById('statBalance').textContent = bal.toLocaleString();

    // ID card
    document.getElementById('idName').textContent = name;
    document.getElementById('idDomain').textContent = displayDomain;
    document.querySelector('.id-card .field-value[style*="cyan"]') && (document.querySelector('.id-card .field-value[style*="cyan"]').textContent = wisdom + ' / 200');

    // Edit form defaults
    document.getElementById('editName').value = name;
    document.querySelector('.form-input[readonly]') && (document.querySelector('.form-input[readonly]').value = displayDomain);
  })();

  function openEditSheet() {
    document.getElementById('editOverlay').classList.add('open');
  }
  function closeEditSheet() {
    document.getElementById('editOverlay').classList.remove('open');
  }

  function selectAvatar(el, emoji) {
    document.querySelectorAll('.av-option').forEach(a => a.classList.remove('selected'));
    el.classList.add('selected');
    selectedAvatar = emoji;
  }

  function saveProfile() {
    const name = document.getElementById('editName').value.trim() || sessionStorage.getItem('citizen_name') || 'Sovereign';
    document.getElementById('profileName').textContent = name;
    document.getElementById('idName').textContent = name;
    document.getElementById('avatarEl').textContent = selectedAvatar;
    sessionStorage.setItem('citizen_name', name);
    closeEditSheet();
    showToast('✓ Profile updated');
  }

  function sharePassport() {
    const domain = sessionStorage.getItem('citizen_web3_domain') || '';
    const slug = domain ? domain.replace('.indx','') : (sessionStorage.getItem('citizen_name') || 'sovereign').toLowerCase().replace(/[^a-z0-9]/g,'');
    if (navigator.share) {
      navigator.share({
        title: 'My IN$DEX Sovereign Passport',
        text: `I'm a Genesis Citizen on IN$DEX join me at ${slug}.IN$DEX`,
        url: `https://imagenationdex.com/join/${slug}`
      });
    } else {
      showToast(`🔗 Link copied: imagenationdex.com/${slug}`);
    }
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  document.getElementById('editOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeEditSheet();
  });

  // ══ GOD MODE JS ══════════════════════════════════════════════
  // Feature 1: Cybertron hex canvas
  (function initProfCanvas() {
    const cv = document.getElementById('cyberCanvasProf');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const COLORS = ['#00D4FF','#2B35D8','#8B3FE8','#00E5A0','#FFB800'];
    let W, H, pts;
    const FRAME_MS = 1000/22, N = 22;
    let lastT = 0;
    function resize() {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
      pts = Array.from({length:N}, () => ({
        x:Math.random()*W, y:Math.random()*H,
        vx:(Math.random()-0.5)*0.44, vy:(Math.random()-0.5)*0.44,
        r:1.8+Math.random()*2.2,
        color:COLORS[Math.floor(Math.random()*COLORS.length)],
        phase:Math.random()*Math.PI*2
      }));
    }
    window.addEventListener('resize', resize); resize();
    function draw(ts) {
      requestAnimationFrame(draw);
      if (ts-lastT < FRAME_MS) return; lastT = ts;
      ctx.clearRect(0,0,W,H);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.phase+=0.02;
        if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1;
        const op=0.15+0.10*Math.sin(p.phase);
        ctx.save(); ctx.translate(p.x,p.y); ctx.beginPath();
        for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;i===0?ctx.moveTo(p.r*Math.cos(a),p.r*Math.sin(a)):ctx.lineTo(p.r*Math.cos(a),p.r*Math.sin(a));}
        ctx.closePath(); ctx.fillStyle=p.color+Math.round(op*255).toString(16).padStart(2,'0'); ctx.fill(); ctx.restore();
      });
      for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
        const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);
        if(d<125){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(0,212,255,${(1-d/125)*0.10})`;ctx.lineWidth=0.5;ctx.stroke();}
      }
    }
    requestAnimationFrame(draw);
  })();

  // Feature 3: Wisdom score count-up animation
  (function animateWisdomCount() {
    const el = document.querySelector('.wisdom-score-num');
    if (!el) return;
    const wisdom = parseInt(sessionStorage.getItem('citizen_wisdom') || '0');
    let cur = 0;
    const total = wisdom;
    if (total === 0) return;
    const dur = 1200; // ms
    const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      cur = Math.round(total * ease);
      el.innerHTML = cur + ' <span>/ 200</span>';
      if (p < 1) requestAnimationFrame(step);
    }
    setTimeout(() => requestAnimationFrame(step), 350);
  })();

  // Feature 4: Recent activity feed from localStorage
  (function initActivityFeed() {
    const feed = document.getElementById('activityFeed');
    const title = document.getElementById('activityTitle');
    if (!feed) return;
    const payHist  = JSON.parse(localStorage.getItem('indx_pay_hist')  || '[]');
    const swapHist = JSON.parse(localStorage.getItem('indx_swap_hist') || '[]');
    // Merge and sort by timestamp
    const events = [
      ...payHist.map(p  => ({ type:'send', icon:'💸', label:'Sent to ' + p.name, amt:'-'+p.amt+' INDX', cls:'neg', ts:p.ts })),
      ...swapHist.map(s => ({ type:'swap', icon:'⚡', label:'Swapped ' + s.from + ' → ' + s.to, amt:s.received+' '+s.to, cls:'neu', ts:s.ts }))
    ].sort((a,b) => b.ts - a.ts).slice(0, 6);

    if (!events.length) {
      // FIXED 2026-07-25: was showing 3 fabricated sample transactions (Jake Nuku,
      // SOL swap, AJ) as if they were the citizen's real recent activity whenever
      // no real pay/swap history existed. Honest empty state instead. See gotchas.md.
      title.style.display = 'block';
      feed.innerHTML = '<div style="padding:20px 12px;text-align:center;color:var(--text-dim);font-size:12px;">No activity yet — sends and swaps will show up here.</div>';
      return;
    }
    title.style.display = 'block';
    feed.innerHTML = events.map(e => renderAct(e)).join('');
  })();

  function renderAct(e) {
    const ago = relActTime(e.ts);
    const iconCls = e.type === 'send' ? 'send' : e.type === 'recv' ? 'recv' : 'swap';
    return `<div class="activity-item">
      <div class="act-icon ${iconCls}">${e.icon}</div>
      <div class="act-body">
        <div class="act-label">${e.label}</div>
        <div class="act-time">${ago}</div>
      </div>
      <div class="act-amt ${e.cls}">${e.amt}</div>
    </div>`;
  }
  function relActTime(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s/60);
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m/60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h/24) + 'd ago';
  }

  // ══ GOD MODE R2 ══════════════════════════════════════════════
  (function godModeProfileR2() {
    const BIO_KEY  = 'indx_profile_bio';

    // Feature 2: Inline bio editor
    function initBio() {
      var bioEl  = document.getElementById('profileBio');
      var hintEl = document.getElementById('bioHint');
      if (!bioEl) return;
      var saved = localStorage.getItem(BIO_KEY) || '';
      if (saved) {
        bioEl.textContent = saved;
        bioEl.style.color = '';
      } else {
        bioEl.textContent = 'Tap to add a bio…';
        bioEl.style.color = 'var(--text-dim)';
      }
      bioEl.addEventListener('focus', function() {
        if (bioEl.textContent === 'Tap to add a bio…') {
          bioEl.textContent = '';
          bioEl.style.color = '';
        }
        if (hintEl) hintEl.classList.add('show');
      });
      bioEl.addEventListener('blur', function() {
        var txt = bioEl.textContent.trim();
        if (!txt) {
          bioEl.textContent = 'Tap to add a bio…';
          bioEl.style.color = 'var(--text-dim)';
          localStorage.removeItem(BIO_KEY);
        } else {
          localStorage.setItem(BIO_KEY, txt);
          showToast('✓ Bio saved');
        }
        if (hintEl) hintEl.classList.remove('show');
        // Rebuild completion after bio change
        buildCompletionCard();
      });
    }

    // Feature 1: Profile completion meter
    var PROFILE_TASKS = [
      { label: 'Add display name',     icon: '👤', done: function(){ return !!(sessionStorage.getItem('citizen_name')); },                          action: function(){ openEditSheet(); } },
      { label: 'Write a bio',          icon: '✍️', done: function(){ return !!(localStorage.getItem(BIO_KEY)); },                                   action: function(){ var b=document.getElementById('profileBio'); if(b)b.focus(); } },
      { label: 'Choose an avatar',     icon: '🎭', done: function(){ return !!(localStorage.getItem('indx_profile_avatar')); },                     action: function(){ openEditSheet(); } },
      { label: 'Complete verification',icon: '🔐', done: function(){ return parseInt(sessionStorage.getItem('citizen_wisdom')||'0')>0; },            action: function(){ window.location.href='sovereign-verify.html'; } },
      { label: 'Make first referral',  icon: '🤝', done: function(){ return JSON.parse(localStorage.getItem('indx_ref_pending')||'[]').length>0; }, action: function(){ window.location.href='referral.html'; } }
    ];

    function buildCompletionCard() {
      var card  = document.getElementById('profileCompCard');
      var fill  = document.getElementById('pccFill');
      var tasksEl = document.getElementById('pccTasks');
      var pctEl = document.getElementById('pccPct');
      if (!card) return;
      var doneCount = PROFILE_TASKS.filter(function(t){ return t.done(); }).length;
      var total = PROFILE_TASKS.length;
      var pct = Math.round((doneCount / total) * 100);
      pctEl.textContent = pct + '%';
      setTimeout(function(){ fill.style.width = pct + '%'; }, 400);
      if (pct === 100) {
        card.style.borderColor = 'rgba(0,229,160,0.3)';
        tasksEl.innerHTML = '<div class="pcc-complete-msg">🎉 Profile complete — you\'re fully sovereign!</div>';
      } else {
        tasksEl.innerHTML = PROFILE_TASKS.map(function(t, i) {
          var isDone = t.done();
          return '<div class="pcc-task' + (isDone ? ' done' : '') + '">' +
            '<span class="pct-icon">' + (isDone ? '✅' : t.icon) + '</span>' +
            '<span>' + t.label + '</span>' +
            (isDone ? '' : '<span class="pct-action" data-task="' + i + '">Do it →</span>') +
          '</div>';
        }).join('');
        tasksEl.querySelectorAll('.pct-action').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var idx = parseInt(btn.getAttribute('data-task'));
            if (PROFILE_TASKS[idx]) PROFILE_TASKS[idx].action();
          });
        });
      }
    }

    // Feature 3: Referral impact card
    // FIXED 2026-08-21: "Joined" and "Earned" used to be invented from a flat,
    // made-up 60%-conversion assumption on local share-attempt count (totalCitizens
    // = shares*0.6, earnedINDX = totalCitizens*10) -- no real referral ever backed
    // either number, and 10 INDX/referral was also the wrong rate. referral-dashboard.html
    // already calls the real get_referral_stats RPC (real referrals table, real
    // completed_referrals count, indx_earned = completed*50) -- this card now calls
    // the same RPC instead of fabricating its own numbers.
    async function buildReferralCard() {
      var elShares = document.getElementById('ricShares');
      var elCitizens = document.getElementById('ricCitizens');
      var elEarned = document.getElementById('ricEarned');
      var elUSD = document.getElementById('ricUSD');
      var citizenId = sessionStorage.getItem('citizen_id');
      if (!citizenId) return; // not signed in — leave the honest 0 defaults in the markup
      try {
        var SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
        var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
        var sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
        var res = await sbClient.rpc('get_referral_stats', { p_citizen_id: citizenId });
        if (res.error || !res.data) return;
        var d = res.data;
        var earnedUSD = ((d.indx_earned || 0) * 0.24).toFixed(2);
        if (elShares) elShares.textContent = d.total_referred || 0;
        if (elCitizens) elCitizens.textContent = d.completed_referrals || 0;
        if (elEarned) elEarned.textContent = (d.indx_earned || 0) + ' INDX';
        if (elUSD) elUSD.textContent = '$' + earnedUSD;
      } catch (e) { /* leave honest 0 defaults on any failure */ }
    }

    // Feature 4: Stat boxes (Citizens Referred, Items Listed)
    // FIXED 2026-08-21: this used to overwrite the "Items Listed" box's label
    // and number with a device-local "Profile Views" counter that just counted
    // how many times the OWNER opened their own profile (this screen has no
    // other-citizen viewer -- citizen-profile.html is the one others see), and
    // populated "Citizens Referred" from the same local share-attempt count
    // buildReferralCard() fabricated its numbers from. Neither was real. Now:
    // "Citizens Referred" reuses buildReferralCard()'s real get_referral_stats
    // call, and "Items Listed" calls the real get_my_listings RPC. The
    // "Profile Views" label/counter is dropped -- there's no real cross-citizen
    // view tracking to report.
    async function updateStatBoxes() {
      var statBoxes = document.querySelectorAll('.stat-box');
      var citizenId = sessionStorage.getItem('citizen_id');
      if (!citizenId) return; // not signed in — leave the honest 0 defaults in the markup
      try {
        var SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
        var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
        var sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
        var [refRes, listRes] = await Promise.all([
          sbClient.rpc('get_referral_stats', { p_citizen_id: citizenId }),
          sbClient.rpc('get_my_listings', { p_citizen_id: citizenId })
        ]);
        if (!refRes.error && refRes.data && statBoxes[1]) {
          statBoxes[1].querySelector('.num').textContent = refRes.data.completed_referrals || 0;
        }
        if (!listRes.error && Array.isArray(listRes.data) && statBoxes[2]) {
          statBoxes[2].querySelector('.num').textContent = listRes.data.length;
        }
      } catch (e) { /* leave honest 0 defaults on any failure */ }
    }

    // Init all
    initBio();
    buildCompletionCard();
    buildReferralCard();
    updateStatBoxes();
  })();

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { window.history.back(); }
function h_2(event) { window.location.href='referral.html'; }
function h_3(event) { window.location.href='sovereign-verify.html'; }
function h_4(event) { window.location.href='light-node.html'; }
function h_5(event) { window.location.href='nft-gallery.html'; }
function h_6(event) { window.location.href='business-network.html'; }
function h_7(event) { window.location.href='skill-point-nft.html'; }
function h_8(event) { window.location.href='governance.html'; }
function h_9(event) { window.location.href='notifications-setup.html'; }
function h_10(event) { showToast('🌙 Dark mode is always on you\'re welcome'); }
function h_11(event) { window.location.href='pag.html'; }
function h_12(event) { window.location.href='feed.html'; }
function h_13(event) { window.location.href='dispute.html'; }
function h_14(event) { window.location.href='citizen-dashboard.html'; }
function h_15(event) { window.location.href='marketplace.html'; }
function h_16(event) { window.location.href='portfolio.html'; }
function h_17(event) { window.location.href='profile.html'; }


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

})();
