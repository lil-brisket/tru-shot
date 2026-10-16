# True Shot — Game Design

Version 0.1. Owner: you. **Agents never edit this file** (it is a protected path). Agents may propose changes in a plan's "Requests for owner" section; you edit this file by hand.

Anything marked **DEFAULT** is an assumption written on your behalf from a short brief. Change it whenever you like. Nothing marked DEFAULT is sacred.

## 1. Pitch

True Shot is a basketball game about building teams and players, played through menus, stats and polished visuals rather than twitch controls. It has three modes (GM, Career, Dynasty) that all run on one shared, deterministic basketball simulation.

## 2. Pillars

1. **It has to feel like basketball.** Box scores, season stats and star performances must be credible. A sim that produces nonsense ruins every mode.
2. **Deep menus, delightful presentation.** Stat-and-menu gameplay, with flat-vector art, player portraits on every card and satisfying animation where it counts (especially pack opening).
3. **One engine, three modes.** Modes are different wrappers around the same sim, league and player model.
4. **Phone-first, desktop-good.** One responsive web app. Every screen must work in portrait on a phone.
5. **Fair and transparent.** Pack odds are shown in game. There is no real-money spending.
6. **Always playable.** Every merged change leaves the game runnable.

## 3. Platform and tech (summary; see DECISIONS.md)

- Browser game, mobile-first responsive, installable as a PWA, works offline.
- Saves live on the device (IndexedDB), with export and import of save files. **No backend, accounts or online play in v1.**
- TypeScript (strict), Vite + React for the UI, Vitest for tests, Playwright for end-to-end and screenshots.
- npm workspaces: `packages/sim` (headless game logic, no DOM) and `packages/web` (UI). `sim` never imports from `web`.
- Touch targets at least 44 px. Layouts verified at 390×844 (phone) and 1280×800 (desktop).

## 4. Shared simulation engine

A pure function: `simulateGame(homeTeam, awayTeam, options, rng) → GameResult`. Same inputs and same seed must always give the same result.

