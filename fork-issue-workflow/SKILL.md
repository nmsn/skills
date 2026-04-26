---
name: fork-issue-workflow
description: 扫描本地 fork 目录下的仓库，找到上游仓库中新提的、容易解决的 GitHub Issues，并完成修复 → 审核 → PR 提交流程。当用户提到"找 issue 来修"、"fork 贡献"、"扫 issues"、"帮上游修 bug"、"处理 fork 仓库"时使用此技能。
---

# fork-issue-workflow

> **注意**：skill 中的 `<fork_dir>` 需要替换为你实际的 fork 目录路径，如 `~/fork/` 或 `/Users/xxx/fork/`。

扫描 fork 目录下的仓库，找到上游仓库中新提的、容易解决的 GitHub Issues，并完成从修复到 PR 的完整流程。

## 完整流程概览

1. 扫描 fork 目录，查找有哪些项目
2. 查找对应项目的原项目，并扫描 issues 列表
3. 按修改难易程度分析并排序
4. 在本地 fork 项目中创建分支、修改代码、编写测试用例并运行测试
5. 测试通过后，列出修改内容交由用户审核
6. 审核通过后，删除测试内容，对修改提交 PR

---

## Step 1: 扫描 fork 目录查找项目

```bash
ls -d <fork_dir>/*/
```

记录每个 fork 仓库的目录名，即为待处理项目列表。

---

## Step 2: 查找上游仓库并扫描 Issues

对每个项目，先找上游仓库，再查 open issues：

```bash
cd <fork_dir>/<repo>
git remote -v
```

用 `git remote get-url origin` 或 `gh api repos/:owner/:repo --jq '.parent.full_name'` 确认上游地址。

然后批量查询上游 issues：

**先检查 issue 总数：**

```bash
gh api repos/:owner/:repo --jq '.open_issues_count'
```

**根据 issue 数量决定查询范围：**

| open issues 数量 | 查询策略 |
|------------------|---------|
| ≤ 100 | 全量查询 `--limit 100` |
| > 100 | 只查最近一周的 `--created>=$(date -v-7d +%Y-%m-%d)` |

```bash
# 100 以内：全量查询
gh issue list --repo :owner/:repo --state open --limit 100 --json number,title,createdAt,labels,body,assignees

# 100 以上：限制一周内
gh issue list --repo :owner/:repo --state open --created>=$(date -v-7d +%Y-%m-%d) --json number,title,createdAt,labels,body,assignees
```

> `--json body,assignees` 带上完整内容和 assignee，便于后续判断。

---

## Step 2.5: 获取 Issue 详情（评论 + 事件 + 关联 PR）

**对每个候选 issue，依次获取：**

### 2.5.1 获取评论

```bash
gh api repos/:owner/:repo/issues/:number/comments --jq '.[] | {author: .user.login, body: .body, createdAt: .createdAt}'
```

### 2.5.2 获取时间线事件

```bash
gh api repos/:owner/:repo/issues/:number/timeline --jq '.[] | {type: .event, actor: .actor.login, createdAt: .createdAt, stateReason: .stateReason}'
```

### 2.5.3 判断是否有人正在修复

检查以下信号（任一存在则跳过）：

| 信号 | 含义 | 跳过条件 |
|------|------|----------|
| `assignees` 非空 | 有人负责 | 跳过 |
| `pull_request` 事件存在 | 有人提了 PR | 跳过 |
| 评论中有 "I'm working on this" / "I will fix" | 有人认领 | 跳过 |
| `event: linked` 或 `event: referenced` | 关联了 PR | 跳过 |

```bash
# 快速检查是否有 open 的 PR
gh api repos/:owner/:repo/issues/:number --jq '.pull_request'
# 如果返回非 null，说明已有关联 PR
```

---

## Step 3: 综合分析难度并排序

基于 issue 本体 + 评论 + 事件综合评判：

### 难度评估维度

| 维度 | 信息来源 | 加分/减分 |
|------|----------|-----------|
| 作者已提供根因/修复建议 | issue body | ⬇️ 极简单 |
| 有测试复现步骤 | issue body | ⬇️ 简单 |
| 讨论活跃（3+ 评论） | comments | ⬆️ 复杂（可能有隐藏复杂度） |
| 有 re-open 记录 | timeline | ⬆️ 复杂（之前修过又出问题） |
| 单文件改动 | 代码分析 | ⬇️ 简单 |
| 纯前端/文档改动 | 代码分析 | ⬇️ 极简单 |
| 多服务联动 | 代码分析 | ⬆️ 复杂 |
| 架构调整 | 代码分析 | ⬆️ 极复杂 |

### 排除条件

**跳过（有人正在修复）：**
- 有 assignee
- 已关联 open PR
- 评论中有 "working on it" / "I'll fix" / "taking this"

