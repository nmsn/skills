# Domain glossary for `nmsn/skills`

A short ubiquitous-language reference. The terms below are the **canonical names** used throughout `SKILL.md` files, `docs/`, and commit messages. If you find yourself using a synonym that isn't listed as "alias", pick the canonical term.

## Core terms

**Skill**
A single capability the agent can invoke. One skill = one `SKILL.md` at `skills/<bucket>/<name>/SKILL.md`.
_Avoid_: command, plugin (unless referring to the `.claude-plugin/` manifest), tool, agent.

**Bucket**
A grouping folder under `skills/`. Buckets control visibility: `engineering/`, `productivity/`, and `design/` are promoted into the top-level `README.md` and `plugin.json`; `personal/`, `in-progress/`, and `deprecated/` are hidden.
_Avoid_: category, group, namespace, tier (use "bucket").

**Trigger**
A phrase that causes a `SKILL.md` to be loaded. Listed in the `description` frontmatter field after "Triggers:". Mix of Chinese and English.
_Avoid_: keyword, activator, hook (use "trigger"; reserve "hook" for Claude Code settings hooks).

**Fork**
A GitHub fork relationship between two repositories. Used in `fork-issue-workflow`.
_Avoid_: clone (use only for literal `git clone`), copy, branch.

**Upstream**
The source repository from which a fork was created. The counterpart of **Fork**.
_Avoid_: source (too generic), parent, origin (overloaded with `git`'s `origin` remote).

**Triage role**
A canonical label applied to a GitHub issue during triage (e.g. `needs-triage`, `ready-for-afk`, `in-progress`). The set of roles is the contract that `issue-analyzer` reads and `fork-issue-workflow` writes.
_Avoid_: state (overloaded with GitHub's `state: open/closed`), status, label (use "label" for the raw GitHub label string).

**Issue**
A single tracked unit of work in a GitHub repository — a bug report, feature request, or task. Produced or consumed by `issue-analyzer`, `fork-issue-workflow`, `github-daily-digest`, `github-project-history`.
_Avoid_: ticket, bug (use only for the bug-report subtype), task (use only for the task subtype).

**Project history**
The chronological record of a GitHub project's events — issues, PRs, releases — as a single narrative. The output type of `github-project-history`.
_Avoid_: changelog (use only for the literal `CHANGELOG.md` file), timeline, log.

## Relationships

- A **Skill** belongs to exactly one **Bucket**
- A **Bucket** is either *promoted* (appears in top-level `README.md` + `plugin.json`) or *hidden* (does not)
- An **Issue** carries one **Triage role** at a time
- A **Fork** has exactly one **Upstream**; an **Upstream** may have many **Forks**
- A **Trigger** activates a **Skill**

## Flagged ambiguities

- "label" vs "triage role" — the raw GitHub label string is "label"; the canonical state-machine meaning is "triage role". Skills should name the mapping in their `SKILL.md` (e.g. `triage:needs-triage`) rather than reusing "label" as a synonym.
- "fork" the verb vs the noun — only the noun (a forked repo) is a glossary term; the verb is just a regular English word.
