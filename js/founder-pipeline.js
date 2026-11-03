const STAGES = [
  { key:'prospect', label:'Prospect', color:'#8892B0' },
  { key:'outreach', label:'Outreach', color:'#00D4FF' },
  { key:'talks',    label:'In Talks', color:'#FFB800' },
  { key:'active',   label:'Active Partner', color:'#00E5A0' }
];

const PLAT_LABELS = { linkedin:'💼 LinkedIn', twitter:'𝕏 Twitter/X', youtube:'▶ YouTube', indx:'⬡ IN$DEX' };
const TYPE_BG = {
  partner: 'linear-gradient(135deg,#2B35D8,#00D4FF)',
  investor: 'linear-gradient(135deg,#FFB800,#FF8C00)',
  influencer: 'linear-gradient(135deg,#8B3FE8,#2B35D8)',
  creator: 'linear-gradient(135deg,#00E5A0,#2B35D8)',
  media: 'linear-gradient(135deg,#FF4D6D,#8B3FE8)',
  protocol: 'linear-gradient(135deg,#00D4FF,#2B35D8)',
  ramp: 'linear-gradient(135deg,#00E5A0,#2B35D8)',
  telecom: 'linear-gradient(135deg,#FFB800,#2B35D8)',
  blocked: 'linear-gradient(135deg,#FF4D6D,#22263A)'
};