- **Possession-based.** Each possession picks a ball handler, an action, a shot type or turnover, a result, and a rebound or foul. Fatigue and substitutions follow minutes and stamina.
- **Output:** final score, full box score, and a play-by-play event log (a text feed is enough; no animated court in v1).
- **All randomness comes from an injected seeded RNG.** No `Math.random`, `Date.now` or `new Date()` anywhere in `packages/sim` (a test enforces this).
- **Game length is configurable** (needed for Dynasty's short games).

### Player ratings (DEFAULT)

15 ratings, 0–99: Height, Strength, Speed, Vertical, Stamina, Inside Scoring, Mid-Range, Three-Point, Free Throw, Ball Handling, Passing, Rebounding, Interior Defense, Perimeter Defense, Basketball IQ. Overall rating and position are derived from ratings, not stored. Heights and physical ratings are consistent with real-world human ranges.

### Realism targets (DEFAULT; tune through a plan, never by quietly editing tests)

League-wide, modern-era style, averaged over a full simulated season:

| Stat (per team per game) | Target range |
|---|---|
| Points | 100 – 118 |
| Pace (possessions per 48 min) | 92 – 104 |
| Field goal % | 44 – 49 |
| Three-point % | 33 – 38 |
| Free throw % | 74 – 80 |
| Turnovers | 11 – 16 |
| Rebounds | 40 – 48 |

Also: league leading scorers average roughly 27 – 34 points; a team whose rotation averages +10 overall beats an average team more than 70% of the time, but never 100%; a 7-footer out-rebounds a guard of otherwise equal ratings; stats stay stable across 30 simulated seasons (no inflation, no collapse).

### Performance (DEFAULT)

A full 30-team, 82-game season simulates headlessly in under 20 seconds on a normal laptop.

## 5. Mode: GM

A full franchise sim in the spirit of classic GM games. You run a team across many seasons. **No scripted story or dialogue.** Everything is systems.

**Starting a league (all content fictional):**
- *Random players:* a fully generated league.
- *Fantasy draft:* all generated players are pooled and you and the AI teams draft them.

**Core features, in priority order:**
1. League generation: DEFAULT 30 teams, 2 conferences. Original player names and team nicknames.
2. Season loop: schedule (DEFAULT 82 games, with shorter season options), standings, playoffs (DEFAULT 16 teams, best-of-7), awards.
3. Roster management: starters, rotation and minutes, lineups.
4. Draft: DEFAULT 2 rounds with a lottery. Prospect ratings are shown with scouting uncertainty.
5. Contracts and salary cap: DEFAULT soft cap with minimum payroll, luxury tax and a rookie scale.
6. Free agency: players have asking amounts and preferences.
7. Trades: AI valuation that cannot be exploited by trivial tricks (a test suite probes this).
8. Player development: age curves, potential, randomness, injuries, retirement.
9. AI-run teams that behave sensibly (draft, sign, trade, cut).
10. History: records, leaders, player pages, retired players.
11. Later: owner mood and finances, Hall of Fame, difficulty settings, multiple save slots.

## 6. Mode: Career

You create one player and develop them through a career. RPG-style progression, driven by systems, not story.

- **Create a player:** name, portrait builder, height and build, archetype, starting attributes by point-buy, entry route (DEFAULT: draft position or undrafted).
- **Development:** earn experience from performance; choose training focus between games; attributes grow toward a potential ceiling and decline with age; unlockable traits or badges give small, bounded sim modifiers.
- **Playing time:** your role and minutes depend on your ratings, team depth and coach trust. The rest of the league runs on the same league engine as GM mode, simulated without you managing it.
- **Playing games:** the game is simulated; you see your box score, highlights feed and development progress. DEFAULT: an optional pre-game style choice (for example "shoot more" or "play defense") with bounded effect.
- **Contracts:** simplified offers when your deal ends; choose a team.
- **Goals and legacy:** milestones, awards and a legacy score. Retirement ends the run.
- **Out of scope:** scripted narrative, dialogue trees, relationships as story.

## 7. Mode: Dynasty

A card-collecting auto-battler with gacha-style packs. **Virtual currency only; no real-money purchases.**

- **Cards:** each card is a fictional player (portrait, ratings, rarity, one trait). DEFAULT rarities: Common, Rare, Epic, Legendary, Mythic. Rarity must be distinguishable by shape or icon, not only color.
- **Currency:** DEFAULT one soft currency ("Coins") earned from battles and daily challenges.
- **Packs:** several tiers, bought with Coins. **Odds are displayed in the pack screen.** DEFAULT pity rule: a guaranteed Epic-or-better within a fixed number of packs. Duplicates convert to a crafting resource (DEFAULT "Essence") used to upgrade or craft cards.
- **Team building:** DEFAULT roster of 8 (5 starters, 3 bench). Simple synergy tags (archetypes, sets) give small bonuses.
- **Battles:** auto-battles run on the shared sim with your lineup. DEFAULT: short games (two 6-minute halves) so a battle takes seconds. Ladder with divisions, seasons and rewards.
- **Economy rules live in one config file.** A test suite simulates the economy (average packs to first Legendary, time to complete a set, currency inflation) and flags drift.
- **Fairness:** no countdown pressure tricks, no hidden odds, no pay-to-win. If real-money packs are ever considered, that is a separate decision requiring your explicit approval and a check of regional loot-box laws.
- **Out of scope for v1:** trading between players, online PvP, real-money purchases.

## 8. Visual direction

**Flat vector cartoon.** Bold shapes, flat fills with minimal gradients, consistent line weight, team colors driving UI accents.

- **Player portraits:** generated procedurally as layered SVG (head shape, skin tone, hair, facial hair, eyes, brows, nose, mouth, accessories) from a seed, so every player is unique, consistent and licensing-free. Every player and card shows a portrait.
- **Cards:** rarity frames, ratings, trait icon, portrait. Collection grid and detail views.
- **Animation:** done in code (CSS, SVG, canvas). The pack opening has three beats (anticipation, reveal, summary), with flair that scales with rarity. A skip button is always visible. Respect `prefers-reduced-motion`.
- **Accessibility:** WCAG AA contrast, rarity not conveyed by color alone, readable text sizes on phones.
- **Dev gallery:** a `/dev` route shows every card rarity, portrait variants, animations and key components in one place, with controls to open a pack or simulate a season instantly. This is where you review visuals.
- **Third-party assets:** allowed only if the license permits it. Each one is logged with its license in `assets/LICENSES.md`. Until real art exists, placeholders are used and tracked in an asset manifest.

## 9. Content and legal guardrails

- All players, teams, leagues and logos are fictional. No real NBA or other real-world names, logos or trademarks. Real city names with original nicknames are fine.
- Original name pools, original team nicknames, original logos.
- No real-money mechanics. No gambling-style wording.

## 10. Non-goals

Real-time controlled gameplay, 3D graphics, online multiplayer, story or dialogue systems, licensed content, real-money purchases.

## 11. Open questions for the owner

Answer whenever you want. Agents must not decide these on their own.

1. League size, season length and playoff format defaults (see section 5).
2. Dynasty: should cards level up, merge, or both?
3. Any reference games for look and feel?
4. Team naming style (city + animal, city + object, something else)?
5. Difficulty: one league difficulty setting, or several named ones?
