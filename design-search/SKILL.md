---
name: design-search
description: Use when user asks for design inspiration, references, or inspiration materials from Dribbble or Pinterest (e.g. "搜索 xxx 设计", "找 xxx 相关设计", "design inspiration for xxx")
---

# Design Search Skill

## Overview

使用 Playwright MCP 从 Dribbble 和 Pinterest 抓取设计灵感。与返回搜索链接不同，本技能提取实际设计内容（标题、作者、描述、链接）并结构化展示。

## When to Use

- 用户说 "搜索 xxx 设计"
- 用户说 "找 xxx 相关设计"
- 用户说 "帮我找 xxx 设计参考"
- 用户说 "design inspiration for xxx"
- 用户请求从 Dribbble/Pinterest 查找视觉参考

**When NOT to use:**
- 用户只需要链接而非内容预览
- 目标平台不是 Dribbble 或 Pinterest
- 需要登录才能访问的内容

## Quick Reference

| 平台 | URL 格式 | 特殊处理 |
|------|----------|----------|
| Dribbble | `https://dribbble.com/search/{query}` | 不需要 URL encode |
| Pinterest | `https://www.pinterest.com/search/pins/?q={url-encoded-query}` | 需要 URL encode |

**Playwright 工具:**
- `browser_navigate` → 导航到搜索页
- `browser_snapshot` → 获取页面结构
- `browser_press_key("End")` → 触发 Pinterest 懒加载

## Process

1. **Dribbble**: 导航 → 快照 → 提取卡片（标题/作者/点赞/链接）
2. **Pinterest**: 导航 → 按 End 键 → 快照 → 提取 Pin（描述/链接）
3. 格式化输出为表格

## Output Format

```
## 设计搜索结果

### Dribbble 🔍

| 标题 | 作者 | 点赞 | 链接 |
|------|------|------|------|
| ... | ... | ... | ... |

### Pinterest 🔍

| 描述 | 链接 |
|------|------|
| ... | ... |
```

## Common Mistakes

| 错误 | 修复 |
|------|------|
| Pinterest 只返回空弹窗 | 弹窗后通常有内容，继续提取 `<listitem>` 元素 |
| Dribbble 无内容 | 尝试滚动或检查是否需要登录 |
| 图片不显示 | accessibility snapshot 只有 alt 文本，用作描述 |
| 直接返回搜索链接 | 必须抓取实际内容，仅在失败时降级为链接 |