let contacts = JSON.parse(localStorage.getItem('fp_contacts') || 'null') || [
  // ── PROTOCOL PARTNERS (IN$DEX tech stack) ──
  { id:1, name:'Solana Foundation', role:'Layer 1 blockchain · Core infrastructure', handle:'@solana', platform:'twitter', type:'protocol', stage:'active', deal:0, note:'IN$DEX built on Solana. Apply for ecosystem grant — $50K-$500K range.', added:'Jan 1, 2026' },
  { id:2, name:'Squads Protocol', role:'Multisig infrastructure · Grid Account', handle:'@squadsprotocol', platform:'twitter', type:'protocol', stage:'active', deal:0, note:'Powers the Grid Account (2-of-3 MPC keys). Integration live.', added:'Jan 1, 2026' },
  { id:3, name:'Raydium', role:'AMM · INDX/SOL LP pool', handle:'@RaydiumProtocol', platform:'twitter', type:'protocol', stage:'active', deal:0, note:'INDX/SOL liquidity pool. LP seed on L99 launch — coordinate timing.', added:'Jan 1, 2026' },
  { id:4, name:'Streamflow Finance', role:'Token vesting · distribution', handle:'@streamflow_fi', platform:'twitter', type:'protocol', stage:'active', deal:0, note:'Vesting/distribution streams only. NOT an LP lock — founder decision 2026-07-22 removed the LP lock and the LP burn.', added:'Jan 1, 2026' },
  { id:5, name:'TRISA / OpenVASP', role:'Travel Rule compliance · ZK-proof', handle:'@trisa_io', platform:'linkedin', type:'protocol', stage:'talks', deal:0, note:'ZK-proof Travel Rule for transfers >$1,000. Integration spec in whitepaper.', added:'Mar 15, 2026' },
  { id:6, name:'Jupiter Exchange', role:'DEX aggregator · Solana', handle:'@JupiterExchange', platform:'twitter', type:'protocol', stage:'prospect', deal:0, note:'List INDX on Jupiter aggregator post-L99. Massive reach for Pacific citizens.', added:'Jun 1, 2026' },
  { id:7, name:'Jito Labs', role:'MEV · Solana staking', handle:'@jito_labs', platform:'twitter', type:'protocol', stage:'prospect', deal:0, note:'Explore MEV protection for INDX transactions. Good for citizen security story.', added:'Jun 10, 2026' },
  // ── INVESTORS ──
  { id:8, name:'Pacific DeFi Fund', role:'VC · Pacific region focus', handle:'@pacificdefifund', platform:'linkedin', type:'investor', stage:'talks', deal:250000, note:'Second call booked — July 8', added:'Jun 8, 2026' },
  { id:9, name:'UNHCR Innovation', role:'UN Refugee Agency · Humanitarian tech', handle:'@unhcrinnovation', platform:'linkedin', type:'partner', stage:'prospect', deal:0, note:'Explore humanitarian pilot for stateless persons', added:'Jun 18, 2026' },
  // ── MEDIA / INFLUENCERS ──
  { id:10, name:'Layah Heilpern', role:'Bitcoin advocate · Author', handle:'@layahheilpern', platform:'twitter', type:'influencer', stage:'outreach', deal:5000, note:'Sent collab DM — awaiting reply', added:'Jun 17, 2026' },
  { id:11, name:'Crypto Banter', role:'YouTube · 850K subscribers', handle:'@cryptobanter', platform:'youtube', type:'media', stage:'outreach', deal:10000, note:'Pitch episode on unbanked / IN$DEX story', added:'Jun 20, 2026' },
  { id:12, name:'Anatoly Yakovenko', role:'Co-Founder · Solana', handle:'@aeyakovenko', platform:'twitter', type:'partner', stage:'prospect', deal:0, note:'Tag in Solana ecosystem grants application', added:'Jun 15, 2026' },
  // ── CREATORS ──
  { id:13, name:'Moana Kealoha', role:'Pacific creator · 210K followers', handle:'@moana.creates', platform:'youtube', type:'creator', stage:'active', deal:3000, note:'Genesis Creator Ambassador — live', added:'May 30, 2026' },

  // ── FIAT ON-RAMPS ──
  { id:14, name:'Transak', role:'Fiat on/off ramp · PRIMARY PICK', handle:'@Transak', platform:'twitter', type:'ramp', stage:'prospect', deal:0, note:'KYC Reliance feature = IN$DEX biometric scan accepted by Transak. Citizen never KYCs twice. Sovereign-aligned. Registered in Australia — contact directly. 160+ countries, Pacific coverage, remittance use case. White-label API available. Contact: transak.com/talk-to-us', added:'Jun 23, 2026' },
  { id:15, name:'Kado', role:'Fiat on/off ramp · Solana-native', handle:'@kado_money', platform:'twitter', type:'ramp', stage:'prospect', deal:0, note:'Built specifically for Solana dApps. Self-custody focused. Quick KYC. 100+ countries. Good secondary option or Solana widget. Lower amounts = lighter KYC. kado.money/partner', added:'Jun 23, 2026' },
  { id:16, name:'MoonPay', role:'Fiat ramp · NOT ALIGNED', handle:'@moonpay', platform:'twitter', type:'blocked', stage:'prospect', deal:0, note:'⛔ NOT ALIGNED — DO NOT PARTNER. KYC model conflicts with IN$DEX Tier 0 (phone/contact only — no documents, no face scan, no liveness, per the founder decision of 2026-07-27). Blocked AJ personally with no reason given and no appeal process. Arbitrary centralised gating = anti-sovereign. Use Transak or Kado instead.', added:'Jun 23, 2026' },

  // ── TELECOMS (Pacific distribution) ──
  { id:17, name:'Telstra Pacific (fmr. Digicel Pacific)', role:'Mobile operator · PNG, Fiji, Samoa, Tonga, Vanuatu, Nauru · Owned by Telstra', handle:'@Telstra', platform:'twitter', type:'telecom', stage:'outreach', deal:0, note:'#1 priority. Telstra acquired Digicel Pacific July 2022 (US$1.6B). CEO: Oliver Camplin-Warner (Telstra International). AUSTRALIAN company — AJ is in Melbourne. Contact via Telstra Enterprise. Mobile credit → INDX = coconut girl problem solved. Email drafted → dadyboy73@gmail.com drafts.', added:'Jun 23, 2026' },

  { id:26, name:'ATH / Vodafone Pacific', role:'Amalgamated Telecom Holdings · Vodafone Fiji, Vanuatu, PNG', handle:'@VodafoneFiji', platform:'twitter', type:'telecom', stage:'outreach', deal:0, note:'ATH (Amalgamated Telecom Holdings, Fiji-based) owns Vodafone Fiji, Vodafone Vanuatu, and Vodafone PNG under licence. 100% locally owned Pacific company — NOT connected to Vodafone Australia (TPG Telecom). ADB is an investor in PNG arm. Fiji National Provident Fund is co-owner in Fiji. Contact ATH directly via ath.com.fj. Together with Telstra Pacific, covers virtually every IN$DEX target market in the Pacific. Email drafted → dadyboy73@gmail.com drafts.', added:'Jun 23, 2026' },

  { id:27, name:'Vodafone Cook Islands', role:'Mobile operator · Cook Islands · Owned by ATH', handle:'@VodafoneCookIslands', platform:'twitter', type:'telecom', stage:'prospect', deal:0, note:'ATH (same parent as Vodafone Fiji/Vanuatu/PNG) acquired Vodafone Cook Islands in 2019 — went live as Vodafone brand January 2020. Sole or primary mobile operator in Cook Islands. 100% locally owned Pacific company. CRITICAL: Cook Islands is the origin story of IN$DEX (coconut girl, Rarotonga). This is the most symbolic first partnership — the island that inspired everything. Contact: vodafone.co.ck / info@vodafone.co.ck', added:'Jun 23, 2026' },

  { id:28, name:'Starlink (SpaceX)', role:'Satellite internet · Pacific Islands connectivity', handle:'@Starlink', platform:'twitter', type:'telecom', stage:'prospect', deal:0, note:'STRATEGIC INFRASTRUCTURE. Starlink now live in Fiji (May 2024), Vanuatu (Oct 2024), Tonga (2025), Nauru (Dec 2024), Tuvalu (Jan 2025), Kiribati (Mar 2025). Direct to Cell launching with carrier partners. Pacific Islanders increasingly choosing Starlink OVER local carriers (Vodafone etc.) for better speeds and prices — these citizens HAVE internet but may lack banking. IN$DEX fits perfectly: Starlink brings them online, IN$DEX makes them sovereign. Explore co-marketing or bundling. starlink.com/business · Contact via SpaceX partnerships portal.', added:'Jun 23, 2026' },

  // ── MISSING PROTOCOLS ──
  { id:18, name:'Metaplex', role:'NFT standard · Solana', handle:'@metaplex', platform:'twitter', type:'protocol', stage:'prospect', deal:0, note:'SP-NFTs and VR-NFTs must be Metaplex-compliant or they cannot trade on any Solana marketplace. Wire before SP-NFT public launch. metaplex.com/developers', added:'Jun 23, 2026' },
  { id:19, name:'Pyth Network', role:'Price oracle · Solana', handle:'@PythNetwork', platform:'twitter', type:'protocol', stage:'prospect', deal:0, note:'Real-time INDX/USD price feed on-chain. Required for staking contracts and yield calculations at Phase 5. pyth.network/developers', added:'Jun 23, 2026' },
  { id:20, name:'Magic Eden', role:'NFT marketplace · Solana', handle:'@MagicEden', platform:'twitter', type:'protocol', stage:'prospect', deal:0, note:'Largest Solana NFT marketplace. List SP-NFTs and VR-NFTs post-L99 for secondary trading. Gives NFTs real perceived value. magiceden.io/creators', added:'Jun 23, 2026' },
  { id:21, name:'Superteam DAO', role:'Solana builder community · Emerging markets', handle:'@SuperteamDAO', platform:'twitter', type:'partner', stage:'prospect', deal:0, note:'Already embedded in Southeast Asia, Africa, India. Looking for exactly what IN$DEX builds. Natural alliance for Pacific expansion, talent pipeline, and grants. superteam.fun', added:'Jun 23, 2026' },

  // ── MEDIA (L99 press push) ──
  { id:22, name:'Laura Shin / Unchained', role:'Crypto journalist podcast · 400K+ audience', handle:'@laurashin', platform:'twitter', type:'media', stage:'prospect', deal:0, note:'Biggest crypto journalist podcast. Unbanked origin story (coconut girl) is exactly her audience. Pitch: "The world\'s first Sovereign Digital Civilization built for the people banks forgot." unchainedpodcast.com/contact', added:'Jun 23, 2026' },
  { id:23, name:'Bankless', role:'DeFi podcast · 500K+ subscribers', handle:'@BanklessHQ', platform:'twitter', type:'media', stage:'prospect', deal:0, note:'Name is literally what IN$DEX is. INDX token + Sovereign Yield + unbanked story = perfect Bankless episode. Pitch for L99 launch week. bankless.com/pitch', added:'Jun 23, 2026' },
  { id:24, name:'CoinDesk', role:'Crypto media · News + features', handle:'@CoinDesk', platform:'twitter', type:'media', stage:'prospect', deal:0, note:'Press coverage for L99 launch. Lead with Pacific First angle and the coconut girl origin. Target editorial: tips@coindesk.com', added:'Jun 23, 2026' },
  { id:25, name:'The Block', role:'Crypto media · Research + news', handle:'@TheBlock__', platform:'twitter', type:'media', stage:'prospect', deal:0, note:'Credibility publication. L99 launch coverage. Good for investor audience. news@theblockcrypto.com', added:'Jun 23, 2026' }
];

