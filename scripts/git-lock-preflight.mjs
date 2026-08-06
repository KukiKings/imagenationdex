import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function resolveGitPath(relativePath) {
  const result = spawnSync('git', ['rev-parse', '--git-path', relativePath], {
    cwd: resolve(import.meta.dirname, '..'),
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || 'Unable to resolve Git path.\n');
    process.exit(2);
  }

  return resolve(resolve(import.meta.dirname, '..'), result.stdout.trim());
}

const explicitLockPath = argumentValue('--lock-path');
const lockPath = explicitLockPath ? resolve(explicitLockPath) : resolveGitPath('index.lock');

const rebaseMerge = explicitLockPath ? null : resolveGitPath('rebase-merge');
const rebaseApply = explicitLockPath ? null : resolveGitPath('rebase-apply');

if ((rebaseMerge && existsSync(rebaseMerge)) || (rebaseApply && existsSync(rebaseApply))) {
  console.error('GIT_OPERATION_IN_PROGRESS: a rebase is active. Do not create a worktree, commit, pull, merge or rebase.');
  process.exit(2);
}

if (!existsSync(lockPath)) {
  console.log('GIT_LOCK_CLEAR');
  process.exit(0);
}

const stat = statSync(lockPath);
const ageSeconds = Math.max(0, Math.floor((Date.now() - stat.mtimeMs) / 1000));

console.error(`GIT_LOCK_BLOCKED: ${lockPath} size=${stat.size} age_seconds=${ageSeconds}`);
console.error('Do not delete the lock automatically. First prove that no Git process is active, identify the interrupted operation and obtain approval for the exact recovery action.');
process.exit(2);
