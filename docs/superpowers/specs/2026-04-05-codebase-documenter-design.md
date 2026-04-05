# Codebase Documenter Skill — Design

## Overview

A skill that analyzes codebase structure and generates structured documentation, with two depth levels: Quick (default, 5-10 min) and Standard (15-30 min).

## Triggers

**中文:** 分析项目结构、解释这个代码库、文档化架构、生成代码概览
**English:** analyze codebase、explain this code、document architecture、generate codebase overview

**Depth switching:**
- Default: Quick (implicit on standard triggers)
- Explicit: 用户说 "详细分析" / "完整文档" → Standard

---

## Depth Levels

| | Quick (default) | Standard |
|---|---|---|
| **Duration** | 5-10 min | 15-30 min |
| **Project Overview** | ✅ | ✅ |
| **Tech Stack** | ✅ | ✅ |
| **Directory Structure** | ✅ | ✅ |
| **Key Components** | ✅ | ✅ |
| **Data Flow** | — | ✅ Mermaid diagram |
| **Architecture Decisions** | — | ✅ |
| **External Integrations** | — | ✅ |
| **Entry Points** | — | ✅ |

---

## Process

```
1. Parse depth level (default Quick)
2. Glob scan project structure (root + key dirs)
3. Read critical files: README, package.json, config files
4. Explore agent (thorough) — Standard only
5. Grep extract: imports, exports, routes, patterns
6. Synthesize output: conversation + files
```

---

## Output Structure

### Quick

**Conversation:** Structured analysis output
**File:** `docs/codebase/OVERVIEW.md`

```
## 项目概览 / Project Overview
## 技术栈 / Tech Stack
## 目录结构 / Directory Structure
## 关键组件 / Key Components
```

### Standard

**Conversation:** Comprehensive analysis
**Files:**
- `docs/codebase/README.md` — Index + overview
- `docs/codebase/ARCHITECTURE.md` — Architecture diagram + data flow
- `docs/codebase/OVERVIEW.md` — Full content

---

## Tools

- `Glob` — Directory structure scan
- `Read` — README, configs, entry points
- `Grep` — Import/export patterns, routes
- `Agent (Explore, thorough)` — Standard depth only
- `Write` — Generate documentation files
- `Bash` — Git metadata, version info

---

## File Location

Output files are written to the **target project's** `docs/codebase/` directory, not the skill directory.
