#!/usr/bin/env node
// Plan gate for True Shot (see CLAUDE.md, "The workflow").
//
// Rules, checked against the diff between BASE_REF and HEAD:
//  1. Protected files (CLAUDE.md, GAME_DESIGN.md, .claude/, .github/, this gate) cannot change in a PR.
//  2. A plan PR adds docs/plans/NNNN-slug.md with `status: proposed` and contains no code.
//  3. Plans already on the base branch cannot be edited, except the `status:` line and an appended `## Outcome` section. They cannot be deleted.
//  4. A code PR must contain a line `Plan: docs/plans/NNNN-slug.md` naming a plan that already exists on the base branch
//     (that is, one the owner merged) and is not `done`.
//     `Plan: trivial` is allowed only within LIMITS.
//
// Usage: BASE_REF=origin/main PR_BODY="..." node scripts/check-plan.mjs   (or --body-file path)

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMITS = { trivialMaxFiles: 2, trivialMaxLines: 20 };

const OPEN_STATUSES = new Set(['proposed', 'in-progress']);
const PLAN_RE = /^docs\/plans\/\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const PROTECTED_EXACT = new Set([
  'CLAUDE.md',
  'GAME_DESIGN.md',
  'scripts/check-plan.mjs',
  'scripts/check-plan.test.mjs',
  'docs/plans/_TEMPLATE.md',
]);
const PROTECTED_PREFIXES = ['.claude/', '.github/'];
const EXEMPT_EXACT = new Set(['PROGRESS.md', 'DECISIONS.md', 'ROADMAP.md', 'README.md', 'RUNBOOK.md']);

