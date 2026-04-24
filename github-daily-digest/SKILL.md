---
name: github-daily-digest
description: Summarize followed GitHub users' daily code activity. Use when the user wants a daily digest of their followed developers' commits, wants to monitor developers they follow, daily standup reports on developer activity, or weekly/monthly developer updates. Triggers on requests like "check my followed users' activity", "who's been coding lately", "what's happening with developers I follow", "daily GitHub digest", "followed users commit summary". NOT for: searching specific repos, checking a single user's profile, GitHub issue/PR management.
---

# GitHub Daily Digest

Fetch and summarize GitHub events from users you follow.

## When to Trigger

Trigger when the user asks for:
- "我的 follow 用户今天有什么提交"
- "daily GitHub digest"
- "谁在写代码/谁最近比较活跃"
- "监控我 follow 的开发者的动态"
- Any request about summarizing followed users' GitHub activity

## Prerequisites

- `gh` CLI must be installed and authenticated (`gh auth status`)
- **GH_TOKEN recommended**: You follow 92 users, which requires 93+ API calls per run. Unauthenticated requests are limited to 60/hour — you will hit rate limits. Set `GH_TOKEN` in your environment to get 5,000 requests/hour.

## Important Data Limitations

**PushEvent only contains refs, not commit messages.**

When you fetch a PushEvent, the payload gives you:
- `ref`: branch name
- `head`: latest commit SHA

To get actual commit messages for keyword filtering, you MUST fetch the commits separately.

Do NOT try to count commits — focus on what happened, not how many times.

## Workflow

### Step 1: Get Followed Users

```bash
gh api /user/following --paginate -q '.[].login'
```

### Step 2: Calculate Yesterday's Time Window

```bash
# macOS
START=$(date -v-1d -j +"%Y-%m-%dT00:00:00Z")
END=$(date -v-1d -j +"%Y-%m-%dT23:59:59Z")

# Linux
# START=$(date -d yesterday +"%Y-%m-%dT00:00:00Z")
# END=$(date -d yesterday +"%Y-%m-%dT23:59:59Z")
```

### Step 3: Fetch Yesterday's Events Per User

For each followed user:

```bash
gh api "/users/{username}/events" --paginate -q "
  [.[] | select(.type == \"PushEvent\" or .type == \"CreateEvent\" or .type == \"PullRequestEvent\") |
  select(.created_at >= \"$START\" and .created_at <= \"$END\")]
"
```

**Event types to collect:**
- `PushEvent` — has `payload.ref` (branch) and `payload.head` (latest SHA)
- `CreateEvent` — has `payload.ref_type` (can be `tag`, `branch`, or `repository`)
- `PullRequestEvent` — has `payload.action` (opened, closed, merged, etc.)

### Step 4: Detect Releases from CreateEvent

When you see a `CreateEvent` with `payload.ref_type == "tag"`:
- The tag name is in `payload.ref` (e.g., "v9.4.0", "2.0.0")
- This counts as a **New Release**
- Fetch release details if needed: `gh api /repos/{owner}/{repo}/releases/tags/{tag}`

Do NOT mistake a branch creation for a release. A release is specifically a tag.

### Step 5: Fetch Commit Messages (Only When Needed for Keyword Filtering)

For PushEvents where you need to detect perf/feat keywords, fetch messages:

```bash
gh api "/repos/{owner}/{repo}/commits?author={username}&since=${START}&until=${END}" \
  -q '.[].commit.message'
```

Search for these keywords:
- Performance: `perf`, `optimize`, `benchmark`, `improve`, `speed`, `fast`, `efficiency`, `performance`
- Feature: `feat`, `implement`, `add`, `introduce`, `new`
- Release: `release`, `v[0-9]`, `publish`

### Step 7: Infer "How" from Commit Messages

For performance improvements and notable features, the commit message usually contains the "how":

- `perf: optimize bundle size by tree shaking` → "通过 tree shaking 优化 bundle 大小"
- `feat: implement virtual scrolling for large lists` → "使用虚拟滚动优化大列表渲染"
- `fix: cursor reflow corruption on resize` → "修复 resize 处理防止视觉故障"
- `fix(agent-runtime): sanitize invalid tool_call arguments` → "对工具调用参数进行消毒处理，防止非法输入"

If the message is vague (e.g., "update", "fix stuff", "refactor"), note: "具体改动需查看 diff"。

### Step 8: Apply Filters and Generate Digest

