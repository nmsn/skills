# Project rules for Claude

This file is the rulebook for the `nmsn/skills` repository. Anything that disagrees with it is wrong, not this file.

## Layout

Skills are organized into bucket folders under `skills/`:

- `skills/engineering/` — daily code work (summarizing, documenting, committing)
- `skills/productivity/` — workflow tools that are not strictly engineering (issue triage, GitHub consumption, feed aggregation)
- `skills/design/` — creative exploration tools (design inspiration search)
- `skills/personal/` — skills tied to a specific user environment; not promoted
- `skills/in-progress/` — drafts not yet ready to ship; excluded from the plugin and the top-level README
- `skills/deprecated/` — retired skills, kept for history; excluded from the plugin and the top-level README

The top-level `README.md` lists skills from `engineering/`, `productivity/`, and `design/` only. Skills in `personal/`, `in-progress/`, and `deprecated/` are hidden by design.

`.claude-plugin/plugin.json` mirrors the top-level `README.md`: it lists exactly the same promoted skills, no more, no less.

## Per-skill directory

Each skill lives in its own directory. Allowed contents:

- `SKILL.md` — required
- `scripts/` — optional, for executable helpers
- `examples/` — optional, for sample inputs/outputs

Disallowed contents:

- Per-skill `README.md` — fold any extra docs into `SKILL.md`
- Per-skill `LICENSE` — the top-level `LICENSE` covers the whole repo

## SKILL.md frontmatter

Every `SKILL.md` must start with YAML frontmatter:

```yaml
---
name: <kebab-case-name>
description: "<one-sentence description in CN + EN, ending with Triggers: ...>"
---
```

Two non-negotiable rules:

- **`description` must be wrapped in double quotes.** Always. The `skills` CLI silently drops any unquoted description containing `: ` (colon-space) — see `docs/adr/0002-bilingual-skill-descriptions.md` for the bug history. If the value contains inner double quotes, escape them as `\"`.
- The `description` field is bilingual (Chinese first, then English, slash-separated). Triggers are listed at the end, slash-separated, mixing CN and EN.

`scripts/list-skills.sh` warns about unquoted descriptions as a regression guard.

## Installation

Two install paths, with different audiences:

- **Other users** — `npx skills add nmsn/skills`. The `skills` CLI reads `.claude-plugin/plugin.json` and shows an interactive multi-select picker over the promoted skills. This is the path the README documents first.
- **Local development** — `./scripts/link-skills.sh`. Symlinks every promoted skill into `~/.claude/skills/` (override with `CLAUDE_SKILLS_DIR=~/.agents/skills` for Codex). Idempotent and self-reference-safe; skips `deprecated/`. This is for someone who has cloned the repo to read or modify it.

Do not duplicate these commands in per-skill `SKILL.md` files — the README's "Installation" section is the single source of truth.

## Documents

- `CONTEXT.md` — domain glossary (DDD ubiquitous-language style)
- `docs/adr/` — architectural decision records, one per file, numbered
- `docs/specs/` — design specs for individual skills
- `docs/plans/` — implementation plans for individual skills
- `.out-of-scope/` — requests the project has explicitly declined, with reasons
