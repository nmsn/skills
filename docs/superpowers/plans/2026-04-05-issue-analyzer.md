# Issue Analyzer Skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `issue-analyzer` skill in `skills/issue-analyzer/` with Quick/Standard dual modes. Quick uses `gh issue list` + basic analysis. Standard delegates to `codebase-documenter` skill for deep code analysis.

**Architecture:** Single SKILL.md with bilingual triggers, depth detection via keywords, issue fetching via `gh`, status judgment (closed/open+assignee/comment), heuristic difficulty estimation, and Agent-based delegation to codebase-documenter for Standard mode.

**Tech Stack:** Bash (`gh`), Read, Grep, Agent (Explore), Write

---

## File Structure

```
skills/
├── docs/
│   └── superpowers/
│       ├── specs/2026-04-05-issue-analyzer-design.md
│       └── plans/2026-04-05-issue-analyzer.md
└── issue-analyzer/        ← NEW
    ├── README.md
    ├── LICENSE
    └── SKILL.md
```

---

## Tasks

### Task 1: Create issue-analyzer directory

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/nmsn/Studio/skills/issue-analyzer
```

- [ ] **Step 2: Commit**

```bash
git add issue-analyzer && git commit -m "feat: scaffold issue-analyzer skill"
```

---

### Task 2: Write SKILL.md

**File:** `skills/issue-analyzer/SKILL.md`

**Content:**

```markdown
---
name: issue-analyzer
description: 获取 GitHub issues 列表，分析代码结构，评估修改难度，定位需修改的函数/文件 / Analyze GitHub issues, assess difficulty, locate code to modify. Triggers: 分析 issues、分析 issue、查看 issues、analyze issues、list issues
---

# Issue Analyzer / Issue 分析器

## Overview

获取 GitHub 项目 issues 列表，分析代码结构，评估修改难度，定位需修改的位置。支持两种深度：
- **Quick（默认）**：issue 列表 + 文件级修改定位
- **Standard**：调用 `codebase-documenter` skill 深度分析，函数级修改定位

---

## When to Use / 触发场景

**Quick（默认）:**
- 中文：分析 issues、分析 issue、查看 issues
- English：analyze issues、list issues

**Standard（显式指定）:**
- 中文：详细分析 issue、完整分析 issue
- English：detailed issue analysis、full issue analysis

---

## 双模式对比

| 维度 | Quick | Standard |
|------|-------|----------|
| Issue 获取 | `gh issue list --state all` | 同左 |
| 代码分析 | 基于 issue 文本 + 简单 Grep | 调用 `codebase-documenter` skill |
| 修改定位 | 文件级 | 函数级 |
| Token 消耗 | 低 | 高 |
| 适用场景 | 快速筛选 | 深度实施准备 |

---

## Issue 状态判断

| 状态 | 规则 |
|------|------|
| 已完成 | `state: closed` |
| 修改中 | `state: open` + 有 assignees，或近期有评论 |
| 可认领 | `state: open` + 无 assignee |

---

## 难度评估

基于启发式规则：

- **高**: 涉及多文件、核心模块、API 协议变更
- **中**: 单一模块、局部逻辑修改
- **低**: 文档、配置、小型 Bugfix

---

## 执行流程

### Quick 模式

```
1. 解析 depth level（默认 Quick）
2. 检测 gh 是否可用 + 项目是否为 GitHub 项目
3. Bash: gh issue list --state all --json number,title,state,assignees,comments
4. 判断每个 issue 的状态（已完成/修改中/可认领）
5. 启发式评估难度（基于标题关键词）
6. 简单 Grep 匹配相关代码文件（基于 issue 标题关键词）
7. 输出 issue 列表 + 文件级修改位置
```

### Standard 模式

```
1. 解析 depth level（检测到详细/完整/深入等关键词）
2. 执行 Quick 模式步骤 1-4
3. Agent (Explore) — 调用 codebase-documenter skill，thorough 模式
   - prompt: "Analyze this codebase structure focusing on: [issue topic]"
4. 基于 codebase-documenter 输出 + issue 内容
5. Grep 定位相关函数
6. 输出 issue 列表 + 函数级修改位置
```

