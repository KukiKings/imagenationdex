// ── CONSTANTS ──────────────────────────────────────────────────────────────
const INDX_PRICE_USD = 0.24;

// ── STATE ──────────────────────────────────────────────────────────────────
let gallery = JSON.parse(localStorage.getItem('indx_studio_gallery') || '[]');
let credits = parseInt(localStorage.getItem('indx_studio_credits') || '250');
let selectedRatio = '1:1';
let selectedImgModel = 'flux';
let selectedVideoModel = 'runway';
let selectedMood = 'hype';
let selectedWriteType = 'listing';
let isPlaying = false;

// ── TOAST ──────────────────────────────────────────────────────────────────
function showToast(msg, ms = 2600) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}

// ── TABS ───────────────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-action="switchTab"][data-args='["${name}"]']`).classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'gallery') renderGallery();
}

// ── SINGLE-SELECT CHIPS ────────────────────────────────────────────────────
function selectChip(el, group) {
  document.querySelectorAll(`[data-action="selectChip"][data-args='["$this","${group}"]']`).forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

function getChip(group) {
  return document.querySelector(`[data-action="selectChip"][data-args='["$this","${group}"]'].active`)?.textContent.trim() || '';
}

// ── PRESETS ────────────────────────────────────────────────────────────────
function selectPreset(el, type) {
  document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  if (type === 'img') {
    const ta = document.getElementById('imgDesc');
    if (!ta.value.trim()) ta.value = el.dataset.val;
  }
}

// ── RATIO ──────────────────────────────────────────────────────────────────
function selectRatio(el, ratio) {
  document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  selectedRatio = ratio;
}

// ── MODEL ──────────────────────────────────────────────────────────────────
function selectModel(el, type) {
  el.closest('.model-row').querySelectorAll('.model-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  if (type === 'img') selectedImgModel = el.dataset.model;
  if (type === 'video') selectedVideoModel = el.dataset.model;
}

// ── DURATION ───────────────────────────────────────────────────────────────
function selectDur(el, rowId) {
  document.querySelectorAll(`#${rowId} .dur-btn`).forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function getActiveDur(rowId) {
  return document.querySelector(`#${rowId} .dur-btn.active`)?.textContent || '';
}

// ── MOOD ───────────────────────────────────────────────────────────────────
function selectMood(el) {
  document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  selectedMood = el.dataset.mood;
}

// ── VIDEO SOURCE ───────────────────────────────────────────────────────────
function switchVideoSource(el, src) {
  document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['vsText','vsImage','vsProduct'].forEach(id => document.getElementById(id).style.display = 'none');
  document.getElementById('vs' + src.charAt(0).toUpperCase() + src.slice(1)).style.display = 'block';
}

// ── WRITE TYPE ─────────────────────────────────────────────────────────────
function selectWriteType(el) {
  document.querySelectorAll('.write-type-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  selectedWriteType = el.dataset.type;
}

function selectPlatform(el) {
  document.querySelectorAll('.platform-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

// ── IMAGE PROMPT BUILDER ───────────────────────────────────────────────────
function buildImagePrompt() {
  const desc = document.getElementById('imgDesc').value.trim();
  if (!desc) { showToast('Tell me what you want to create first ✦'); return; }

  document.getElementById('imgThinking').style.display = 'flex';

  setTimeout(() => {
    document.getElementById('imgThinking').style.display = 'none';

    const style = getChip('imgStyle') || 'Photorealistic';
    const modelLabel = { flux: 'Flux 1.1 Pro', ideogram: 'Ideogram v3', gpt: 'GPT Image 1.5', midjourney: 'Midjourney v7' }[selectedImgModel];

    const styleMap = {
      'Photorealistic': 'photorealistic, hyperdetailed, DSLR photography, Sony A7IV, 85mm prime lens, f/1.4 bokeh, studio three-point lighting, subsurface skin scattering, visible pore detail',
      'Artistic': 'painterly digital art, dynamic brushwork, rich colour palette, gallery quality, ArtStation trending, expressive composition, cinematic colour grading',
      'Cyberpunk': 'cyberpunk futuristic aesthetic, neon lights cyan and purple, holographic elements, dark cinematic, sci-fi bioluminescent glow, rain-slicked surfaces',
      'Minimalist': 'minimalist clean composition, large white negative space, single hero subject, Muji zen aesthetic, simple elegant forms, editorial restraint',
      'Pacific': 'Pacific Islander warmth, golden hour ocean light, tropical elements, traditional patterns, earth tones terracotta and teal, natural textures, authentic cultural depth',
      'Editorial': 'editorial magazine photography, Vogue quality, dramatic Rembrandt lighting, high fashion, cinematic colour grade, bold composition'
    };

    const quality = '8K RAW, ultra-sharp focus, physically-based rendering, volumetric light, film grain 10%, award-winning photography, impossible detail, makes you stop scrolling, worth printing at 40x60';
    const positive = `${desc}, ${styleMap[style] || styleMap['Photorealistic']}, aspect ratio ${selectedRatio}, ${quality}`;
    const negative = '— Negative: watermark, logo text overlay, deformed hands, extra fingers, blurry, low resolution, cartoon, anime, stock photo feel, generic, plastic skin, fluorescent lighting, white background, amateur photography';

    document.getElementById('imgPositive').textContent = positive;
    document.getElementById('imgNegative').textContent = negative;
    document.getElementById('imgPromptBox').classList.add('show');
    document.getElementById('imgOpenIn').style.display = 'block';
    document.getElementById('imgActions').style.display = 'flex';

    // Wire Ideogram link
    document.getElementById('ideogramLink').href = `https://ideogram.ai/t/explore`;

    // Deduct credits
    credits = Math.max(0, credits - 5);
    localStorage.setItem('indx_studio_credits', credits);
    document.getElementById('creditCount').innerHTML = `${credits} <span>remaining</span>`;

    showToast('✦ Prompt ready — copy and generate');
  }, 2000);
}

// ── VIDEO PROMPT BUILDER ───────────────────────────────────────────────────
function buildVideoPrompt() {
  const desc = (document.getElementById('videoDesc')?.value || '').trim() || 'a cinematic product showcase';
  document.getElementById('videoThinking').style.display = 'flex';

  setTimeout(() => {
    document.getElementById('videoThinking').style.display = 'none';

    const vibe = getChip('videoVibe') || 'Cinematic';
    const dur = getActiveDur('videoDurRow') || '10s';
    const modelLabel = { runway: 'Runway Gen-4.5', kling: 'Kling 3.0', luma: 'Luma Ray 3', veo: 'Google Veo 3.1' }[selectedVideoModel];

    const prompt = `${desc}. Style: ${vibe.toLowerCase()}, professional cinematography, smooth controlled camera movement, ${dur} clip. Camera: slow dolly push-in with subtle parallax. Lighting: cinematic three-point setup, rim light, deep shadows. Colour grade: teal and gold, rich contrast, 4K ultra-sharp. No text overlays. No watermarks. Production quality: luxury brand commercial. [Optimised for ${modelLabel}]`;

    document.getElementById('videoPositive').textContent = prompt;
    document.getElementById('videoPromptBox').classList.add('show');
    document.getElementById('videoOpenIn').style.display = 'block';
    document.getElementById('videoActions').style.display = 'flex';

    showToast('✦ Video prompt ready');
  }, 2100);
}

// ── MUSIC PROMPT BUILDER ───────────────────────────────────────────────────
function buildMusicPrompt() {
  const context = document.getElementById('musicContext').value.trim();
  const genre = getChip('musicGenre') || 'Electronic';
  const dur = getActiveDur('musicDurRow') || '30s';

  const moodData = {
    hype:       { desc: 'high energy, driving beat, powerful drops, adrenaline rush', bpm: '128-140', key: 'F minor' },
    chill:      { desc: 'relaxed flow, smooth melodies, subtle groove, effortless cool', bpm: '75-90', key: 'Eb major' },
    epic:       { desc: 'cinematic grandeur, sweeping strings, rising tension, hero moment', bpm: '60-80', key: 'D minor' },
    mysterious: { desc: 'dark ambient, subtle tension, ethereal atmosphere, haunting melody', bpm: '85-100', key: 'B minor' },
    uplifting:  { desc: 'bright chords, ascending melody, feel-good energy, positive momentum', bpm: '110-125', key: 'G major' },
    pacific:    { desc: 'island rhythm, ukulele warmth, tropical percussion, ocean breeze, authentic Pacific soul', bpm: '95-110', key: 'C major' }
  };

  document.getElementById('musicThinking').style.display = 'flex';

  setTimeout(() => {
    document.getElementById('musicThinking').style.display = 'none';

    const md = moodData[selectedMood] || moodData.hype;
    const prompt = `${genre} instrumental music — ${md.desc}. Duration: ${dur}. BPM: ${md.bpm}. Key: ${md.key}. Studio mastered, professional production quality, no vocals, royalty-free style, cinematic mix — clear low-end, warm mid-range, crisp highs.${context ? ` Context: ${context}.` : ''} Mood: ${selectedMood}.`;

    document.getElementById('musicPositive').textContent = prompt;
    document.getElementById('musicPromptBox').classList.add('show');
    document.getElementById('musicOpenIn').style.display = 'block';

    showToast('✦ Music prompt ready');
  }, 1900);
}

// ── WRITING GENERATOR ──────────────────────────────────────────────────────
function generateWriting() {
  const desc = document.getElementById('writeDesc').value.trim();
  if (!desc) { showToast('Tell me about your product first ✦'); return; }

  document.getElementById('writeThinking').style.display = 'flex';

  setTimeout(() => {
    document.getElementById('writeThinking').style.display = 'none';

    const tone = getChip('writeTone') || 'Bold & Confident';
    const platform = document.querySelector('.platform-pill.active')?.textContent || 'Instagram';

    const writers = {
      listing: () => `${desc}\n\n✦ Why you'll love it:\n• Handcrafted with intention — no two pieces are the same\n• Made by an independent creator through IN$DEX\n• Ships with care, directly from maker to you\n• IN$DEX Verified Creator ✦\n\n🌏 Every purchase supports independent creators and our community.\n\nINDX Price: $${INDX_PRICE_USD} · 2% Community Fee on every sale`,

      caption: () => {
        const hooks = { 'Bold & Confident': '🔥 This is the one.', 'Warm & Personal': '✨ Made with love and care.', 'Professional': '📦 Now available.', 'Playful': '👀 You need this in your life.', 'Inspiring': '💫 Crafted for people who believe in something.' };
        return `${hooks[tone] || '✦'}\n\n${desc}\n\n🛒 Available now on IN$DEX — the marketplace built for creators.\n🌏 Shop the link in bio.\n\n#INDEXMarketplace #IndependentCreator #PacificMade #HandmadeWithLove #CreatorEconomy #Web3Commerce #TheFutureIsOurs`;
      },

      script: () => `[OPENING — 0s to 3s]\nHook: "${desc.split(' ').slice(0, 5).join(' ')}..."\n\n[HOOK — 3s to 8s]\n"This isn't just a product. It's a piece of culture. A piece of my story."\n\n[STORY — 8s to 22s]\n${desc}\n\nEvery piece is handmade. No factory. No middleman. Just creator to community — through IN$DEX.\n\n[CALL TO ACTION — 22s to 30s]\n"Find it on IN$DEX. Link in bio. Support real creators. The future is ours."\n\n#INDEXCreator #TheFutureIsOurs`,

      bio: () => `Kia ora — I'm an IN$DEX creator bringing authentic craftsmanship to the world of Web3 commerce.\n\n${desc}\n\nI create with purpose. Every piece carries a story, a culture, a heartbeat.\n\n🌏 Pacific made · Shipping worldwide\n💎 IN$DEX Verified Creator\n✦ 2% of every sale supports our community\n\n→ Shop my store on IN$DEX`,

      story: () => `THE STORY BEHIND THE BRAND\n\n${desc}\n\nI didn't start this for the money. I started this because I had something to say — and I needed a platform that honoured where I came from.\n\nIN$DEX gave me that. A marketplace where the future of commerce meets the wisdom of culture. Where creators keep what they earn. Where community is built into every transaction.\n\nEvery piece I create is a vote for a different kind of economy.\n\nThe future is ours. ✦`,

      email: () => `Subject: Something I think you'll love 🌏\n\nHey,\n\nI wanted to reach out because ${desc}.\n\nI'm now selling it through IN$DEX — a marketplace built specifically for independent creators like me. Every purchase goes directly to supporting the maker with no corporate cut.\n\nHere's the link: [Your IN$DEX listing]\n\nThank you for supporting real creators.\n\nWith aloha,\n[Your Name]`
    };

    const output = (writers[selectedWriteType] || writers.listing)();
    document.getElementById('writeText').textContent = output;
    document.getElementById('writeOutput').classList.add('show');

    saveToGallery('text');
    showToast('✦ Copy ready — tap Copy to use it');
  }, 1800);
}

// ── COPY TEXT ──────────────────────────────────────────────────────────────
function copyText(id) {
  const text = document.getElementById(id)?.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => showToast('✦ Copied to clipboard'))
    .catch(() => showToast('Long-press to copy'));
}

// ── GALLERY ────────────────────────────────────────────────────────────────
function saveToGallery(type) {
  const icons = { image: '🖼️', video: '🎬', music: '🎵', text: '📝' };
  const item = {
    id: Date.now(),
    type,
    icon: icons[type],
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Creation`,
    date: new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }),
    createdAt: new Date().toISOString()
  };
  gallery.unshift(item);
  if (gallery.length > 60) gallery = gallery.slice(0, 60);
  localStorage.setItem('indx_studio_gallery', JSON.stringify(gallery));
  updateGalleryStats();
  showToast('✦ Saved to Gallery');
}

function renderGallery() {
  updateGalleryStats();
  const grid = document.getElementById('galleryGrid');

  if (!gallery.length) {
    grid.innerHTML = `<div class="gallery-empty"><div style="font-size:40px;margin-bottom:12px;opacity:0.25;">🗂️</div><p style="font-size:14px;color:var(--sub);">Your creations will appear here.</p><p style="font-size:12px;color:var(--sub);opacity:0.6;margin-top:6px;">Create images, videos, music or copy<br>and tap Save to add them here.</p></div>`;
    return;
  }

  // GOD MODE PATCH — cards now include tap-to-confirm delete button
  grid.innerHTML = gallery.map(item => `
    <div class="gallery-card" data-type="${item.type}" data-action="showToast" data-args='["Opening ${item.type}..."]'>
      <button class="gm-del-btn" data-action="gmDeleteGalleryItem" data-args='["$event",${item.id}]'>✕</button>
      <div class="gallery-thumb">${item.icon}</div>
      <div class="gallery-meta">
        <div class="gallery-type">${item.type.toUpperCase()}</div>
        <div class="gallery-title">${item.title}</div>
        <div class="gallery-date">${item.date}</div>
      </div>
    </div>
  `).join('');
}

function filterGallery(el, type) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.gallery-card').forEach(card => {
    card.style.display = (type === 'all' || card.dataset.type === type) ? '' : 'none';
  });
}

function updateGalleryStats() {
  const counts = { image: 0, video: 0, music: 0, text: 0 };
  gallery.forEach(i => { if (counts[i.type] !== undefined) counts[i.type]++; });
  document.getElementById('statImages').textContent = counts.image;
  document.getElementById('statVideos').textContent = counts.video;
  document.getElementById('statMusic').textContent = counts.music;
  document.getElementById('statTexts').textContent = counts.text;
}

// ── SHARE ──────────────────────────────────────────────────────────────────
function openShare() {
  document.getElementById('shareOverlay').classList.add('show');
  document.getElementById('shareSheet').classList.add('show');
}

function closeShare() {
  document.getElementById('shareOverlay').classList.remove('show');
  document.getElementById('shareSheet').classList.remove('show');
}

function doShare(platform) {
  closeShare();
  showToast(`Sharing to ${platform}...`);
}

// ── MARKETPLACE PUSH ───────────────────────────────────────────────────────
// FIX 2026-08-30: this used to redirect the citizen straight into
// l99-launch-command.html -- an internal founder launch-broadcast tool with
// no real marketplace listing flow inside it at all. No real marketplace
// publishing flow exists yet, so say that honestly instead of routing a
// citizen into founder-only tooling.
function pushToMarketplace() {
  showToast('🚧 Marketplace publishing is coming soon — not live yet.');
}

// ── QUICK TOOLS ────────────────────────────────────────────────────────────
function quickTool(tool) {
  const names = {
    'bg-remove': 'Background Remover',
    'upscale': 'AI Upscaler',
    'qr': 'QR Code Generator',
    'palette': 'Brand Palette Extractor',
    'caption': 'Auto Caption',
    'resize': 'Social Media Resizer',
    'translate': 'AI Translator',
    'nft': 'NFT Minter'
  };
  showToast(`${names[tool]} — coming in next update ✦`);
}

// ── AUDIO PLAYER ───────────────────────────────────────────────────────────
function togglePlay() {
  isPlaying = !isPlaying;
  document.getElementById('playBtn').textContent = isPlaying ? '⏸' : '▶';
  if (isPlaying) animateWave();
  else document.querySelectorAll('.audio-bar').forEach(b => b.style.opacity = '0.35');
}

function animateWave() {
  if (!isPlaying) return;
  document.querySelectorAll('.audio-bar').forEach(b => {
    b.style.height = (Math.random() * 46 + 10) + 'px';
    b.style.opacity = '1';
  });
  setTimeout(animateWave, 120);
}

function buildWaveform() {
  const w = document.getElementById('audioWaveform');
  if (!w) return;
  for (let i = 0; i < 32; i++) {
    const b = document.createElement('div');
    b.className = 'audio-bar';
    b.style.height = (Math.random() * 30 + 10) + 'px';
    w.appendChild(b);
  }
}

// ── INIT ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildWaveform();
  document.getElementById('creditCount').innerHTML = `${credits} <span>remaining</span>`;
  updateGalleryStats();
  // GOD MODE PATCH — initialise God Mode features
  godModeInit();
});

// ═══════════════════════════════ GOD MODE (Fable 5) ═══════════════════════
// 1. Draft auto-save & restore   2. Live brief strength meter
// 3. Gallery tap-to-confirm delete   4. Recent brief history (tap to reuse)

const GM_DRAFTS_KEY = 'indx_studio_drafts';
const GM_HISTORY_KEY = 'indx_studio_history';
const gmDraftFields = ['imgDesc', 'videoDesc', 'musicContext', 'writeDesc'];
let gmDraftTimer = null;
let gmArmedDelete = null;

// ── Feature 1: Draft auto-save & restore ──────────────────────────────────
function gmSaveDrafts() {
  const drafts = {};
  gmDraftFields.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value.trim()) drafts[id] = el.value;
  });
  localStorage.setItem(GM_DRAFTS_KEY, JSON.stringify(drafts));
}

function gmRestoreDrafts() {
  let drafts = {};
  try { drafts = JSON.parse(localStorage.getItem(GM_DRAFTS_KEY) || '{}'); } catch (e) { drafts = {}; }
  let restored = 0;
  gmDraftFields.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.value && drafts[id]) { el.value = drafts[id]; restored++; }
  });
  if (restored) showToast('✦ Draft restored — right where you left it');
  gmDraftFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      clearTimeout(gmDraftTimer);
      gmDraftTimer = setTimeout(gmSaveDrafts, 600);
    });
  });
}

// ── Feature 2: Live brief strength meter ──────────────────────────────────
const gmDetailWords = ['light', 'lighting', 'colour', 'color', 'texture', 'background',
  'close-up', 'angle', 'shadow', 'warm', 'cool', 'golden', 'dark', 'soft', 'glow',
  'wood', 'stone', 'velvet', 'ocean', 'handmade', 'detail', 'style', 'mood',
  'premium', 'studio', 'natural', 'traditional'];

function gmScoreBrief(text) {
  const t = text.toLowerCase();
  let score = Math.min(50, Math.round(text.length / 2.4));
  gmDetailWords.forEach(w => { if (t.includes(w)) score += 7; });
  return Math.min(100, score);
}

function gmUpdateStrength() {
  const ta = document.getElementById('imgDesc');
  const fill = document.getElementById('imgStrengthFill');
  const label = document.getElementById('imgStrengthLabel');
  const count = document.getElementById('imgCharCount');
  if (!ta || !fill || !label || !count) return;
  const text = ta.value.trim();
  const score = text ? gmScoreBrief(text) : 0;
  fill.style.width = score + '%';
  count.textContent = text.length + ' chars';
  if (!text) {
    fill.style.background = 'var(--red)';
    label.textContent = 'Start typing — SIINDEX is listening';
    label.style.color = 'var(--sub)';
  } else if (score < 35) {
    fill.style.background = 'var(--red)';
    label.textContent = 'Thin brief — add subject, material, lighting';
    label.style.color = 'var(--red)';
  } else if (score < 70) {
    fill.style.background = 'var(--gold)';
    label.textContent = 'Good brief — one more sensory detail lifts it';
    label.style.color = 'var(--gold)';
  } else {
    fill.style.background = 'var(--green)';
    label.textContent = 'Strong brief — SIINDEX has plenty to work with';
    label.style.color = 'var(--green)';
  }
}

function gmInitStrength() {
  const ta = document.getElementById('imgDesc');
  if (!ta) return;
  ta.addEventListener('input', gmUpdateStrength);
  gmUpdateStrength();
}

// ── Feature 3: Gallery tap-to-confirm delete ──────────────────────────────
function gmDeleteGalleryItem(ev, id) {
  ev.stopPropagation();
  const btn = ev.currentTarget;
  if (gmArmedDelete !== id) {
    document.querySelectorAll('.gm-del-btn.armed').forEach(b => {
      b.classList.remove('armed');
      b.textContent = '✕';
    });
    gmArmedDelete = id;
    btn.classList.add('armed');
    btn.textContent = 'Remove?';
    setTimeout(() => {
      if (gmArmedDelete === id) {
        gmArmedDelete = null;
        btn.classList.remove('armed');
        btn.textContent = '✕';
      }
    }, 2600);
    return;
  }
  gmArmedDelete = null;
  gallery = gallery.filter(i => i.id !== id);
  localStorage.setItem('indx_studio_gallery', JSON.stringify(gallery));
  renderGallery();
  showToast('✦ Removed from Gallery');
}

// ── Feature 4: Recent brief history ───────────────────────────────────────
const gmHistMap = {
  image: { wrap: 'gmHistImage', chips: 'gmHistImageChips', field: 'imgDesc' },
  video: { wrap: 'gmHistVideo', chips: 'gmHistVideoChips', field: 'videoDesc' },
  write: { wrap: 'gmHistWrite', chips: 'gmHistWriteChips', field: 'writeDesc' }
};

function gmLoadHistory() {
  try { return JSON.parse(localStorage.getItem(GM_HISTORY_KEY) || '{}'); } catch (e) { return {}; }
}

function gmRecordHistory(tab, text) {
  if (!text) return;
  const h = gmLoadHistory();
  const list = (h[tab] || []).filter(t => t !== text);
  list.unshift(text);
  h[tab] = list.slice(0, 5);
  localStorage.setItem(GM_HISTORY_KEY, JSON.stringify(h));
  gmRenderHistory();
}

function gmRenderHistory() {
  const h = gmLoadHistory();
  Object.keys(gmHistMap).forEach(tab => {
    const cfg = gmHistMap[tab];
    const wrap = document.getElementById(cfg.wrap);
    const chipsEl = document.getElementById(cfg.chips);
    if (!wrap || !chipsEl) return;
    const list = h[tab] || [];
    if (!list.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    chipsEl.innerHTML = '';
    list.forEach(text => {
      const chip = document.createElement('div');
      chip.className = 'gm-history-chip';
      chip.textContent = text.length > 42 ? text.slice(0, 42) + '…' : text;
      chip.title = text;
      chip.onclick = () => {
        const ta = document.getElementById(cfg.field);
        if (!ta) return;
        ta.value = text;
        ta.dispatchEvent(new Event('input'));
        showToast('✦ Brief loaded — build when ready');
      };
      chipsEl.appendChild(chip);
    });
  });
}

// GOD MODE PATCH — wrap prompt builders to capture brief history
const gmOrigBuildImagePrompt = buildImagePrompt;
buildImagePrompt = function () {
  const d = document.getElementById('imgDesc').value.trim();
  if (d) gmRecordHistory('image', d);
  gmOrigBuildImagePrompt();
};

const gmOrigBuildVideoPrompt = buildVideoPrompt;
buildVideoPrompt = function () {
  const d = (document.getElementById('videoDesc')?.value || '').trim();
  if (d) gmRecordHistory('video', d);
  gmOrigBuildVideoPrompt();
};

const gmOrigGenerateWriting = generateWriting;
generateWriting = function () {
  const d = document.getElementById('writeDesc').value.trim();
  if (d) gmRecordHistory('write', d);
  gmOrigGenerateWriting();
};

// ── GOD MODE INIT (called from the existing DOMContentLoaded) ─────────────
function godModeInit() {
  gmRestoreDrafts();
  gmInitStrength();
  gmRenderHistory();
}

// ── Delegated click dispatcher ────────────────────────────────────────────
// Replaces the inline onclick="fn(args)" attributes (CSP phase: no inline handlers).
// Markup carries data-action="fn" and optional data-args='[...]' (JSON; "$this" = the element,
// "$event" = the click event). Walks up from the target so nested actions fire inner-first,
// like native bubbling, and stops once a handler calls stopPropagation().
document.addEventListener('click', function (e) {
  for (let el = e.target; el && el !== document; el = el.parentElement) {
    const name = el.dataset && el.dataset.action;
    if (!name) continue;
    const fn = window[name];
    if (typeof fn !== 'function') continue;
    let args = [];
    try { args = el.dataset.args ? JSON.parse(el.dataset.args) : []; } catch (_) { continue; }
    const ev = new Proxy(e, { get(t, k) { if (k === 'currentTarget') return el; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
    fn.apply(el, args.map(function (a) { return a === '$this' ? el : a === '$event' ? ev : a; }));
    if (e.cancelBubble) break;
  }
});