function git(cwd, args) {
  return execFileSync('git', ['-c', 'core.quotepath=false', ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function tryGit(cwd, args) {
  try {
    return git(cwd, args);
  } catch {
    return null;
  }
}

function classify(path) {
  if (PROTECTED_EXACT.has(path) || PROTECTED_PREFIXES.some((p) => path.startsWith(p))) return 'protected';
  if (path.startsWith('docs/plans/')) return PLAN_RE.test(path) ? 'plan' : 'badplan';
  if (EXEMPT_EXACT.has(path) || path.startsWith('docs/')) return 'exempt';
  return 'code';
}

export function frontmatterStatus(text) {
  const fm = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const s = fm[1].match(/^status:\s*"?([a-z-]+)"?\s*$/m);
  return s ? s[1] : null;
}

// What an approved plan may still change: its status line and an appended "## Outcome" section.
function normalizePlan(text) {
  let t = text.replace(/\r\n/g, '\n');
  const fm = t.match(/^---\n([\s\S]*?)\n---/);
  if (fm) {
    t = '---\n' + fm[1].replace(/^status:.*$/m, 'status: _') + '\n---' + t.slice(fm[0].length);
  }
  const outcome = t.search(/^## Outcome\s*$/m);
  if (outcome >= 0) t = t.slice(0, outcome);
  return t.trimEnd();
}

export function checkPlanGate({ baseRef = 'origin/main', prBody = '', cwd = process.cwd() } = {}) {
  const errors = [];
  const range = `${baseRef}...HEAD`;

  const changed = git(cwd, ['diff', '--name-status', '--no-renames', range])
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, ...rest] = line.split('\t');
      return { status: status[0], path: rest.join('\t') };
    });

  const lineCounts = new Map();
  for (const row of git(cwd, ['diff', '--numstat', '--no-renames', range]).split('\n').filter(Boolean)) {
    const [added, deleted, ...rest] = row.split('\t');
    lineCounts.set(rest.join('\t'), (Number(added) || 0) + (Number(deleted) || 0));
  }

  const groups = { protected: [], plan: [], badplan: [], exempt: [], code: [] };
  for (const f of changed) groups[classify(f.path)].push(f);

  for (const f of groups.protected) {
    errors.push(
      `Protected file changed: ${f.path}. Only the owner changes these (commit them yourself; see RUNBOOK.md). Agents: put the request in the plan's "Requests for owner".`,
    );
  }
  for (const f of groups.badplan) {
    errors.push(`Bad plan file name: ${f.path}. Use docs/plans/NNNN-short-slug.md (four digits, lowercase, dashes).`);
  }

  const addedPlans = [];
  for (const f of groups.plan) {
    if (f.status === 'A') {
      addedPlans.push(f.path);
      const status = frontmatterStatus(git(cwd, ['show', `HEAD:${f.path}`]));
      if (status !== 'proposed') {
        errors.push(`New plan ${f.path} must say "status: proposed" (found "${status ?? 'none'}"). Only the owner's merge approves a plan.`);
      }
    } else if (f.status === 'D') {
      errors.push(`Plans cannot be deleted: ${f.path}. Supersede it with a new plan instead.`);
    } else {
      const before = tryGit(cwd, ['show', `${baseRef}:${f.path}`]);
      const after = git(cwd, ['show', `HEAD:${f.path}`]);
      if (before !== null && normalizePlan(before) !== normalizePlan(after)) {
        errors.push(`Approved plan edited: ${f.path}. Only its "status:" line and an appended "## Outcome" section may change. Propose a new plan instead.`);
      }
    }
  }

  const code = groups.code;
  if (addedPlans.length > 0 && code.length > 0) {
    errors.push(
      `A PR that adds a plan must not change code (code changed: ${code.map((f) => f.path).join(', ')}). Open the plan PR alone; implement after the owner merges it.`,
    );
  }

  if (code.length > 0 && addedPlans.length === 0) {
    const match = prBody.match(/^\s*Plan:\s*(.+?)\s*$/im);
    const ref = match ? match[1].replace(/^[`<]+|[`>]+$/g, '').trim() : null;
    if (!ref) {
      errors.push('Code changed but the PR body has no "Plan: docs/plans/NNNN-slug.md" line (or "Plan: trivial").');
    } else if (ref.toLowerCase() === 'trivial') {
      const lines = code.reduce((sum, f) => sum + (lineCounts.get(f.path) ?? 0), 0);
      if (code.length > LIMITS.trivialMaxFiles || lines > LIMITS.trivialMaxLines) {
        errors.push(
          `"Plan: trivial" is only for at most ${LIMITS.trivialMaxFiles} files and ${LIMITS.trivialMaxLines} changed lines (this PR: ${code.length} files, ${lines} lines). Write a plan.`,
        );
      }
    } else if (!PLAN_RE.test(ref)) {
      errors.push(`Plan line "${ref}" is not a plan path like docs/plans/0001-example.md.`);
    } else {
      const onBase = tryGit(cwd, ['show', `${baseRef}:${ref}`]);
      if (onBase === null) {
        errors.push(`${ref} does not exist on ${baseRef}. A plan counts as approved only after the owner merges it.`);
      } else {
        const status = frontmatterStatus(onBase);
        if (!OPEN_STATUSES.has(status)) {
          errors.push(`${ref} has status "${status ?? 'none'}" on ${baseRef}; only proposed or in-progress plans can be implemented.`);
        }
      }
    }
  }

  const summary = `${changed.length} files changed (${code.length} code, ${groups.plan.length} plan, ${groups.exempt.length} docs, ${groups.protected.length} protected)`;
  return { errors, summary };
}

function main() {
  const baseRef = process.env.BASE_REF || 'origin/main';
  const bodyFileIdx = process.argv.indexOf('--body-file');
  const prBody =
    bodyFileIdx >= 0 ? readFileSync(process.argv[bodyFileIdx + 1], 'utf8') : (process.env.PR_BODY ?? '');
  const { errors, summary } = checkPlanGate({ baseRef, prBody });
  if (errors.length > 0) {
    console.error(`Plan gate FAILED (${summary})`);
    for (const e of errors) console.error(` - ${e}`);
    process.exit(1);
  }
  console.log(`Plan gate OK (${summary})`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
