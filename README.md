# nmsn/skills

Personal Claude Code / Codex skills, consolidated from multiple standalone repos.

Skills are organized into buckets by purpose. See [CLAUDE.md](./CLAUDE.md) for the rules that govern this layout, and [CONTEXT.md](./CONTEXT.md) for the domain glossary.

## Skills

### [Engineering](./skills/engineering/)

Daily code work — summarizing, documenting, and committing.

- [code-summarizer](./skills/engineering/code-summarizer/) — Summarize code flow, core methods, and tricky parts into a markdown document.
- [codebase-documenter](./skills/engineering/codebase-documenter/) — Analyze codebase structure and generate documentation at Quick or Standard depth.
- [git-commit-generator](./skills/engineering/git-commit-generator/) — Generate commit messages by detecting commitlint or gitmoji conventions.

### [Productivity](./skills/productivity/)

Workflow tools that are not strictly engineering.

- [follow-frontend](./skills/productivity/follow-frontend/) — Aggregate frontend tech news from RSS sources.
- [fork-issue-workflow](./skills/productivity/fork-issue-workflow/) — Scan fork repos for easy upstream issues and drive them through fix → review → PR.
- [github-daily-digest](./skills/productivity/github-daily-digest/) — Daily summary of followed GitHub users' commit activity.
- [github-project-history](./skills/productivity/github-project-history/) — Analyze a GitHub repository's development history.
- [issue-analyzer](./skills/productivity/issue-analyzer/) — Fetch GitHub issues, assess difficulty, locate the code to modify.

### [Design](./skills/design/)

Creative exploration tools.

- [design-search](./skills/design/design-search/) — Search design inspiration from Dribbble and Pinterest; optionally render an HTML card page.

## Installation

### For other users — install via the standard skills CLI

The repo ships a `.claude-plugin/plugin.json` that the `skills` CLI consumes. To install all promoted skills into Claude Code or Codex:

```bash
npx skills add nmsn/skills
```

This downloads the repo, reads the plugin manifest, and links every promoted skill into the right place. No clone required.

### For local development — clone and symlink

If you want to read the code, modify a skill, or test changes locally, clone the repo and run the install script:

```bash
git clone https://github.com/nmsn/skills.git
cd skills
./scripts/link-skills.sh
```

The script symlinks each promoted skill into `~/.claude/skills/` (override with `CLAUDE_SKILLS_DIR=~/.agents/skills` for Codex). It is idempotent and self-reference-safe: editing a `SKILL.md` under `skills/<bucket>/<name>/` is picked up immediately, no reinstall needed.

Run `./scripts/list-skills.sh` to see which skills are available.

## Project layout

```
.
├── CLAUDE.md            # Project rules (read first)
├── CONTEXT.md           # Domain glossary
├── LICENSE              # MIT, applies to the whole repo
├── README.md            # This file
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest consumed by Claude Code / Codex
├── scripts/             # Install + inventory helpers
├── docs/
│   ├── adr/             # Architectural decision records
│   ├── specs/           # Per-skill design specs
│   └── plans/           # Per-skill implementation plans
├── .out-of-scope/       # Declined requests, with reasons
└── skills/
    ├── engineering/
    ├── productivity/
    ├── design/
    ├── personal/        # Hidden, not promoted
    ├── in-progress/     # Hidden, not promoted
    └── deprecated/      # Hidden, not promoted
```
