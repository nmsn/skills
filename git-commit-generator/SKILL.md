---
name: "git-commit-generator"
description: "Generate Git commit messages by detecting commitlint or gitmoji conventions from the target repository and analyzing staged changes. Use when the user wants to commit staged changes or asks for a commit message."
---

# Git Commit Generator

Use this skill when the user wants Codex to generate a commit message or commit already staged changes.

## Requirements

- Git is installed
- The current working directory is a Git repository
- The user has staged changes with `git add`

## Trigger Hints

Typical requests:

- "commit these changes"
- "generate a commit message"
- "help me commit"
- "按照 conventional commits 提交"
- "帮我提交代码"

## Workflow

1. Run `git branch --show-current`
2. If the current branch is `main`, `master`, or another protected trunk branch, warn the user and confirm whether to continue
3. Run `git status --short` and verify there are staged changes
4. If nothing is staged, ask the user to stage files first
5. Run `git diff --cached --stat`
6. Run `git diff --cached`
7. Detect the commit convention from the target repository
8. Propose a commit message that matches the detected convention
9. Ask for confirmation before running `git commit`

## Convention Detection

Check in this order:

1. `.commitlintrc`
2. `.commitlintrc.json`
3. `.commitlintrc.js`
4. `commitlint.config.js`
5. `commitlint.config.mjs`
6. `package.json` with a `commitlint` field
7. `.gitmojirc`
8. `gitmoji.config.js`
9. Default to Conventional Commits if none are present

## Output Rules

- Prefer Conventional Commits unless the repository clearly uses gitmoji
- Keep the subject line concise and specific
- Infer a scope only when the changed files make it clear
- Show the proposed message before committing
- Respect the user's edits if they want to refine the message

## Conventional Commit Format

```text
<type>(<scope>): <description>
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`, `style`

## Gitmoji Format

```text
<emoji> <description>
```

## Safety Rules

- Never commit unstaged work by accident
- Never use destructive Git commands unless the user explicitly asks
- Never skip hooks with `--no-verify` unless the user explicitly asks
- Never force-push protected branches