let selectedPlat = 'linkedin';
let selectedTag = 'partner';
let selectedStage = 'prospect';
let activeContact = null;
let currentFilter = 'all';

function save() { localStorage.setItem('fp_contacts', JSON.stringify(contacts)); }

function getInitials(name) { return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }

function totalDeal() {
  return contacts.filter(c=>c.stage==='active'||c.stage==='talks').reduce((s,c)=>s+(c.deal||0),0);
}

function renderSummary() {
  const grid = document.getElementById('summaryGrid');
  grid.innerHTML = STAGES.map(s => {
    const count = contacts.filter(c=>c.stage===s.key).length;
    return `<div class="sum-box">
      <div class="sum-val" style="color:${s.color};">${count}</div>
      <div class="sum-label">${s.label}</div>
    </div>`;
  }).join('');

  const dv = totalDeal();
  document.getElementById('totalDealVal').textContent = '$' + dv.toLocaleString();

  // SIINDEX tip
  const inTalks = contacts.filter(c=>c.stage==='talks');
  const tip = inTalks.length > 0
    ? `${inTalks.length} deal${inTalks.length>1?'s':''} in "In Talks" — estimated $${inTalks.reduce((s,c)=>s+(c.deal||0),0).toLocaleString()} combined. I'll flag if no action is logged in 7 days.`
    : 'Pipeline is clear. Add your next prospect and I\'ll track the relationship from first contact to signed deal.';
  document.getElementById('siTip').textContent = tip;
}

