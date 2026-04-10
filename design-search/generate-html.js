/**
 * design-search HTML 生成器
 * 将 Dribbble/Pinterest 抓取结果转换为自包含 HTML 卡片页面
 */

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

const https = require('https');
const http = require('http');

/**
 * 将图片 URL 转换为 data URI
 * @param {string} imageUrl - 图片 URL
 * @returns {Promise<string|null>} - data URI 或 null（失败时）
 */
function fetchImageAsDataUri(imageUrl, redirectCount = 0) {
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
      // 处理重定向（最多 10 次）
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirectCount >= 10) {
          resolve(null);
          return;
        }
        fetchImageAsDataUri(res.headers.location, redirectCount + 1).then(resolve);
        return;
      }

      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }

      const contentType = res.headers['content-type'] || '';

      // Validate content-type is actually an image
      if (!contentType || !contentType.startsWith('image/')) {
        resolve(null);
        return;
      }

      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > maxSize) {
          req.destroy();
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

    let resolved = false;
    const resolveOnce = (val) => { if (!resolved) { resolved = true; resolve(val); } };

    req.on('error', () => resolveOnce(null));
    req.setTimeout(10000, () => {
      req.destroy();
      resolveOnce(null);
    });
  });
}

/**
 * 生成 HTML 报告
 * @param {Array} results - 搜索结果数组，每项需含 source(dribbble/pinterest)、url、imageUrl
 * @param {Object} options - 配置选项
 * @param {string} options.query - 搜索关键词，用于文件名和页面标题
 * @param {boolean} options.fetchImages - 是否下载图片嵌入 HTML，默认 true
 * @param {string} options.outputPath - 输出文件路径（可选），默认 /tmp/design-search-{query}-{timestamp}.html
 * @returns {Promise<string>} - 生成的文件路径
 */
async function generateHtmlReport(results, options = {}) {
  const { query = 'design', outputPath, fetchImages = true } = options;

  const safeResults = Array.isArray(results) ? results : [];

  // Optionally fetch images as data URIs
  const itemsWithImages = await Promise.all(safeResults.map(async (item) => {
    if (!fetchImages || !item.imageUrl || item.imageDataUri) {
      return { ...item };
    }
    return { ...item, imageDataUri: await fetchImageAsDataUri(item.imageUrl) };
  }));

  const dribbbleItems = itemsWithImages.filter(i => i.source === 'dribbble');
  const pinterestItems = itemsWithImages.filter(i => i.source === 'pinterest');

  const html = buildHtmlTemplate({ query, dribbbleItems, pinterestItems });

  const fs = require('fs');
  const path = require('path');
  const timestamp = Date.now();
  const safeQuery = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'design';
  const filename = `design-search-${safeQuery}-${timestamp}.html`;

  // Determine output directory: outputPath takes precedence, otherwise use current working directory
  let defaultDir = process.cwd();
  let defaultPath;

  if (outputPath) {
    // If outputPath is an absolute path, use it directly
    // If it's a relative path, resolve from cwd
    defaultPath = path.isAbsolute(outputPath) ? outputPath : path.resolve(defaultDir, outputPath);
  } else {
    // Use cwd/.design-search-results/ directory
    const resultsDir = path.join(defaultDir, '.design-search-results');
    try {
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      defaultPath = path.join(resultsDir, filename);
    } catch {
      // Fallback to tmp if directory creation fails
      defaultPath = `/tmp/${filename}`;
    }
  }

  const filePath = defaultPath;

  try {
    fs.writeFileSync(filePath, html, 'utf8');
  } catch (err) {
    throw new Error(`Failed to write HTML report: ${err.message}`);
  }

  return filePath;
}

module.exports = { generateHtmlReport };
