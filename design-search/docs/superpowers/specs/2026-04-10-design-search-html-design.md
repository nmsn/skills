# design-search HTML 输出优化设计

**日期：** 2026-04-10
**状态：** 已批准

## 概述

将 design-search skill 的输出从 Markdown 表格升级为可分享的 HTML 卡片页面。抓取 Dribbble 和 Pinterest 设计内容后，生成自包含的 HTML 文件，用户可直接在浏览器中查看、点击卡片跳转到原始设计。

## 数据获取

| 平台 | 提取字段 |
|------|----------|
| Dribbble | 标题、作者、点赞数、原图 URL、详情页链接 |
| Pinterest | Pin 描述、图片 URL、原链接 |

## HTML 生成

### 图片处理
- 图片转为 data URI（base64）直接嵌入 HTML
- 确保页面完全自包含，可离线查看
- 图片加载失败时显示占位符（平台 Logo）

### 输出文件
- 路径：`/tmp/design-search-{query}-{timestamp}.html`
- 用户可通过 `open` 命令直接打开
- 文件可分享给他人

### 页面结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>设计灵感 - {query}</title>
  <style>/* 响应式网格布局 */</style>
</head>
<body>
  <header><h1>设计灵感 - {query}</h1></header>
  <main>
    <!-- Dribbble 卡片 -->
    <section>
      <h2>Dribbble</h2>
      <div class="grid">
        <a href="{original_url}" class="card" target="_blank">
          <img src="{data_uri}" alt="{title}">
          <div class="card-body">
            <h3>{title}</h3>
            <span class="source">Dribbble</span>
          </div>
        </a>
      </div>
    </section>
    <!-- Pinterest 卡片 -->
    <section>
      <h2>Pinterest</h2>
      ...
    </section>
  </main>
</body>
</html>
```

## 卡片样式

- **布局**：响应式网格（移动端 1 列， tablet 2 列， desktop 3-4 列）
- **卡片**：圆角边框，hover 效果（阴影/缩放）
- **图片**：16:9 或原图比例，object-fit cover
- **标题**：截断显示，tooltip 展示完整标题
- **来源标识**：Dribbble/Pinterest 小图标

## 交互

- 卡片图片点击 → 打开原始设计页面（新标签页）
- 页面完全自包含，无外部依赖
- 支持浏览器直接打印为 PDF

## 实现清单

1. 新增 `generate_html_report(results, query)` 函数
2. 实现图片转 data URI 功能（含错误处理）
3. 生成响应式 HTML 模板
4. 更新 SKILL.md 文档
5. 测试验证

## 文件变更

- `SKILL.md` — 新增 HTML 输出说明
- `generate-html.js` (新) — HTML 生成逻辑
