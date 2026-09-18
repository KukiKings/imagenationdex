#!/usr/bin/env node
/**
 * verify-siindex-public-phase-a.mjs
 * Static checks for Phase A public SIINDEX surface on the working tree or a checkout.
 * Exit 0 = pass. Does not deploy or contact anyone.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const failures = [];

function ok(cond, msg) {
  if (!cond) failures.push(msg);
}

function read(rel) {
  const p = resolve(root, rel);
  ok(existsSync(p), `missing file: ${rel}`);
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf8');
}

const required = [
  'js/siindex-public-knowledge.js',
  'js/siindex-public-bridge.js',
  'js/siindex-public-boot.js',
  'js/siindex-page-context.js',
  'siindex-public/page-context-map.json',
  'siindex-public/utility-directory.json',
  'siindex-public/utility-directory.html',
  'siindex-public/LIVING_KNOWLEDGE_SOURCE_v1.md',
  'siindex-public/COOK_ISLANDS_QA.md',
  'siindex-public/SIINDEX_WELCOME_15S.md',
  'siindex-public/ACCEPTANCE_PHASE_A.md',
  'siindex-interview.html',
  'siindex-present.html',
  'siindex-faq.html',
  'public-home.html',
  'speak-to-siindex.html',
  'sw.js',
  'indx-pwa.js',
];

for (const f of required) read(f);

const knowledge = read('js/siindex-public-knowledge.js');
ok(knowledge.includes("brand: 'IN$DEX'") || knowledge.includes('brand: "IN$DEX"'), 'knowledge must lock brand IN$DEX');
// NOTE (2026-09-04, god mode Item 7): the original 'never_call' key this checked
// for was a Phase A draft convention that no longer exists in the file. The
// current architecture refuses AI-wording inline (an explicit regex-matched
// Q&A branch plus first-person "I am not artificial intelligence" statements
// in the greeting/identity copy) — check for that instead of the retired key.
ok(/not artificial intelligence/i.test(knowledge) && /artificial intelligence/.test(knowledge), 'knowledge must refuse AI wording');
ok(/Image Nation DEx Limited/.test(knowledge), 'knowledge must include legal registrant');
ok(/answer:\s*function/.test(knowledge), 'knowledge must export answer()');
ok(/matchAnswer\s*[:=]\s*function|matchAnswer\(/.test(knowledge), 'knowledge must export matchAnswer() (Session 103 real-model routing fix)');

const bridge = read('js/siindex-public-bridge.js');
ok(/matchesPublicFact/.test(bridge), 'bridge must match public facts');
ok(/_publicKnowledgePatched/.test(bridge), 'bridge must patch SIINDEXVoice.ask');

const boot = read('js/siindex-public-boot.js');
ok(/siindex-public-knowledge\.js/.test(boot), 'boot must load knowledge');
ok(/siindex-public-bridge\.js/.test(boot), 'boot must load bridge');

const sw = read('sw.js');
// NOTE (2026-09-04): 'indx-v5-phase-a' was the literal cache-version string at
// the time this script was first written. The service worker has since been
// re-versioned multiple times as real fixes shipped (currently
// 'indx-v9-video-bypass') — pin to the naming pattern, not one frozen value.
ok(/const VERSION = 'indx-v\d+/.test(sw), 'service worker cache version constant is missing or malformed');
ok(/siindex-public-boot\.js/.test(sw), 'service worker must inject public boot');

const pwa = read('indx-pwa.js');
ok(/siindexPwaPublicBoot|siindex-public-boot\.js/.test(pwa), 'indx-pwa must load public boot');

const ud = JSON.parse(read('siindex-public/utility-directory.json') || '{}');
// NOTE (2026-09-04): '>= 30' dates to the original Phase A commit, which
// shipped a 32-entry draft directory. The directory has been deliberately
// consolidated and re-scoped multiple times since (32 -> 13 -> 15 -> 24
// entries across real commits) as duplicate/superseded screens were merged
// or retired — most recently dropping a stale entry that claimed a
// routing-blocked internal screen (siindex-os.html) was still "Live" (Item 7
// Part 2, Session 105). 24 is the current, verified-accurate count. Floor at
// 20 so the check still catches an accidental mass-deletion without forcing
// the count back up toward an aspirational number nobody maintains anymore.
ok(Array.isArray(ud.sections) && ud.sections.length >= 20, 'utility directory needs 20+ sections');
ok(ud.sections.some((s) => s.id === 'interview'), 'utility directory must list interview');
ok(ud.sections.some((s) => s.id === 'present'), 'utility directory must list present');
ok(ud.sections.some((s) => s.id === 'faq'), 'utility directory must list faq');
// A public directory entry that says "Live" for a screen the routing layer
// actually 404s (per vercel.json's internal/founder-only denylist, Item 7
// Part 2) is a false availability claim — catch it directly instead of
// trusting the section list to stay manually in sync with vercel.json.
{
  const vercelConfig = JSON.parse(read('vercel.json') || '{}');
  const blockedNames = new Set();
  for (const route of vercelConfig.routes || []) {
    if (route.status !== 404) continue;
    const m = /^\^\/\(([^)]+)\)\[\.\]html\$$/.exec(route.src || '');
    if (m) m[1].split('|').forEach((name) => blockedNames.add(name));
  }
  for (const s of ud.sections || []) {
    const fileName = (s.href || '').replace(/^\//, '').replace(/\.html$/, '');
    if (s.status === 'Live' && blockedNames.has(fileName)) {
      failures.push(`utility directory claims "${s.id}" (${s.href}) is Live but vercel.json routes it to a 404`);
    }
  }
}

const living = read('siindex-public/LIVING_KNOWLEDGE_SOURCE_v1.md');
ok(/Brand-first/.test(living), 'living knowledge must state brand-first');
ok(/Image Nation DEx Limited/.test(living), 'living knowledge must include legal name');
ok(!/Imagination Index Limited/.test(living) || /superseded/.test(living), 'Imagination Index Limited must be superseded');

const interview = read('siindex-interview.html');
ok(/siindex-public-knowledge\.js/.test(interview), 'interview page must load knowledge');
ok(/INTERVIEW MODE/.test(interview), 'interview page must label Interview Mode');

const present = read('siindex-present.html');
ok(/PRESENTATION MODE/.test(present), 'present page must label Presentation Mode');

const home = read('public-home.html');
ok(/siindex-interview\.html/.test(home), 'public-home must link interview');
ok(/siindex-present\.html/.test(home), 'public-home must link present');
ok(/siindex-faq\.html/.test(home), 'public-home must link faq');

if (failures.length) {
  console.error('FAIL — Phase A public SIINDEX checks');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS — Phase A public SIINDEX surface checks');
console.log('Files checked:', required.length);
console.log('Utility sections:', ud.sections.length);
process.exit(0);
