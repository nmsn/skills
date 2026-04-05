# Issue Analyzer Skill — Design Spec

## Overview

获取 GitHub 项目 issues 列表，分析代码结构，评估修改难度，定位需修改的函数级位置。支持 Quick/Standard 双模式，Standard 模式委托给 codebase-documenter skill 深度分析。

## When to Use / 触发场景

**Quick（默认）:**
- 中文：分析 issues、分析 issue、查看 issues
- English：analyze issues、list issues

**Standard（显式指定）:**
- 中文：详细分析 issue、完整分析 issue
- English：detailed issue analysis、full issue analysis

## 双模式对比

| 维度 | Quick | Standard |
|------|-------|----------|
| Issue 获取 | `gh issue list --state all` | 同左 |
| 代码分析 | 基于 issue 文本 + 简单 Grep | 调用 `codebase-documenter` skill |
| 修改定位 | 文件级 | 函数级 |
| Token 消耗 | 低 | 高 |
| 适用场景 | 快速筛选 | 深度实施准备 |

## Issue 状态判断

| 状态 | 判断逻辑 |
|------|----------|
| 已完成 | `state: closed` |
| 修改中 | `state: open` + 有 assignees，或近期有评论 |
| 可认领 | `state: open` + 无 assignee |

## 难度评估

基于启发式规则评估（Quick/Standard 通用）：
- **高**: 涉及多文件、核心模块、API 协议变更
- **中**: 单一模块、局部逻辑修改
- **低**: 文档、配置、小型 Bugfix

## 委托机制 (Standard 模式)

```
issue-analyzer (Standard mode)
  └── Agent (Explore)
      └── invoke: codebase-documenter skill
  └── 基于 issue 内容 + 代码结构
      └── Grep 定位相关函数
      └── 输出函数级修改位置
```

## 输出格式

### Issue 列表输出

```markdown
## Issue 列表

| # | 标题 | 状态 | 难度 | 负责人 |
|---|------|------|------|--------|
| 123 | 登录失败 | 🟡 修改中 | 中 | @username |
| 124 | 添加单元测试 | 🟢 可认领 | 低 | - |
| 125 | 重构认证模块 | 🔴 已完成 | 高 | - |
```

### Issue 详情输出 (Standard)

```markdown
## Issue #123: 登录失败

**状态**: 修改中
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

## 工具使用

| 工具 | 用途 |
|------|------|
| `Bash` | `gh issue list`, `gh issue view`, `gh api graphql` |
| `Read` | issue 正文 |
| `Grep` | 代码模式匹配（函数定义、API 路由等） |
| `Agent (Explore)` | 调用 codebase-documenter skill (Standard) |

## 文件结构

```
skills/
└── issue-analyzer/      ← NEW
    ├── README.md
    ├── LICENSE
    └── SKILL.md
```

## Edge Cases

- 项目无 GitHub remote: 提示用户非 GitHub 项目，不适用
- `gh` 未安装: 提示安装 GitHub CLI
- Issue 关联 PR: 标注 "已通过 PR #xxx 修复"
- 大量 issues (>100): 默认只显示 open issues，标注总数
