import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkPlanGate } from './check-plan.mjs';

function plan(status, extra = '') {
  return `---\nid: "0001"\ntitle: Example\nstatus: ${status}\nmilestone: M0\n---\n\n## Goal\nBuild the thing.\n${extra}`;
}

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'plan-gate-'));
  const git = (...args) => execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], { cwd: dir, stdio: 'pipe' });
  const write = (path, text) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  write('README.md', 'hello\n');
  write('src/game.ts', 'export const a = 1;\n');
  write('docs/plans/0001-example.md', plan('proposed'));
  write('docs/plans/0002-finished.md', plan('done'));
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  git('checkout', '-q', '-b', 'work');
  const commit = () => {
    git('add', '-A');
    git('commit', '-q', '-m', 'work');
  };
  return { dir, write, commit, git, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function gate(repo, prBody = '') {
  return checkPlanGate({ baseRef: 'main', prBody, cwd: repo.dir });
}

function withRepo(fn) {
  const repo = makeRepo();
  try {
    fn(repo);
  } finally {
    repo.cleanup();
  }
}

test('code change without a Plan line fails', () =>
  withRepo((r) => {
    r.write('src/game.ts', 'export const a = 2;\n'.repeat(30));
    r.commit();
    const { errors } = gate(r, 'no plan here');
    assert.equal(errors.length, 1);
    assert.match(errors[0], /no "Plan:/);
  }));

test('code change referencing a plan already on main passes', () =>
  withRepo((r) => {
    r.write('src/game.ts', 'export const a = 2;\n'.repeat(30));
    r.commit();
    const { errors } = gate(r, 'Plan: docs/plans/0001-example.md\n\nMore text');
    assert.deepEqual(errors, []);
  }));

test('code change referencing a plan that is not on main fails', () =>
  withRepo((r) => {
    r.write('src/game.ts', 'export const a = 2;\n'.repeat(30));
    r.commit();
    const { errors } = gate(r, 'Plan: docs/plans/0009-missing.md');
    assert.match(errors.join('\n'), /does not exist on main/);
  }));

test('code change referencing a finished plan fails', () =>
  withRepo((r) => {
    r.write('src/game.ts', 'export const a = 2;\n'.repeat(30));
    r.commit();
    const { errors } = gate(r, 'Plan: docs/plans/0002-finished.md');
    assert.match(errors.join('\n'), /status "done"/);
  }));

test('plan-only PR with status proposed passes', () =>
  withRepo((r) => {
    r.write('docs/plans/0003-new.md', plan('proposed'));
    r.write('PROGRESS.md', 'note\n');
    r.commit();
    assert.deepEqual(gate(r, '').errors, []);
  }));

test('new plan that marks itself approved fails', () =>
  withRepo((r) => {
    r.write('docs/plans/0003-new.md', plan('approved'));
    r.commit();
    assert.match(gate(r).errors.join('\n'), /must say "status: proposed"/);
  }));

test('plan and code in the same PR fails (cannot self-approve)', () =>
  withRepo((r) => {
    r.write('docs/plans/0003-new.md', plan('proposed'));
    r.write('src/game.ts', 'export const a = 3;\n'.repeat(30));
    r.commit();
    const { errors } = gate(r, 'Plan: docs/plans/0003-new.md');
    assert.match(errors.join('\n'), /must not change code/);
  }));

test('editing an approved plan body fails', () =>
  withRepo((r) => {
    r.write('docs/plans/0001-example.md', plan('proposed', '\nAlso build a casino.\n'));
    r.commit();
    assert.match(gate(r).errors.join('\n'), /Approved plan edited/);
  }));

test('changing only status and appending Outcome to an approved plan passes', () =>
  withRepo((r) => {
    r.write('docs/plans/0001-example.md', plan('done') + '\n## Outcome\nShipped it.\n');
    r.commit();
    assert.deepEqual(gate(r).errors, []);
  }));

test('deleting a plan fails', () =>
  withRepo((r) => {
    rmSync(join(r.dir, 'docs/plans/0001-example.md'));
    r.commit();
    assert.match(gate(r).errors.join('\n'), /cannot be deleted/);
  }));

test('bad plan file name fails', () =>
  withRepo((r) => {
    r.write('docs/plans/My Plan.md', plan('proposed'));
    r.commit();
    assert.match(gate(r).errors.join('\n'), /Bad plan file name/);
  }));

for (const path of ['CLAUDE.md', 'GAME_DESIGN.md', '.claude/agents/x.md', '.github/workflows/ci.yml', 'scripts/check-plan.mjs']) {
  test(`protected file ${path} fails`, () =>
    withRepo((r) => {
      r.write(path, 'changed\n');
      r.commit();
      assert.match(gate(r).errors.join('\n'), /Protected file changed/);
    }));
}

test('Plan: trivial passes within limits', () =>
  withRepo((r) => {
    r.write('src/game.ts', 'export const a = 5;\n');
    r.commit();
    assert.deepEqual(gate(r, 'Plan: trivial').errors, []);
  }));

test('Plan: trivial fails when too many lines or files', () =>
  withRepo((r) => {
    r.write('src/game.ts', 'export const a = 5;\n'.repeat(40));
    r.commit();
    assert.match(gate(r, 'Plan: trivial').errors.join('\n'), /only for at most/);
  }));

test('Plan: trivial fails when too many files', () =>
  withRepo((r) => {
    r.write('src/a.ts', 'x\n');
    r.write('src/b.ts', 'x\n');
    r.write('src/c.ts', 'x\n');
    r.commit();
    assert.match(gate(r, 'Plan: trivial').errors.join('\n'), /only for at most/);
  }));

test('docs-only PR needs no plan', () =>
  withRepo((r) => {
    r.write('PROGRESS.md', 'a note\n');
    r.write('docs/notes.md', 'notes\n');
    r.commit();
    assert.deepEqual(gate(r).errors, []);
  }));
