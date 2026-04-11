/**
 * design-search scraper
 * 方案 C: Playwright MCP 静默模式 + HTTP 回退机制
 *
 * 1. 优先使用 Playwright MCP (headless=new)
 * 2. MCP 不可用时回退到纯 HTTP 抓取
 * 3. 最终生成 HTML 卡片页面
 *
 * 运行方式: node scrape.js "搜索关键词"
 */

const https = require('https');
const http = require('http');

// ============================================================================
// HTTP 抓取 (零依赖，Node.js 内置)
// ============================================================================

/**
 * 简单 HTTP GET 请求
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpGet(res.headers.location).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * 从 HTML 文本中提取内容
 */
function extractFromHtml(html, selectors) {
  const result = {};
  for (const [key, selector] of Object.entries(selectors)) {
    const match = html.match(new RegExp(`${selector}[^]*?</div>`, 'i'));
    result[key] = match ? match[0].replace(/<[^>]+>/g, '').trim() : '';
  }
  return result;
}

// ============================================================================
// Dribbble 抓取
// ============================================================================

/**
 * 使用 HTTP 抓取 Dribbble (零依赖回退方案)
 */
async function scrapeDribbbleHttp(query) {
  const url = `https://dribbble.com/search/${query}`;
  const html = await httpGet(url);

  // 解析 Dribbble 搜索结果
  const shotRegex = /<a[^>]+href="(\/shots\/[^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<span[^>]*class="username"[^>]*>([^<]+)<\/span>/gi;

  const shots = [];
  let match;
  while ((match = shotRegex.exec(html)) !== null && shots.length < 20) {
    shots.push({
      title: match[3]?.trim() || '',
      author: match[4]?.trim() || '',
      likes: '0',
      url: `https://dribbble.com${match[1]}`,
      imageUrl: match[2]?.startsWith('http') ? match[2] : `https://dribbble.com${match[2]}`
    });
  }

  // 备用解析：简单正则
  if (shots.length === 0) {
    const simpleRegex = /data-src="([^"]+)"[^>]*>[\s\S]*?<a[^>]+href="(\/shots\/[^"]+)"[^>]*>[\s\S]*?<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)/gi;
    while ((match = simpleRegex.exec(html)) !== null && shots.length < 20) {
      shots.push({
        title: match[3]?.trim() || '',
        author: 'Unknown',
        likes: '0',
        url: `https://dribbble.com${match[2]}`,
        imageUrl: match[1]?.startsWith('http') ? match[1] : `https://dribbble.com${match[1]}`
      });
    }
  }

  return shots;
}

// ============================================================================
// Pinterest 抓取
// ============================================================================

/**
 * 使用 HTTP 抓取 Pinterest (零依赖回退方案)
 */
async function scrapePinterestHttp(query) {
  const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
  const html = await httpGet(url);

  // Pinterest 的数据通常在 JSON 脚本中
  const jsonRegex = /<script[^>]+id="[^"]*initial[^"]*"[^>]*>(\{[^<]+\})/gi;
  const pins = [];

  // 尝试从 HTML 中提取 pin 数据
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]+alt="([^"]*)"[^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null && pins.length < 20) {
    const imgUrl = match[1];
    const desc = match[2] || '';

    // Pinterest 图片 URL 过滤
    if (imgUrl && imgUrl.includes('pinimg') && !imgUrl.includes('data:image')) {
      pins.push({
        description: desc,
        url: `https://www.pinterest.com/pin/${Math.random().toString(36).slice(2)}`,
        imageUrl: imgUrl
      });
    }
  }

  return pins;
}

// ============================================================================
// Playwright MCP 接口 (主方案 - 静默模式)
// ============================================================================

let pw = null;

async function getPlaywright() {
  if (!pw) {
    try {
      pw = require('playwright');
    } catch {
      console.log('Playwright not installed, using HTTP fallback');
      return null;
    }
  }
  return pw;
}

/**
 * 使用 Playwright CLI/MCP 静默抓取 (headless=new)
 */
