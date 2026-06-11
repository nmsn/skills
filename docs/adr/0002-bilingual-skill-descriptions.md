# 0002 — SKILL.md `description` is bilingual (Chinese first, then English)

## Status

Accepted (2026-06-11). Reinforces the convention introduced in commit `b4d53cf` for the `code-summarizer` skill.

## Context

`SKILL.md` frontmatter's `description` field is the primary signal Claude Code / Codex use to decide when to load a skill. We author skills in two contexts:

- Personal daily use, where the user thinks and types in Chinese.
- Sharing with the broader community (e.g. via `npx skills add`), where the audience is mostly English-speaking.

A monolingual description forces the user to switch language when triggering a skill. A fully bilingual description without a convention produces inconsistent files and makes the "is this skill triggered by phrase X?" question ambiguous to read.

## Decision

The `description` field follows a strict shape:

```
<one-sentence description in Chinese> / <one-sentence description in English>. Triggers: <cn phrase 1>、<cn phrase 2>、<en phrase 1>、<en phrase 2>
```

- Chinese first, English second, separated by ` / `.
- Triggers listed at the end after a literal `Triggers: ` marker, slash- or Chinese-comma-separated, mixing both languages freely.
- The `name` field stays in lowercase kebab-case English (it's a directory name and machine identifier).
- The body of the `SKILL.md` can be in either language; pick the one that fits the skill's primary user. Don't translate the body for translation's sake.

## Consequences

Positive:

- A reader of any single `SKILL.md` can predict the layout.
- The `Triggers:` suffix gives Claude (and humans auditing the file) a single place to look up "what phrases activate this skill?"

Negative / trade-offs:

- The description is necessarily longer than a monolingual one. This is intentional — discoverability beats terseness for trigger metadata.
- Mixing languages inside the same frontmatter field breaks some YAML linters; we accept this.

## Alternatives considered

- **Pure English descriptions, add Chinese triggers via a separate `triggers:` list.** Rejected: doubles the surface area and requires linter changes.
- **One file per skill per language (e.g. `SKILL.md` + `SKILL.zh.md`).** Rejected: doubles maintenance, halves discoverability.
