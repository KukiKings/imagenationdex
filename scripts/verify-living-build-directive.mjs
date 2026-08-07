import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const path = resolve(root, 'INDEX_SIINDEX_LIVING_BUILD_DIRECTIVE_V4_3.md');
const directive = readFileSync(path, 'utf8');

const required = [
  '# IN$DEX / SIINDEX Living Build Directive v4.3',
  'Status: ACTIVE LIVING BUILD DIRECTIVE',
  'IN$DEX has no final feature set.',
  '## 27. Continuous expansion model',
  'Build everything committed. Test everything claimed.',
  'project-status/living-verified-status.json',
  'BLOCKED_BY_SOURCE',
  'USD $0.24 is the sole founder-selected launch and genesis reference.',
  'The only approved top-level pillars are:',
  'No SI agent:',
  'Tier 0 does not require:',
  'Provider capability is not IN$DEX capability.',
  'The earlier 17-agent registry is incomplete because the Mac inventory reported 25 tasks.',
];

for (const text of required) {
  assert.ok(directive.includes(text), `Living Build Directive is missing: ${text}`);
}

const forbidden = [
  /\bcanon(?:ical|ized|ise|ised|ization)?\b/i,
  /\bGOD MODE\b/i,
  /\bAI\b/,
  /^The civilization is ready\.?$/im,
  /^The system runs itself\.?$/im,
  /^No human approval is required\.?$/im,
  /unlimited personalised videos/i,
  /<\s*400ms/i,
  /98\/2 Wealth Retention Law/i,
  /Autonomous economic authority/i,
  /—/,
];

for (const pattern of forbidden) {
  assert.doesNotMatch(directive, pattern, `Living Build Directive contains forbidden wording: ${pattern}`);
}

assert.match(directive, /24 September 2026 dates must not return as current targets/);
assert.match(directive, /24 January 2027 at 10:00 AM AEST/);
assert.match(directive, /24 February 2027/);
assert.match(directive, /These dates serve different milestones/);

console.log('IN$DEX Living Build Directive v4.3 verification passed.');
