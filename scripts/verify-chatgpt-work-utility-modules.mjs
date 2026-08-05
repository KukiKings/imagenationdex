import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const researchPath = resolve(root, 'CHATGPT_WORK_UTILITY_MODULES_RESEARCH_2026-08-06.md');
const handoffPath = resolve(root, 'CLAUDE_CURRENT_HANDOFF.md');

const research = readFileSync(researchPath, 'utf8');
const handoff = readFileSync(handoffPath, 'utf8');

const required = [
  '# IN$DEX ChatGPT Work Utility Modules',
  'Status: RESEARCHED AND PLANNED',
  'Production impact: None',
  'HeyGen Avatar V is the proposed real-person digital-twin engine.',
  'Higgsfield is the proposed creative-production layer.',
  "Clay enters as a partner-research tool, not an automatic mass-contact system.",
  "Do not use recorded browser steps as the production engine for:",
  'Sites deployments are production deployments.',
  'Dynamic tool discovery creates a conflict with the IN$DEX deny-by-default manifest.',
  'None is recorded as installed, connected, tested or live for IN$DEX.',
  'Sites must not enable financial transactions.',
  'No Site, scheduled task, agent or connector performs the transfer.',
  'The current society-incorporation fee is NZD 50, not NZD 30.',
  'The commercial experiment does not replace the committed IN$DEX build.',
  'Treat as a proposed SAS Foundry experiment, not verified capacity or a public promise.',
  'Do not promise a finished client site in ten minutes.',
];

for (const text of required) {
  assert.ok(research.includes(text), `Utility-module research is missing: ${text}`);
}

const forbidden = [
  /\bAI\b/,
  /—/,
  /unlimited personalised videos/i,
  /No human approval is required/i,
  /The system runs itself/i,
  /automatic mass outreach/i,
  /automatic public publication/i,
  /^\| 4\.2-second biometric onboarding \| Approved/im,
  /^\| 100 businesses in 90 days \| Verified/im,
  /^A finished client site takes ten minutes\.?$/im,
];

for (const pattern of forbidden) {
  assert.doesNotMatch(research, pattern, `Utility-module research contains unsafe wording: ${pattern}`);
}

assert.ok(
  handoff.includes('CHATGPT_WORK_UTILITY_MODULES_RESEARCH_2026-08-06.md'),
  'Claude handoff does not route provider-dependent work to the utility-module research',
);

console.log('IN$DEX ChatGPT Work utility-module verification passed.');
