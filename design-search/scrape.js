/**
 * design-search scraper
 * 使用 Playwright 从 Dribbble 和 Pinterest 抓取设计灵感
 * 运行方式: node scrape.js "搜索关键词"
 *
 * 前置依赖:
 *   npm install playwright
 *   npx playwright install chromium
 */

const { spawn } = require('child_process');
const https = require('https');
const http = require('http');

/**
 * 检查并安装 Playwright
 */
async function ensurePlaywright() {
  return new Promise((resolve, reject) => {
    try {
      require('playwright');
      resolve();
    } catch {
      console.log('📦 正在安装 Playwright...');
      const npm = spawn('npm', ['install', 'playwright'], {
        cwd: __dirname,
        stdio: 'inherit'
      });
      npm.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Playwright 安装完成');
          resolve();
        } else {
          reject(new Error('Playwright 安装失败'));
        }
      });
    }
  });
}

/**
 * 抓取 Dribbble 搜索结果
 */
async function scrapeDribbble(query) {
  const { chromium } = await getPlaywright();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
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

    await browser.close();
    return shots;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

/**
 * 抓取 Pinterest 搜索结果
 */
async function scrapePinterest(query) {
  const { chromium } = await getPlaywright();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
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

    await browser.close();
    return pins;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Playwright 缓存
let pw = null;

async function getPlaywright() {
  if (!pw) {
    try {
      pw = require('playwright');
    } catch {
      await ensurePlaywright();
      pw = require('playwright');
    }
  }
  return pw;
}

/**
 * 主函数
 */
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

module.exports = { scrapeDribbble, scrapePinterest, ensurePlaywright };

if (require.main === module) {
  main();
}