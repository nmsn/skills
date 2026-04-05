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