**跳过（不适合）：**
- `question` / `enhancement` label
- 被 close 过又 re-open（可能有隐藏问题）
- 涉及多仓库/多服务联动
- 需要深度架构调整

整理成 Markdown 表格：

```
| # | 仓库 | Issue | 类型 | 难度 | 状态 | 描述 |
|---|------|-------|------|------|------|------|
```

难度等级：
- ⭐ 极简单：改文档、补测试文件、改一行代码
- ⭐⭐ 简单：有明确根因和修复方向，单文件改动
- ⭐⭐⭐ 中等：涉及多文件但逻辑清晰
- ⭐⭐⭐⭐+：复杂/架构调整

**状态标记：**
- `🆕 新 issue` - 无人认领，可处理
- `⏳ 有人认领` - 有 assignee 或 PR，跳过
- `🔁 re-open` - 之前修过又出问题，谨慎

按难度从低到高排序，低难度优先处理。

---

## Step 4: 创建分支、修改代码、编写测试

对每个要修复的 issue，在本地 fork 仓库中操作：

### 4.1 创建分支

```bash
cd <fork_dir>/<repo>
git checkout -b fix/<issue-description-slug>
```

### 4.2 分析代码并修改

阅读相关源码，定位需要改动的文件和函数。

**Rust 项目**：
```bash
# 查看现有测试结构
cargo test --lib -- --list 2>&1 | head -30
# 在源码文件末尾的 mod tests {} 中添加测试用例
```

**Node.js/TypeScript 项目**（先确认测试框架）：
```bash
# bun 项目
bun test <path/to/test.file>
# jest/vitest 项目
npm test -- --testPathPattern=<pattern>
```

### 4.3 编写测试用例

在项目已有的测试文件结构中新增测试，或创建临时测试文件。

Rust 示例（在 `src/services/xxx.rs` 末尾的 `mod tests {}` 中添加）：
```rust
#[test]
fn test_xxx_fix() {
    // 测试修复后的行为
    assert_eq!(fix_function("input"), "expected");
}
```

TypeScript 示例（创建临时测试文件）：
```typescript
import { describe, it, expect } from 'bun:test'; // 或 jest / vitest
// 测试修复后的行为
```

### 4.4 运行测试验证

```bash
# Rust
cargo test --lib <test_name>

# Node.js (bun)
bun test <path/to/test.file>
```

测试必须全部通过。如有 lint warning 是文件已有问题，不影响。

### 4.5 确认修复正确

测试通过后，验证修复逻辑确实解决了 issue 中描述的问题。

---

## Step 5: 列出修改内容交由审核

向用户展示：
- 原 issue 链接和问题描述（便于对照查看）
- 原 issue 的问题是什么
- 改了哪些文件，为什么要这么改动
- 具体 diff（`git diff` 或 `git diff --cached`）
- 测试结果（哪些 case 通过）

示例格式：

```
【<repo> #<issue>】fix/<issue-description-slug> 分支

原 issue: https://github.com/:owner/:repo/issues/:number
问题: <一句话描述 issue 描述的问题>

改动说明:
- <file>: <为什么要这么改动>
- <file>: <为什么要这么改动>

diff:
- <简要描述改动>

测试: <test_name> ✓ (N cases)

等你审核后我执行 push 并创建 PR。
```

---

## Step 6: 删除测试内容，提交 PR

用户审核通过后：

### 6.1 删除测试代码

将测试用例的修改回退（测试代码不提交）：
```bash
git checkout HEAD -- <modified_file>
```

确认仓库干净：
```bash
git status --short
```

### 6.2 提交修改

确认目标分支（参考 upstream 的默认分支名，用 `gh api repos/:owner/:repo --jq '.default_branch'` 查询）：

```bash
cd <fork_dir>/<repo>
git add <modified_files>
git diff --cached  # 确认改动内容
git commit -m "fix: 简洁描述 (#issue号)"
```

### 6.3 Push 并创建 PR

```bash
git push origin fix/<issue-description-slug>
```

创建 PR：
```bash
gh pr create \
  --repo :upstream_owner/:repo \
  --base <default_branch> \
  --head <your_username>:fix/<issue-description-slug> \
  --title "fix: 简洁描述 (#issue号)" \
  --body "Fixes #issue号

修复说明..."
```

---

## 注意事项

- Issues 按 createdAt 倒序排列，最近的在前
- 一个仓库可能 Issues 已禁用（`gh issue list` 返回错误），跳过即可
- 部分仓库没有 parent（本身就是主仓库），用 `git remote -v` 确认
- 用户偏好：提交 PR 前需要审核（"提交前交给我审查一下"）
- 单元测试代码在 PR 前必须删除，不随 commit 提交
- Rust 项目 lint 报 async fn edition 错误是文件已有问题，与修改无关
- 如果需要 bun 环境但未安装：`npm install -g bun`，用完记得 `npm uninstall -g bun`
