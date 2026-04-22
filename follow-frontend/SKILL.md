---
name: follow-frontend
description: 前端技术资讯 — 聚合 dev.to/Hacker News/JavaScript Weekly/Node Weekly/React/CSS-Tricks 等 RSS 源，自动过滤一周内新闻并输出 Markdown。当用户提到"前端资讯"、"前端动态"、"技术周报"、"刷一下前端新闻"、"帮我看看最近前端有什么新东西"时使用此技能。
metadata:
  openclaw: true
  requires:
    bins:
      - node
---

# Follow Frontend

追踪前端技术生态的最新动态，从优质 RSS 源聚合内容，过滤一周内新闻，输出中文 Markdown。

## 工作流程

### 触发方式

- 用户输入 `/fe` 或「给我来一份前端资讯」
- 用户要求刷一下前端新闻
- 用户想了解 React/Vue/JavaScript/CSS 生态最新动态

### 执行步骤

**第 1 步：运行抓取脚本**

```bash
cd ${CLAUDE_SKILL_DIR}/scripts && node fetch-feeds.js
```

脚本从以下 RSS 源抓取内容：
- dev.to
- Hacker News
- JavaScript Weekly
- Node Weekly
- React (legacy.reactjs.org)
- CSS-Tricks

**第 2 步：过滤与输出**

脚本自动：
- 过滤发布日期，只保留 **7 天内**的新闻
- 去除 HTML 标签，保留纯文本
- 按来源分组，输出到 `scripts/feeds-output.md`

**第 3 步：展示结果**

读取 `scripts/feeds-output.md`，以友好格式展示给用户。

---

## 数据源管理

当前数据源在 `scripts/fetch-feeds.js` 的 `FEEDS` 数组中。如需修改，直接编辑该文件。

---

## 注意事项

- 脚本自动过滤一周前的新闻，无需手动处理
- 如果某个 RSS 源返回错误，脚本会跳过该源继续处理其他的
- 输出格式为 Markdown，包含原文链接，方便进一步阅读
- 抓取间隔建议不小于 500ms，避免对目标服务器造成压力
