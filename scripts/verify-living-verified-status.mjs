import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const statusPath = resolve(root, 'project-status/living-verified-status.json');
const status = JSON.parse(readFileSync(statusPath, 'utf8'));

const governanceFiles = [
  'AGENTS.md',
  'CLAUDE_AGENT_PROTOCOL.md',
  'QUALITY_RECOVERY_PROTOCOL.md',
  'CLAUDE_AGENT_FLEET_BLUEPRINT.md',
  'CLAUDE_SCHEDULED_AGENT_SHARED_PREAMBLE.md',
  'claude-agent-responsibility-registry.json',
  'CLAUDE_CURRENT_HANDOFF.md',
  '.claude/agents/index-daily-checker.md',
  '.claude/commands/index-daily-check.md',
  '.claude/agents/index-quality-recovery.md',
  '.claude/commands/index-repair.md',
];

for (const relativePath of governanceFiles) {
  const content = readFileSync(resolve(root, relativePath), 'utf8');
  assert.doesNotMatch(content, /Master Mega-Prompt/, `${relativePath} still depends on the missing Master Mega-Prompt`);
  assert.doesNotMatch(content, /MISSING_OR_CONFLICTING_AUTHORITY/, `${relativePath} still uses the retired missing-Mega stop state`);
}

assert.equal(status.schema_version, '1.0.0');
assert.equal(status.owner, 'AJ');
assert.equal(status.operating_rules.product_scope, 'OPEN_AND_EXPANDABLE');
assert.equal(status.operating_rules.missing_or_conflicting_source_result, 'BLOCKED_BY_SOURCE');
assert.equal(status.operating_rules.scheduled_agent_default_authority, 'CHECK_ONLY');
assert.equal(status.operating_rules.self_update_allowed, false);
assert.equal(status.operating_rules.grants_execution_authority, false);

const expectedApprovalControls = [
  'credentials',
  'funds',
  'identity',
  'production',
  'legal claims',
  'citizen contact',
  'public publication',
  'destructive actions',
];

assert.deepEqual(status.operating_rules.preserved_approval_controls, expectedApprovalControls);
assert.equal(status.facts.length, 17, 'The initial living register must contain the 17 reviewed entries');

const keys = status.facts.map((fact) => fact.key);
assert.equal(new Set(keys).size, keys.length, 'Living status keys must be unique');

for (const fact of status.facts) {
  for (const field of ['key', 'current_value', 'status', 'source', 'last_verified', 'owner', 'expiry_or_review']) {
    assert.ok(Object.hasOwn(fact, field), `${fact.key || 'unknown fact'} is missing ${field}`);
  }
}

function fact(key) {
  const entry = status.facts.find((candidate) => candidate.key === key);
  assert.ok(entry, `Missing living status entry: ${key}`);
  return entry;
}

assert.equal(fact('siindex.identity').current_value.includes('Synthetic Intelligence'), true);
assert.equal(fact('milestone.grand_synchronicity_l99_historical').current_value, '24 January 2027 at 10:00 AM AEST');
assert.equal(fact('milestone.grand_synchronicity_l99_historical').status, 'HISTORICAL_DISTINCT_MILESTONE');
assert.equal(fact('milestone.controlled_public_pilot').current_value, '24 February 2027');
assert.equal(fact('milestone.controlled_public_pilot').status, 'TARGET_NOT_GUARANTEE');

assert.equal(status.claim_coverage.expected_minimum_enforced_claims, 27);
assert.equal(status.claim_coverage.last_observed_enforced_claims, 26);
assert.ok(status.claim_coverage.required_claim_ids.includes('R015'));
assert.ok(status.claim_coverage.unresolved_claim_ids.includes('R015'));
assert.equal(status.claim_coverage.readiness, 'BLOCKED');
assert.deepEqual(status.claim_coverage.affected_scopes, ['legacy_claim_checker', 'public_claim_audit']);

console.log('IN$DEX Living Verified Status structure passed.');
console.log('BLOCKED_BY_SOURCE: R015 definition remains unavailable and must not be reported CLEAN.');
