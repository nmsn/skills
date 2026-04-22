# follow-frontend

前端技术资讯 — 聚合 dev.to、Hacker News、JavaScript Weekly、Node Weekly、React、CSS-Tricks 等 RSS 源，自动过滤一周内新闻并输出 Markdown。

## 数据源

- dev.to
- Hacker News
- JavaScript Weekly
- Node Weekly
- React (legacy.reactjs.org)
- CSS-Tricks

## 快速开始

```bash
cd scripts && npm install
```

## 使用方式

输入 `/fe` 或「给我来一份前端资讯」，Agent 会运行 `fetch-feeds.js` 抓取最新内容。

## 输出格式

脚本输出 Markdown 到 `scripts/feeds-output.md`，按来源分组，包含标题、链接、摘要和发布日期。

示例见 [examples/feeds-output.md](examples/feeds-output.md)。

## 自定义数据源

编辑 `scripts/fetch-feeds.js` 中的 `FEEDS` 数组。

## 环境要求

- Node.js v18+
