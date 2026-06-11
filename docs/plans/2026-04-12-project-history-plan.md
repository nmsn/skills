# Project History Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Claude Code skill that analyzes a GitHub project's development history via `gh` CLI and outputs a narrative Markdown report.

**Architecture:** Single `SKILL.md` file that handles slash command + natural language parsing, invokes `gh` for data, generates a Markdown report via Write tool, and displays a narrative summary in chat. No external scripts needed — all logic is in the skill workflow steps.

**Tech Stack:** `gh` CLI, Claude Code tools (Bash, Write), Markdown.

---

## File Structure

```
/Users/nmsn/Studio/skills/github-project-history/
└── SKILL.md    ← the entire skill, ~200-300 lines
```

Existing skill to reference: `/Users/nmsn/Studio/skills/git-commit-generator/SKILL.md`

---

## Task 1: Create github-project-history directory and SKILL.md scaffold

**Files:**
- Create: `github-project-history/SKILL.md`

- [ ] **Step 1: Create directory and scaffold**

Run:
```bash
mkdir -p /Users/nmsn/Studio/skills/github-project-history
```

- [ ] **Step 2: Write SKILL.md scaffold with frontmatter**

```markdown
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

_... (to be filled in Task 2-4) ..._
```

- [ ] **Step 3: Commit**

```bash
git add github-project-history/ && git commit -m "feat: scaffold github-project-history skill directory"
```

---

## Task 2: Implement repo info and commit parsing

**Files:**
- Modify: `github-project-history/SKILL.md`

- [ ] **Step 1: Write the gh data-fetching steps**

After the Workflow section header, add the following steps:

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add github-project-history/SKILL.md && git commit -m "feat: add gh data fetching steps to github-project-history skill"
```

---

## Task 3: Implement Markdown report generation and narrative output

**Files:**
- Modify: `github-project-history/SKILL.md`

- [ ] **Step 1: Write the report generation and output steps**

Append after Step 8:

```markdown
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

- [ ] **Step 2: Commit**

```bash
git add github-project-history/SKILL.md && git commit -m "feat: add report generation and narrative output to github-project-history"
```

---

## Task 4: Refine natural language parsing

**Files:**
- Modify: `github-project-history/SKILL.md`

- [ ] **Step 1: Write regex-based parsing rules**

The skill needs to extract `{owner}/{repo}` from natural language. Add to Step 1:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add github-project-history/SKILL.md && git commit -m "feat: add natural language parsing to github-project-history"
```

---

## Task 5: Self-review against spec

- [ ] **Step 1: Spec coverage check**

Skim the design spec and verify each section is implemented:

| Spec Section | Implemented? | Where |
|---|---|---|
| Trigger: slash command | ✅ | Step 1 trigger hints |
| Trigger: natural language | ✅ | Step 1 + Task 4 |
| gh data fetching | ✅ | Steps 2-8 |
| Overview section | ✅ | Step 9 |
| Version Release Rhythm | ✅ | Step 9 |
| Key Milestones | ✅ | Step 9 |
| Top Contributors | ✅ | Step 9 |
| Community Activity Trends | ✅ | Step 9 |
| Markdown report file output | ✅ | Step 9 (Write tool) |
| Narrative summary in chat | ✅ | Step 10 |
| Error handling | ✅ | Step 11 |

- [ ] **Step 2: Placeholder scan**

Search the SKILL.md for: TBD, TODO, fill in, TBD
Fix any placeholders found.

- [ ] **Step 3: Trigger hints review**

Verify trigger hints cover: 「分析一下 facebook/react 的发展历程」and `/github-project-history facebook/react`

- [ ] **Step 4: Commit self-review changes**

```bash
git add github-project-history/SKILL.md && git commit -m "fix: address self-review findings in github-project-history"
```

---

## Task 6: Final verification

- [ ] **Step 1: Test with a real repo (dry run)**

Run through the skill steps mentally with `nicolango/uikit` or a known small public repo. Verify:
- gh commands produce valid JSON
- Markdown output matches spec structure
- Filename is correct format

- [ ] **Step 2: Read final SKILL.md and verify structure**

Check that the final SKILL.md has:
- Correct frontmatter (name, description)
- Clear Workflow section with numbered steps
- Error handling section
- Consistent formatting

- [ ] **Step 3: Final commit**

```bash
git add -A && git commit -m "feat: complete github-project-history skill implementation"
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-12-project-history-plan.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