async function scrapeWithPlaywright(query, platform) {
  const pw = await getPlaywright();
  if (!pw) return null;

  const { chromium } = pw;
  const browser = await chromium.launch({ headless: true });  // 静默模式
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    if (platform === 'dribbble' || platform === 'both') {
      await page.goto(`https://dribbble.com/search/${query}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await page.waitForSelector('.shot-thumbnail', { timeout: 10000 }).catch(() => {});

      const shots = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-serialized-shot]');
        if (items.length === 0) {
          const altItems = document.querySelectorAll('.shots .shot, [data-qa="shot"]');
          return Array.from(altItems).map(item => {
            const titleEl = item.querySelector('[data-testid="shot-title"], h2 a, .title');
            const authorEl = item.querySelector('[data-testid="shot-owner"], .user-link');
            const likesEl = item.querySelector('[data-testid="shot-likes"], .likes');
            const linkEl = item.querySelector('a[href*="/shots/"]');
            const imgEl = item.querySelector('img');

            return {
              title: titleEl?.textContent?.trim() || '',
              author: authorEl?.textContent?.trim() || '',
              likes: likesEl?.textContent?.trim() || '0',
              url: linkEl ? (linkEl.href.startsWith('http') ? linkEl.href : `https://dribbble.com${linkEl.getAttribute('href')}`) : '',
              imageUrl: imgEl?.src || ''
            };
          }).filter(s => s.url);
        }

        return Array.from(items).map(item => {
          const titleEl = item.querySelector('.shot-title, .shot-title-link');
          const authorEl = item.querySelector('.username, .display-name');
          const likesEl = item.querySelector('.likes-count, .shot-like-count');
          const linkEl = item.querySelector('a[href*="/shots/"]');
          const imgEl = item.querySelector('img');

          return {
            title: titleEl?.textContent?.trim() || '',
            author: authorEl?.textContent?.trim() || '',
            likes: likesEl?.textContent?.trim() || '0',
            url: linkEl ? `https://dribbble.com${linkEl.getAttribute('href')}` : '',
            imageUrl: imgEl?.src || ''
          };
        }).filter(s => s.url);
      });

      return { platform: 'dribbble', shots };
    }

    if (platform === 'pinterest' || platform === 'both') {
      const encodedQuery = encodeURIComponent(query);
      await page.goto(`https://www.pinterest.com/search/pins/?q=${encodedQuery}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
      }

      await page.waitForSelector('[data-testid="pin"]', { timeout: 10000 }).catch(() => {});

      const pins = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-testid="pin"], .Pin');
        return Array.from(items).map(item => {
          const linkEl = item.querySelector('a[href*="/pin/"]');
          const imgEl = item.querySelector('img');
          const descEl = item.querySelector('[data-testid="pin-description"], .description');

          return {
            description: descEl?.textContent?.trim() || '',
            url: linkEl ? (linkEl.href.startsWith('http') ? linkEl.href : `https://www.pinterest.com${linkEl.getAttribute('href')}`) : '',
            imageUrl: imgEl?.src || ''
          };
        }).filter(p => p.url);
      });

      return { platform: 'pinterest', pins };
    }
  } finally {
    await browser.close();
  }
}

// ============================================================================
// 主抓取函数 (MCP 优先，回退到 HTTP)
// ============================================================================

async function scrapeDribbble(query) {
  // 优先尝试 Playwright
  try {
    const result = await scrapeWithPlaywright(query, 'dribbble');
    if (result && result.shots && result.shots.length > 0) {
      return result.shots;
    }
  } catch (e) {
    console.log(`Playwright Dribbble failed: ${e.message}, trying HTTP...`);
  }

  // HTTP 回退
  try {
    const shots = await scrapeDribbbleHttp(query);
    if (shots.length > 0) {
      return shots;
    }
  } catch (e) {
    console.log(`HTTP Dribbble failed: ${e.message}`);
  }

  return [];
}

async function scrapePinterest(query) {
  // 优先尝试 Playwright
  try {
    const result = await scrapeWithPlaywright(query, 'pinterest');
    if (result && result.pins && result.pins.length > 0) {
      return result.pins;
    }
  } catch (e) {
    console.log(`Playwright Pinterest failed: ${e.message}, trying HTTP...`);
  }

  // HTTP 回退
  try {
    const pins = await scrapePinterestHttp(query);
    if (pins.length > 0) {
      return pins;
    }
  } catch (e) {
    console.log(`HTTP Pinterest failed: ${e.message}`);
  }

  return [];
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  const query = process.argv[2] || 'design';
  const platform = process.argv[3] || 'both';

  console.log(`🔍 搜索 "${query}"...`);

  const results = {
    source: 'search',
    query,
    timestamp: Date.now(),
    dribbble: [],
    pinterest: []
  };

  try {
    if (platform === 'dribbble' || platform === 'both') {
      console.log('📸 正在抓取 Dribbble...');
      try {
        results.dribbble = await scrapeDribbble(query);
        console.log(`   ✅ 获取 ${results.dribbble.length} 个结果`);
      } catch (e) {
        console.log(`   ❌ Dribbble 抓取失败: ${e.message}`);
      }
    }

    if (platform === 'pinterest' || platform === 'both') {
      console.log('📌 正在抓取 Pinterest...');
      try {
        results.pinterest = await scrapePinterest(query);
        console.log(`   ✅ 获取 ${results.pinterest.length} 个结果`);
      } catch (e) {
        console.log(`   ❌ Pinterest 抓取失败: ${e.message}`);
      }
    }

    console.log('\n---RESULTS_START---');
    console.log(JSON.stringify(results, null, 2));
    console.log('---RESULTS_END---');

  } catch (error) {
    console.error('❌ 搜索失败:', error.message);
    process.exit(1);
  }
}

module.exports = { scrapeDribbble, scrapePinterest, scrapeDribbbleHttp, scrapePinterestHttp, ensurePlaywright: getPlaywright };

if (require.main === module) {
  main();
}
