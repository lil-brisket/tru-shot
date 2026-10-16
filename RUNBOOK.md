# True Shot — Runbook

How to set this up on your computer and run the plan-first loop. Written for you, the owner.

## 1. How the loop works

```
You: "write the next plan"  →  planner writes docs/plans/NNNN-slug.md  →  shipper opens a plan PR
You read the plan (phone is fine)  →  merge it = approved   (or comment what to change)
You: "build the next approved slice"  →  implementer + testers + reviewer  →  shipper opens a code PR
CI runs verify + plan gate  →  you play the PR locally  →  merge or comment
```

Two merges per feature: the plan, then the code. The plan gate (`scripts/check-plan.mjs`, run in CI) makes the order unbreakable: a code PR must name a plan that is already on `main`, and a PR that adds a plan can't contain code, so the AI cannot approve its own plan.

## 2. One-time setup

1. **Unzip** the kit and open a terminal in the `true-shot` folder.
2. **Initialise git:** `git init -b main`, then make the first commit.
3. **Install and verify:** `npm install`, then `npm run verify`. It should end green. **Commit the generated `package-lock.json`.** CI uses `npm ci` and will fail without it. (I could not run `npm install` where I built this kit, so the TypeScript and Vitest part has not been executed end to end yet. If `verify` fails on your machine, paste me the error and I'll fix it.)
4. **Create a private GitHub repo and push** (for example `gh repo create true-shot --private --source . --push`).
5. **Protect `main`** in the repo's Settings (Branches or Rules): require a pull request before merging, require the status checks named `verify` and `plan-gate`, and block force pushes. Make sure the checks have run once so GitHub lists them.
6. **Check `gh` works:** `gh auth status`. The shipper uses it.
7. **Install Claude Code** and start it in the repo folder with `claude`. Confirm it loaded the agents (the `/agents` command lists them).

### Recommended before you leave it unattended

The deny rules in `.claude/settings.json` (no merging, no force-push, no editing protected files) are a good-faith guardrail, not a security boundary: Claude Code's own documentation says command rules can be sidestepped by differently written commands. The real boundary is GitHub. If Claude Code runs under your own GitHub login, it technically has your permissions.

Safer: create a second GitHub account (or a fine-grained token limited to this repo with only contents and pull-request write access), log `gh` in as that identity for Claude Code, and keep your own account as the only one that can merge. Branch protection then applies to the agent for real.

### Changing protected files yourself

`CLAUDE.md`, `GAME_DESIGN.md`, `.claude/`, `.github/` and the gate scripts are protected: agents can't edit them, and the gate fails any PR that touches them. To change one, edit it yourself and commit straight to `main` (as repo admin), or open a PR and merge it past the failing gate.

## 3. Daily use

### Ask for a plan (first time: milestone M0)

```
Read CLAUDE.md, GAME_DESIGN.md, ROADMAP.md and PROGRESS.md. Use the planner agent to write
plan 0001 for milestone M0 (Foundation), split into slices. Then use the shipper agent to open
a plan PR on branch plan/0001-foundation. Write no code. Stop once the PR is open and give me
the link and any questions.
```

Later: replace "plan 0001 for milestone M0" with "the next plan for the next unchecked ROADMAP item".

### Approve or change a plan

Open the PR on GitHub (phone works). Merge it to approve. To request changes, comment in plain English, then tell Claude:

```
Read the comments on PR #<n>, revise the plan to address them, and push to the same branch.
```

(Editing is allowed while the plan is still in its own PR. After it merges, it's locked.)

### Build the next approved slice

```
git pull main first. Then check `gh pr list` and PROGRESS.md and find the lowest-numbered plan in
docs/plans/ that isn't done and whose next slice has no open PR. Implement just that one slice
following CLAUDE.md (implementer, the required testers and reviewer, npm run verify), then have the
shipper open the PR on branch feat/NNNN-slug with the "Plan:" line. Stop after one slice.
```

### Play a PR

```
gh pr checkout <number>
npm install
npm run dev        # exists after the M0 plan ships; for your phone on the same Wi-Fi, ask Claude to add a --host option
```

Merge if you like it. If not, comment in plain English ("rebounds feel too low", "pack opening is too slow") and tell Claude to read the PR comments and fix them.

### Staying hands-off on a $20 plan

- **Batch your approvals.** Have Claude write several plans, each in its own plan PR. Approve them in one sitting. Then every build session has an approved slice waiting.
- **One slice per session.** Small, well-scoped work is cheaper and more reliable than long sessions. Start a fresh session per slice.
- **Use the strongest model only where it matters** (planning and review). The agent files already pick Opus, Sonnet or Haiku by role. For the main session, check `/model` in Claude Code and choose per session.
- **Measure.** The article you shared logs the 5-hour and weekly usage percentages from the status line so you can see what a PR costs. Worth copying once you have a few PRs.
- Check current plan limits at support.claude.com. They change.

## 4. What's in the kit

| Path | What it is |
|---|---|
| `GAME_DESIGN.md` | The design. Yours to edit; agents can't. Items marked DEFAULT are my assumptions. |
| `CLAUDE.md` | Rules every Claude Code session follows, including the plan-first workflow. |
| `ROADMAP.md` | Milestones M0 to M6 as checklists. |
| `DECISIONS.md`, `PROGRESS.md` | Decision log and running progress log. |
| `docs/plans/` | Plans. `_TEMPLATE.md` is what the planner copies. |
| `.claude/agents/` | planner, scoper, implementer, simtester, playtester, reviewer, shipper. |
| `.claude/settings.json` | Permission allow and deny rules for Claude Code. |
| `.github/` | CI workflow and PR template. |
| `scripts/check-plan.mjs` | The plan gate, with its own tests. |
| `packages/sim/` | Starter sim package: seeded RNG plus a purity test that bans `Math.random`, `Date.now` and web imports. |

## 5. Not set up yet (on purpose)

- **Headless or scheduled runs.** Claude Code's automation flags and scheduling change often, and I could not verify them here. Do manual sessions for the first few PRs while the rules settle, then we add a runner using the current docs.
- **Hosted PR previews.** You chose local for now. Cloudflare Pages is free for this and can be added in M6 or earlier (see DECISIONS.md D-006).
- **The web app, Playwright and lint.** These are M0 roadmap items, so the planner will plan them and you'll approve them.

## 6. If the plan gate fails

| Message | Meaning |
|---|---|
| `no "Plan:" line` | Add `Plan: docs/plans/NNNN-slug.md` to the PR description. |
| `does not exist on origin/main` | The plan isn't merged yet. Merge the plan PR first. |
| `must not change code` | A plan PR also contained code. Split them. |
| `Approved plan edited` | Plans are locked after merge. Write a new plan. |
| `Protected file changed` | See "Changing protected files yourself". |
| `Plan: trivial ... only for at most 2 files and 20 lines` | Too big for the shortcut. Write a plan. |

## 7. Honest limits of this kit

- The plan gate has 20 passing tests. The RNG logic and strict type check passed here, but `npm install`, Vitest and the full `verify` could not run in my sandbox, so run `npm run verify` first.
- The agents are well-formed but have not been exercised in a live Claude Code session. Expect to tune their prompts after the first few runs. Do that by editing `.claude/agents/*.md` and `CLAUDE.md` yourself.
- GitHub Actions versions in `ci.yml` (`checkout@v4`, `setup-node@v4`) work today. Newer majors may exist.
- "No story lines" is applied as: no scripted narrative or dialogue anywhere. Career mode is systems-driven. Say so if you meant something narrower.
