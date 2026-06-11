# 0001 — Skills are organized into buckets under `skills/`

## Status

Accepted (2026-06-11).

## Context

The repository started as a flat list of skill directories at the repo root. As more skills were added, two problems became clear:

1. **The top-level `README.md` grew in lockstep with the number of skills.** New skills had to be remembered, and a few drifted in unreferenced (e.g. `follow-frontend`, `fork-issue-workflow` were never added to the original README table).
2. **There was no place to put "not for general use" skills.** A skill tied to a personal environment, a draft not ready to ship, or a retired skill had no obvious home — keeping them at the root blurred the line between "promoted" and "kept around."

The `plugin.json` manifest used by Claude Code / Codex also had to be hand-maintained, with no rule saying which skills belong in it.

## Decision

Adopt a six-bucket layout under `skills/`:

- `engineering/` — daily code work
- `productivity/` — workflow tools that are not strictly engineering
- `design/` — creative exploration tools
- `personal/` — tied to a specific user environment
- `in-progress/` — drafts not ready to ship
- `deprecated/` — retired skills, kept for history

The first three buckets are **promoted**: their skills appear in the top-level `README.md` and in `.claude-plugin/plugin.json`. The last three are **hidden**: they are reachable on disk but excluded from both the README and the plugin manifest. `scripts/link-skills.sh` also skips them.

## Consequences

Positive:

- The top-level README becomes a stable index that only grows when a new *bucket-promoted* skill lands.
- New authors get a one-question decision: "which bucket does this belong to?" — and the bucket itself answers "is it promoted?"
- Hidden buckets give personal and in-progress skills an honest home without polluting the user-facing surface.

Negative / trade-offs:

- Anyone reading an older commit must learn the bucket convention.
- The two source-of-truth files (`README.md` and `plugin.json`) must be kept in sync by convention; the `CLAUDE.md` rule "they must list exactly the same promoted skills" is the enforcement mechanism (manual review).

## Alternatives considered

- **Keep flat, fix the README by hand.** Rejected: doesn't scale, and there's no place for personal/draft skills.
- **Single `promoted` flag per skill (e.g. `promoted: true` in frontmatter).** Rejected: hides intent. Buckets also serve as discovery ("what kind of skills do I have?").
