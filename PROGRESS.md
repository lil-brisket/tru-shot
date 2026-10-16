# True Shot — Progress Log

Newest entry at the top. Keep each entry to 10 lines or fewer. Add an entry after every merged-ready PR and whenever a run stops early.

Entry format:

```
## YYYY-MM-DD — <plan id or topic>
- Done: ...
- PR: <link or number>
- Stopped because: <only if a run ended early, e.g. usage limit, blocked, needs-human>
- Next: ...
```

## 2026-10-15 — Plan 0001 slice 3: install basics
- Done: app manifest, original basketball icon (SVG + 192/512/180 PNG, drawn by `scripts/make-icons.mjs` from one set of shapes), offline cache (a build step lists every built file; the cache only runs in the built app). New `npm run preview` (build, then serve the built app). Unit tests run the generated worker against fake browser parts.
- Checked by hand in real Edge (throwaway Playwright in scratchpad, not added to repo): offline reload of `/` and `/dev` works at 390×844 and 1280×800, manifest icons load at their stated sizes, no console errors. Playtester skipped: the repo's Playwright harness arrives in slice 4.
- Note: phones on home Wi-Fi (`dev:lan`) use plain http, so Android won't fully install and the offline cache won't run there; desktop and localhost do. Proper https hosting is M6.
- PR: feat/0001-install-basics (slice 3)
- Next: slice 4, screenshot harness (turn the hand check above into a real Playwright test). Owner request: add `npm run preview` to the CLAUDE.md command list.

## 2026-10-15 — Plan 0001 slice 2: web app shell
- Done: `packages/web` (Vite 8.3.4, React 19.3.1, hand-written router): home with GM/Career/Dynasty "Coming soon" tiles, `/dev` gallery placeholder, not-found page. New commands `dev`, `dev:lan`, `build`; `verify` now ends with a production build. Playtester PASS at 390×844 and 1280×800 (no sideways scroll, no console errors, targets ≥ 44 px).
- Note: the owner's CLAUDE.md command-list edit is still uncommitted locally; agents are blocked from committing protected files, so the owner commits it.
- PR: feat/0001-web-shell (slice 2)
- Next: slice 3, install basics (manifest, icon, offline cache). Owner request: add `dev`, `dev:lan`, `build` to the CLAUDE.md command list.

## 2026-10-15 — Plan 0001 slice 1: clean-checkout check, lint and formatting
- Done: fresh clone of main passes `npm ci` + `verify` (Node 24, npm 9.9). Added Biome 2.5.15 (`npm run lint`, `npm run format`); lint runs first in `verify`. Protected files excluded from Biome. Added `.gitattributes` (LF everywhere) so the format check agrees on Windows. One-time format touched one file.
- Note: `npm audit` reports 3 issues in the existing vitest 3 chain (already on main, not from Biome); fixing needs a vitest major bump, which needs a plan.
- PR: feat/0001-foundation (slice 1)
- Next: slice 2, the web app shell. Owner request: add `npm run lint` and `npm run format` to the CLAUDE.md command list.

## 2026-10-15 — Plan 0001 (M0 Foundation) proposed
- Done: planner wrote docs/plans/0001-foundation.md (6 slices: lint/format + clean-checkout check, web shell, install basics, Playwright screenshots, save storage/versions, export/import + /dev save panel).
- PR: plan PR on branch plan/0001-foundation
- Next: owner reviews and merges the plan PR (3 decisions, 2 protected-file requests inside); then build slice 1.

## 2026-10-15 — Starter kit created
- Done: design doc, roadmap, plan-first workflow, agents, CI and plan gate, minimal `sim` package.
- Next: run the kickoff prompt in RUNBOOK.md so the planner writes plan 0001 for milestone M0.
