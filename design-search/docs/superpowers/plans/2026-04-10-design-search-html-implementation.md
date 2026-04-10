# design-search HTML 输出实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 将 design-search skill 的输出从 Markdown 表格升级为可分享的 HTML 卡片页面。

**架构：** 在现有 skill 中新增一个 Node.js 脚本 `generate-html.js`，接收抓取结果数据，生成自包含的 HTML 文件（图片以内联 base64 嵌入）。

**技术栈：** Node.js（纯 JavaScript，无外部依赖）、Playwright MCP（用于抓取）

---

## 文件结构

```
design-search/
├── SKILL.md                      # 更新文档，说明新流程
├── generate-html.js               # 新增：HTML 生成脚本
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-04-10-design-search-html-design.md
│       └── plans/
│           └── 2026-04-10-design-search-html-implementation.md
```

---

## 实现任务

### Task 1: 创建 HTML 生成脚本骨架

**文件:**
- 创建: `generate-html.js`

**步骤:**

- [ ] **Step 1: 创建 generate-html.js 文件，包含基础结构**

```javascript
/**
 * design-search HTML 生成器
 * 将 Dribbble/Pinterest 抓取结果转换为自包含 HTML 卡片页面
 */

/**
 * 生成 HTML 报告
 * @param {Array} results - 抓取结果数组
 * @param {Object} options - 配置选项
 * @param {string} options.query - 搜索关键词
 * @param {string} options.outputPath - 输出文件路径（可选）
 * @returns {Promise<string>} - 生成的文件路径
 */
async function generateHtmlReport(results, options = {}) {
  const { query = 'design', outputPath } = options;
  // TODO: 实现 HTML 生成逻辑
}

module.exports = { generateHtmlReport };
```

- [ ] **Step 2: 提交**

```bash
git add generate-html.js
git commit -m "feat: scaffold HTML generator script"
```

---

### Task 2: 实现 HTML 模板生成

**文件:**
- 修改: `generate-html.js`

**步骤:**

- [ ] **Step 1: 在 generateHtmlReport 函数中添加 HTML 模板生成逻辑**

```javascript
function buildHtmlTemplate(data) {
  const { query, dribbbleItems = [], pinterestItems = [] } = data;

  const dribbbleCards = dribbbleItems.map(item => `
    <a href="${escapeHtml(item.url)}" class="card" target="_blank" rel="noopener">
      <div class="card-image">
        <img src="${item.imageDataUri || ''}" alt="${escapeHtml(item.title)}"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 60%22><rect fill=%22%23f0f0f0%22 width=%22100%22 height=%2260%22/><text x=%2250%22 y=%2235%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2212%22>Dribbble</text></svg>'">
      </div>
      <div class="card-body">
        <h3 class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
        <div class="card-meta">
          <span class="source-badge dribbble">Dribbble</span>
          ${item.likes ? `<span class="likes">♥ ${item.likes}</span>` : ''}
        </div>
      </div>
    </a>
  `).join('');

  const pinterestCards = pinterestItems.map(item => `
    <a href="${escapeHtml(item.url)}" class="card" target="_blank" rel="noopener">
      <div class="card-image">
        <img src="${item.imageDataUri || ''}" alt="${escapeHtml(item.description || 'Pinterest')}"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 60%22><rect fill=%22%23f0f0f0%22 width=%22100%22 height=%2260%22/><text x=%2250%22 y=%2235%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2212%22>Pinterest</text></svg>'">
      </div>
      <div class="card-body">
        <p class="card-description" title="${escapeHtml(item.description || '')}">${escapeHtml(item.description || '')}</p>
        <span class="source-badge pinterest">Pinterest</span>
      </div>
    </a>
  `).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>设计灵感 - ${escapeHtml(query)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; color: #333; }
    header { background: #fff; border-bottom: 1px solid #eee; padding: 24px; text-align: center; }
    header h1 { font-size: 1.5rem; font-weight: 600; }
    header .subtitle { color: #666; margin-top: 8px; font-size: 0.9rem; }
    main { max-width: 1200px; margin: 0 auto; padding: 24px; }
    section { margin-bottom: 48px; }
    section h2 { font-size: 1.25rem; margin-bottom: 16px; color: #222; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .card { display: block; background: #fff; border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .card-image { aspect-ratio: 4/3; background: #f0f0f0; overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; }
    .card-body { padding: 16px; }
    .card-title { font-size: 0.95rem; font-weight: 500; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-description { font-size: 0.85rem; color: #666; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-meta { display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; }
    .source-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
    .source-badge.dribbble { background: #ea4c89; color: #fff; }
    .source-badge.pinterest { background: #bd081c; color: #fff; }
    .likes { color: #666; }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>设计灵感 - ${escapeHtml(query)}</h1>
    <div class="subtitle">共 ${dribbbleItems.length + pinterestItems.length} 个设计灵感</div>
  </header>
  <main>
    ${dribbbleCards ? `<section><h2>Dribbble 🔍</h2><div class="grid">${dribbbleCards}</div></section>` : ''}
    ${pinterestCards ? `<section><h2>Pinterest 🔍</h2><div class="grid">${pinterestCards}</div></section>` : ''}
  </main>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
```

- [ ] **Step 2: 提交**

```bash
git add generate-html.js
git commit -m "feat: add HTML template generation"
```

---

### Task 3: 实现图片转 Data URI 功能

**文件:**
- 修改: `generate-html.js`

**步骤:**

- [ ] **Step 1: 添加 fetchImageAsDataUri 函数**

