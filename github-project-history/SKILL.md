---
name: "github-project-history"
description: "Analyze a GitHub repository's development history including commits, tags, releases, milestones, and contributors. Use when user wants to understand how a project evolved over time (e.g., '分析 facebook/react 的发展历程', '/github-project-history facebook/react')."
---

# Project History Analyzer

Use this skill when the user wants to analyze the development history of a GitHub repository.

## Requirements

- `gh` CLI is installed and authenticated (`gh auth status`)
- Target repository is public (or user is authenticated for private repos)

## Trigger Hints

Typical requests:
- 「分析一下 {owner}/{repo} 的发展历程」
- 「看看 {repo} 的项目历史」
- `/github-project-history {owner}/{repo}`
- 「{repo} 是什么时候创建的」
- 「{owner}/{repo} 的 release cycle 是多久」

## Workflow

### Step 1: Parse owner/repo from user input

Extract `{owner}/{repo}` from:
- Slash command: `/github-project-history facebook/react` → `facebook/react`
- Conversation: 「分析一下 facebook/react 的发展历程」→ `facebook/react`
- If only repo name given (e.g., "react"), try to resolve via `gh api` search or ask user

If no valid repo found, ask user: "请提供仓库地址，格式为 owner/repo"

### Step 2: Fetch basic repo info

Run:
```bash
gh repo view {owner}/{repo} --json name,owner,createdAt,defaultBranchRef,description
```

If this fails (repo not found, private, no access), stop and report the error.

### Step 3: Fetch commit history

Run:
```bash
gh api repos/{owner}/{repo}/commits --paginate --jq '.[0:300] | .[] | {sha: .sha[0:7], message: .commit.message | split("\n")[0], date: .commit.author.date, author: .commit.author.name}'
```

Limit to 300 most recent commits to stay within token limits.

### Step 4: Fetch tags

Run:
```bash
gh api repos/{owner}/{repo}/tags --paginate --jq '.[] | {name: .name, commit: .commit.sha}'
```

### Step 5: Fetch releases

Run:
```bash
gh api repos/{owner}/{repo}/releases --paginate --jq '.[] | {tag: .tag_name, name: .name, date: .published_at, body: .body | split("\n")[0]}'
```

### Step 6: Fetch contributors

Run:
```bash
gh api repos/{owner}/{repo}/contributors --paginate --jq '.[0:20] | .[] | {login: .login, contributions: .contributions}'
```

### Step 7: Fetch milestones

Run:
```bash
gh api repos/{owner}/{repo}/milestones --paginate --jq '.[] | {title: .title, state: .state, due: .due_on, closed: .closed_at}'
```

### Step 8: Fetch issue activity (last 100, for trends)

Run:
```bash
gh api repos/{owner}/{repo}/issues --state all --paginate --jq '.[0:100] | group_by(.state) | map({state: .[0].state, count: length})'
```
