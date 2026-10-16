---
id: "0000"
title: Short plan title
status: proposed
milestone: M0
---

<!--
Write this for the owner, who is NOT reading code and is probably on a phone.
Plain language, player-facing terms, no code, no jargon. Keep it to about one page.
Delete these comments. Do not change `status` after writing it (the gate enforces this).
File name: docs/plans/NNNN-short-slug.md  (NNNN = next unused number)
-->

## Goal
One or two sentences: what will exist when this is done?

## What you'll see and play
What the owner can open and try after this ships. If nothing is visible (pure engine work), say what report or numbers will prove it works.

## In scope
- ...

## Out of scope
- ...

## Approach
Plain-words explanation of how it will be built. Name any new libraries and why (license and size). New libraries need approval here.

## Acceptance criteria
Testable statements. Each one must be checked by an automated test, a sim report or a screenshot.
- [ ] ...

## How you'll play-test it
Numbered steps the owner can follow on a phone or desktop after checking out the PR.
1. ...

## Verification
Which tests, sim reports or screenshots will be produced, and which numbers must land where (reference GAME_DESIGN.md targets).

## Slices
Each slice is one PR of roughly 400 changed lines or fewer, in order.
1. ...

## Risks and unknowns
- ...

## Decisions for the owner
Questions only you can answer. Leave empty if none.

## Requests for owner
Changes needed to protected files (CLAUDE.md, GAME_DESIGN.md, `.claude/`, `.github/`, `scripts/check-plan.mjs`). Agents cannot edit these; you do it by hand. Leave empty if none.

<!--
When the last slice merges, the implementing PR appends a section titled "Outcome" (a level-two heading, on its own line)
saying what shipped, what changed from the plan, and follow-ups. The gate allows editing only the `status:` line and that section after approval.
-->
