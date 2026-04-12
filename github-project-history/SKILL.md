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

## Natural Language Parsing Rules

Extract `{owner}/{repo}` using these patterns in order:

1. **Direct slash pattern:** matches `{word}/{word}` in input
   - Regex: `([a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+)`
   - Example: "分析 facebook/react" → `facebook/react`

2. **URL pattern:** matches GitHub URLs
   - Regex: `github\.com/([a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+)`
   - Example: "github.com/facebook/react" → `facebook/react`

3. **Bare repo name:** if only one word given (e.g., "react"), search via:
   ```bash
   gh api search/repos --jq '.items[0] | "\(.owner.login)/\(.name)"' "{bare_name}" --match "name:{bare_name}"
   ```
   If multiple matches found, ask user to clarify.

If no repo can be identified after all patterns, prompt:
"请提供要分析的 GitHub 仓库地址，格式为 owner/repo，例如：facebook/react"

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

### Step 9: Generate Markdown report

Using all data collected, generate a Markdown report with the following structure:

**Filename:** `{owner}-{repo}-history.md` (e.g., `facebook-react-history.md`)

```markdown
# {Repo Name} — Project History

> {owner}/{repo} | Generated {date}

## Overview
- Created: {createdAt}
- Total commits analyzed: {N} (most recent 300)
- Latest release: {latest_tag}
- Top contributors: {N}

## Version Release Rhythm
Analyze the time gaps between major tags/releases. Identify the pattern:
- If gaps are consistent: "This project releases major versions approximately every X months."
- If irregular: Note the shortest and longest gaps.

## Key Milestones

{For each major tag/release, in reverse chronological order, write 2-3 sentences:}
- **{tag}** ({date}): {narrative describing what changed, inferred from commit messages}
  - Notable: {notable commit message from the period}

## Top Contributors

| Rank | Contributor | Contributions |
|------|-------------|---------------|
| 1 | {login} | {contributions} |
| ... | ... | ... |

## Community Activity Trends
{Analyze the issue data. Note periods of high activity, e.g., "Q2 2023 saw a spike in issues, correlating with the v18 release."}

## Summary
{AI-generated 2-3 sentence narrative tying together the project's journey from creation to present day, highlighting the overall trajectory and key turning points.}
```

Use the Write tool to save this to `{owner}-{repo}-history.md` in the current working directory.

### Step 10: Display narrative summary in chat

After writing the file, output a brief narrative summary in chat (not the full report):

```
## {Repo Name} 项目发展历程

{3-4 sentence narrative summary covering: when it started, major evolution phases, current state}

📄 完整报告已保存到 `{owner}-{repo}-history.md`
```

### Step 11: Error handling

| Error | Message |
|-------|---------|
| gh not installed | "gh CLI 未安装，请先安装：https://cli.github.com" |
| gh not authenticated | "gh 未登录，请运行 `gh auth login`" |
| repo not found | "找不到仓库 {owner}/{repo}，请确认仓库地址正确且为公开仓库" |
| rate limited | "GitHub API 速率限制已达，请稍后再试或使用 `gh auth refresh`" |
```
