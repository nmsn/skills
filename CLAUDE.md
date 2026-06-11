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

```
---
name: <kebab-case-name>
description: <one-sentence description in CN + EN, ending with "Triggers: ...">
---
```

The `description` field is bilingual (Chinese first, then English, slash-separated). Triggers are listed at the end, slash-separated, mixing CN and EN. See `docs/adr/0002-bilingual-skill.md` for the rationale.

## Installation

Users install skills by running `./scripts/link-skills.sh`, which symlinks each promoted skill into `~/.claude/skills/`. The script is idempotent, self-reference-safe, and skips `deprecated/`. Do not add copy-paste install instructions to the README — point users at the script.

## Documents

- `CONTEXT.md` — domain glossary (DDD ubiquitous-language style)
- `docs/adr/` — architectural decision records, one per file, numbered
- `docs/specs/` — design specs for individual skills
- `docs/plans/` — implementation plans for individual skills
- `.out-of-scope/` — requests the project has explicitly declined, with reasons