function renderPipeline() {
  const filtered = currentFilter==='all' ? contacts : contacts.filter(c=>c.type===currentFilter);
  const view = document.getElementById('pipelineView');
  view.innerHTML = STAGES.map(s => {
    const sc = filtered.filter(c=>c.stage===s.key);
    if (!sc.length) return '';
    return `<div class="pipeline-stage">
      <div class="stage-header">
        <div class="stage-dot" style="background:${s.color};"></div>
        <div class="stage-name" style="color:${s.color};">${s.label}</div>
        <div class="stage-count">${sc.length}</div>
      </div>
      ${sc.map(c => contactCard(c)).join('')}
    </div>`;
  }).join('');
}

function contactCard(c) {
  const bg = TYPE_BG[c.type] || TYPE_BG.partner;
  return `<div class="contact-card" data-action="openDetail" data-args='[${c.id}]'>
    <div class="contact-top">
      <div class="contact-avatar" style="background:${bg};">${getInitials(c.name)}</div>
      <div class="contact-info">
        <div class="contact-name">${c.name}</div>
        <div class="contact-role">${c.role}</div>
      </div>
      <div>
        <span class="tag ${c.type}">${c.type}</span><br>
        <span class="tag ${c.platform}" style="margin-top:3px;display:inline-block;">${c.platform==='indx'?'IN$DEX':c.platform}</span>
      </div>
    </div>
    <div class="deal-row">
      <div class="deal-left">${c.note}</div>
      ${c.deal ? `<div class="deal-amount">$${c.deal.toLocaleString()}</div>` : ''}
      <button class="deal-advance" data-stop data-action="quickAdvance" data-args='[${c.id}]'>↑</button>
    </div>
  </div>`;
}

function filterContacts(el, type) {
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  currentFilter = type;
  renderPipeline();
}