---

## 输出格式

### Issue 列表

```markdown
## Issue 列表

| # | 标题 | 状态 | 难度 | 负责人 |
|---|------|------|------|--------|
| 123 | 登录失败 | 🟡 修改中 | 中 | @username |
| 124 | 添加单元测试 | 🟢 可认领 | 低 | - |
| 125 | 重构认证模块 | 🔴 已完成 | 高 | - |

共 N 个 open issues
```

### Issue 详情 (Standard)

```markdown
## Issue #123: 登录失败

**状态**: 🟡 修改中
**难度**: 中
**负责人**: @username

**分析:**
此 issue 涉及认证流程，代码位于 `src/auth/` 目录。

**预计修改（函数级）:**

| 文件 | 函数 | 修改说明 |
|------|------|----------|
| src/auth/login.ts | `authenticateUser()` | 修复 token 验证逻辑 |
| src/auth/session.ts | `createSession()` | 更新 session 过期时间 |
```

---

## 工具使用

| 工具 | 用途 |
|------|------|
| `Bash` | `gh issue list`, `gh issue view`, 仓库检测 |
| `Read` | issue 正文 |
| `Grep` | 代码模式匹配（函数定义、API 路由等） |
| `Agent (Explore)` | Standard 模式调用 codebase-documenter skill |

---

## Edge Cases

- **非 GitHub 项目**: 提示不支持，终止
- **gh 未安装**: 提示安装 GitHub CLI，终止
- **Issue 关联 PR**: 标注 "已通过 PR #xxx 修复"
- **大量 issues**: 默认只显示 open issues，标注总数
- **无 assignee 的 closed issue**: 标注为"已完成"
```

- [ ] **Step 2: Write README.md** (`skills/issue-analyzer/README.md`)

```markdown
# Issue Analyzer

获取 GitHub issues 列表，分析代码结构，评估修改难度，定位需修改的文件/函数。

## 功能特性

- **Quick 模式**: `gh issue list` + 基础分析，文件级修改定位
- **Standard 模式**: 委托 `codebase-documenter` skill 深度分析，函数级修改定位
- **状态判断**: 已完成 / 修改中 / 可认领
- **难度评估**: 高 / 中 / 低

## 安装

```bash
# Claude Code
mkdir -p ~/.claude/skills && cp -r skills/issue-analyzer ~/.claude/skills/

# Codex
mkdir -p ~/.agents/skills && cp -r skills/issue-analyzer ~/.agents/skills/
```

## 使用

| 深度 | 触发词 | 输出 |
|------|--------|------|
| Quick（默认）| 分析 issues | issue 列表 + 文件级定位 |
| Standard | 详细分析 issue | issue 列表 + 函数级定位 |

## 前置要求

- GitHub CLI (`gh`) 已安装并登录
- Claude Code 或 Codex
- 无需额外 MCP

## License

MIT
```

- [ ] **Step 3: Copy LICENSE**

```bash
cp /Users/nmsn/Studio/skills/codebase-documenter/LICENSE /Users/nmsn/Studio/skills/issue-analyzer/LICENSE
```

- [ ] **Step 4: Commit**

```bash
git add issue-analyzer/ && git commit -m "$(cat <<'EOF'
feat: add issue-analyzer skill

- Quick mode: gh issue list + basic analysis + file-level modification
- Standard mode: delegates to codebase-documenter skill for function-level analysis
- Issue status: closed/open+assignee/comment
- Heuristic difficulty: high/medium/low

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

- **Spec coverage**: All spec items covered (Quick/Standard modes, status rules, difficulty heuristics, delegation, output formats, edge cases)
- **Placeholder scan**: No TBD/TODO found
- **Bilingual**: description + triggers support both Chinese and English
- **Depth levels**: Clear Quick/Standard separation with switch keywords
- **Delegation**: Standard mode delegates to codebase-documenter via Agent (Explore)
- **Output formats**: Issue list table and Issue detail table match spec exactly
