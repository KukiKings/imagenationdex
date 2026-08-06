import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

const codex = read('AGENTS.md');
const protocol = read('QUALITY_RECOVERY_PROTOCOL.md');
const template = read('QUALITY_RECOVERY_REPORT_TEMPLATE.md');
const agent = read('.claude/agents/index-quality-recovery.md');
const command = read('.claude/commands/index-repair.md');
const dailyAgent = read('.claude/agents/index-daily-checker.md');
const dailyCommand = read('.claude/commands/index-daily-check.md');

[
  'one-writer rule',
  'Use SI or Synthetic Intelligence for SIINDEX',
  'Do not commit, push, merge, deploy, migrate data or modify production',
  'The daily checker remains read-only',
].forEach((required) => assert.ok(codex.includes(required), `Codex instructions are missing: ${required}`));

[
  'CHECK_ONLY',
  'LOCAL_REPAIR',
  'RELEASE',
  'R4 Prohibited autonomous action',
  'Only one agent writes to a repository worktree at a time',
  'Do not change code before obtaining a reproducible case',
  'Never weaken or delete a valid test',
  'REPAIR_REQUIRED',
  'The repair agent must repeat the reproduction',
  'Git lock containment',
  'git-lock-preflight.mjs',
].forEach((required) => assert.ok(protocol.includes(required), `Recovery protocol is missing: ${required}`));

[
  'Authority mode',
  'Risk class',
  'Starting commit',
  'Ending commit',
  'Reproduction test',
  'External writes',
  'Production impact',
  'Rollback path',
].forEach((required) => assert.ok(template.includes(required), `Report template is missing: ${required}`));

assert.match(agent, /Default to `CHECK_ONLY`/);
assert.match(agent, /project-status\/living-verified-status\.json/);
assert.match(agent, /Follow the one-writer rule/);
assert.match(agent, /require exact AJ approval/);
assert.match(command, /This command alone does not authorise commit, push, merge, deployment/);
assert.match(command, /project-status\/living-verified-status\.json/);
assert.match(command, /Reproduce the failure/);
assert.match(dailyAgent, /Operate read-only/);
assert.match(dailyCommand, /Do not edit, stage, commit/);

function runProtectionCheck(filePath) {
  return spawnSync('python3', [resolve(root, '.claude/protection-check.py')], {
    input: JSON.stringify({ tool_input: { file_path: filePath } }),
    encoding: 'utf8',
  });
}

const ordinaryFile = runProtectionCheck(resolve(root, 'src/example.ts'));
assert.equal(ordinaryFile.status, 0, 'Protection hook must allow ordinary scoped files');

const protectedFile = runProtectionCheck(resolve(root, 'CLAUDE.md'));
assert.equal(protectedFile.status, 2, 'Protection hook must block CLAUDE.md without AJ sign-off');
assert.match(protectedFile.stdout, /require(?:s)? AJ approval|requires explicit AJ sign-off/);

const clearLock = spawnSync('node', [resolve(root, 'scripts/git-lock-preflight.mjs')], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(clearLock.status, 0, 'Git lock preflight must pass when no lock or rebase is active');
assert.match(clearLock.stdout, /GIT_LOCK_CLEAR/);

const lockFixture = mkdtempSync(resolve(tmpdir(), 'indx-git-lock-'));
const lockPath = resolve(lockFixture, 'index.lock');
try {
  writeFileSync(lockPath, '');

  const blockedLock = spawnSync('node', [resolve(root, 'scripts/git-lock-preflight.mjs'), '--lock-path', lockPath], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(blockedLock.status, 2, 'Git lock preflight must fail closed when a lock exists');
  assert.match(blockedLock.stderr, /GIT_LOCK_BLOCKED/);
  assert.equal(existsSync(lockPath), true, 'Git lock preflight must never delete a lock automatically');
} finally {
  rmSync(lockFixture, { recursive: true, force: true });
}

console.log('IN$DEX Quality and Recovery Agent verification passed.');
