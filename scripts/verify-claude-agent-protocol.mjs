import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

const protocol = read('CLAUDE_AGENT_PROTOCOL.md');
const handoff = read('CLAUDE_CURRENT_HANDOFF.md');
const agent = read('.claude/agents/index-daily-checker.md');
const command = read('.claude/commands/index-daily-check.md');

[
  'Master Mega-Prompt',
  'Never run `git add -A`',
  'Never rebase a dirty working tree',
  'Daily checks are read-only',
  'No SI agent owns private keys',
  'USD $0.24',
  'Build all committed utilities now',
  'QUALITY_RECOVERY_PROTOCOL.md',
  'REPAIR_REQUIRED',
  'Required stop conditions',
  'Required handoff',
].forEach((required) => assert.ok(protocol.includes(required), `Protocol is missing: ${required}`));

[
  '66dd2cf',
  'ec21d1c',
  '78fb06b',
  '54daac3',
  'Publication status: not pushed',
  'Do not run `git add -A`',
].forEach((required) => assert.ok(handoff.includes(required), `Handoff is missing: ${required}`));

assert.match(agent, /Operate read-only/);
assert.match(agent, /Never assume the desktop clone and Codex clone match/);
assert.match(agent, /REPAIR_REQUIRED/);
assert.match(command, /Do not edit, stage, commit/);
assert.match(command, /REPAIR_REQUIRED/);

console.log('IN$DEX Claude agent protocol verification passed.');