```javascript
const https = require('https');
const http = require('http');

/**
 * 将图片 URL 转换为 data URI
 * @param {string} imageUrl - 图片 URL
 * @returns {Promise<string|null>} - data URI 或 null（失败时）
 */
function fetchImageAsDataUri(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(null);
      return;
    }

    const protocol = imageUrl.startsWith('https') ? https : http;
    const maxSize = 5 * 1024 * 1024; // 5MB 限制
    let size = 0;
    let data = [];

    const req = protocol.get(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchImageAsDataUri(res.headers.location).then(resolve);
        return;
      }

      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }

      const contentType = res.headers['content-type'] || 'image/jpeg';

      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > maxSize) {
          req.abort();
          resolve(null);
          return;
        }
        data.push(chunk);
      });

      res.on('end', () => {
        try {
          const buffer = Buffer.concat(data);
          const base64 = buffer.toString('base64');
          resolve(`data:${contentType};base64,${base64}`);
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(null);
    });
  });
}
```

- [ ] **Step 2: 在 generateHtmlReport 中集成图片转换**

更新 `generateHtmlReport` 函数，接收已转换的 data URI，或提供转换选项：

```javascript
async function generateHtmlReport(results, options = {}) {
  const { query = 'design', outputPath, fetchImages = true } = options;

  // 支持两种输入格式：
  // 1. results[i].imageDataUri - 已转换的图片
  // 2. results[i].imageUrl - 原始 URL，需要转换
  const items = await Promise.all(results.map(async (item) => {
    if (item.imageDataUri) return item;
    if (fetchImages && item.imageUrl) {
      item.imageDataUri = await fetchImageAsDataUri(item.imageUrl);
    }
    return item;
  }));

  // 按平台分组
  const dribbbleItems = items.filter(i => i.source === 'dribbble');
  const pinterestItems = items.filter(i => i.source === 'pinterest');

  const html = buildHtmlTemplate({ query, dribbbleItems, pinterestItems });

  const timestamp = Date.now();
  const defaultPath = `/tmp/design-search-${slugify(query)}-${timestamp}.html`;
  const filePath = outputPath || defaultPath;

  const fs = require('fs');
  fs.writeFileSync(filePath, html, 'utf8');

  return filePath;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'query';
}
```

- [ ] **Step 3: 提交**

```bash
git add generate-html.js
git commit -m "feat: add image to data URI conversion"
```

---

### Task 4: 更新 SKILL.md 文档

**文件:**
- 修改: `SKILL.md`

**步骤:**

- [ ] **Step 1: 在 SKILL.md 中新增 HTML 输出说明**

在现有的 "Output Format" 部分后添加：

```markdown
## HTML 输出（可选）

使用 `--html` 或 `--output <path>` 参数时，生成自包含 HTML 卡片页面。

**图片处理：**
- 图片自动转换为 data URI（base64）嵌入 HTML
- 文件完全自包含，可离线查看
- 图片加载失败显示占位符

**输出示例：**

```bash
# 生成 HTML 到默认路径 /tmp
design-search --query "mobile app" --html

# 指定输出路径
design-search --query "dashboard design" --output ~/Desktop/designs.html
```

**生成的 HTML 特性：**
- 响应式网格布局（移动端 1 列，桌面 3-4 列）
- 卡片 hover 效果
- 点击图片打开原始设计页面
- 平台标识（Dribbble/Pinterest）
```

- [ ] **Step 2: 提交**

```bash
git add SKILL.md
git commit -m "docs: document HTML output feature"
```

---

### Task 5: 测试验证

**文件:**
- 测试: `generate-html.js`（内联测试）

**步骤:**

- [ ] **Step 1: 运行内联测试**

```javascript
// 在 Node.js 中运行
const { generateHtmlReport } = require('./generate-html.js');

const testResults = [
  {
    source: 'dribbble',
    title: 'App Dashboard UI',
    url: 'https://dribbble.com/shots/12345678',
    imageUrl: 'https://cdn.dribbble.com/userapi/.../shot.png',
    likes: 234
  },
  {
    source: 'pinterest',
    description: 'Minimalist workspace design inspiration',
    url: 'https://pinterest.com/pin/123',
    imageUrl: 'https://i.pinimg.com/.../image.jpg'
  }
];

async function test() {
  const path = await generateHtmlReport(testResults, {
    query: 'dashboard design',
    fetchImages: false // 测试模板生成，不下载图片
  });
  console.log('Generated:', path);

  const fs = require('fs');
  const content = fs.readFileSync(path, 'utf8');
  console.log('File size:', content.length, 'bytes');
  console.log('Has Dribbble section:', content.includes('Dribbble'));
  console.log('Has Pinterest section:', content.includes('Pinterest'));
}

test().catch(console.error);
```

运行：
```bash
node -e "$(cat generate-html.js); $(cat <<'EOF'
const { generateHtmlReport } = require('./generate-html.js');
generateHtmlReport([
  { source: 'dribbble', title: 'Test', url: 'https://dribbble.com', imageUrl: '' },
  { source: 'pinterest', description: 'Test pin', url: 'https://pinterest.com', imageUrl: '' }
], { query: 'test', fetchImages: false }).then(console.log);
EOF
)"
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "test: verify HTML generation works"
```

---

## 自检清单

完成实现后，确认以下内容：

- [ ] spec 中每个需求都有对应任务实现
- [ ] 无 "TBD"、"TODO"、"后续实现" 等占位符
- [ ] 类型一致性（函数签名、参数命名）
- [ ] 所有代码有实际内容，非伪代码
