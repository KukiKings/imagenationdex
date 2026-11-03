
    // AUDIT 2026-09-09: removed unused const INDX_PRICE_USD = 0.24 (dead fabricated-value
    // landmine — no live INDX price feed exists; nothing in this file referenced it).
    const PASSPORT_KEY = 'indx_brain_passports';
    const citizenName = sessionStorage.getItem('citizen_name') || '';

    let currentCat = 'Products & Craft';
    let activeFlags = new Set();
    let currentIdea = '';
    let currentPassport = {};

    // ── GOD MODE: DRAFT PERSISTENCE, READINESS METER, CHECKLIST PROGRESS, HISTORY ACTIONS ──
    const DRAFT_KEY = 'indx_imagenation-brain-builder_draft';
    let pendingDeleteIndex = null;

    function saveDraft() {
      try {
        const draft = {
          idea: document.getElementById('ideaInput').value,
          situation: document.getElementById('situationInput').value,
          success: document.getElementById('successInput').value,
          cat: currentCat,
          ts: Date.now()
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch(e) {}
    }

    function restoreDraft() {
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
        if (!draft || !draft.idea) return;
        document.getElementById('ideaInput').value = draft.idea || '';
        document.getElementById('situationInput').value = draft.situation || '';
        document.getElementById('successInput').value = draft.success || '';
        if (draft.cat) {
          document.querySelectorAll('#catChips .chip').forEach(c => c.classList.toggle('active', c.textContent === draft.cat));
          currentCat = draft.cat;
        }
        showToast('Draft restored ✓');
      } catch(e) {}
    }

    function clearDraft() {
      localStorage.removeItem(DRAFT_KEY);
    }

    function handleIntakeInput() {
      saveDraft();
      updateReadiness();
    }

    function updateReadiness() {
      const ideaEl = document.getElementById('ideaInput');
      const situationEl = document.getElementById('situationInput');
      const successEl = document.getElementById('successInput');
      if (!ideaEl) return;
      const idea = ideaEl.value.trim();
      const situation = situationEl ? situationEl.value.trim() : '';
      const success = successEl ? successEl.value.trim() : '';
      let score = idea.length >= 10 ? 50 : Math.round((idea.length / 10) * 50);
      if (situation.length > 0) score += 25;
      if (success.length > 0) score += 25;
      score = Math.max(0, Math.min(100, score));
      const fill = document.getElementById('readinessFill');
      const pct = document.getElementById('readinessPct');
      const hint = document.getElementById('readinessHint');
      if (fill) {
        fill.style.width = score + '%';
        fill.style.background = score >= 80 ? 'var(--green)' : score >= 40 ? 'var(--gold)' : 'var(--red)';
      }
      if (pct) pct.textContent = score + '%';
      if (hint) hint.textContent = score >= 80 ? 'Ready to build your three brains.' : score >= 40 ? 'Add more detail for a sharper brain.' : 'Describe your idea to get started.';
    }

    function updateChecklistProgress() {
      const dots = document.querySelectorAll('[id^="tc"][id$="dot"]');
      const total = dots.length;
      let checked = 0;
      dots.forEach(d => { if (d.style.background === 'var(--green)') checked++; });
      const fill = document.getElementById('checklistProgressFill');
      const label = document.getElementById('checklistProgressLabel');
      if (fill) fill.style.width = (total ? Math.round((checked/total)*100) : 0) + '%';
      if (label) label.textContent = checked + ' / ' + total;
    }

    function pinPassport(i, evt) {
      if (evt) evt.stopPropagation();
      const passports = getPassports();
      if (!passports[i]) return;
      passports[i].pinned = !passports[i].pinned;
      localStorage.setItem(PASSPORT_KEY, JSON.stringify(passports));
      showToast(passports[i].pinned ? 'Pinned to top ✓' : 'Unpinned');
      renderHistory();
    }

    function deletePassport(i, evt) {
      if (evt) evt.stopPropagation();
      pendingDeleteIndex = i;
      const overlay = document.getElementById('deleteConfirmOverlay');
      if (overlay) overlay.classList.add('show');
    }

    function cancelDeletePassport() {
      pendingDeleteIndex = null;
      const overlay = document.getElementById('deleteConfirmOverlay');
      if (overlay) overlay.classList.remove('show');
    }

    function confirmDeletePassport() {
      if (pendingDeleteIndex === null) return;
      const passports = getPassports();
      passports.splice(pendingDeleteIndex, 1);
      localStorage.setItem(PASSPORT_KEY, JSON.stringify(passports));
      const overlay = document.getElementById('deleteConfirmOverlay');
      if (overlay) overlay.classList.remove('show');
      showToast('Brain Passport deleted');
      pendingDeleteIndex = null;
      renderHistory();
    }

    // ── CHIP HELPERS ──
    function selectCat(el) {
      document.querySelectorAll('#catChips .chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      currentCat = el.textContent;
      // GOD MODE PATCH
      saveDraft();
    }
    function toggleFlag(el) {
      el.classList.toggle('active');
      // GOD MODE PATCH
      saveDraft();
    }
    function toggleOut(id) { document.getElementById(id).classList.toggle('open'); }

    // ── STEP MANAGEMENT ──
    const PHASES = ['intake','identity','opportunity','content','passport'];
    const STEP_IDS = ['step1','step2','step3','step4','step5'];

    function setStep(activePhase) {
      const idx = PHASES.indexOf(activePhase);
      STEP_IDS.forEach((s,i) => {
        const el = document.getElementById(s);
        el.className = 'step-item' + (i < idx ? ' done' : i === idx ? ' active' : '');
        const dot = el.querySelector('.step-dot');
        dot.textContent = i < idx ? '✓' : (i+1);
      });
      PHASES.forEach(p => {
        const panel = document.getElementById('phase-' + p);
        panel.classList.toggle('active', p === activePhase);
      });
      window.scrollTo(0,0);
    }

    function goBack(targetPhase, currentPhase) { setStep(targetPhase); }

    // ── PHASE TRANSITIONS WITH PROCESSING ──
    function nextPhase(fromPhase, toPhase) {
      const configs = {
        'identity': {
          label: 'Building your Identity Brain',
          sub: 'Defining who you are, who you serve, and how you speak',
          steps: ['Reading your idea','Mapping your audience','Writing your voice rules','Setting cultural boundaries']
        },
        'opportunity': {
          label: 'Building your Opportunity Brain',
          sub: 'Evaluating 3 offers — killing weak ideas — selecting best path',
          steps: ['Generating 3 offer directions','Running investor stress test','Killing weak ideas','Selecting best first move']
        },
        'content': {
          label: 'Building your Content Brain',
          sub: 'Writing your pillars, hooks, magnet, and 30-day plan',
          steps: ['Mapping content pillars','Writing hook bank','Creating Opportunity Magnet','Building 30-day calendar']
        },
        'passport': {
          label: 'Creating your Brain Passport',
          sub: 'Compiling all three brains into your Life Graph record',
          steps: ['Compiling Identity Brain','Compiling Opportunity Brain','Compiling Content Brain','Sealing Brain Passport']
        }
      };
      const cfg = configs[toPhase];
      showProc(cfg.label, cfg.sub, cfg.steps, () => {
        buildPhaseContent(toPhase);
        setStep(toPhase);
      });
    }

    function showProc(label, sub, steps, callback) {
      const overlay = document.getElementById('procOverlay');
      document.getElementById('procLabel').textContent = label;
      document.getElementById('procSub').textContent = sub;
      const stepsEl = document.getElementById('procSteps');
      stepsEl.innerHTML = steps.map((_,i) => `<div class="proc-step" id="pstep${i}"><div class="proc-step-dot"></div>${steps[i]}</div>`).join('');
      overlay.classList.add('show');
      let i = 0;
      const tick = setInterval(() => {
        if (i > 0) { const prev = document.getElementById('pstep'+(i-1)); if(prev){prev.classList.remove('active');prev.classList.add('done');} }
        const cur = document.getElementById('pstep'+i);
        if (cur) { cur.classList.add('active'); i++; }
        else {
          clearInterval(tick);
          setTimeout(() => {
            overlay.classList.remove('show');
            steps.forEach((_,j) => { const el = document.getElementById('pstep'+j); if(el){el.classList.remove('active','done');} });
            callback();
          }, 400);
        }
      }, 650);
    }

    // ── BRAIN TEMPLATES ──
    const BRAINS = {
      'Products & Craft': {
        identity: {
          positioning: 'A sovereign maker turning handmade craft into trusted, beautiful products — for buyers who want real skill, real story, and real cultural meaning behind what they own.',
          oneline: 'I make things by hand. I sell them with dignity. I build with SIINDEX.',
          audience: 'Local buyers and tourists who value handmade quality. Pacific diaspora seeking connection to home. Gift buyers wanting something meaningful. Ethical shoppers who avoid factory products.',
          voice: 'Warm, proud, direct, story-led, culturally aware. Speak like a maker, not a marketer.',
          visual: 'Hands at work. Materials close-up. Product in real environments. Natural light. No stock photos. Real studio, real market stall, real maker.',
          values: 'Craft over convenience. Story over hype. Cultural respect. 98% to the maker. Dignity in every transaction.',
          never: 'Do not claim "luxury" without proof. Do not use "sold out" for scarcity manipulation. Do not promise "guaranteed income" from sales. Do not publish cultural motifs without classification.',
          trust: 'Product photos (natural light). Process proof (hands working). Creator identity (face, name, location). Cultural permission status. Buyer protection statement. Pickup or shipping details.',
          cultural: 'If your products use traditional patterns or motifs — classify them first via the Cultural Rights screen. Commercial use of community-owned designs requires elder or community approval.',
          boundaries: 'Do not overstate cultural significance. Do not claim designs are traditional unless they are. Do not use other communities\' motifs without permission. Always allow buyer time to inspect before purchase is final.'
        },
        offers: [
          { name: 'Handmade Product Pack', type: 'Physical product bundle', buyer: 'Tourists, local buyers, gift buyers', price: '$20–$80 per item / $60–$150 bundle', status: 'winner', winWhy: 'Easiest to photograph, explain, and sell. No complex permissions if designs are original. Immediate income. Can list on IN$DEX marketplace today.', failWhy: null },
          { name: 'Story + Product Bundle', type: 'Product with cultural story card', buyer: 'Premium gift buyers, diaspora, cultural collectors', price: '$80–$200', status: 'keep', winWhy: 'Higher margin. Stronger emotional value. Attracts premium buyers willing to pay for meaning.', failWhy: 'Requires accurate attribution. Cultural claims must be verified before publishing.' },
          { name: 'Digital Pattern Licensing', type: 'Licensing deal to manufacturers', buyer: 'Textile manufacturers, tourism brands', price: '$300–$2,000 per license', status: 'rejected', winWhy: null, failWhy: 'High complexity. Requires IP registration. Cultural approval needed. Wrong first move for a maker just launching.' }
        ],
        selected: 'Handmade Product Pack — your easiest, fastest, most trustworthy first offer.',
        whyWins: 'Clear product. Clear buyer. Clear price. No complex permissions needed for original designs. Can sell at market, online, or on IN$DEX marketplace today.',
        pricing: 'Price based on: material cost × 3 + your time at $15/hr minimum. Do not underprice to compete. Your handmade work is worth more than factory products. Start at your real price.',
        firstCustomer: '1. Photograph 5 products today (natural light, hands visible). 2. Post a story carousel. 3. Send WhatsApp message to 20 contacts. 4. Set up IN$DEX marketplace listing. 5. DM your first 5 potential buyers directly.',
        revenue: 'Local market stall → IN$DEX marketplace → Tourist shops / hotels → Online orders → Live commerce sessions → Bundle upgrades → Story card add-on → Cultural licensing (after classification)',
        plan14: [
          { day:'Day 1', action:'Photograph 5 products. Natural light. Show your hands.', type:'Setup' },
          { day:'Day 2', action:'Confirm cultural permission status on any traditional designs.', type:'Compliance' },
          { day:'Day 3', action:'Create IN$DEX opportunity page. Write your story.', type:'Platform' },
          { day:'Day 4', action:'Publish first marketplace listing. Set real price.', type:'Launch' },
          { day:'Day 5', action:'Post story carousel (10 slides). Tag your location and craft.', type:'Content' },
          { day:'Day 6', action:'Send WhatsApp broadcast to your contact list.', type:'Outreach' },
          { day:'Day 7', action:'Run mini live commerce session (30 min). Show making process.', type:'Live' },
          { day:'Day 8', action:'Share buyer FAQ. Answer every comment.', type:'Trust' },
          { day:'Day 9', action:'Create Story + Product bundle. Add cultural story card.', type:'Upsell' },
          { day:'Day 10', action:'Contact 3 local hotels or tour operators.', type:'B2B' },
          { day:'Day 11', action:'Post a "behind the craft" TikTok or Reel.', type:'Content' },
          { day:'Day 12', action:'Improve listing based on feedback. Add more photos.', type:'Improve' },
          { day:'Day 13', action:'Launch "This Week\'s Drop" — announce next batch.', type:'Launch' },
          { day:'Day 14', action:'Review signals. Count sales, enquiries, DMs. Update Brain Passport.', type:'Review' }
        ],
        pillars: [
          { name: 'The Making', purpose: 'Show skill, process, and craft quality.', hook: '"Watch me make this from scratch."', format: 'Short video, TikTok, Reel', cta: 'DM to order' },
          { name: 'The Story Behind It', purpose: 'Build emotional connection and trust.', hook: '"This piece took 3 days. Here\'s why."', format: 'Instagram carousel, caption', cta: 'Find in my IN$DEX shop' },
          { name: 'Product Drop', purpose: 'Direct sales post.', hook: '"New drop. 5 available. First reply gets it."', format: 'Instagram post, WhatsApp', cta: 'DM to buy now' },
          { name: 'What Buyers Say', purpose: 'Social proof and trust building.', hook: '"First customer message I received."', format: 'Screenshot, story, carousel', cta: 'Order yours' },
          { name: 'The Maker Behind It', purpose: 'Brand story and personal connection.', hook: '"I started making this because..."', format: 'Video, founder post, carousel', cta: 'Follow for weekly drops' }
        ],
        hooks: [
          '"Watch me turn [material] into something you\'ll keep for years."',
          '"I made this by hand. No factory. No machine. Just me."',
          '"If you want something with a real story — this is for you."',
          '"New batch ready. Here\'s what went into each piece."',
          '"I don\'t sell products. I sell skill, time, and care."',
          '"The best gift is something someone made with their hands."',
          '"How do I price handmade work? Here\'s my honest answer."',
          '"3 things I never compromise on when I make [product]."',
          '"First order I ever received. Here\'s what it felt like."',
          '"This is what [material] looks like when you care about it."'
        ],
        magnet: {
          title: '"How to Choose Handmade: A Buyer\'s Guide"',
          format: 'PDF guide / Instagram Story / WhatsApp download',
          gives: 'Teaches buyers how to identify real handmade quality — and why it costs more than factory products.',
          optIn: '"Get my free guide: How to choose handmade products that last. DM me GUIDE and I\'ll send it now."',
          followUp: 'Day 1: Send guide. Day 2: Share your maker story. Day 3: Send this week\'s product photos. Day 5: Offer first-time buyer discount.',
          privacy: 'Your contact details are used only to deliver this guide. I don\'t sell or share your information.'
        },
        plan30: {
          w1: [
            { day:'Day 1', action:'Post "The Making" video — show craft in action.', type:'Reach' },
            { day:'Day 2', action:'Share your maker story (carousel).', type:'Trust' },
            { day:'Day 3', action:'Post first product photos. DM 10 people.', type:'Launch' },
            { day:'Day 4', action:'Send WhatsApp broadcast.', type:'Reach' },
            { day:'Day 5', action:'Answer every comment. Build community.', type:'Trust' },
            { day:'Day 6', action:'Post "behind the making" Story.', type:'Reach' },
            { day:'Day 7', action:'Review Week 1. What got the most response?', type:'Review' }
          ],
          w2: [
            { day:'Day 8', action:'Share process video — step by step.', type:'Education' },
            { day:'Day 9', action:'Post buyer FAQ.', type:'Trust' },
            { day:'Day 10', action:'Send Opportunity Magnet guide to interested leads.', type:'Nurture' },
            { day:'Day 11', action:'Post product drop announcement.', type:'Sell' },
            { day:'Day 12', action:'Live commerce session (30 min).', type:'Sell' },
            { day:'Day 13', action:'Share cultural story of your craft.', type:'Education' },
            { day:'Day 14', action:'Post first results: sales, enquiries, messages.', type:'Proof' }
          ],
          w3: [
            { day:'Day 15', action:'Launch bundle offer — Story + Product.', type:'Upsell' },
            { day:'Day 16', action:'Post supplier or material story.', type:'Trust' },
            { day:'Day 17', action:'Contact hotels / tour operators.', type:'B2B' },
            { day:'Day 18', action:'Post "what the buyer said" — testimonial.', type:'Proof' },
            { day:'Day 19', action:'Announce next batch. Collect pre-orders.', type:'Sell' },
            { day:'Day 20', action:'Post educational content — why handmade costs more.', type:'Education' },
            { day:'Day 21', action:'Review Week 3. Top performing content type?', type:'Review' }
          ],
          w4: [
            { day:'Day 22', action:'Share a behind-the-scenes production day.', type:'Trust' },
            { day:'Day 23', action:'Post "favourite piece I\'ve made" with story.', type:'Brand' },
            { day:'Day 24', action:'Second live commerce session.', type:'Sell' },
            { day:'Day 25', action:'Reach out to 5 new potential stockists.', type:'B2B' },
            { day:'Day 26', action:'Post "month one wrap-up" — honest results.', type:'Community' },
            { day:'Day 27', action:'Ask your audience: "What should I make next?"', type:'Community' },
            { day:'Day 28', action:'Update Brain Passport. Plan Month 2.', type:'Review' }
          ]
        },
        passport: {
          category: 'Products & Craft',
          offerSummary: 'Handmade Product Pack + Story Bundle',
          firstAction: 'Photograph 5 products today. Publish first marketplace listing.',
          culturalStatus: 'Confirm cultural permission on all traditional designs before listing.',
          trustStatus: 'Creator identity + product photos + cultural status = trust ready.',
          nba: 'Photograph your products today. Natural light. Hands visible. Then create your IN$DEX marketplace listing.',
          trustChecklist: [
            'Product photos taken (not stock images)',
            'Cultural permission confirmed if traditional motifs used',
            'Creator identity visible (name, face, location)',
            'Price set at real value (not underpriced)',
            'Buyer protection statement written',
            'No income guarantee claims in any posts',
            'WhatsApp message drafted for broadcast',
            'IN$DEX marketplace listing created'
          ]
        }
      },

      'Food & Beverage': {
        identity: {
          positioning: 'A local food maker turning home recipes, island ingredients, and real cooking skills into trusted, fresh, made-to-order food products that nourish community.',
          oneline: 'I cook from the heart. I sell with honesty. I build with SIINDEX.',
          audience: 'Local community buyers. Event organizers. Families who want fresh, real food. Hotels and restaurants wanting local suppliers. Market shoppers.',
          voice: 'Warm, generous, community-first, recipe-proud. Talk like someone who loves to feed people.',
          visual: 'Kitchen action. Ingredients fresh and natural. Steam, colour, texture. Plated product. Real kitchen, real hands, real food.',
          values: 'Fresh over frozen. Local over imported. Honest ingredients. Community nourishment.',
          never: 'Do not claim health benefits without approval. Do not overpromise shelf life. Do not hide allergens.',
          trust: 'Ingredients listed. Preparation method visible. Food handling certification if available. Customer messages. Order process clearly explained.',
          cultural: 'If food uses traditional recipes or preparation methods — attribute origin. Some traditional recipes may be community knowledge. Consult your community before commercializing.',
          boundaries: 'Do not claim medical or health benefits without regulatory approval. Always list allergens. Be clear about made-to-order timelines.'
        },
        offers: [
          { name: 'Weekly Fresh Order Box', type: 'Made-to-order food product', buyer: 'Local families, community buyers', price: '$25–$60 per order', status: 'winner', winWhy: 'Repeating income. No waste — cook to order. Community loyalty. Easy to promote on WhatsApp.', failWhy: null },
          { name: 'Event & Function Catering', type: 'Full catering service', buyer: 'Event organizers, community groups, hotels', price: '$300–$3,000 per event', status: 'keep', winWhy: 'High value. One event funds weeks of operation. Great for local reputation.', failWhy: 'Requires capacity planning. Not first-week income.' },
          { name: 'Packaged Retail Product', type: 'Bottled sauce, preserved, packaged goods', buyer: 'Supermarkets, gift shops', price: '$8–$30 per unit', status: 'rejected', winWhy: null, failWhy: 'Requires food safety certification, labelling compliance, and shelf-life testing. Not the right first move.' }
        ],
        selected: 'Weekly Fresh Order Box — cook to order, repeat customers, community trust built fast.',
        whyWins: 'Zero food waste. Reliable weekly income. WhatsApp and IN$DEX make order management simple. Community word-of-mouth is powerful.',
        pricing: 'Cost of ingredients × 3 + your time at $15/hr. Delivery surcharge if delivering. Never sell below the cost of your time.',
        firstCustomer: '1. Tell 20 contacts you are taking orders. 2. Post your menu. 3. Take first 5 orders by WhatsApp. 4. Cook. Deliver. Ask for a message/review. 5. Repeat.',
        revenue: 'Weekly order box → Event catering → Local hotel/restaurant supply → Community meal programs → Learning: cooking classes → Packaged products (later)',
        plan14: [
          { day:'Day 1', action:'Write your weekly menu. Photograph 3 dishes.', type:'Setup' },
          { day:'Day 2', action:'Send WhatsApp broadcast: "Taking orders this week."', type:'Outreach' },
          { day:'Day 3', action:'Post food video — cooking in action.', type:'Content' },
          { day:'Day 4', action:'Create IN$DEX opportunity page and marketplace listing.', type:'Platform' },
          { day:'Day 5', action:'Cook first orders. Photograph delivery.', type:'Fulfil' },
          { day:'Day 6', action:'Ask customers for a message or photo.', type:'Proof' },
          { day:'Day 7', action:'Post cooking behind-the-scenes Story.', type:'Content' },
          { day:'Day 8', action:'Contact 2 local hotels about regular supply.', type:'B2B' },
          { day:'Day 9', action:'Post ingredient story — where your food comes from.', type:'Trust' },
          { day:'Day 10', action:'Announce next week\'s menu. Take pre-orders.', type:'Launch' },
          { day:'Day 11', action:'Share customer message (with permission).', type:'Proof' },
          { day:'Day 12', action:'Post recipe tip — teach one skill.', type:'Education' },
          { day:'Day 13', action:'Run a live cooking session (15 min).', type:'Live' },
          { day:'Day 14', action:'Review: orders received, revenue, best-selling dish.', type:'Review' }
        ],
        pillars: [
          { name: 'Watch Me Cook', purpose: 'Show skill and process.', hook: '"I made this in 20 minutes. Want to see how?"', format: 'Short video, TikTok', cta: 'Order yours this week' },
          { name: 'This Week\'s Menu', purpose: 'Direct sales.', hook: '"This week\'s menu is live. 5 slots left."', format: 'Instagram, WhatsApp', cta: 'Reply to order' },
          { name: 'Where My Food Comes From', purpose: 'Trust and authenticity.', hook: '"Every ingredient I use comes from [source]."', format: 'Carousel, Instagram', cta: 'Order fresh this week' },
          { name: 'Community Recipes', purpose: 'Education and heritage.', hook: '"My grandmother made this every Sunday. Here\'s how."', format: 'Carousel, video', cta: 'Follow for weekly recipes' },
          { name: 'What Customers Say', purpose: 'Social proof.', hook: '"First message I got after my first delivery."', format: 'Screenshot, story', cta: 'Order this week' }
        ],
        hooks: [
          '"I cooked this today. Here\'s what went into it."',
          '"If you\'ve never had [dish name], you need to fix that."',
          '"This week\'s menu is ready. Slots are limited."',
          '"My grandmother\'s recipe. Now it\'s feeding the community."',
          '"Real food takes real time. Here\'s mine."',
          '"3 things I never skip when I cook [dish]."',
          '"I started selling food because [honest reason]."',
          '"What $[price] gets you when you order from me."',
          '"The freshest [food] you\'ll find in [location]. Here\'s proof."',
          '"Every week I cook for [X] families. Here\'s what I made this week."'
        ],
        magnet: {
          title: '"5 Recipes Every Pacific Kitchen Should Know"',
          format: 'PDF or image guide / WhatsApp download',
          gives: 'Free recipe guide that builds trust and showcases cooking expertise.',
          optIn: '"DM me RECIPES and I\'ll send you 5 of my favourite recipes — free."',
          followUp: 'Day 1: Send recipes. Day 2: Share this week\'s menu. Day 3: Ask if they tried one. Day 5: Offer first order discount.',
          privacy: 'Your contact is used only to send this guide and weekly menu. Unsubscribe any time.'
        },
        plan30: {
          w1: [{ day:'Day 1', action:'Post cooking video.', type:'Reach' },{ day:'Day 2', action:'Share this week\'s menu.', type:'Sell' },{ day:'Day 3', action:'WhatsApp broadcast.', type:'Reach' },{ day:'Day 4', action:'Cook and deliver first orders.', type:'Fulfil' },{ day:'Day 5', action:'Share customer photo (with permission).', type:'Proof' },{ day:'Day 6', action:'Behind-the-scenes kitchen story.', type:'Trust' },{ day:'Day 7', action:'Review Week 1.', type:'Review' }],
          w2: [{ day:'Day 8', action:'Post ingredient origin story.', type:'Trust' },{ day:'Day 9', action:'Send Opportunity Magnet to leads.', type:'Nurture' },{ day:'Day 10', action:'Announce Week 2 menu.', type:'Sell' },{ day:'Day 11', action:'Live cooking session (15 min).', type:'Live' },{ day:'Day 12', action:'Contact hotel for regular supply.', type:'B2B' },{ day:'Day 13', action:'Educational post: what makes this dish special.', type:'Education' },{ day:'Day 14', action:'Post Week 2 results.', type:'Proof' }],
          w3: [{ day:'Day 15', action:'Launch bundle: 3-meal week pack.', type:'Upsell' },{ day:'Day 16', action:'Share recipe tip.', type:'Education' },{ day:'Day 17', action:'Community event catering enquiry outreach.', type:'B2B' },{ day:'Day 18', action:'Post customer review.', type:'Proof' },{ day:'Day 19', action:'Announce event / special weekly dish.', type:'Sell' },{ day:'Day 20', action:'Post family or community meal story.', type:'Community' },{ day:'Day 21', action:'Review Week 3.', type:'Review' }],
          w4: [{ day:'Day 22', action:'Month-one thank you post.', type:'Community' },{ day:'Day 23', action:'New dish reveal.', type:'Reach' },{ day:'Day 24', action:'Ask audience: "What should I cook next?"', type:'Community' },{ day:'Day 25', action:'Second live session.', type:'Live' },{ day:'Day 26', action:'Behind-the-scenes: sourcing ingredients.', type:'Trust' },{ day:'Day 27', action:'Share honest Month 1 numbers.', type:'Proof' },{ day:'Day 28', action:'Update Brain Passport. Plan Month 2 menu.', type:'Review' }]
        },
        passport: {
          category: 'Food & Beverage', offerSummary: 'Weekly Fresh Order Box', firstAction: 'Write your weekly menu. Send first WhatsApp broadcast today.',
          culturalStatus: 'Attribute traditional recipes to their cultural origin. Consult community before commercializing traditional knowledge.',
          trustStatus: 'Ingredients visible + cooking process shown + customer messages = trust ready.',
          nba: 'Write your first weekly menu today. Photograph your best dish. Send your first WhatsApp broadcast tonight.',
          trustChecklist: ['Menu clearly written with ingredients','Allergens identified','Cultural attribution for traditional recipes','No health benefit claims without regulatory approval','Order and payment process clear','Delivery timeline communicated','IN$DEX marketplace listing created','WhatsApp order system set up']
        }
      },

      'Services & Skills': {
        identity: { positioning:'A skilled professional turning real expertise into sovereign income — helping the right clients get real results without middlemen taking the margin.', oneline:'I solve problems. I charge my worth. I build with SIINDEX.', audience:'Small business owners who need your skill. Individuals with a specific problem you solve. Remote clients globally. Local organizations.', voice:'Confident, direct, competent, calm. Talk like someone who has done this before.', visual:'Results shown. Work samples. Client outcomes. Process explained simply.', values:'Competence. Honest pricing. Reliable delivery. Real results.', never:'Do not claim certifications you don\'t have. Do not guarantee outcomes you can\'t control. Do not undercharge to win clients.', trust:'Work samples. Client outcomes (with permission). Your experience stated honestly. Clear scope and pricing. Refund or revision policy.', cultural:'If your service relates to cultural knowledge — classify it. Teaching traditional knowledge requires appropriate permission.', boundaries:'Do not claim guaranteed client results. Do not take payment before agreeing scope. Always put scope in writing.' },
        offers: [
          { name: 'Core Service Package', type: 'Fixed-scope service bundle', buyer: 'Small businesses, individuals', price: '$150–$800 per package', status: 'winner', winWhy: 'Clear scope, clear price, easy to sell. Clients know exactly what they\'re buying.', failWhy: null },
          { name: 'Monthly Retainer', type: 'Ongoing advisory or service', buyer: 'Businesses needing ongoing support', price: '$400–$2,000/month', status: 'keep', winWhy: 'Recurring income. High-value relationships. Once set up, reliable.', failWhy: 'Takes longer to close. Not the first-week offer.' },
          { name: 'Training / Course', type: 'Teach your skill to groups', buyer: 'Students, employees, community members', price: '$50–$300/person', status: 'rejected', winWhy: null, failWhy: 'Requires more setup time. Not your fastest first sale. Build the core service first.' }
        ],
        selected: 'Core Service Package — fixed scope, fixed price, fastest close.',
        whyWins: 'Clients know what they\'re getting. You know what you\'re delivering. Simple to price and sell. Can be delivered remotely or locally.',
        pricing: 'Price by value delivered, not hours worked. Ask: "What is this worth to the client?" Start at the real value. Do not discount to win first client — set the right expectation.',
        firstCustomer: '1. Write a clear one-paragraph description of your service. 2. List on IN$DEX. 3. DM 10 people who might need it. 4. Post one skill demonstration. 5. Ask your network to refer.',
        revenue: 'Core package → Retainer → Group training → Digital course → Speaking → Consulting → Mentorship',
        plan14: [
          { day:'Day 1', action:'Write your service description. One clear paragraph.', type:'Setup' },
          { day:'Day 2', action:'Create IN$DEX marketplace listing.', type:'Platform' },
          { day:'Day 3', action:'Post one skill demonstration.', type:'Content' },
          { day:'Day 4', action:'DM 10 potential clients.', type:'Outreach' },
          { day:'Day 5', action:'Post a result you\'ve achieved for someone.', type:'Proof' },
          { day:'Day 6', action:'Share a professional LinkedIn post.', type:'Content' },
          { day:'Day 7', action:'Follow up with everyone who responded.', type:'Sales' },
          { day:'Day 8', action:'Post educational tip related to your skill.', type:'Education' },
          { day:'Day 9', action:'Reach out to 5 businesses who might need you.', type:'B2B' },
          { day:'Day 10', action:'Post a process explainer — "Here\'s how I work."', type:'Trust' },
          { day:'Day 11', action:'Ask a past colleague or client for a referral.', type:'Outreach' },
          { day:'Day 12', action:'Improve your listing with more detail.', type:'Improve' },
          { day:'Day 13', action:'Post case study or result.', type:'Proof' },
          { day:'Day 14', action:'Review: proposals sent, responses, conversions. Adjust.', type:'Review' }
        ],
        pillars: [
          { name: 'Skill Demo', purpose: 'Prove what you can do.', hook: '"Here\'s how I solved [problem] in [time]."', format: 'Video, before/after', cta: 'DM to work together' },
          { name: 'Client Result', purpose: 'Social proof.', hook: '"A client came to me with [problem]. Here\'s what happened."', format: 'Carousel, case study', cta: 'Book a conversation' },
          { name: 'Expert Tip', purpose: 'Education builds authority.', hook: '"3 things most [clients] get wrong about [topic]."', format: 'Carousel, LinkedIn', cta: 'Follow for weekly tips' },
          { name: 'Process Explainer', purpose: 'Reduce buyer fear.', hook: '"Here\'s exactly what happens when you hire me."', format: 'Carousel, post', cta: 'DM to start' },
          { name: 'Pricing Transparency', purpose: 'Build trust by being clear.', hook: '"Here\'s what my service costs and why."', format: 'Post, LinkedIn', cta: 'View my listing on IN$DEX' }
        ],
        hooks: ['"I fixed [problem] in [time]. Here\'s exactly what I did."','"If you\'re struggling with [problem], this is for you."','"Here\'s what hiring the wrong [skill] costs you."','"3 questions to ask before you hire a [professional]."','"I\'ve been doing this for [X years]. Here\'s what I know."','"My [service] starts at [price]. Here\'s what you get."','"Client came to me with [problem]. Here\'s what we built."','"You don\'t need [expensive thing]. You need [what I do]."','"Here\'s the honest truth about [skill/industry]."','"I turned [hours of work] into [client result]. Ask me how."'],
        magnet: { title:'"5 Questions to Ask Before Hiring a [Your Skill]"', format:'PDF guide or LinkedIn article', gives:'Helps potential clients understand what good service looks like — and why you provide it.', optIn:'"DM me GUIDE and I\'ll send you my free checklist before hiring a [skill]."', followUp:'Day 1: Send guide. Day 2: Share a result. Day 3: Invite to a free 15-min call. Day 5: Follow up.', privacy:'Used only to deliver this guide. Unsubscribe any time.' },
        plan30: {
          w1:[{day:'Day 1',action:'Skill demo post.',type:'Reach'},{day:'Day 2',action:'Professional intro on LinkedIn.',type:'Trust'},{day:'Day 3',action:'DM 15 prospects.',type:'Outreach'},{day:'Day 4',action:'Post educational tip.',type:'Education'},{day:'Day 5',action:'Send Opportunity Magnet to leads.',type:'Nurture'},{day:'Day 6',action:'Follow-up with interested leads.',type:'Sales'},{day:'Day 7',action:'Review Week 1.',type:'Review'}],
          w2:[{day:'Day 8',action:'Case study post.',type:'Proof'},{day:'Day 9',action:'Process explainer.',type:'Trust'},{day:'Day 10',action:'B2B outreach to 5 businesses.',type:'B2B'},{day:'Day 11',action:'Second skill demo.',type:'Reach'},{day:'Day 12',action:'Pricing transparency post.',type:'Trust'},{day:'Day 13',action:'LinkedIn article on your expertise.',type:'Authority'},{day:'Day 14',action:'Post Week 2 results.',type:'Proof'}],
          w2: [{day:'Day 8',action:'Case study post.',type:'Proof'},{day:'Day 9',action:'Process explainer.',type:'Trust'},{day:'Day 10',action:'B2B outreach to 5 businesses.',type:'B2B'},{day:'Day 11',action:'Second skill demo.',type:'Reach'},{day:'Day 12',action:'Pricing transparency post.',type:'Trust'},{day:'Day 13',action:'LinkedIn article on your expertise.',type:'Authority'},{day:'Day 14',action:'Post Week 2 results.',type:'Proof'}],
          w3:[{day:'Day 15',action:'Introduce retainer option.',type:'Upsell'},{day:'Day 16',action:'Share client outcome (with permission).',type:'Proof'},{day:'Day 17',action:'Educational carousel.',type:'Education'},{day:'Day 18',action:'Referral request to network.',type:'Outreach'},{day:'Day 19',action:'Post your "why I do this" story.',type:'Brand'},{day:'Day 20',action:'Host free 30-min Q&A or webinar.',type:'Live'},{day:'Day 21',action:'Review Week 3.',type:'Review'}],
          w4:[{day:'Day 22',action:'Month-one wrap-up post.',type:'Community'},{day:'Day 23',action:'New service addition or expansion.',type:'Launch'},{day:'Day 24',action:'Ask audience: "What problem should I solve next?"',type:'Community'},{day:'Day 25',action:'Skill deep-dive post.',type:'Education'},{day:'Day 26',action:'Referral campaign.',type:'Outreach'},{day:'Day 27',action:'Share honest Month 1 results.',type:'Proof'},{day:'Day 28',action:'Update Brain Passport. Plan Month 2 pipeline.',type:'Review'}]
        },
        passport:{ category:'Services & Skills', offerSummary:'Core Service Package', firstAction:'Write your service description. Create IN$DEX listing today. DM 10 prospects.', culturalStatus:'If service involves cultural knowledge, classify and attribute appropriately.', trustStatus:'Work samples + clear scope + pricing = trust ready.', nba:'Write your one-paragraph service description now. DM 10 people who might need it.', trustChecklist:['Service described clearly and honestly','Pricing set at real value','Scope of work defined in writing','No guaranteed outcome claims','Work samples or results ready to share','Cultural attribution if applicable','IN$DEX marketplace listing published','Follow-up process prepared'] }
      },

      'Art & Culture': {
        identity:{ positioning:'A sovereign artist turning cultural expression, creative skill, and personal vision into protected, meaningful work that earns income, builds legacy, and preserves what matters.', oneline:'I create with purpose. I own what I make. I build with SIINDEX.', audience:'Art buyers and collectors. Cultural institutions. Ethical brands wanting to license authentic art. Tourism industry. Pacific diaspora.', voice:'Artistic, intentional, culturally proud, warm but protective. Speak like someone who understands the value of what they create.', visual:'Work close-up. Creation process. Studio or natural setting. Pattern, colour, texture. Cultural context visible.', values:'Artistic integrity. Cultural ownership. Fair compensation. Attribution always. No extraction.', never:'Do not claim cultural significance without context. Do not license community art as personal work. Do not sell below the cultural value of the work.', trust:'Original work proof. Creator identity. Cultural permission status. Attribution statement. Marketplace protection.', cultural:'Cultural motifs and traditional designs must be classified before commercial use. Elder or community approval required for community-owned designs. Attribution is not optional.', boundaries:'Never sell sacred or restricted cultural designs commercially. Always attribute the cultural tradition that inspired your work. Seek elder review for any work drawing on traditional knowledge.' },
        offers:[
          { name:'Original Art Sales', type:'Original one-of-a-kind pieces', buyer:'Collectors, art buyers, gifts', price:'$80–$2,000+', status:'winner', winWhy:'Highest value per piece. Cultural authenticity commands premium. IN$DEX marketplace reaches global buyers.', failWhy:null },
          { name:'Print + Story Edition', type:'Limited print with cultural story card', buyer:'Diaspora, tourism, gift market', price:'$40–$150', status:'keep', winWhy:'More accessible. Volume play. Strong gift market. Can be produced in runs.', failWhy:'Lower margin per unit. Requires print production.' },
          { name:'Pattern Licensing', type:'License designs to brands', buyer:'Textile companies, tourism brands', price:'$500–$5,000 per license', status:'rejected', winWhy:null, failWhy:'Requires IP clarity, cultural classification, and legal structure. Not a first-month offer.' }
        ],
        selected:'Original Art Sales — highest value, cultural authenticity commands premium price.',
        whyWins:'One-of-a-kind work cannot be replicated. Cultural story adds premium value. Global reach via IN$DEX marketplace.',
        pricing:'Research comparable artists. Price based on: time + materials + cultural value + rarity. Never undercharge. Premium buyers pay for story and authenticity.',
        firstCustomer:'1. Photograph 3–5 works in natural light. 2. Write cultural context (2–3 sentences). 3. List on IN$DEX with attribution statement. 4. Post creation video. 5. DM serious buyers.',
        revenue:'Original sales → Limited prints → Commission work → Teaching → Cultural licensing (after classification) → Institutional collaboration',
        plan14:[
          {day:'Day 1',action:'Photograph 3–5 works. Natural light.',type:'Setup'},
          {day:'Day 2',action:'Write cultural context for each piece.',type:'Story'},
          {day:'Day 3',action:'Classify any cultural motifs — cultural-rights.html.',type:'Compliance'},
          {day:'Day 4',action:'Publish IN$DEX listings with attribution.',type:'Platform'},
          {day:'Day 5',action:'Post creation process video.',type:'Content'},
          {day:'Day 6',action:'Share the cultural meaning of one piece.',type:'Education'},
          {day:'Day 7',action:'Contact 2 local galleries or cultural institutions.',type:'B2B'},
          {day:'Day 8',action:'Post an artist statement.',type:'Brand'},
          {day:'Day 9',action:'Share process close-up (hands, materials, tools).',type:'Content'},
          {day:'Day 10',action:'DM 10 serious art buyers or collectors.',type:'Outreach'},
          {day:'Day 11',action:'Post commission enquiry CTA.',type:'Sell'},
          {day:'Day 12',action:'Share cultural education post.',type:'Education'},
          {day:'Day 13',action:'Run a "reveal" of a new piece on live.',type:'Live'},
          {day:'Day 14',action:'Review: sales, enquiries, cultural feedback.',type:'Review'}
        ],
        pillars:[
          {name:'The Work',purpose:'Show the art.',hook:'"Here is what I made. Here is why."',format:'Instagram, TikTok',cta:'View in my IN$DEX gallery'},
          {name:'The Cultural Story',purpose:'Build depth and trust.',hook:'"This pattern has been in my family for generations."',format:'Carousel, caption',cta:'Ask me about the story'},
          {name:'The Process',purpose:'Show skill.',hook:'"Watch me create from blank canvas."',format:'Short video, Reel',cta:'Commission yours'},
          {name:'Why Culture Matters',purpose:'Education and protection.',hook:'"Art is not decoration. It is memory."',format:'Long caption, LinkedIn',cta:'Follow for cultural education'},
          {name:'For Sale',purpose:'Direct sales.',hook:'"This piece is available. Here is what it means."',format:'Post, story',cta:'DM to purchase'}
        ],
        hooks:['"This piece took [time]. Here is what every part means."','"Art is not decoration. It is memory made visible."','"I painted [subject] because [reason]."','"New piece available. Here is the story behind it."','"Cultural art should never be taken. It should be shared — on the artist\'s terms."','"The colour [name] in my culture means [meaning]."','"I paint with [material]. Here is where it comes from."','"Commission enquiries open. Here is my process."','"What makes this art different from a print shop? Watch."','"I protect what I create. Here is how IN$DEX helps."'],
        magnet:{title:'"Understanding Pacific Art: A Buyer\'s Cultural Guide"',format:'PDF or Instagram guide',gives:'Teaches buyers how to identify authentic cultural art, what attribution means, and how to purchase ethically.',optIn:'"DM me ART GUIDE and I\'ll send you my free guide to understanding and buying Pacific art."',followUp:'Day 1: Send guide. Day 2: Share a new piece. Day 3: Cultural education post. Day 5: Commission enquiry follow-up.',privacy:'Used only to send this guide. Not shared with anyone.'},
        plan30:{
          w1:[{day:'Day 1',action:'Post creation video.',type:'Reach'},{day:'Day 2',action:'Share cultural story.',type:'Trust'},{day:'Day 3',action:'Publish listings on IN$DEX.',type:'Platform'},{day:'Day 4',action:'DM 10 collectors.',type:'Outreach'},{day:'Day 5',action:'Process close-up video.',type:'Reach'},{day:'Day 6',action:'Cultural education post.',type:'Education'},{day:'Day 7',action:'Review Week 1.',type:'Review'}],
          w2:[{day:'Day 8',action:'Commission enquiry post.',type:'Sell'},{day:'Day 9',action:'Cultural protection post.',type:'Trust'},{day:'Day 10',action:'Contact local gallery.',type:'B2B'},{day:'Day 11',action:'New piece reveal.',type:'Launch'},{day:'Day 12',action:'Artist statement post.',type:'Brand'},{day:'Day 13',action:'Cultural story deep dive.',type:'Education'},{day:'Day 14',action:'Post results — sales, enquiries.',type:'Proof'}],
          w3:[{day:'Day 15',action:'Limited print announcement.',type:'Launch'},{day:'Day 16',action:'Commission process explained.',type:'Trust'},{day:'Day 17',action:'Gallery or institution outreach.',type:'B2B'},{day:'Day 18',action:'Buyer testimonial (with permission).',type:'Proof'},{day:'Day 19',action:'New piece drop.',type:'Sell'},{day:'Day 20',action:'Cultural education carousel.',type:'Education'},{day:'Day 21',action:'Review Week 3.',type:'Review'}],
          w4:[{day:'Day 22',action:'Month-one thank you.',type:'Community'},{day:'Day 23',action:'Behind-the-scenes studio day.',type:'Trust'},{day:'Day 24',action:'Ask: "What should I paint next?"',type:'Community'},{day:'Day 25',action:'Live reveal session.',type:'Live'},{day:'Day 26',action:'Cultural heritage post.',type:'Education'},{day:'Day 27',action:'Month 1 honest results.',type:'Proof'},{day:'Day 28',action:'Update Brain Passport. Plan Month 2.',type:'Review'}]
        },
        passport:{category:'Art & Culture',offerSummary:'Original Art Sales + Story Edition',firstAction:'Photograph your works. Classify cultural motifs. Publish IN$DEX listing today.',culturalStatus:'CRITICAL: Classify all cultural motifs before commercial listing. Elder review if community-owned designs used.',trustStatus:'Original works + cultural attribution + creator identity = trust ready.',nba:'Photograph 3 works today. Run them through cultural-rights.html. Publish your first IN$DEX listing tonight.',trustChecklist:['Works photographed clearly','Cultural motifs classified','Elder review completed if needed','Attribution statement written','Price set at real cultural value','No guaranteed resale claims','IN$DEX listing with full cultural context','Commission process documented']}
      },

      'Learning': {
        identity:{positioning:'A sovereign educator turning years of hard-won knowledge into learning pathways that build citizen capability, create income, and leave lasting legacy.',oneline:'I teach what I know. I earn what I\'m worth. I build with SIINDEX.',audience:'People ready to learn your skill. Professionals seeking advancement. Community members who can\'t access formal education. Online learners.',voice:'Patient, clear, encouraging, expert. Speak like the best teacher you ever had.',visual:'Teaching in action. Whiteboard, screen share, demonstration. Student transformation. Curriculum visible.',values:'Learning as liberation. Accessible education. Honest results. Student success over enrollment numbers.',never:'Do not promise job guarantees. Do not overstate certification value. Do not charge for knowledge that doesn\'t deliver.',trust:'Curriculum outline. Your credentials or experience. Student outcomes (with permission). Refund policy. Trial lesson if possible.',cultural:'If teaching cultural knowledge — consult community. Traditional knowledge teaching requires permission.',boundaries:'Do not claim accreditation you don\'t have. Don\'t promise job placement without capacity to deliver. Be clear what the course does and doesn\'t include.'},
        offers:[
          {name:'Skill Course or Workshop',type:'Short course or workshop',buyer:'Learners wanting this specific skill',price:'$50–$300 per person',status:'winner',winWhy:'Highest leverage. Teach once, serve many. IN$DEX learning path integration. Can grow into full program.',failWhy:null},
          {name:'1:1 Mentorship',type:'Personal coaching sessions',buyer:'Individuals needing personalized guidance',price:'$80–$250/session',status:'keep',winWhy:'Premium price. High impact. Builds strong relationships and referrals.',failWhy:'Time-limited. Can only scale by raising price.'},
          {name:'Self-Paced Digital Course',type:'Recorded video course',buyer:'Global online learners',price:'$30–$200',status:'rejected',winWhy:null,failWhy:'Requires significant production time. Live workshops first — learn what students need, then record.'}
        ],
        selected:'Skill Course or Workshop — fastest way to teach many, earn well, and prove your method.',
        whyWins:'One workshop can serve 10–30 students. Proves your teaching before investing in digital production. Builds your reputation fast.',
        pricing:'Price per student: (your hourly rate × hours) ÷ number of students. Minimum $50/student. Group pricing rewards commitment.',
        firstCustomer:'1. Write a one-page curriculum outline. 2. Announce your first cohort date. 3. Take 5 enrolments by WhatsApp or IN$DEX. 4. Deliver. Collect feedback. Improve. 5. Launch cohort 2.',
        revenue:'Live workshop → 1:1 mentorship → Digital course → Certification → Community subscription → Institutional partnership',
        plan14:[
          {day:'Day 1',action:'Write one-page curriculum outline.',type:'Setup'},
          {day:'Day 2',action:'Set first workshop date. 5 student minimum.',type:'Launch'},
          {day:'Day 3',action:'Post curriculum overview.',type:'Content'},
          {day:'Day 4',action:'Create IN$DEX learning path listing.',type:'Platform'},
          {day:'Day 5',action:'Take first 5 enrolments.',type:'Sell'},
          {day:'Day 6',action:'Post educational tip from your curriculum.',type:'Education'},
          {day:'Day 7',action:'Send pre-workshop prep guide to enrolled students.',type:'Nurture'},
          {day:'Day 8',action:'Post "why I teach this" founder post.',type:'Brand'},
          {day:'Day 9',action:'DM potential students who engaged.',type:'Sales'},
          {day:'Day 10',action:'Host first workshop. Record for review.',type:'Deliver'},
          {day:'Day 11',action:'Collect student feedback.',type:'Review'},
          {day:'Day 12',action:'Share student outcome (with permission).',type:'Proof'},
          {day:'Day 13',action:'Announce Cohort 2 with improvements.',type:'Launch'},
          {day:'Day 14',action:'Review: enrolments, feedback, revenue, next improvement.',type:'Review'}
        ],
        pillars:[
          {name:'Teach Something Real',purpose:'Prove your expertise by giving value.',hook:'"Here is one thing I teach that changes everything."',format:'Short video, carousel',cta:'Enrol in my course'},
          {name:'Student Transformation',purpose:'Proof of real outcomes.',hook:'"A student came in not knowing [X]. Here is where they are now."',format:'Carousel, testimonial',cta:'Apply to join'},
          {name:'The Why',purpose:'Emotional connection.',hook:'"I started teaching because [honest reason]."',format:'Caption, video',cta:'Follow for learning tips'},
          {name:'What You\'ll Learn',purpose:'Direct sales.',hook:'"In 4 weeks, you will [specific outcome]. Here is how."',format:'Carousel, post',cta:'Book your spot'},
          {name:'Expert Insight',purpose:'Authority building.',hook:'"Most people learn [skill] wrong. Here is the right way."',format:'LinkedIn, carousel',cta:'Learn from someone who\'s done it'}
        ],
        hooks:['"I spent [X years] learning this so you don\'t have to spend as long."','"One lesson changed everything about how I [skill]."','"Here is what no one teaches about [topic]."','"Student came in not knowing [X]. 4 weeks later: [outcome]."','"My course is [X weeks]. Here is exactly what you learn."','"The biggest mistake beginners make with [skill]."','"I\'ve taught [number] students. Here is the most common question."','"Why I believe everyone should know [skill]."','"You don\'t need years of study. You need the right teacher."','"Enrolments are open. Here is what to expect."'],
        magnet:{title:'"Your First [Skill] Lesson — Free"',format:'Short video or PDF',gives:'A real, useful first lesson that proves teaching quality and builds enrolment intent.',optIn:'"DM me LESSON and I\'ll send your first lesson free."',followUp:'Day 1: Send lesson. Day 2: Ask what they thought. Day 3: Share curriculum. Day 5: Invite to enrol.',privacy:'Used only to send this lesson. Not shared.'},
        plan30:{
          w1:[{day:'Day 1',action:'Post "Teach Something Real" tip.',type:'Education'},{day:'Day 2',action:'Share curriculum outline.',type:'Launch'},{day:'Day 3',action:'Open enrolments. Post everywhere.',type:'Sell'},{day:'Day 4',action:'Send Opportunity Magnet to leads.',type:'Nurture'},{day:'Day 5',action:'DM potential students.',type:'Sales'},{day:'Day 6',action:'Why I teach post.',type:'Brand'},{day:'Day 7',action:'Review Week 1.',type:'Review'}],
          w2:[{day:'Day 8',action:'Post second educational tip.',type:'Education'},{day:'Day 9',action:'Student outcome post.',type:'Proof'},{day:'Day 10',action:'Enrolment reminder.',type:'Sell'},{day:'Day 11',action:'Host first workshop.',type:'Deliver'},{day:'Day 12',action:'Collect student feedback.',type:'Review'},{day:'Day 13',action:'Announce Cohort 2.',type:'Launch'},{day:'Day 14',action:'Week 2 results post.',type:'Proof'}],
          w3:[{day:'Day 15',action:'Share student transformation.',type:'Proof'},{day:'Day 16',action:'Deep-dive educational post.',type:'Education'},{day:'Day 17',action:'Introduce 1:1 mentorship.',type:'Upsell'},{day:'Day 18',action:'Q&A live session.',type:'Live'},{day:'Day 19',action:'Enrolment close for Cohort 2.',type:'Sell'},{day:'Day 20',action:'Behind-the-scenes teaching post.',type:'Trust'},{day:'Day 21',action:'Review Week 3.',type:'Review'}],
          w4:[{day:'Day 22',action:'Month-one wrap-up.',type:'Community'},{day:'Day 23',action:'New curriculum addition.',type:'Launch'},{day:'Day 24',action:'Ask: "What should I teach next?"',type:'Community'},{day:'Day 25',action:'Expert deep-dive post.',type:'Authority'},{day:'Day 26',action:'Institutional or community outreach.',type:'B2B'},{day:'Day 27',action:'Month 1 honest results.',type:'Proof'},{day:'Day 28',action:'Update Brain Passport. Plan Cohort 3.',type:'Review'}]
        },
        passport:{category:'Learning',offerSummary:'Skill Course / Workshop',firstAction:'Write curriculum outline today. Set first workshop date. Open enrolments.',culturalStatus:'If teaching cultural knowledge, consult community and attribute correctly.',trustStatus:'Curriculum outline + educator credentials + student outcomes = trust ready.',nba:'Write your one-page curriculum outline now. Set your first cohort date. Post the announcement today.',trustChecklist:['Curriculum outline written clearly','No accreditation claimed without proof','No job guarantee unless you can deliver','Student outcome examples ready','Clear refund or revision policy','Cultural knowledge permissions confirmed if applicable','IN$DEX learning path listed','First cohort date confirmed']}
      },

      'Community': {
        identity:{positioning:'A sovereign community builder turning shared purpose, collective wisdom, and community assets into organized, trusted, opportunity-rich civic infrastructure.',oneline:'I organize people. I multiply what\'s possible. I build with SIINDEX.',audience:'Community members seeking connection, opportunity, and governance. Local leaders. Mission-aligned individuals. Organizations that want to support communities.',voice:'Inclusive, clear, honest, mission-driven. Speak for the collective, not just yourself.',visual:'People together. Community events. Shared spaces. Governance in action. Real faces.',values:'Collective over individual. Trust over hype. Purpose over attention. Zero addiction design.',never:'Do not promise outcomes beyond your community\'s control. Do not manipulate membership for numbers. Do not make financial promises on behalf of the community.',trust:'Community governance visible. Decision process transparent. Member protection clear. No dark patterns.',cultural:'Community assets belong to the community. Decisions affecting cultural or community assets require collective input.',boundaries:'Do not commercialize community without member consent. Never sell community data. Governance decisions must follow the process.'},
        offers:[
          {name:'Community Membership',type:'Access to community value',buyer:'Mission-aligned individuals',price:'Free / $5–$20/month',status:'winner',winWhy:'Builds your base. Creates ongoing relationship. IN$DEX governance integration gives members real power.',failWhy:null},
          {name:'Community Event',type:'Live gathering or online event',buyer:'Members and non-members',price:'$0–$50 per ticket',status:'keep',winWhy:'High impact. Builds culture and trust. Generates non-member attention.',failWhy:'Time-intensive. One-off. Not recurring income.'},
          {name:'Community Enterprise Fund',type:'Collective economic project',buyer:'Members contributing to shared goal',price:'Variable',status:'rejected',winWhy:null,failWhy:'Requires governance structure, legal advice, and trust base first. Not a Month 1 offer.'}
        ],
        selected:'Community Membership — build the base before monetizing. Free or low cost to start.',
        whyWins:'Trust is the product. Members become your mission distribution. Governance gives them real stake and real voice.',
        pricing:'Start free or low cost. Earn through: events, collective projects, grants, sponsored programs, merchant partnerships. Never monetize the community itself.',
        firstCustomer:'1. Define the mission clearly. 2. Invite 20 people who align with it. 3. Create the community space on IN$DEX. 4. Hold first gathering (online or offline). 5. Establish governance rules.',
        revenue:'Membership (optional) → Community events → Grant funding → Merchant partnerships → Training programs → Governance services',
        plan14:[
          {day:'Day 1',action:'Write your community mission statement (3 sentences).',type:'Setup'},
          {day:'Day 2',action:'Create community page on IN$DEX.',type:'Platform'},
          {day:'Day 3',action:'Invite 20 founding members personally.',type:'Outreach'},
          {day:'Day 4',action:'Post community mission publicly.',type:'Launch'},
          {day:'Day 5',action:'Introduce founding members to each other.',type:'Community'},
          {day:'Day 6',action:'Share first community values and governance rules.',type:'Governance'},
          {day:'Day 7',action:'Hold first community gathering (30 min).',type:'Community'},
          {day:'Day 8',action:'Post recap of first gathering.',type:'Content'},
          {day:'Day 9',action:'Invite members to introduce themselves.',type:'Community'},
          {day:'Day 10',action:'Post first governance proposal for member input.',type:'Governance'},
          {day:'Day 11',action:'Open a community discussion on a shared challenge.',type:'Community'},
          {day:'Day 12',action:'Announce first community event.',type:'Launch'},
          {day:'Day 13',action:'Invite aligned organizations to connect.',type:'B2B'},
          {day:'Day 14',action:'Review: members joined, engagement, governance decisions.',type:'Review'}
        ],
        pillars:[
          {name:'The Mission',purpose:'Why this community exists.',hook:'"We are building something that doesn\'t exist yet."',format:'Post, video',cta:'Join us'},
          {name:'Member Stories',purpose:'Social proof and community life.',hook:'"Meet [member name]. Here\'s why they joined."',format:'Carousel, interview',cta:'Become a member'},
          {name:'Governance in Action',purpose:'Trust through transparency.',hook:'"Here is how we make decisions together."',format:'Explainer, video',cta:'Participate in governance'},
          {name:'Community Opportunity',purpose:'Show the value of membership.',hook:'"What our members have built in [time]."',format:'Results post, carousel',cta:'Join and build with us'},
          {name:'Zero Addiction Design',purpose:'Differentiate from attention platforms.',hook:'"We don\'t optimize for screen time. We optimize for your progress."',format:'Educational post',cta:'This is different. See how.'}
        ],
        hooks:['"A community is not followers. It\'s people with a shared mission."','"We built this for people who want to contribute, not just consume."','"Join us. Not to scroll. To build."','"Here is how our community makes decisions together."','"What happens when a community has real governance?"','"Our community exists because [honest reason]."','"Members of [community] have [achieved X]. Here is how."','"Zero addiction design. Here is what that means."','"The difference between a group and a community."','"We\'re [number] members and growing. Here\'s who we\'re looking for."'],
        magnet:{title:'"Community Mission Canvas — Define Your Purpose in One Page"',format:'Free template / PDF',gives:'Helps potential members understand what they\'re joining and why it matters.',optIn:'"DM me MISSION and I\'ll send our community mission canvas — free."',followUp:'Day 1: Send canvas. Day 2: Invite to founding member call. Day 3: Share community values. Day 5: Personal invite to join.',privacy:'Used only to send this canvas and community updates. Opt out any time.'},
        plan30:{
          w1:[{day:'Day 1',action:'Post community mission.',type:'Launch'},{day:'Day 2',action:'Personal invites to 20 founding members.',type:'Outreach'},{day:'Day 3',action:'First community gathering.',type:'Community'},{day:'Day 4',action:'Introduce members to each other.',type:'Community'},{day:'Day 5',action:'Share governance rules.',type:'Governance'},{day:'Day 6',action:'Member story feature.',type:'Proof'},{day:'Day 7',action:'Review Week 1.',type:'Review'}],
          w2:[{day:'Day 8',action:'First governance proposal.',type:'Governance'},{day:'Day 9',action:'Educational post on community model.',type:'Education'},{day:'Day 10',action:'Send Opportunity Magnet.',type:'Nurture'},{day:'Day 11',action:'Community discussion on a real challenge.',type:'Community'},{day:'Day 12',action:'Announce first community event.',type:'Launch'},{day:'Day 13',action:'Reach out to aligned organizations.',type:'B2B'},{day:'Day 14',action:'Week 2 results.',type:'Proof'}],
          w3:[{day:'Day 15',action:'Host community event.',type:'Community'},{day:'Day 16',action:'Share event recap.',type:'Proof'},{day:'Day 17',action:'Introduce community enterprise idea (for input only).',type:'Governance'},{day:'Day 18',action:'Member achievement post.',type:'Proof'},{day:'Day 19',action:'Second gathering.',type:'Community'},{day:'Day 20',action:'Zero addiction design post.',type:'Education'},{day:'Day 21',action:'Review Week 3.',type:'Review'}],
          w4:[{day:'Day 22',action:'Month-one community wrap-up.',type:'Community'},{day:'Day 23',action:'Governance decision reveal.',type:'Governance'},{day:'Day 24',action:'Ask: "What should we build next together?"',type:'Community'},{day:'Day 25',action:'New member welcome post.',type:'Community'},{day:'Day 26',action:'Grant or funding enquiry.',type:'B2B'},{day:'Day 27',action:'Month 1 honest numbers.',type:'Proof'},{day:'Day 28',action:'Update Brain Passport. Plan Month 2 governance.',type:'Review'}]
        },
        passport:{category:'Community',offerSummary:'Community Membership (free / low cost)',firstAction:'Write your mission statement. Create IN$DEX community page. Invite 20 founding members.',culturalStatus:'Any community cultural assets require collective governance decision before commercialization.',trustStatus:'Clear mission + transparent governance + zero dark patterns = trust ready.',nba:'Write your 3-sentence mission statement now. Create your IN$DEX community page. Send 20 personal invites today.',trustChecklist:['Mission statement clear and honest','Governance rules defined','No financial promises beyond community capacity','Cultural asset decisions governed collectively','No dark patterns or manipulative scarcity','Member data protected — not sold','IN$DEX community page created','First gathering scheduled']}
      }
    };

    // ── BUILD PHASE CONTENT ──
    function buildPhaseContent(phase) {
      const T = BRAINS[currentCat] || BRAINS['Products & Craft'];
      if (phase === 'identity') buildIdentity(T.identity);
      if (phase === 'opportunity') buildOpportunity(T);
      if (phase === 'content') buildContent(T);
      if (phase === 'passport') buildPassport(T);
    }

    function buildIdentity(id) {
      setText('ib-pos-text', id.positioning);
      setText('ib-oneline', id.oneline);
      setText('ib-audience', id.audience);
      setText('ib-voice-text', id.voice);
      setText('ib-visual', id.visual);
      setText('ib-values', id.values);
      setText('ib-never', id.never);
      setText('ib-trust-text', id.trust);
      setText('ib-cultural', id.cultural);
      setText('ib-boundaries', id.boundaries);
    }

    function buildOpportunity(T) {
      // Offers
      const offersBody = document.getElementById('ob-offers-body');
      offersBody.innerHTML = T.offers.map(o => `
        <div class="offer-card ${o.status === 'winner' ? 'winner' : 'rejected'}" style="margin-top:${T.offers.indexOf(o)===0?'12px':'0'}">
          <span class="offer-badge ${o.status === 'winner' ? 'win' : 'rej'}">${o.status === 'winner' ? '✓ Selected' : o.status === 'keep' ? '○ Secondary' : '✕ Rejected'}</span>
          <div class="offer-name">${o.name}</div>
          <div class="offer-row">
            <span class="offer-tag">${o.type}</span>
            <span class="offer-tag">${o.buyer}</span>
            <span class="offer-tag">${o.price}</span>
          </div>
          ${o.status === 'winner' || o.status === 'keep' ? `<div class="offer-reason win">✓ ${o.winWhy}</div>` : ''}
          ${o.status === 'rejected' ? `<div class="offer-reason rej">✕ Killed: ${o.failWhy}</div>` : ''}
          ${o.status === 'keep' && o.failWhy ? `<div class="offer-reason rej" style="margin-top:4px">⚠️ ${o.failWhy}</div>` : ''}
        </div>
      `).join('');

      setText('ob-selected', T.selected);
      setText('ob-why-wins', T.whyWins);
      setText('ob-pricing', T.pricing);
      setText('ob-first-customer', T.firstCustomer);
      setText('ob-revenue', T.revenue);

      // 14-day plan
      const planBody = document.getElementById('ob-plan-body');
      planBody.innerHTML = T.plan14.map(d => `
        <div class="plan-day-row" style="margin-top:${d===T.plan14[0]?'12px':'0'}">
          <div class="plan-day-label">${d.day}</div>
          <div><div class="plan-day-action">${d.action}</div><div class="plan-day-type">${d.type}</div></div>
        </div>
      `).join('');
    }

    function buildContent(T) {
      // Pillars
      const pillarsBody = document.getElementById('cb-pillars-body');
      pillarsBody.innerHTML = T.pillars.map((p,i) => `
        <div class="pillar-card" style="margin-top:${i===0?'12px':'0'}">
          <div class="pillar-num">Pillar ${i+1}</div>
          <div class="pillar-name">${p.name}</div>
          <div class="pillar-purpose">${p.purpose}</div>
          <div class="pillar-hooks">Hook: ${p.hook}</div>
          <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
            <span style="font-size:10px;color:var(--cyan)">${p.format}</span>
            <span style="font-size:10px;color:var(--green)">CTA: ${p.cta}</span>
          </div>
        </div>
      `).join('');

      // Hooks
      const hooksBody = document.getElementById('cb-hooks-body');
      hooksBody.innerHTML = '<div style="margin-top:12px;">' + T.hooks.map((h,i) => `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:var(--surface2);border-radius:8px;margin-bottom:6px;">
          <span style="font-size:10px;font-weight:700;color:var(--purple);min-width:20px;">${i+1}.</span>
          <span style="font-size:12px;color:var(--text);line-height:1.4;">${h}</span>
        </div>
      `).join('') + '</div>';

      // Magnet
      const m = T.magnet;
      const magnetBody = document.getElementById('cb-magnet-body');
      magnetBody.innerHTML = `
        <div class="magnet-card" style="margin-top:12px;">
          <div class="magnet-header"><span class="magnet-icon">🧲</span><div><div class="magnet-title">${m.title}</div><div class="magnet-sub">${m.format}</div></div></div>
          <div class="out-label">What it gives</div><div class="out-text" style="margin-bottom:10px;">${m.gives}</div>
          <div class="out-label">Opt-in copy</div><div class="out-box">${m.optIn}</div>
          <div class="out-label" style="margin-top:10px;">Follow-up sequence</div><div class="out-text">${m.followUp}</div>
          <div style="margin-top:10px;padding:10px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.12);border-radius:8px;font-size:11px;color:var(--muted);">🔒 Privacy: ${m.privacy}</div>
        </div>
      `;

      // 30-day plan
      const plan30Body = document.getElementById('cb-30day-body');
      const p = T.plan30;
      const renderWeek = (week, label) => `
        <div class="plan-week">
          <div class="plan-week-header">${label}</div>
          ${week.map(d => `<div class="plan-day-row"><div class="plan-day-label">${d.day}</div><div><div class="plan-day-action">${d.action}</div><div class="plan-day-type">${d.type}</div></div></div>`).join('')}
        </div>
      `;
      plan30Body.innerHTML = '<div style="margin-top:12px;">' +
        renderWeek(p.w1, 'Week 1 — Trust & Story') +
        renderWeek(p.w2, 'Week 2 — Education & Proof') +
        renderWeek(p.w3, 'Week 3 — Offer & First Sales') +
        renderWeek(p.w4, 'Week 4 — Improve & Compound') +
        '</div>';
    }

    function buildPassport(T) {
      const pp = T.passport;
      const passportId = 'BP-' + Date.now().toString(36).toUpperCase();
      document.getElementById('pp-title').textContent = (citizenName ? citizenName + '\'s ' : '') + 'Brain Passport';
      document.getElementById('pp-id').textContent = passportId;
      document.getElementById('pp-nba').textContent = pp.nba;

      const ppGrid = document.getElementById('pp-grid');
      ppGrid.innerHTML = [
        {label:'Category', val: pp.category},
        {label:'Best Offer', val: pp.offerSummary},
        {label:'First Action', val: pp.firstAction, full: true},
        {label:'Cultural Status', val: pp.culturalStatus, full: true},
        {label:'Trust Status', val: pp.trustStatus, full: true}
      ].map(f => `
        <div class="passport-field${f.full ? ' full' : ''}">
          <div class="passport-field-label">${f.label}</div>
          <div class="passport-field-val">${f.val}</div>
        </div>
      `).join('');

      // Trust checklist
      const tcBody = document.getElementById('pp-trust-body');
      tcBody.innerHTML = '<div style="margin-top:12px;">' + pp.trustChecklist.map((item, i) => `
        <div id="tc${i}" data-action="h_2" data-args="${JSON.stringify(["$event",i]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--surface2);border-radius:8px;margin-bottom:6px;cursor:pointer;">
          <div id="tc${i}dot" style="width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);background:transparent;flex-shrink:0;margin-top:1px;transition:all 0.2s;"></div>
          <div style="font-size:12px;color:var(--text);line-height:1.4;">${item}</div>
        </div>
      `).join('') + '</div>';

      currentPassport = { id: passportId, idea: currentIdea, cat: currentCat, pp, ts: Date.now() };
      // GOD MODE PATCH
      updateChecklistProgress();
    }

    function toggleCheck(i) {
      const dot = document.getElementById('tc' + i + 'dot');
      const isChecked = dot.style.background === 'var(--green)';
      dot.style.background = isChecked ? 'transparent' : 'var(--green)';
      dot.style.borderColor = isChecked ? 'rgba(255,255,255,0.15)' : 'var(--green)';
      // GOD MODE PATCH
      updateChecklistProgress();
    }

    function setText(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    // ── START BUILD ──
    function startBrainBuild() {
      const idea = document.getElementById('ideaInput').value.trim();
      if (!idea || idea.length < 10) { showToast('Describe your idea first.'); return; }
      currentIdea = idea;
      // GOD MODE PATCH
      clearDraft();
      nextPhase('intake', 'identity');
    }

    // ── SAVE PASSPORT ──
    function savePassport() {
      const passports = getPassports();
      passports.unshift(currentPassport);
      if (passports.length > 20) passports.pop();
      localStorage.setItem(PASSPORT_KEY, JSON.stringify(passports));
      // GOD MODE PATCH
      clearDraft();
      showToast('Brain Passport saved to Life Graph ✓');
      renderHistory();
    }

    function getPassports() {
      try { return JSON.parse(localStorage.getItem(PASSPORT_KEY) || '[]'); } catch(e) { return []; }
    }

    // GOD MODE PATCH — added pin/delete actions and pinned-first sort
    function renderHistory() {
      const passports = getPassports();
      const sec = document.getElementById('histSec');
      const list = document.getElementById('histList');
      if (!passports.length) { sec.style.display='none'; return; }
      sec.style.display = 'block';
      const indexed = passports.map((p, i) => ({ p, i }));
      indexed.sort((a, b) => (b.p.pinned ? 1 : 0) - (a.p.pinned ? 1 : 0));
      list.innerHTML = indexed.map(({p, i}) => `
        <div class="history-item" data-action="h_3" data-args="${JSON.stringify(["$event",i]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
          <div class="history-item-brains">
            <div class="history-brain-dot" style="background:var(--cyan)"></div>
            <div class="history-brain-dot" style="background:var(--gold)"></div>
            <div class="history-brain-dot" style="background:var(--green)"></div>
          </div>
          <div class="history-item-info">
            <div class="history-item-idea">${p.idea.substring(0,50)}${p.idea.length>50?'...':''}</div>
            <div class="history-item-meta">${p.cat} · ${new Date(p.ts).toLocaleDateString()}</div>
          </div>
          <div class="history-item-actions">
            <button class="history-action-btn${p.pinned ? ' pinned' : ''}" data-action="h_4" data-args="${JSON.stringify(["$event",i]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${p.pinned ? '★' : '☆'}</button>
            <button class="history-action-btn delete" data-action="h_5" data-args="${JSON.stringify(["$event",i]).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">🗑</button>
          </div>
        </div>
      `).join('');
    }

    function loadPassport(i) {
      const p = getPassports()[i];
      if (!p) return;
      document.getElementById('ideaInput').value = p.idea;
      document.querySelectorAll('#catChips .chip').forEach(c => c.classList.toggle('active', c.textContent === p.cat));
      currentCat = p.cat;
      currentIdea = p.idea;
      showToast('Loaded previous Brain Passport ✓');
    }

    function startOver() {
      document.getElementById('ideaInput').value = '';
      document.getElementById('situationInput').value = '';
      document.getElementById('successInput').value = '';
      document.querySelectorAll('#catChips .chip').forEach((c,i) => c.classList.toggle('active', i===0));
      currentCat = 'Products & Craft';
      currentIdea = '';
      // GOD MODE PATCH
      clearDraft();
      updateReadiness();
      setStep('intake');
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    document.addEventListener('DOMContentLoaded', () => {
      renderHistory();
      // GOD MODE PATCH
      restoreDraft();
      updateReadiness();
    });

// ── Generated handler wrappers (inline on* attributes → named functions) ──
function h_1(event) { if(event.target===this) cancelDeletePassport(); }
function h_2(event, __p0) { toggleCheck(__p0); }
function h_3(event, __p0) { loadPassport(__p0); }
function h_4(event, __p0) { pinPassport(__p0, event); }
function h_5(event, __p0) { deletePassport(__p0, event); }


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
    }, false); })(EV.input);
  (function (c) { document.addEventListener(c[0], function (e) {
      if (!c[3]) { if (e.target && e.target.dataset) run(e, e.target, c[1], c[2]); return; }
      for (let el = e.target; el && el !== document; el = el.parentElement) { if (el.dataset) run(e, el, c[1], c[2]); if (e.cancelBubble) break; }
    }, false); })(EV.click);

})();
