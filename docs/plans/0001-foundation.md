---
id: "0001"
title: Foundation - app shell, checks, screenshots and saves
status: proposed
milestone: M0
---

## Goal
Turn the empty workspace into a runnable game app with a home screen, a `/dev` gallery, automatic phone and desktop screenshots, a save system on the device, and one command (`npm run verify`) that checks everything. This is milestone M0. No gameplay yet.

## What you'll see and play
- `npm run dev` opens True Shot in your browser: a home screen with three tiles (GM, Career, Dynasty), each marked "Coming soon".
- On a phone the layout is a single column. On desktop it widens. Nothing scrolls sideways.
- `/dev` opens the gallery page with empty sections ready for cards, portraits and animations, plus a "Save system" panel.
- In that panel you can create a test save, reload the page and still see it, download it as a file, and load the file back.
- The app can be added to your phone's home screen and opens with its own icon.

## In scope
- Code style check (lint) and auto-formatting, both part of `verify`.
- The web app: home screen, page switching, a "page not found" screen, phone and desktop layouts.
- Install-to-home-screen basics: app name, icon and a cached copy so a reload works without internet.
- Empty `/dev` gallery.
- Automatic screenshot tests at phone (390×844) and desktop (1280×800) size.
- Save system skeleton: saves stored on the device, each tagged with a version number, upgrade steps for old saves (with tests), and export/import to a file.
- Confirming a fresh copy of the repo installs and passes `verify`.

## Out of scope
- Any gameplay, players, teams or sim work (M1).
- Visual style, colours and components (M3). Screens use plain placeholder styling.
- A save screen for players or multiple save slots. The save panel lives only in `/dev` for now.
- Full offline hardening and hosting (M6).

## Approach
- **Lint and format:** one tool, **Biome** (MIT, about 25 MB installed, developer-only, nothing ships to players). It replaces the usual two tools with one. Protected files (gate scripts, `.claude/`, `.github/`) are excluded from formatting so it never touches them.
- **Web app:** **Vite** (MIT, developer-only) with its React plugin (MIT), and **React + React DOM** (MIT, about 60 KB compressed in the shipped app). Page switching is a small hand-written router, so no extra library. A new `packages/web` folder; it may use the sim package, never the other way round.
- **Install basics:** a hand-written app manifest, an original simple icon (a basketball mark, no real-world logos) and a small offline cache. No PWA plugin.
- **Screenshots:** **Playwright test runner** (Apache-2.0, developer-only, plus a one-time Chromium download of about 150 MB). A helper captures any page at both sizes. These run as `npm run test:e2e`, separate from `verify`, until CI can install a browser (see Requests).
- **Saves:** stored in the browser's built-in database (IndexedDB), no library. Every save carries a version number. Loading an older save runs upgrade steps in order. A save file from a newer game version is refused with a clear message, never half-loaded. Tests use **fake-indexeddb** (Apache-2.0, developer-only, under 1 MB) to stand in for the browser database.
- `verify` grows to: lint, typecheck, unit tests, gate tests and a production build of the app.

## Acceptance criteria
- [ ] A fresh clone runs `npm ci` then `npm run verify` green. Recorded in the slice 1 PR, and CI is green.
- [ ] `verify` fails when a file breaks a lint or formatting rule (test or recorded failing run).
- [ ] Home, `/dev` and an unknown address each render at 390×844 and 1280×800 with no sideways scroll and no console errors (Playwright tests plus screenshots).
- [ ] Buttons and tiles are at least 44 px tall and wide (Playwright test).
- [ ] The built app has a valid manifest and icon, and a reload with the network turned off still shows the home screen (Playwright test).
- [ ] Saves survive a page reload (Playwright test) and save, load, list and delete work (unit tests).
- [ ] An old-version save is upgraded step by step to the current version (unit test with a stored sample file).
- [ ] Export then import gives back an identical save; broken or newer-version files are rejected with a message (unit and Playwright tests).

## How you'll play-test it
1. Check out the PR, run `npm install`, then `npm run dev`, and open the address it prints.
2. See the home screen and three "Coming soon" tiles. Narrow the window to phone width; nothing should cut off or scroll sideways.
3. Go to `/dev`. Use the Save system panel: create a save, reload, see it still listed.
4. Export it (a file downloads), delete it, import the file; it comes back.
5. Optional on phone: run `npm run dev:lan`, open the printed address on your phone on the same Wi-Fi.
6. Run `npm run test:e2e` and look at the screenshots it lists.

## Verification
`npm run verify` green in every PR. From slice 4 on, each UI PR includes playtester screenshots at both sizes. No sim numbers apply to M0.

## Slices
1. **Clean-checkout check, lint and formatting.** Fresh-clone `verify` run recorded; Biome added; lint and format checks in `verify`; one-time format of existing files. You see: no visible change; CI stays green.
2. **Web app shell.** `packages/web`, home screen, page switching, not-found page, empty `/dev` gallery, phone and desktop layouts, `dev`, `dev:lan` and `build` commands; app typecheck and build join `verify`. You see: the home screen and `/dev`.
3. **Install basics.** Manifest, icon, offline cache. You see: "Add to home screen" works and gives the True Shot icon.
4. **Screenshot harness.** Playwright, phone and desktop helper, smoke tests for slices 2 and 3, `test:e2e` command. You see: screenshots of every page at both sizes.
5. **Save storage and versions.** Versioned save format, upgrade steps, device storage, unit tests with sample old save. You see: nothing new on screen; tests prove it.
6. **Export, import and the `/dev` save panel.** Download and load save files, error messages, Playwright round-trip test. You see: the Save system panel.

## Risks and unknowns
- Offline caching can serve stale pages during development; the cache is only switched on in the built app, not in `npm run dev`.
- Until CI installs a browser, screenshot tests run only on your machine and in agent sessions, not on GitHub.
- The one-time format in slice 1 may touch many lines; if it pushes the PR over about 400 lines it becomes its own PR.

## Decisions for the owner
1. Is Biome (one tool for lint and format) fine, rather than the more common two-tool setup? Default: Biome.
2. Should the Playwright screenshot tests block merges once CI can run them? Default: yes.
3. Is a `dev:lan` command that shows the game to devices on your home Wi-Fi acceptable? Default: yes, only when you run it.

## Requests for owner
1. **`CLAUDE.md` command list:** after slices merge, add `npm run lint`, `npm run format`, `npm run dev`, `npm run dev:lan`, `npm run build`, `npm run test:e2e`.
2. **`.github/workflows/ci.yml`:** after slice 4 merges, add a job that installs the Chromium browser for Playwright and runs `npm run test:e2e`, keeping screenshots as a downloadable result. Then mark it a required check in branch protection if you answer yes to decision 2.
