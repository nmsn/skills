# Skills Monorepo

Personal Claude Code / Codex skills, consolidated from multiple standalone repos.

## Skills

| Skill | Description |
|-------|-------------|
| [codebase-documenter](./codebase-documenter/) | Analyze codebase structure and generate documentation (Quick/Standard depth) |
| [design-search](./design-search/) | Search design inspiration from Dribbble & Pinterest using Playwright MCP |
| [git-commit-generator](./git-commit-generator/) | Generate Git commit messages by detecting commit conventions |
| [issue-analyzer](./issue-analyzer/) | Analyze GitHub issues, assess difficulty, locate code to modify |

## Installation

Skills are installed by copying to your local skills directory:

```bash
# Claude Code
mkdir -p ~/.claude/skills && cp -r skills/<skill-name> ~/.claude/skills/

# Codex
mkdir -p ~/.agents/skills && cp -r skills/<skill-name> ~/.agents/skills/
```

Or use the `skills` CLI if available.
