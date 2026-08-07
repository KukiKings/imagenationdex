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
ok(/never_call/.test(knowledge) && /artificial intelligence/.test(knowledge), 'knowledge must refuse AI wording');
ok(/Image Nation DEx Limited/.test(knowledge), 'knowledge must include legal registrant');
ok(/answer:\s*function/.test(knowledge), 'knowledge must export answer()');

const bridge = read('js/siindex-public-bridge.js');
ok(/matchesPublicFact/.test(bridge), 'bridge must match public facts');
ok(/_publicKnowledgePatched/.test(bridge), 'bridge must patch SIINDEXVoice.ask');

const boot = read('js/siindex-public-boot.js');
ok(/siindex-public-knowledge\.js/.test(boot), 'boot must load knowledge');
ok(/siindex-public-bridge\.js/.test(boot), 'boot must load bridge');

const sw = read('sw.js');
ok(/indx-v5-phase-a/.test(sw), 'service worker must be v5 phase-a');
ok(/siindex-public-boot\.js/.test(sw), 'service worker must inject public boot');

const pwa = read('indx-pwa.js');
ok(/siindexPwaPublicBoot|siindex-public-boot\.js/.test(pwa), 'indx-pwa must load public boot');

const ud = JSON.parse(read('siindex-public/utility-directory.json') || '{}');
ok(Array.isArray(ud.sections) && ud.sections.length >= 30, 'utility directory needs 30+ sections');
ok(ud.sections.some((s) => s.id === 'interview'), 'utility directory must list interview');
ok(ud.sections.some((s) => s.id === 'present'), 'utility directory must list present');
ok(ud.sections.some((s) => s.id === 'faq'), 'utility directory must list faq');

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
