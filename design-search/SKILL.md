---
name: design-search
description: Use when user asks for design inspiration, references, or inspiration materials from Dribbble or Pinterest, or wants to generate an HTML card page of search results
---

# Design Search Skill

## Overview

使用 Playwright MCP 从 Dribbble 和 Pinterest 抓取设计灵感。与返回搜索链接不同，本技能提取实际设计内容（标题、作者、描述、链接）并结构化展示。

**可选：后台运行** — 配置 Playwright MCP 为 headless 模式可让浏览器操作在后台静默执行，用户无感知。

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

## Headless Mode（可选）

让浏览器操作在后台静默执行，用户无感知。

**启动 headless 模式：**

```bash
# CLI 启动
npx @playwright/mcp@latest --headless

# Docker 部署
docker run -d -i --rm --init --pull=always \
  --entrypoint node --name playwright \
  -p 8931:8931 mcr.microsoft.com/playwright/mcp \
  cli.js --headless --browser chromium --no-sandbox

# 或使用配置文件 config.json
{
  "browser": {
    "launchOptions": { "headless": true }
  }
}
```

配置后重启 Claude Code，MCP 会自动使用 headless 模式。

## Process

1. **Dribbble**: 导航 → 快照 → 提取卡片（标题/作者/点赞/链接/图片）
2. **Pinterest**: 导航 → 按 End 键 → 快照 → 提取 Pin（描述/链接/图片）
3. 输出结果（Markdown 表格 或 HTML 卡片页面）

## Output Format

### Markdown 表格（默认）

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

### HTML 卡片页面（可选）

使用 `generateHtmlReport()` 函数生成自包含 HTML 文件：

```javascript
const { generateHtmlReport } = require('./design-search/generate-html.js');

const results = [
  { source: 'dribbble', title: 'App UI', url: '...', imageUrl: '...', likes: 234 },
  { source: 'pinterest', description: 'Design', url: '...', imageUrl: '...' }
];

// 生成 HTML（图片自动转为 base64）
const path = await generateHtmlReport(results, { query: 'mobile app' });

// 不下载图片，只生成模板
const path = await generateHtmlReport(results, { query: 'mobile app', fetchImages: false });

// 指定输出路径
const path = await generateHtmlReport(results, { query: 'app', outputPath: '~/Desktop/designs.html' });
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `results` | Array | 必填 | 搜索结果数组，每项需含 `source`（dribbble/pinterest）、`url`、`imageUrl` |
| `options.query` | string | 'design' | 搜索关键词，用于文件名和页面标题 |
| `options.fetchImages` | boolean | true | 是否下载图片嵌入 HTML |
| `options.outputPath` | string | 自动生成 | 自定义输出路径 |

**图片处理：**
- 图片自动转换为 data URI（base64）嵌入 HTML
- 文件完全自包含，可离线查看
- 图片加载失败显示平台占位符

**生成的 HTML 特性：**
- 响应式网格布局（移动端 1 列，桌面 3-4 列）
- 卡片 hover 效果（阴影提升）
- 点击图片打开原始设计页面（新标签页）
- 平台标识（Dribbble/Pinterest）
- 点赞数显示（Dribbble）

## Common Mistakes

| 错误 | 修复 |
|------|------|
| Pinterest 只返回空弹窗 | 弹窗后通常有内容，继续提取 `<listitem>` 元素 |
| Dribbble 无内容 | 尝试滚动或检查是否需要登录 |
| 图片不显示 | accessibility snapshot 只有 alt 文本，用作描述 |
| 直接返回搜索链接 | 必须抓取实际内容，仅在失败时降级为链接 |
