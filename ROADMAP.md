# True Shot — Roadmap

Maintained by the `planner` agent (and you). One milestone at a time. A milestone is done only when its items are merged and you have played it.

Order: M0 → M1 → M2 → M3 → M4 → M5 → M6. Do not start a later milestone while an earlier one has open items, unless you say so.

## M0 — Foundation
- [ ] Lint and formatting in `verify`
- [ ] `packages/web` shell: Vite + React, responsive layout, routing, PWA basics
- [ ] `/dev` gallery route (empty, ready for components)
- [ ] Playwright harness with phone (390×844) and desktop (1280×800) screenshot helper
- [ ] Save system skeleton (IndexedDB, versioned schema, migration tests, export/import)
- [ ] CI workflow green on a clean checkout (`.github/workflows/ci.yml` already exists)

## M1 — Sim core
- [ ] Player and team data model, rating definitions, derived overall and position
- [ ] Name generator and random player generator (fictional)
- [ ] Possession-based game sim with box score and play-by-play log
- [ ] Golden-stat tests against the targets in GAME_DESIGN.md section 4
- [ ] Batch runner CLI (`npm run sim:batch`) that prints a season-level report
- [ ] Performance test (season under 20 s headless)

## M2 — GM mode
- [ ] League generation (random players and fantasy draft start)
- [ ] Season loop: schedule, standings, playoffs, awards
- [ ] Roster, rotation and minutes screens
- [ ] Draft with lottery and scouting uncertainty
- [ ] Contracts, salary cap, luxury tax
- [ ] Free agency
- [ ] Trades with AI valuation and exploit-probe tests
- [ ] Progression, injuries, retirement
- [ ] AI team management
- [ ] History, records, player pages
- [ ] Multi-season stability test (30 simulated seasons)

## M3 — Visual system
- [ ] Design tokens and base components (flat vector style)
- [ ] Procedural portrait generator (SVG layers, seeded)
- [ ] Player card component with rarity frames
- [ ] Portraits wired into GM screens

## M4 — Career mode
- [ ] Create-a-player flow with portrait builder and point-buy
- [ ] Development system: experience, training focus, age curve, potential
- [ ] Traits and badges (bounded sim modifiers)
- [ ] Career game loop and highlights feed
- [ ] Contracts and team choice
- [ ] Goals, legacy score, retirement

## M5 — Dynasty mode
- [ ] Card model and rarity system
- [ ] Economy config and economy simulation tests
- [ ] Packs: tiers, odds screen, pity rule, duplicates to Essence
- [ ] Pack opening animation (three beats, rarity-scaled, skippable)
- [ ] Collection and card detail screens
- [ ] Team builder with synergy tags
- [ ] Auto-battle on the shared sim (short games)
- [ ] Ladder, divisions, rewards

## M6 — Polish and release prep
- [ ] Balance pass across all modes
- [ ] Performance and bundle-size pass
- [ ] Accessibility pass
- [ ] Offline/PWA hardening
- [ ] Decide on hosting (Cloudflare Pages previews) and app-store wrapper
