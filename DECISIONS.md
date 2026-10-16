# True Shot — Decisions Log

Short entries. Newest at the bottom. Agents append new entries here when a plan you approved settles a question; they do not reverse an existing decision without a new approved plan.

| ID | Date | Decision | Why |
|---|---|---|---|
| D-001 | 2026-10-15 | Web app in TypeScript: Vite + React UI, headless sim package, Vitest, Playwright | Everything is text Claude can read and edit, the sim runs fast in Node for tests, and screenshots are easy |
| D-002 | 2026-10-15 | All content is fictional (players, teams, leagues, logos) | Avoids licensing problems; lets the setup generate content freely |
| D-003 | 2026-10-15 | Dynasty uses virtual currency only; no real-money mechanics | Loot-box rules vary by region; keep v1 simple and safe |
| D-004 | 2026-10-15 | Art direction is flat vector cartoon; portraits are procedural SVG | Code can build and verify it; no licensing risk |
| D-005 | 2026-10-15 | Plan-first workflow: no feature code without a plan merged to `main`. Merging a plan PR is the approval. | You asked for approval before coding; only you merge, so merge is a trustworthy signal |
| D-006 | 2026-10-15 | Local-first: you play each PR by checking it out and running it locally. Hosted PR previews (Cloudflare Pages) come later. | You chose local for now; hosting is free and can be added in M6 or earlier |
| D-007 | 2026-10-15 | No backend, accounts or online play in v1 | Keeps the project testable and cheap to run |
| D-008 | 2026-10-15 | Deterministic sim: all randomness through an injected seeded RNG | Makes bugs reproducible and lets agents verify work with batch runs |
