# 0002 — SKILL.md `description` is bilingual (Chinese first, then English)

## Status

Accepted (2026-06-11). Reinforces the convention introduced in commit `b4d53cf` for the `code-summarizer` skill.

**Amended (2026-06-11)**: The `description` field **must be wrapped in double quotes**. The original decision overlooked a YAML parser quirk in the `skills` CLI that silently drops any unquoted description containing `": "` (colon-space) — see "Bug found" below.

## Context

`SKILL.md` frontmatter's `description` field is the primary signal Claude Code / Codex use to decide when to load a skill. We author skills in two contexts:

- Personal daily use, where the user thinks and types in Chinese.
- Sharing with the broader community (e.g. via `npx skills add`), where the audience is mostly English-speaking.

A monolingual description forces the user to switch language when triggering a skill. A fully bilingual description without a convention produces inconsistent files and makes the "is this skill triggered by phrase X?" question ambiguous to read.

## Decision

The `description` field follows a strict shape:

```yaml
description: "<one-sentence description in Chinese> / <one-sentence description in English>. Triggers: <cn phrase 1>、<cn phrase 2>、<en phrase 1>、<en phrase 2>"
```

- Wrapped in **double quotes**. Always. Even if the value looks "simple" — the rule is unconditional, because the alternative is to track which descriptions happen to contain `: ` and quote only those, which is exactly the bug we want to prevent (see below).
- Chinese first, English second, separated by ` / `.
- Triggers listed at the end after a literal `Triggers: ` marker, slash- or Chinese-comma-separated, mixing both languages freely.
- The `name` field stays in lowercase kebab-case English (it's a directory name and machine identifier).
- The body of the `SKILL.md` can be in either language; pick the one that fits the skill's primary user. Don't translate the body for translation's sake.

If the description contains literal double quotes (e.g. quoting a user's example phrase), escape them as `\"` inside the YAML string. See `skills/productivity/github-daily-digest/SKILL.md` for an example.

## Bug found (2026-06-11, fixed in `bfaa1dd` + `5f0e266`)

The first iteration of this rule left descriptions **unquoted**. That worked for the 5 skills whose descriptions didn't contain `: ` (colon-space) — but the other 4 (`code-summarizer`, `codebase-documenter`, `github-daily-digest`, `issue-analyzer`) all used the `Triggers: ...` or `NOT for: ...` pattern, and the `skills` CLI silently dropped them from `npx skills add` discovery.

The CLI's YAML parser treats `: ` inside an unquoted scalar as a flow-mapping indicator, so the description field is parsed as a partial mapping and the resulting `description` value is either empty or wrong, failing the CLI's "must have name and description" validation. The user sees a picker with 5 options, not 9, with no warning.

The fix: always quote the description. `scripts/list-skills.sh` now also warns about unquoted descriptions as a regression guard.

## Consequences

Positive:

- A reader of any single `SKILL.md` can predict the layout.
- The `Triggers:` suffix gives Claude (and humans auditing the file) a single place to look up "what phrases activate this skill?"
- Quoting is robust against any future description edit that introduces a `: ` token.

Negative / trade-offs:

- Quoted descriptions must escape inner double quotes. Slightly noisier, but rare in practice.
- The description is necessarily longer than a monolingual one. This is intentional — discoverability beats terseness for trigger metadata.

## Alternatives considered

- **Pure English descriptions, add Chinese triggers via a separate `triggers:` list.** Rejected: doubles the surface area and requires linter changes.
- **One file per skill per language (e.g. `SKILL.md` + `SKILL.zh.md`).** Rejected: doubles maintenance, halves discoverability.
- **Quote only when the description contains `: `.** Rejected: this is exactly the rule we just abandoned. The "always quote" rule is uniform and reviewable; a conditional rule requires per-file judgement and is the bug we just fixed.
