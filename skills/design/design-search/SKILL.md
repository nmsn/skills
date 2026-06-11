---
name: design-search
description: Use when user asks for design inspiration, references, or inspiration materials from Dribbble or Pinterest, or wants to generate an HTML card page of search results
---

# Design Search Skill

## Overview

从 Dribbble 和 Pinterest 抓取设计灵感，生成自包含 HTML 卡片页面。

**方案 C: Playwright MCP 静默模式 + HTTP 回退**
1. 优先使用 Playwright MCP（headless 静默执行）
2. Playwright 不可用时自动回退到纯 HTTP 抓取
3. 最终生成 HTML 卡片页面

**特点：**
- 后台静默执行（无可见浏览器窗口）
- 零依赖回退方案（HTTPS 模块，Node.js 内置）
- 自动降级保障抓取成功率
- 支持 HTML 卡片页面生成

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

## 依赖说明

### 最小依赖（自动降级）
```javascript
// 零额外依赖，仅使用 Node.js 内置模块
const https = require('https');
const http = require('http');
```

### 完整功能（可选）
```bash
npm install playwright    # 可选，增强抓取能力
npx playwright install chromium  # 可选，165MB
```

**注意**: 即使不安装 Playwright，HTTP 回退方案仍可正常工作。

## Usage

### 命令行直接运行

```bash
node scrape.js "pomodoro timer"      # 搜索两个平台
node scrape.js "mobile app" dribbble  # 只搜索 Dribbble
node scrape.js "dashboard" pinterest # 只搜索 Pinterest
```

### 在 Node.js 中调用

```javascript
const { scrapeDribbble, scrapePinterest } = require('./scrape.js');

// 抓取 Dribbble
const dribbbleResults = await scrapeDribbble('mobile app');

// 抓取 Pinterest
const pinterestResults = await scrapePinterest('dashboard design');

// 两个平台都抓
const results = [];
results.push(...await scrapeDribbble('app design'));
results.push(...await scrapePinterest('app design'));
```

### 生成 HTML 报告

```javascript
const { scrapeDribbble } = require('./scrape.js');
const { generateHtmlReport } = require('./generate-html.js');

const results = await scrapeDribbble('pomodoro timer');
const htmlPath = await generateHtmlReport(results, { query: 'pomodoro timer' });
console.log('HTML 报告:', htmlPath);
```

## Output Format

### JSON 输出（默认）

```json
{
  "source": "search",
  "query": "pomodoro timer",
  "timestamp": 1234567890,
  "dribbble": [
    {
      "title": "Pomodoro Timer App",
      "author": "John Doe",
      "likes": "234",
      "url": "https://dribbble.com/shots/12345678",
      "imageUrl": "https://cdn.dribbble.com/..."
    }
  ],
  "pinterest": [
    {
      "description": "Minimalist workspace design",
      "url": "https://www.pinterest.com/pin/123",
      "imageUrl": "https://i.pinimg.com/..."
    }
  ]
}
```

### HTML 卡片页面

```javascript
const { scrapeDribbble, scrapePinterest } = require('./scrape.js');
const { generateHtmlReport } = require('./generate-html.js');

async function searchAndGenerate(query) {
  const [dribbble, pinterest] = await Promise.all([
    scrapeDribbble(query).catch(() => []),
    scrapePinterest(query).catch(() => [])
  ]);

  const allResults = [
    ...dribbble.map(r => ({ ...r, source: 'dribbble' })),
    ...pinterest.map(r => ({ ...r, source: 'pinterest' }))
  ];

  const htmlPath = await generateHtmlReport(allResults, { query });
  return htmlPath;
}

// 使用
const path = await searchAndGenerate('pomodoro timer');
```

**HTML 输出参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `results` | Array | 必填 | 搜索结果数组，每项需含 `source`、`url` |
| `options.query` | string | 'design' | 搜索关键词 |
| `options.fetchImages` | boolean | true | 是否下载图片嵌入 HTML |
| `options.outputPath` | string | 自动生成 | 自定义输出路径 |

**HTML 特性：**
- 响应式网格布局（移动端 1 列，桌面 3-4 列）
- 卡片 hover 效果
- 点击打开原始设计页面
- 图片内嵌为 base64，完全自包含

## 抓取策略

```
┌─────────────────────────────────────┐
│         开始抓取请求                 │
└─────────────────┬───────────────────┘
                  ▼
    ┌─────────────────────────┐
    │ Playwright 可用？        │
    └───────────┬─────────────┘
        是      │      否
        ▼       │       ▼
    使用 headless   使用 HTTP 回退
    模式抓取        (零依赖)
        │       │       │
        ▼       │       ▼
    ┌─────────────────────┐
    │ 返回结果？ 成功？     │
    └───────────┬─────────┘
        是      │      否
        ▼       │       ▼
      完成    回退到 HTTP
              (零依赖)
                  │
                  ▼
            ┌───────────┐
            │ 返回结果？ │
            └─────┬─────┘
                是
                ▼
              完成
```

## Common Mistakes

| 错误 | 修复 |
|------|------|
| 浏览器窗口可见 | 已配置 `headless: true`，默认静默执行 |
| `playwright not found` | 可选，不安装也能用 HTTP 回退抓取 |
| Pinterest 无内容 | Pinterest 强依赖 JS，建议使用 Playwright 或获取链接即可 |
| Dribbble 无内容 | 页面结构可能变化，检查选择器或使用 HTTP 回退 |
| 图片不显示 | 图片 URL 可能是懒加载，使用 `fetchImages: true` 抓取 |

## File Structure

```
design-search/
├── SKILL.md           # 本文档
├── scrape.js          # 抓取脚本（MCP 优先 + HTTP 回退）
├── generate-html.js   # HTML 报告生成器
└── README.md
```
