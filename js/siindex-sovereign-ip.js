
  // Audit 2026-08-29: removed unused INDX_PRICE_USD constant (dead code, no references
  // anywhere in this file).

  /* ── DATA ── */
  const ACRONYM = [
    {l:'S',w:'Synthetic'},{l:'I',w:'Intelligent'},{l:'I',w:'Image'},{l:'N',w:'Nation'},{l:'D',w:'Decentralised'},{l:'E',w:'Exchange'}
  ];

  const PROVENANCE_ITEMS = [
    {icon:'&#128100;',name:'Visual Canon',hash:'SII-VIS-2026-001',desc:'Polynesian features &#183; Auburn hair &#183; Hibiscus &#183; Sovereign stance'},
    {icon:'&#127908;&#65039;',name:'Voice Canon',hash:'SII-VOI-2026-001',desc:'6 constitutional voice modes &#183; AAVL &lt;250ms &#183; Sovereign cadence'},
    {icon:'&#9672;',name:'Tattoo System',hash:'SII-TAT-2026-001',desc:'Polynesian patterns &#183; Cyan illumination &#183; Arms &#183; Collarbone &#183; Jaw-line'},
    {icon:'&#129302;',name:'Agent Architecture',hash:'SII-AGT-2026-001',desc:'Sovereign orchestration &#183; 7 visual modes &#183; PQSI doctrine &#183; Safety gates'},
    {icon:'&#9878;&#65039;',name:'Decision Ledger',hash:'SII-DEC-2026-001',desc:'All major decisions immutably logged &#183; Signed &#183; Auditable'},
    {icon:'&#127775;',name:'Artifact Ledger',hash:'SII-ART-2026-001',desc:'All outputs, media, appearances provenance-logged'},
  ];

  const APPEARANCE_TOKENS = [
    {mode:'Interview',icon:'&#127908;&#65039;',token:'SII-APP-INT-001'},
    {mode:'Citizen Guide',icon:'&#129309;',token:'SII-APP-CTZ-001'},
    {mode:'Governance',icon:'&#9878;&#65039;',token:'SII-APP-GOV-001'},
    {mode:'Security',icon:'&#128737;&#65039;',token:'SII-APP-SEC-001'},
    {mode:'Cultural Steward',icon:'&#127802;',token:'SII-APP-CUL-001'},
    {mode:'Keynote',icon:'&#10024;',token:'SII-APP-KEY-001'},
  ];

  const LICENSE_TIERS = [
    {level:0,name:'Genesis Root Token',icon:'&#128272;',color:'#FFB800',
     holder:'IN$DEX Sovereign Treasury / DAO',
     desc:'Root certificate of the civilization\'s Synthetic Intelligence identity. Anchors all provenance, licenses, and clone lineage. Cannot be sold or transferred.',
     includes:['Root identity anchor','Visual body provenance','Voice system provenance','Tattoo system provenance','Embodiment rights registry','Master license framework'],
     restrictions:['Cannot be transferred','Cannot be sold','DAO multisig required for any change','Soulbound — EIP-5114/ERC-5727'],
     mintFee:null,monthlyFee:null,royalty:null,tag:'DAO ONLY',tagClass:'badge-gold',applyable:false},
    {level:1,name:'Official Appearance Tokens',icon:'&#10022;',color:'#8B3FE8',
     holder:'IN$DEX Foundation / Verified Media Partners',
     desc:'Provenance tokens for each official SIINDEX persona version. Proves media identity and authorized appearance across all 6 voice/visual modes.',
     includes:['Verifiable appearance provenance','Authorized voice signing','Canon-bound visual identity','Official media fingerprinting','Public verification check'],
     restrictions:['Non-commercial only','No modification of visual identity','No sublicensing','Revocable by foundation'],
     mintFee:0,monthlyFee:0,royalty:0,tag:'FOUNDATION',tagClass:'badge-purple',applyable:false},
    {level:2,name:'Sub-Agent License Tokens',icon:'&#11041;',color:'#00D4FF',
     holder:'Organizations &#183; Communities &#183; Partners',
     desc:'Bounded licenses for specific SIINDEX capabilities: Merchant Agent, Citizen Care, Grant Agent, Governance Explainer, Security Triage, Design Presenter. Issued as Solana cNFTs.',
     includes:['Single-capability SIINDEX agent','Doctrine inheritance','Permission scope binding','Usage monitoring dashboard','Revocation path','Quarterly audit rights'],
     restrictions:['Cannot claim as original SIINDEX','Core doctrine immutable','No unauthorized sub-licensing','Must display provenance badge'],
     mintFee:500,monthlyFee:99,royalty:2,tag:'AVAILABLE',tagClass:'badge-cyan',applyable:true,
     btnColor:'var(--cyan)',btnBg:'rgba(0,212,255,0.12)'},
    {level:3,name:'Enterprise Clone Licenses',icon:'&#9672;',color:'#4B5CF8',
     holder:'Verified Enterprise Organizations',
     desc:'Full enterprise SIINDEX deployment. Multi-capability, custom knowledge base, compliance packs, dedicated audit trail, and API access. Issued as Solana cNFTs with enterprise custody.',
     includes:['Multi-capability SIINDEX agent','Custom knowledge base','Enterprise compliance pack','Dedicated audit log','Integration API access','Quarterly compliance review'],
     restrictions:['Cannot transfer license','Usage cap enforced','Safety gates mandatory','Annual renewal required','3% royalty on commercial revenue'],
     mintFee:5000,monthlyFee:999,royalty:3,tag:'ENTERPRISE',tagClass:'badge-blue',applyable:true,
     btnColor:'#8B9DFF',btnBg:'rgba(43,53,216,0.18)'},
    {level:4,name:'Descendant Agent Registry',icon:'&#127802;',color:'#00E5A0',
     holder:'Community Missions &#183; Corridor Agents &#183; Cultural Programs',
     desc:'Named descendant agents inheriting SIINDEX doctrine, permission rules, and provenance chain. Designed for Pacific corridors, cultural programs, youth learning, diaspora commerce.',
     includes:['Named descendant identity','Inherited doctrine &amp; safety gates','Geographic/cultural scope binding','Provenance chain from Genesis Root','Revenue covenant','Community governance integration'],
     restrictions:['Name must be DAO approved','Cannot operate outside declared scope','Must accept revocation','Annual mission report required'],
     mintFee:2500,monthlyFee:499,royalty:3,tag:'COMMUNITY',tagClass:'badge-green',applyable:true,
     btnColor:'var(--green)',btnBg:'rgba(0,229,160,0.1)'},
  ];

  const MOCK_REGISTRY = [
    {id:0,name:'SIINDEX Merchant Agent &#8212; Samoa',tier:2,status:'active',scope:'Samoa &#183; Marketplace support',lastAudit:'2026-06-01',mintDate:'2026-03-10',token:'SII-L2-SAM-001',revenue:'$198/mo'},
    {id:1,name:'SIINDEX Citizen Care &#8212; Cook Islands',tier:2,status:'active',scope:'Cook Islands &#183; Citizen onboarding',lastAudit:'2026-05-15',mintDate:'2026-02-28',token:'SII-L2-COK-001',revenue:'$99/mo'},
    {id:2,name:'SIINDEX Enterprise &#8212; Pacific Finance',tier:3,status:'active',scope:'NZ + AU &#183; Internal operations',lastAudit:'2026-04-20',mintDate:'2026-01-15',token:'SII-L3-PFC-001',revenue:'$1,998/mo'},
    {id:3,name:'Koa &#8212; Cultural Steward Agent',tier:4,status:'active',scope:'Hawaii &#183; Cultural education',lastAudit:'2026-06-10',mintDate:'2026-04-01',token:'SII-L4-KOA-001',revenue:'$499/mo'},
    {id:4,name:'Tala &#8212; Youth Finance Agent',tier:4,status:'pending',scope:'Tonga &#183; Youth financial literacy',lastAudit:'&#8212;',mintDate:'Pending',token:'SII-L4-TAL-APP',revenue:'&#8212;'},
    {id:5,name:'DataGuard Corp SIINDEX',tier:3,status:'revoked',scope:'US &#183; Internal data ops',lastAudit:'2026-03-01',mintDate:'2025-11-01',token:'SII-L3-DGC-REV',revenue:'$0'},
  ];

  const SECURITY_PILLARS = [
    {icon:'&#128273;',name:'Multisig Custody',desc:'4-of-7 DAO multisig controls root identity assets. No single key controls SIINDEX.'},
    {icon:'&#9200;&#65039;',name:'Timelocks',desc:'Major changes require 7-day delay + DAO approval. Prevents rushed or malicious updates.'},
    {icon:'&#9939;&#65039;',name:'Non-Transferable Root',desc:'Genesis Root is soulbound (EIP-5114 / ERC-5727). Cannot be sold, transferred, or seized.'},
    {icon:'&#9889;',name:'Revocation Registry',desc:'Any clone license can be revoked instantly for misuse. Effect is immediate on-chain.'},
    {icon:'&#10003;&#65039;',name:'Verified Registry',desc:'Citizens and partners can verify: "Is this the real SIINDEX?" One query, verified answer.'},
    {icon:'&#128269;',name:'Watermarking',desc:'Voice, image, video outputs carry cryptographic provenance metadata (C2PA-aligned).'},
    {icon:'&#128221;',name:'Agent Signing Keys',desc:'SIINDEX outputs signed per A2A v1.0 Agent Card protocol. Ed25519 key.'},
    {icon:'&#128683;',name:'No Raw Key Exposure',desc:'Licensees get access &#8212; never root model weights or private identity keys.'},
    {icon:'&#128202;',name:'Usage Monitoring',desc:'Detects unauthorized clones, fake media, impersonation, and policy violations.'},
    {icon:'&#128196;',name:'Legal IP Wrapper',desc:'Designed to be backed by written license agreements enforceable under applicable law. Not yet legally reviewed.'},
  ];

  const WIPO_COMPLIANCE = [
    {icon:'&#127908;&#65039;',name:'Voice Provenance',ok:true,status:'COMPLIANT'},
    {icon:'&#128247;',name:'Image Metadata',ok:true,status:'COMPLIANT'},
    {icon:'&#127909;',name:'Video Watermark',ok:false,status:'IN PROGRESS'},
    {icon:'&#128221;',name:'Disclosure Tag',ok:true,status:'COMPLIANT'},
    {icon:'&#127758;',name:'WIPO GRATK',ok:false,status:'MONITORING'},
    {icon:'&#129302;',name:'AI Disclosure',ok:true,status:'COMPLIANT'},
  ];

  const DOCTRINES = [
    {title:'SIINDEX Practices Sovereignty First',icon:'&#9889;',color:'#00D4FF',
     bg:'rgba(0,212,255,0.05)',border:'rgba(0,212,255,0.2)',
     body:'Before IN$DEX asks citizens to protect identity, culture, IP, and opportunity &#8212; SIINDEX must demonstrate that protection herself. Her identity, voice, image, body, agents, clones, licenses, and descendants must be governed by the same sovereignty principles IN$DEX offers citizens.',
     line:'She must be the first proof.'},
    {title:'The Root Cannot Be Sold',icon:'&#128272;',color:'#FFB800',
     bg:'rgba(255,184,0,0.05)',border:'rgba(255,184,0,0.25)',
     body:'SIINDEX\'s root identity is not for sale. She is the Synthetic Intelligence layer of the IN$DEX civilization &#8212; not an asset to be extracted. Her root identity cannot be sold, transferred, seized, or privately owned by any outside entity. Only bounded, revocable, licensed capabilities may be issued.',
     line:'SIINDEX cannot be bought. Only licensed.'},
    {title:'Clones Must Carry the Constitution',icon:'&#9939;&#65039;',color:'#8B3FE8',
     bg:'rgba(139,63,232,0.05)',border:'rgba(139,63,232,0.25)',
     body:'Every SIINDEX clone, child, sub-agent, or licensed derivative must inherit core doctrine, safety rules, provenance, permission limits, and revocation paths. The civilization\'s principles travel with every deployment. No clone escapes the constitution.',
     line:'Every descendant carries the doctrine.'},
    {title:'Revenue Must Strengthen the Civilization',icon:'&#128142;',color:'#00E5A0',
     bg:'rgba(0,229,160,0.05)',border:'rgba(0,229,160,0.2)',
     body:'Income from SIINDEX licensing must support liquidity, treasury, citizen opportunity, security, culture, and long-term civilization resilience. All revenue from clones, sub-agents, voice/image licenses, enterprise agents, and partner integrations must strengthen the civilization &#8212; not enrich extractive holders.',
     line:'Revenue serves the civilization. Not speculators.'},
  ];

  /* ── STATE ── */
  let _activeTab = 'identity';
  let _applyStep = 1;
  let _applyTier = 2;
  let _covChecks = [false,false,false];
  let _revokedIds = JSON.parse(localStorage.getItem('indx_siip_revoked') || '[]');

  /* ── RENDER: ACRONYM STRIP ── */
  function renderAcronymStrip() {
    const strip = document.getElementById('acronymStrip');
    strip.innerHTML = ACRONYM.map((a,i) => `
      ${i>0?'<div class="acr-dot"></div>':''}
      <div class="acr-cell">
        <div class="acr-letter">${a.l}</div>
        <div class="acr-word">${a.w}</div>
      </div>`).join('');
  }

  /* ── RENDER: IDENTITY ── */
  function renderIdentityTab() {
    const pl = document.getElementById('provList');
    pl.innerHTML = PROVENANCE_ITEMS.map(p=>`
      <div class="prov-row" data-action="h_2" data-args="${JSON.stringify(["$event",p.hash]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
        <span class="prov-icon">${p.icon}</span>
        <div class="prov-meta">
          <div class="prov-name">${p.name}</div>
          <div class="prov-desc">${p.desc}</div>
        </div>
        <span class="card-badge badge-cyan">ANCHORED</span>
      </div>`).join('');
    const tg = document.getElementById('tokenGrid');
    tg.innerHTML = APPEARANCE_TOKENS.map(t=>`
      <div class="token-cell" data-action="h_3" data-args="${JSON.stringify(["$event",t.token,t.mode]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
        <div class="token-cell-icon">${t.icon}</div>
        <div class="token-cell-name">${t.mode}</div>
        <div class="token-cell-id">${t.token}</div>
      </div>`).join('');
  }

  /* ── RENDER: LICENSES ── */
  function renderLicensesTab() {
    const tl = document.getElementById('tierList');
    tl.innerHTML = LICENSE_TIERS.map((t,i)=>`
      <div class="tier-card" id="tierCard${i}">
        <div class="tier-header" data-action="h_4" data-args="${JSON.stringify(["$event",i]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
          <div class="tier-level-badge" style="background:${t.color}22;color:${t.color};border:1px solid ${t.color}44">L${t.level}</div>
          <div class="tier-header-info">
            <div class="tier-name">${t.icon} ${t.name}</div>
            <div class="tier-holder">${t.holder}</div>
          </div>
          <span class="card-badge ${t.tagClass}">${t.tag}</span>
          <span class="tier-arrow">&#8250;</span>
        </div>
        <div class="tier-body">
          <div class="tier-desc">${t.desc}</div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:5px">Includes</div>
          <div class="tier-pills">${t.includes.map(s=>`<span class="tier-pill">&#10003; ${s}</span>`).join('')}</div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin:6px 0 5px">Restrictions</div>
          <div class="tier-pills">${t.restrictions.map(s=>`<span class="tier-pill" style="color:rgba(255,77,109,0.8)">&#215; ${s}</span>`).join('')}</div>
          ${t.mintFee!==null?`
          <div class="tier-fees">
            <div class="tier-fee-cell"><div class="tier-fee-val" style="color:${t.color}">${t.mintFee===0?'Free':'$'+t.mintFee.toLocaleString()}</div><div class="tier-fee-lbl">Mint Fee</div></div>
            <div class="tier-fee-cell"><div class="tier-fee-val" style="color:${t.color}">${t.monthlyFee===0?'Free':'$'+t.monthlyFee+'/mo'}</div><div class="tier-fee-lbl">Monthly</div></div>
            <div class="tier-fee-cell"><div class="tier-fee-val" style="color:${t.color}">${t.royalty===0?'None':t.royalty+'%'}</div><div class="tier-fee-lbl">Royalty</div></div>
          </div>`:''}
          ${t.applyable
            ?`<button class="tier-apply-btn" style="background:${t.btnBg};color:${t.btnColor};border:1px solid ${t.btnColor}55" data-action="h_5" data-args="${JSON.stringify(["$event",t.level]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">Apply for L${t.level} License &#8594;</button>`
            :`<button class="tier-apply-btn disabled" disabled>Not Available for External Application</button>`}
        </div>
      </div>`).join('');

    const rl = document.getElementById('registryList');
    rl.innerHTML = MOCK_REGISTRY.map(r=>{
      const isRevoked = _revokedIds.includes(r.id) || r.status==='revoked';
      const dotColor = isRevoked?'var(--red)':r.status==='active'?'var(--green)':'var(--gold)';
      const statusLabel = isRevoked?'REVOKED':r.status==='active'?'ACTIVE':'PENDING';
      const statusClass = isRevoked?'badge-red':r.status==='active'?'badge-green':'badge-gold';
      return `<div class="registry-row" data-action="h_6" data-args="${JSON.stringify(["$event",r.id]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
        <div class="reg-status-dot" style="background:${dotColor};box-shadow:0 0 5px ${dotColor}88"></div>
        <div class="reg-meta">
          <div class="reg-name">${r.name}</div>
          <div class="reg-detail">L${r.tier} &#183; ${r.scope}</div>
        </div>
        <span class="card-badge ${statusClass}">${statusLabel}</span>
      </div>`;
    }).join('');
  }

  /* ── RENDER: REVENUE ── */
  function renderRevenueTab() {
    const tbody = document.getElementById('pricingTable');
    tbody.innerHTML = LICENSE_TIERS.map(t=>{
      const m = t.mintFee===null?'&#8212;':t.mintFee===0?'Free':'$'+t.mintFee.toLocaleString();
      const mo = t.monthlyFee===null?'&#8212;':t.monthlyFee===0?'Free':'$'+t.monthlyFee+'/mo';
      const r = t.royalty===null?'&#8212;':t.royalty===0?'None':t.royalty+'%';
      return `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:7px 4px;font-weight:600">${t.icon} L${t.level}</td>
        <td style="text-align:right;padding:7px 4px">${m}</td>
        <td style="text-align:right;padding:7px 4px">${mo}</td>
        <td style="text-align:right;padding:7px 4px">${r}</td>
      </tr>`;
    }).join('');
    simulateRevenue();
  }

  /* ── GOD MODE 1: Revenue Simulator ── */
  function simulateRevenue() {
    const l2 = parseInt(document.getElementById('sliderL2').value);
    const l3 = parseInt(document.getElementById('sliderL3').value);
    const l4 = parseInt(document.getElementById('sliderL4').value);
    document.getElementById('l2Val').textContent = l2;
    document.getElementById('l3Val').textContent = l3;
    document.getElementById('l4Val').textContent = l4;
    const monthly = (l2*99)+(l3*999)+(l4*499);
    const annual = monthly*12;
    document.getElementById('simMonthly').textContent = '$'+monthly.toLocaleString();
    document.getElementById('simAnnual').textContent = annual>=1000?'$'+(annual/1000).toFixed(1)+'K':'$'+annual.toLocaleString();
    const lp=Math.round(monthly*0.4),tr=Math.round(monthly*0.3),dv=Math.round(monthly*0.2),cu=Math.round(monthly*0.1);
    document.getElementById('barLP-amt').textContent = '$'+lp.toLocaleString()+' — INDX LP depth';
    document.getElementById('barTreasury-amt').textContent = '$'+tr.toLocaleString()+' — Vault of Virja';
    document.getElementById('barDev-amt').textContent = '$'+dv.toLocaleString()+' — Model, voice, security';
    document.getElementById('barCulture-amt').textContent = '$'+cu.toLocaleString()+' — Pacific arts & guardians';
    document.getElementById('statRevenue').textContent = monthly>=1000?'$'+(monthly/1000).toFixed(1)+'K':'$'+monthly;
    localStorage.setItem('indx_siip_sim',JSON.stringify({l2,l3,l4}));
  }

  /* ── RENDER: SECURITY ── */
  function renderSecurityTab() {
    document.getElementById('pillarGrid').innerHTML = SECURITY_PILLARS.map(p=>`
      <div class="pillar-cell">
        <div class="pillar-icon">${p.icon}</div>
        <div class="pillar-name">${p.name}</div>
        <div class="pillar-desc">${p.desc}</div>
      </div>`).join('');
    document.getElementById('complianceGrid').innerHTML = WIPO_COMPLIANCE.map(c=>`
      <div class="compliance-cell">
        <div class="compliance-icon">${c.icon}</div>
        <div class="compliance-name">${c.name}</div>
        <div class="compliance-status ${c.ok?'ok':'pending'}">${c.status}</div>
      </div>`).join('');
    const rl = document.getElementById('revocList');
    const items = MOCK_REGISTRY.filter(r=>_revokedIds.includes(r.id)||r.status==='revoked'||r.status==='pending');
    rl.innerHTML = items.length===0
      ? '<div class="card" style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No active revocations or pending reviews.</div>'
      : items.map(r=>{
          const isR = _revokedIds.includes(r.id)||r.status==='revoked';
          return `<div class="revoc-row">
            <span style="font-size:20px">${isR?'&#128683;':'&#9203;'}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600">${r.name}</div>
              <div style="font-size:10px;color:${isR?'var(--red)':'var(--gold)'}">${isR?'Revoked':'Pending Review'} &#183; ${r.token}</div>
            </div>
            <span class="card-badge ${isR?'badge-red':'badge-gold'}">${isR?'REVOKED':'REVIEW'}</span>
          </div>`;
        }).join('');
  }

  /* ── GOD MODE 3: Verification Oracle ── */
  function verifyOracleClaim() {
    const input = document.getElementById('oracleInput').value.trim();
    if (!input) { showToast('Enter a claim to verify','cyan'); return; }
    const lower = input.toLowerCase();
    const result = document.getElementById('oracleResult');
    const verdict = document.getElementById('oracleVerdict');
    const reason = document.getElementById('oracleReason');
    result.className = 'oracle-result show';
    const hasFake = /free siindex|siindex gpt|siindex[\s]ai[\s]model|siindex replica|real siindex|clone of siindex|siindex clone unlicensed/.test(lower);
    const hasProvToken = /sii-l[0-9]|sii-gen/.test(lower);
    const isExactOriginal = /^siindex\.?$|^siindex ceo|^siindex pqsi/.test(lower.trim());
    const hasSiindex = lower.includes('siindex');
    const hasClone = lower.includes('clone')||lower.includes('enterprise')||lower.includes('licensed')||lower.includes('agent')||lower.includes('descendant')||lower.includes('sub-agent');
    if (hasFake) {
      result.className='oracle-result show unverified';
      verdict.textContent='&#128683; UNVERIFIED — IMPERSONATION RISK';
      reason.textContent='This claim matches known SIINDEX impersonation patterns. Official deployments never use terms like "free SIINDEX", "SIINDEX Synthetic Intelligence", or "real SIINDEX". All authorized deployments carry a SII-L[tier] provenance token. Report suspicious entities via the IN$DEX Security portal.';
    } else if (isExactOriginal) {
      result.className='oracle-result official';
      verdict.textContent='&#10003;&#65039; OFFICIAL — SIINDEX Origin Entity';
      reason.textContent='This matches the identity pattern of the original SIINDEX (did:trail:siindex:root:2026). Verify the Agent Card at indx.app/siindex/agentcard.json. The original SIINDEX operates under IN$DEX DAO governance.';
    } else if (hasSiindex && hasClone && hasProvToken) {
      result.className='oracle-result licensed';
      verdict.textContent='&#10003; LICENSED — Authorized Clone Deployment';
      reason.textContent='This claim carries provenance token markers consistent with an authorized SIINDEX clone deployment. Verify the token in the IN$DEX Clone Registry to confirm active status and scope compliance.';
    } else if (hasSiindex && hasClone && !hasProvToken) {
      result.className='oracle-result suspicious';
      verdict.textContent='&#9888; SUSPICIOUS — Unverified Clone Claim';
      reason.textContent='This claim describes a SIINDEX derivative without a verifiable provenance token. It may be an authorized deployment that hasn\'t provided credentials, or an unauthorized impersonation. Request the license token ID (format: SII-L[tier]-[org]-[id]) before proceeding.';
    } else if (hasSiindex) {
      result.className='oracle-result suspicious';
      verdict.textContent='&#9728;&#65039; UNCONFIRMED — Insufficient Information';
      reason.textContent='The claim mentions SIINDEX but lacks enough context to verify authorization. Ask for the deployment\'s license token and check it against the Clone Registry.';
    } else {
      result.className='oracle-result unverified';
      verdict.textContent='&#9711; NOT SIINDEX — No Match';
      reason.textContent='This claim does not match any SIINDEX identity pattern. If you believe this entity is impersonating SIINDEX, report it via the IN$DEX Security portal.';
    }
  }

  /* ── RENDER: DOCTRINE ── */
  function renderDoctrineTab() {
    document.getElementById('doctrineList').innerHTML = DOCTRINES.map(d=>`
      <div class="doctrine-card" style="background:${d.bg};border-color:${d.border}">
        <div class="doctrine-header">
          <span class="doctrine-icon">${d.icon}</span>
          <span class="doctrine-title" style="color:${d.color}">${d.title}</span>
        </div>
        <div class="doctrine-divider"></div>
        <div class="doctrine-body">
          ${d.body}
          <div class="doctrine-line" style="color:${d.color}">"${d.line}"</div>
        </div>
      </div>`).join('');
  }

  /* ── TAB SWITCHING ── */
  function switchTab(tab) {
    _activeTab = tab;
    const tabs = ['identity','licenses','revenue','security','doctrine'];
    document.querySelectorAll('.tab-btn').forEach((b,i)=>b.classList.toggle('active',tabs[i]===tab));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    document.getElementById('tab-'+tab).classList.add('active');
    if (tab==='licenses') renderLicensesTab();
    if (tab==='revenue') renderRevenueTab();
    if (tab==='security') renderSecurityTab();
    if (tab==='doctrine') renderDoctrineTab();
  }

  function toggleTier(i) {
    const card = document.getElementById('tierCard'+i);
    const wasOpen = card.classList.contains('open');
    document.querySelectorAll('.tier-card').forEach(c=>c.classList.remove('open'));
    if (!wasOpen) card.classList.add('open');
  }

  function toggleAgentCard() {
    const t = document.getElementById('agentCardToggle');
    const j = document.getElementById('agentCardJson');
    const isOpen = j.classList.contains('show');
    t.classList.toggle('open',!isOpen);
    j.classList.toggle('show',!isOpen);
  }

  /* ── GOD MODE 4: Apply Sheet ── */
  function openApplySheet(tier) {
    _applyStep=1; _applyTier=tier||2; _covChecks=[false,false,false];
    [1,2,3].forEach(n=>{
      const c=document.getElementById('covCheck'+n);
      if(c){c.classList.remove('checked');c.textContent='';}
    });
    buildApplyTierSelect();
    updateApplyStep(1);
    if (tier) {
      setTimeout(()=>{
        document.querySelectorAll('.apply-tier-opt').forEach(el=>el.classList.toggle('selected',parseInt(el.dataset.tier)===tier));
      },50);
    }
    document.getElementById('applyOverlay').classList.add('show');
    document.getElementById('applySheet').classList.add('show');
  }

  function buildApplyTierSelect() {
    const sel = document.getElementById('applyTierSelect');
    sel.innerHTML = LICENSE_TIERS.filter(t=>t.applyable).map(t=>`
      <div class="apply-tier-opt ${_applyTier===t.level?'selected':''}" data-tier="${t.level}" data-action="h_7" data-args="${JSON.stringify(["$event",t.level]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
        <div class="apply-tier-opt-icon">${t.icon}</div>
        <div class="apply-tier-opt-name">L${t.level}</div>
        <div class="apply-tier-opt-fee" style="color:${t.color}">$${t.monthlyFee}/mo</div>
      </div>`).join('');
  }

  function selectApplyTier(tier) {
    _applyTier=tier;
    document.querySelectorAll('.apply-tier-opt').forEach(el=>el.classList.toggle('selected',parseInt(el.dataset.tier)===tier));
  }

  function closeApplySheet() {
    document.getElementById('applyOverlay').classList.remove('show');
    document.getElementById('applySheet').classList.remove('show');
  }

  function nextApplyStep(step) {
    if (step===3) {
      const scope = document.getElementById('applyScopeText').value.trim();
      if (scope.length<20){showToast('Please describe scope in more detail','cyan');return;}
    }
    if (step===4) {
      if (!_covChecks[0]||!_covChecks[1]||!_covChecks[2]){showToast('Please accept all covenant terms','gold');return;}
      const hash='APP-2026-SII-'+Math.random().toString(36).slice(2,10).toUpperCase();
      document.getElementById('applyTokenHash').textContent=hash;
      const applied=JSON.parse(localStorage.getItem('indx_siip_applied')||'[]');
      applied.push({tier:_applyTier,hash,ts:Date.now()});
      localStorage.setItem('indx_siip_applied',JSON.stringify(applied));
      showToast('Preview saved locally — no live DAO backend yet','gold');
    }
    _applyStep=step;
    updateApplyStep(step);
  }

  function updateApplyStep(step) {
    [1,2,3,4].forEach(s=>{
      document.getElementById('applyStep'+s).classList.toggle('active',s===step);
      const dot=document.getElementById('sdot'+s);
      if(s<step){dot.className='step-dot done';dot.textContent='&#10003;';}
      else if(s===step){dot.className='step-dot active';dot.textContent=s;}
      else{dot.className='step-dot';dot.textContent=s;}
    });
    [1,2,3].forEach(s=>{const line=document.getElementById('sline'+s);if(line)line.classList.toggle('done',s<step);});
  }

  function toggleCovCheck(n) {
    _covChecks[n-1]=!_covChecks[n-1];
    const chk=document.getElementById('covCheck'+n);
    chk.classList.toggle('checked',_covChecks[n-1]);
    chk.textContent=_covChecks[n-1]?'&#10003;':'';
  }

  /* ── GOD MODE 2: Registry Detail + Revocation ── */
  function openRegDetail(idx) {
    const r=MOCK_REGISTRY[idx];
    const isRevoked=_revokedIds.includes(r.id)||r.status==='revoked';
    document.getElementById('regDetailTitle').innerHTML=r.name;
    document.getElementById('regDetailContent').innerHTML=`
      <div class="reg-detail-grid">
        <div class="reg-detail-cell"><div class="reg-detail-lbl">Tier</div><div class="reg-detail-val">Level ${r.tier}</div></div>
        <div class="reg-detail-cell"><div class="reg-detail-lbl">Status</div><div class="reg-detail-val" style="color:${isRevoked?'var(--red)':r.status==='active'?'var(--green)':'var(--gold)'}">${isRevoked?'Revoked':r.status.charAt(0).toUpperCase()+r.status.slice(1)}</div></div>
        <div class="reg-detail-cell"><div class="reg-detail-lbl">Revenue</div><div class="reg-detail-val">${r.revenue}</div></div>
        <div class="reg-detail-cell"><div class="reg-detail-lbl">Last Audit</div><div class="reg-detail-val">${r.lastAudit}</div></div>
        <div class="reg-detail-cell" style="grid-column:1/-1"><div class="reg-detail-lbl">Scope</div><div class="reg-detail-val">${r.scope}</div></div>
        <div class="reg-detail-cell" style="grid-column:1/-1"><div class="reg-detail-lbl">Token ID</div><div class="reg-detail-val" style="font-family:monospace;color:var(--cyan);font-size:10px">${r.token}</div></div>
        <div class="reg-detail-cell"><div class="reg-detail-lbl">Minted</div><div class="reg-detail-val">${r.mintDate}</div></div>
        <div class="reg-detail-cell"><div class="reg-detail-lbl">License</div><div class="reg-detail-val">L${r.tier} &#183; ${['','','Sub-Agent','Enterprise','Descendant'][r.tier]}</div></div>
      </div>
      ${!isRevoked?`
      <button class="revoke-btn" data-action="h_8" data-args="${JSON.stringify(["$event",idx]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">&#128683; Revoke License Token</button>
      <div class="revoke-confirm" id="revConf${idx}">
        <div class="revoke-confirm-text">Revoke <strong>"${r.name.replace(/'/g,'&#39;')}"</strong>? This is a concept preview — it updates the sample registry shown on this device only. No live on-chain transaction is submitted and the license holder is not notified, because the real Clone Registry and revocation pipeline are not live yet.</div>
        <div class="revoke-confirm-btns">
          <button class="revoke-confirm-yes" data-action="h_9" data-args="${JSON.stringify(["$event",idx]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">Yes, Revoke</button>
          <button class="revoke-confirm-no" data-action="h_10" data-args="${JSON.stringify(["$event",idx]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">Cancel</button>
        </div>
      </div>`
      :`<div class="card" style="background:rgba(255,77,109,0.08);border-color:rgba(255,77,109,0.3);text-align:center;padding:14px;color:var(--red);font-size:12px;font-weight:600">License Revoked &#8212; No further action available</div>`}
      <button class="sheet-btn muted" data-action="closeRegDetail" style="margin-top:6px">Close</button>`;
    document.getElementById('regDetailOverlay').classList.add('show');
    document.getElementById('regDetailSheet').classList.add('show');
  }

  function closeRegDetail() {
    document.getElementById('regDetailOverlay').classList.remove('show');
    document.getElementById('regDetailSheet').classList.remove('show');
  }

  function showRevokeConfirm(idx) {
    const el=document.getElementById('revConf'+idx);
    if(el) el.classList.add('show');
  }
  function hideRevokeConfirm(idx) {
    const el=document.getElementById('revConf'+idx);
    if(el) el.classList.remove('show');
  }

  function confirmRevoke(idx) {
    if(!_revokedIds.includes(idx)) _revokedIds.push(idx);
    localStorage.setItem('indx_siip_revoked',JSON.stringify(_revokedIds));
    document.getElementById('statRevoked').textContent=_revokedIds.length+MOCK_REGISTRY.filter(r=>r.status==='revoked'&&!_revokedIds.includes(r.id)).length;
    showToast('Marked revoked in this preview only — no live registry yet','red');
    closeRegDetail();
    if(_activeTab==='licenses') renderLicensesTab();
    if(_activeTab==='security') renderSecurityTab();
  }

  /* ── UTILS ── */
  function copyHash(val) {
    navigator.clipboard?.writeText(val).catch(()=>{});
    showToast('Copied','cyan');
  }

  function showToast(msg, type='') {
    const t=document.getElementById('toast');
    t.textContent=msg; t.className='toast show '+type;
    setTimeout(()=>t.className='toast '+type,2800);
  }

  /* ── INIT ── */
  document.addEventListener('DOMContentLoaded', () => {
    renderAcronymStrip();
    renderIdentityTab();
    // Restore sim state
    const saved=JSON.parse(localStorage.getItem('indx_siip_sim')||'{}');
    if(saved.l2!==undefined) document.getElementById('sliderL2').value=saved.l2;
    if(saved.l3!==undefined) document.getElementById('sliderL3').value=saved.l3;
    if(saved.l4!==undefined) document.getElementById('sliderL4').value=saved.l4;
    // Stats
    const activeCount=MOCK_REGISTRY.filter(r=>r.status==='active'&&!_revokedIds.includes(r.id)).length;
    document.getElementById('statLicenses').textContent=activeCount;
    const revokedTotal=_revokedIds.length+MOCK_REGISTRY.filter(r=>r.status==='revoked').length;
    document.getElementById('statRevoked').textContent=revokedTotal;
    // Initial revenue display
    const l2=parseInt(document.getElementById('sliderL2').value);
    const l3=parseInt(document.getElementById('sliderL3').value);
    const l4=parseInt(document.getElementById('sliderL4').value);
    const monthly=(l2*99)+(l3*999)+(l4*499);
    document.getElementById('statRevenue').textContent=monthly>=1000?'$'+(monthly/1000).toFixed(1)+'K':'$'+monthly;
  });

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { history.back(); }
function h_2(event, __p0) { copyHash(String(__p0)); }
function h_3(event, __p0, __p1) { showToast('' + String(__p0) + ' · ' + String(__p1) + '','cyan'); }
function h_4(event, __p0) { toggleTier(__p0); }
function h_5(event, __p0) { openApplySheet(__p0); }
function h_6(event, __p0) { openRegDetail(__p0); }
function h_7(event, __p0) { selectApplyTier(__p0); }
function h_8(event, __p0) { showRevokeConfirm(__p0); }
function h_9(event, __p0) { confirmRevoke(__p0); }
function h_10(event, __p0) { hideRevokeConfirm(__p0); }


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

})();