**Active Developer**: a user with PushEvents, CreateEvents, or PullRequestEvents in the window — this is purely activity-based, not commit-count-based.

**Significant events** are those that appear in the Significant Changes section — count them accurately.

## Output Format

ALWAYS use this exact template:

```markdown
# GitHub Daily Digest — {YYYY-MM-DD}

## Summary
- Checked: {N} followed users
- Active: {N} users with yesterday's events
- Significant: {N} notable events

## Active Developers (active yesterday)
| User | Repository | Activity |
|------|-----------|----------|
| [@{username}](https://github.com/{username}) | [{repo}](https://github.com/{repo}) | {what they did} |

## Significant Changes

### 🚀 New Releases
- [@{username}](https://github.com/{username}) · [{repo}](https://github.com/{repo}) · [v{version}](https://github.com/{repo}/releases/tag/v{version})
  > {release description}

### ⚡ Performance Improvements
- [@{username}](https://github.com/{username}) · [{repo}](https://github.com/{repo})
  - *What:* {what was improved}
  - *How:* {inferred from commit messages}
  - Commit: [{sha}](https://github.com/{repo}/commit/{sha}) — "{message}"

### ✨ Notable Features
- [@{username}](https://github.com/{username}) · [{repo}](https://github.com/{repo})
  - *What:* {feature description}
  - *How:* {implementation approach from commit messages}
  - Commit: [{sha}](https://github.com/{repo}/commit/{sha}) — "{message}"

## All Activity

### PushEvent
- **[@{username}](https://github.com/{username})** · [{repo}](https://github.com/{repo})

### PullRequestEvent
- **[@{username}](https://github.com/{username})** · [{repo}](https://github.com/{repo}) · [PR #{number}](https://github.com/{repo}/pull/{number}) ({action})

**IMPORTANT**: List every single PR individually. Do NOT write "多条 PR" or summarize multiple PRs into one line. Each PullRequestEvent produces one line in this list.

### CreateEvent
- **[@{username}](https://github.com/{username})** · [{repo}](https://github.com/{repo}) · created {ref_type}: [{ref}](https://github.com/{repo}/tree/{ref})
```

### Empty Day Output

If no users have any events:

```markdown
# GitHub Daily Digest — {YYYY-MM-DD}

今天很安静，大家都没有提交什么内容。

## Summary
- Checked: 92 followed users
- Active: 0
- Significant: 0
```

## Tips

- **Generating links**: All link URLs are derivable from the event data:
  - User: `.actor.login` → `https://github.com/{login}`
  - Repo: `.repo.name` → `https://github.com/{repo}`
  - **Commit link**: `.payload.head` (the FULL SHA from PushEvent, NOT a short number or PR number) → `https://github.com/{repo}/commit/{sha}`. Example: if `.payload.head` is `c4bac5a387820d66e618e64d2da93f59ba031be6`, the URL is `https://github.com/{repo}/commit/c4bac5a387820d66e618e64d2da93f59ba031be6`
  - PR: `.payload.pull_request.number` → `https://github.com/{repo}/pull/{number}`
  - Branch: `.payload.ref` (CreateEvent ref_type=branch) → `https://github.com/{repo}/tree/{ref}`
  - Tag/Release: `.payload.ref` (CreateEvent ref_type=tag) → `https://github.com/{repo}/releases/tag/{tag}`
- **Common mistake — do NOT confuse PR number with commit SHA**: If a PR is #13, that does NOT mean a commit SHA is "13". Always use the actual `.payload.head` value from the PushEvent. A commit URL like `https://github.com/repo/commit/13` is invalid — it must be the full SHA.
- **Parallel fetching**: Use `&` to background-fetch events for multiple users, then `wait`. This speeds up the run significantly.
- **Release vs branch**: A `CreateEvent` with `ref_type == "tag"` is a release. `ref_type == "branch"` is a branch — do NOT confuse them.
- **Date formatting**: `date -v-1d -j +"%Y-%m-%dT00:00:00Z"` on macOS. On Linux, use `date -d yesterday +"%Y-%m-%dT00:00:00Z"`.
- **Vague commit messages**: If a commit says "update" or "fix stuff", note that details require looking at the diff.

## Edge Cases

- **User has no recent events**: Skip silently
- **All users inactive**: Output the quiet-day message
- **Rate limited**: If hit, wait and retry with exponential backoff
- **gh not installed**: Error with clear message pointing to GitHub CLI docs
