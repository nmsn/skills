# git-commit-generator

An installable Codex skill that generates Git commit messages by detecting the target repository's commit convention and analyzing staged changes.

## Install

```bash
npx skills add https://github.com/nmsn/git-commit-generator
```

You can also try:

```bash
npx skills add nmsn/git-commit-generator
```

## What It Does

- Detects commit conventions from the target repository, including commitlint and gitmoji setups
- Reviews staged changes with `git diff --cached`
- Proposes a commit message before running `git commit`
- Warns when committing directly on protected branches such as `main` or `master`

## Requirements

- Git is installed
- The target project is already a Git repository
- Changes are staged with `git add` before using the skill

## When To Use It

Use this skill when you want Codex to:

- generate a commit message
- help commit staged changes
- follow an existing Git commit convention automatically

## Skill Entry Point

The skill definition lives in `SKILL.md`.

## Publishing Notes

This repository is structured as a single-skill repo so it can be installed directly from GitHub with `skills add`.
