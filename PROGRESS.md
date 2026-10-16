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

## 2026-10-15 — Plan 0001 (M0 Foundation) proposed
- Done: planner wrote docs/plans/0001-foundation.md (6 slices: lint/format + clean-checkout check, web shell, install basics, Playwright screenshots, save storage/versions, export/import + /dev save panel).
- PR: plan PR on branch plan/0001-foundation
- Next: owner reviews and merges the plan PR (3 decisions, 2 protected-file requests inside); then build slice 1.

## 2026-10-15 — Starter kit created
- Done: design doc, roadmap, plan-first workflow, agents, CI and plan gate, minimal `sim` package.
- Next: run the kickoff prompt in RUNBOOK.md so the planner writes plan 0001 for milestone M0.
