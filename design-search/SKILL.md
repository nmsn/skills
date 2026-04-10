---
name: design-search
description: Use when user asks for design inspiration, references, or inspiration materials from Dribbble or Pinterest, or wants to generate an HTML card page of search results
---

# Design Search Skill

## Overview

使用 Playwright CLI 从 Dribbble 和 Pinterest 抓取设计灵感（完全后台静默执行）。与返回搜索链接不同，本技能提取实际设计内容（标题、作者、描述、链接）并结构化展示。

**特点：**
- 完全后台运行，无浏览器窗口
- 无需 MCP 配置
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

## Requirements

```bash
npm install playwright
npx playwright install chromium
```

## Usage

### 命令行直接运行

```bash
node scrape.js "pomodoro timer"          # 搜索两个平台
node scrape.js "mobile app" dribbble    # 只搜索 Dribbble
node scrape.js "dashboard" pinterest     # 只搜索 Pinterest
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

## Common Mistakes

| 错误 | 修复 |
|------|------|
| `playwright not found` | 运行 `npm install playwright && npx playwright install chromium` |
| Pinterest 无内容 | 网站可能需要登录，尝试 Dribbble |
| Dribbble 无内容 | 页面结构可能变化，检查选择器 |
| 图片不显示 | 图片 URL 可能是懒加载，使用 `fetchImages: true` 抓取 |

## File Structure

```
design-search/
├── SKILL.md           # 本文档
├── scrape.js          # 抓取脚本（Playwright CLI）
├── generate-html.js   # HTML 报告生成器
└── README.md
```