function openAddSheet() {
  document.getElementById('addSheetOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeAddSheet() {
  document.getElementById('addSheetOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function selectPlat(el, v) { document.querySelectorAll('.plat-btn').forEach(b=>b.classList.remove('active')); el.classList.add('active'); selectedPlat=v; }
function selectTag(el, v) { document.querySelectorAll('.tag-btn').forEach(b=>b.classList.remove('active')); el.classList.add('active'); selectedTag=v; }
function selectStage(el, v) { document.querySelectorAll('.stage-btn').forEach(b=>b.classList.remove('active')); el.classList.add('active'); selectedStage=v; }

function addContact() {
  const name = document.getElementById('newName').value.trim();
  const role = document.getElementById('newRole').value.trim();
  const handle = document.getElementById('newHandle').value.trim();
  const deal = parseFloat(document.getElementById('newDeal').value) || 0;
  const note = document.getElementById('newNote').value.trim();
  if (!name) { showToast('⚠️ Name required'); return; }
  contacts.unshift({
    id: Date.now(), name, role: role||'—', handle: handle||'—',
    platform: selectedPlat, type: selectedTag, stage: selectedStage,
    deal, note: note||'No action yet.',
    added: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
  });
  save();
  closeAddSheet();
  ['newName','newRole','newHandle','newDeal','newNote'].forEach(id=>document.getElementById(id).value='');
  renderSummary(); renderPipeline();
  showToast('✅ ' + name + ' added to pipeline');
}

function openDetail(id) {
  const c = contacts.find(x=>x.id===id);
  if (!c) return;
  activeContact = c;
  const bg = TYPE_BG[c.type]||TYPE_BG.partner;
  const stage = STAGES.find(s=>s.key===c.stage);
  document.getElementById('dAvatar').style.background = bg;
  document.getElementById('dAvatar').textContent = getInitials(c.name);
  document.getElementById('dName').textContent = c.name;
  document.getElementById('dRole').textContent = c.role;
  document.getElementById('dPlat').textContent = PLAT_LABELS[c.platform]||c.platform;
  document.getElementById('dStage').textContent = stage?stage.label:c.stage;
  document.getElementById('dStage').style.color = stage?stage.color:'var(--text)';
  document.getElementById('dDeal').textContent = c.deal ? '$'+c.deal.toLocaleString() : '—';
  document.getElementById('dAdded').textContent = c.added;
  document.getElementById('dNote').textContent = c.note;
  document.getElementById('dTags').innerHTML = `<span class="tag ${c.type}">${c.type}</span><span class="tag ${c.platform}">${c.platform==='indx'?'IN$DEX':c.platform}</span>`;
  document.getElementById('detailOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeDetail() {
  document.getElementById('detailOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function advanceStage() {
  if (!activeContact) return;
  const idx = STAGES.findIndex(s=>s.key===activeContact.stage);
  if (idx>=STAGES.length-1) { showToast('🎉 Already an Active Partner!'); return; }
  activeContact.stage = STAGES[idx+1].key;
  const ci = contacts.findIndex(x=>x.id===activeContact.id);
  if (ci!==-1) contacts[ci]=activeContact;
  save(); renderSummary(); renderPipeline();
  openDetail(activeContact.id);
  showToast('⬆️ Moved to '+STAGES[idx+1].label);
}

function quickAdvance(id) {
  activeContact = contacts.find(x=>x.id===id);
  advanceStage();
  activeContact = null;
}

function removeContact() {
  if (!activeContact) return;
  contacts = contacts.filter(x=>x.id!==activeContact.id);
  save(); closeDetail(); renderSummary(); renderPipeline();
  showToast('🗑️ Removed from pipeline');
}

function showToast(msg) {
  const t = document.getElementById('fpToast');
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(window._fpTimer);
  window._fpTimer = setTimeout(()=>{t.style.display='none';},3000);
}

// ── GOD MODE: ACTIVITY LOG · OUTREACH DRAFTER · STALENESS · WEIGHTED VALUE ──

const STAGE_WEIGHTS = { prospect: 0.10, outreach: 0.25, talks: 0.60, active: 0.90 };

// ── ACTIVITY LOG ──
function getActivity(id) { return JSON.parse(localStorage.getItem('indx_fp_activity_' + id) || '[]'); }
function saveActivity(id, arr) { localStorage.setItem('indx_fp_activity_' + id, JSON.stringify(arr)); }

function renderActivityFeed(id) {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  const entries = getActivity(id);
  if (!entries.length) {
    feed.innerHTML = '<div class="act-empty">No activity yet — log a call, email, or meeting.</div>';
    return;
  }
  feed.innerHTML = entries.slice().reverse().map(e => `
    <div class="act-row">
      <div class="act-dot"></div>
      <div class="act-body">
        <div class="act-text">${e.text}</div>
        <div class="act-ts">${e.ts}</div>
      </div>
    </div>`).join('');
}

function logActivity() {
  const inp = document.getElementById('activityInput');
  if (!inp || !activeContact) return;
  const text = inp.value.trim();
  if (!text) { showToast('⚠️ Enter an activity to log'); return; }
  const arr = getActivity(activeContact.id);
  const now = new Date();
  arr.push({
    text,
    ts: now.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
        now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  });
  saveActivity(activeContact.id, arr);
  localStorage.setItem('indx_fp_touch_' + activeContact.id, Date.now());
  inp.value = '';
  renderActivityFeed(activeContact.id);
  updateStalenessAlert();
  showToast('📝 Activity logged');
}

function focusActivityLog() {
  const inp = document.getElementById('activityInput');
  if (inp) inp.focus();
}

// ── OUTREACH DRAFTER ──
const OUTREACH_TEMPLATES = {
  partner: c => `Hi ${c.name.split(' ')[0]},\n\nI'm AJ, Founder of IN$DEX — the Sovereign Digital Civilisation built on Solana. We're building the financial rails for the Pacific: INDX token, DEX, remittance corridors, and citizen-owned sovereign wallets.\n\nWe see ${c.name} as a natural collaborator as we scale across Oceania. ${c.stage === 'talks' ? 'Would love to nail down next steps from our conversations.' : 'Would love to open a conversation and share our vision.'}\n\nHappy to share the whitepaper or jump on a call this week.\n\nSovereign regards,\nAJ — IN$DEX Founder`,
  investor: c => `Hi ${c.name.split(' ')[0]},\n\nIN$DEX is raising its seed round — $2M to deploy the Pacific's first Sovereign Digital Civilisation. Built on Solana (SPL token, mint deployment pending). 244 screens live. AUSTRAC VASP enrolment submitted, under assessment.\n\n${c.stage === 'talks' ? 'Following up on our earlier discussion — happy to share the data room or financials.' : 'We\'d value your participation and perspective as we structure the round.'}\n\nAJ — IN$DEX`,
  influencer: c => `Hi ${c.name.split(' ')[0]},\n\nWe're building IN$DEX — the world's first Pacific Sovereign Digital Civilisation on Solana. INDX token (SPL, mint deployment pending), DEX, remittance for 27 million Pacific Islanders, and citizen sovereignty.\n\nYour audience would love this story. We'd love to collaborate — content partnership, early citizen access, or a planned INDX allocation at TGE (token launch) — not guaranteed, and subject to final terms once the token is live.\n\n${c.stage === 'outreach' ? 'Would you be open to a quick call this week?' : 'Excited to keep building on our momentum.'}\n\nAJ — IN$DEX`,
  creator: c => `Hi ${c.name.split(' ')[0]},\n\nIN$DEX is building the Creator Economy layer for the Pacific — sovereign wallets, INDX token royalties, and a civilisation that pays its creators.\n\nWe'd love you as a Genesis Creator Ambassador. Early access, a planned INDX allocation at TGE (token launch) — not guaranteed, subject to final terms once the token is live — and your community becomes citizens of IN$DEX.\n\nInterested?\n\nAJ — IN$DEX`,
  media: c => `Hi ${c.name.split(' ')[0]},\n\nIN$DEX is the Pacific's first Sovereign Digital Civilisation — a story about financial sovereignty, Solana, and 27 million people left behind by TradFi. Built by an Australian Cook Islands citizen.\n\nWe'd love to be covered in ${c.role || 'your publication'}. Happy to provide an exclusive angle, founder access, or data.\n\nAJ — IN$DEX Founder`,
  protocol: c => `Hi ${c.name.split(' ')[0]},\n\nIN$DEX is building Pacific-first DeFi infrastructure on Solana and exploring integration with ${c.name} as we scale our liquidity and travel-rule stack.\n\nStrong alignment — INDX token, sovereign wallets, remittance corridors, and citizen-first UX. Would love to discuss technical collaboration or joint liquidity.\n\nAJ — IN$DEX`,
  telecom: c => `Hi ${c.name.split(' ')[0]},\n\nIN$DEX is building sub-1% remittance and sovereign mobile wallets for Pacific communities — and ${c.name} is our first choice distribution partner at launch.\n\nWe offer Pacific citizens direct AUD → local currency transfers, on-chain wallets, and INDX yield. The fit with your subscriber base across the Pacific is clear.\n\nWould love to explore a pilot MOU.\n\nAJ — IN$DEX`,
  ramp: c => `Hi ${c.name.split(' ')[0]},\n\nIN$DEX needs a best-in-class AUD on/off ramp for Pacific corridors — ${c.name} is our first pick.\n\nWe're live with 244 screens, INDX token structure finalized on Solana (SPL, mint deployment pending), AUSTRAC VASP enrolment submitted, under assessment, and Solana integration ready. Our KYC Reliance feature means your verification stack covers our citizens without double KYC.\n\nHappy to discuss integration terms.\n\nAJ — IN$DEX`,
};
const OUTREACH_DEFAULT = c => `Hi ${c.name.split(' ')[0]},\n\nReaching out from IN$DEX — the Sovereign Digital Civilisation for the Pacific, built on Solana (SPL token, mint deployment pending). 244 screens. AUSTRAC VASP enrolment submitted, under assessment.\n\nWould love to explore how we can work together.\n\nAJ — IN$DEX Founder`;

function openOutreachDrafter() {
  if (!activeContact) return;
  const c = activeContact;
  const tpl = OUTREACH_TEMPLATES[c.type] || OUTREACH_DEFAULT;
  document.getElementById('outreachTarget').textContent = c.name + ' · ' + (PLAT_LABELS[c.platform] || c.platform);
  document.getElementById('outreachBody').textContent = tpl(c);
  document.getElementById('outreachOverlay').classList.add('active');
}
function closeOutreach() {
  document.getElementById('outreachOverlay').classList.remove('active');
}
function copyOutreach() {
  const text = document.getElementById('outreachBody').textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('📋 Draft copied to clipboard'));
  } else {
    showToast('📋 Select the text above to copy');
  }
}

// ── STALENESS INDICATOR ──
function getDaysSince(id) {
  const ts = localStorage.getItem('indx_fp_touch_' + id);
  if (!ts) return null;
  return Math.floor((Date.now() - parseInt(ts)) / (1000 * 60 * 60 * 24));
}

function staleBadge(id, stage) {
  if (stage === 'prospect' || stage === 'blocked') return '';
  const d = getDaysSince(id);
  if (d === null) return '<span class="stale-badge">never touched</span>';
  if (d >= 7) return `<span class="stale-badge">${d}d stale</span>`;
  if (d <= 1) return '<span class="fresh-badge">today</span>';
  return `<span class="fresh-badge">${d}d ago</span>`;
}

function updateStalenessAlert() {
  const stale = contacts.filter(c => {
    if (c.stage === 'prospect' || c.stage === 'blocked') return false;
    const d = getDaysSince(c.id);
    return d === null || d >= 7;
  });
  const el = document.getElementById('staleAlert');
  const body = document.getElementById('staleAlertBody');
  if (!el || !body) return;
  if (!stale.length) { el.classList.remove('active'); return; }
  el.classList.add('active');
  body.innerHTML = stale.slice(0, 6).map(c => {
    const d = getDaysSince(c.id);
    const stageLbl = STAGES.find(s => s.key === c.stage)?.label || c.stage;
    return `• <strong>${c.name}</strong> — ${d === null ? 'never contacted' : d + ' days since last touch'} <em>(${stageLbl})</em>`;
  }).join('<br>');
}

// ── GOD MODE PATCH: contactCard — inject staleness badge ──
const _origContactCard = contactCard;
contactCard = function(c) {
  const badge = staleBadge(c.id, c.stage);
  const base = _origContactCard(c);
  // inject badge after contact name
  return base.replace(
    `<div class="contact-name">${c.name}</div>`,
    `<div class="contact-name">${c.name}${badge}</div>`
  );
};

// ── GOD MODE PATCH: openDetail — render activity feed ──
const _origOpenDetail = openDetail;
openDetail = function(id) {
  _origOpenDetail(id);
  renderActivityFeed(id);
};

// ── WEIGHTED PIPELINE VALUE ──
function renderWeightedValue() {
  const existing = document.getElementById('gm_weighted');
  if (existing) existing.remove();
  const weighted = contacts.reduce((sum, c) => {
    if (!c.deal) return sum;
    return sum + c.deal * (STAGE_WEIGHTS[c.stage] || 0.1);
  }, 0);
  const raw = contacts.reduce((sum, c) => sum + (c.deal || 0), 0);
  const el = document.createElement('div');
  el.id = 'gm_weighted';
  el.className = 'weighted-stat';
  el.innerHTML = `<div class="weighted-icon">🎯</div><div class="weighted-body"><div class="weighted-label">Expected Pipeline Value</div><div class="weighted-val">$${Math.round(weighted).toLocaleString()}</div><div class="weighted-sub">vs $${Math.round(raw).toLocaleString()} raw — probability-weighted by stage</div></div>`;
  const banner = document.querySelector('.deal-banner');
  if (banner && banner.parentNode) banner.parentNode.insertBefore(el, banner.nextSibling);
}

// ── GOD MODE PATCH: renderSummary — add weighted value + staleness check ──
const _origRenderSummary = renderSummary;
renderSummary = function() {
  _origRenderSummary();
  renderWeightedValue();
  updateStalenessAlert();
};

// ── GOD MODE PATCH: renderPipeline — run staleness alert after re-render ──
const _origRenderPipeline = renderPipeline;
renderPipeline = function() {
  _origRenderPipeline();
  updateStalenessAlert();
};

renderSummary();
renderPipeline();

// Navigation helpers for converted history.back() / window.location.href handlers.
function goTo(url) { window.location.href = url; }
function goBack() { history.back(); }

// ── Delegated dispatcher ──────────────────────────────────────────────────
// Replaces inline on* attributes (CSP phase: no inline handlers).
// Markup carries data-<kind>action="fn" + data-<kind>args='[...]'. JSON args:
// "$this" = element, "$event" = event (currentTarget = matched element), "$value" = element.value.
// data-stop = event.stopPropagation() equivalent: ancestors' actions do not fire.
function indxDispatch(e, actionKey, argsKey, gate) {
  for (let el = e.target; el && el !== document; el = el.parentElement) {
    const name = el.dataset && el.dataset[actionKey];
    if (name) {
      const fn = window[name];
      let args = null;
      if (typeof fn === 'function') {
        try { args = el.dataset[argsKey] ? JSON.parse(el.dataset[argsKey]) : []; } catch (_) { args = null; }
      }
      if (args && (!gate || gate(e))) {
                const ev = new Proxy(e, { get(t, k) { if (k === 'currentTarget') return el; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
        fn.apply(el, args.map(function (a) { return a === '$this' ? el : a === '$event' ? ev : a === '$value' ? el.value : a; }));
      }
    }
    if (e.type === 'click' && el.dataset && el.dataset.stop !== undefined) break;
    if (e.cancelBubble) break;
  }
}
const indxEnter = function (e) { return e.key === 'Enter'; };
document.addEventListener('click', function (e) { indxDispatch(e, 'action', 'args'); });
document.addEventListener('input', function (e) { indxDispatch(e, 'inputAction', 'inputArgs'); });
document.addEventListener('change', function (e) { indxDispatch(e, 'changeAction', 'changeArgs'); });
document.addEventListener('keydown', function (e) { indxDispatch(e, 'enterAction', 'enterArgs', indxEnter); });
