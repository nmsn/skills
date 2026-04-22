#!/usr/bin/env node
/**
 * fetch-feeds.js
 * Fetches RSS feeds from frontend news sources, filters to last 7 days,
 * and outputs as Markdown.
 */

import { writeFileSync } from 'fs';

const FEEDS = [
  { name: 'dev.to', url: 'https://dev.to/feed' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { name: 'JavaScript Weekly', url: 'https://cprss.s3.amazonaws.com/javascriptweekly.com.xml' },
  { name: 'Node Weekly', url: 'https://cprss.s3.amazonaws.com/nodeweekly.com.xml' },
  { name: 'React', url: 'https://legacy.reactjs.org/feed.xml' },
  { name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/' },
];

const OUTPUT_PATH = './feeds-output.md';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function parseRSS(xml) {
  const items = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);

  for (const match of itemMatches) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = itemXml.match(/<link(?:[^>]*)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const descMatch = itemXml.match(/<description(?:[^>]*)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const pubMatch = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/i);
    const contentMatch = itemXml.match(/<content:encoded(?:[^>]*)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);

    const title = titleMatch ? stripTags(titleMatch[1].trim()) : 'Untitled';
    const link = linkMatch ? linkMatch[1].trim() : '';
    const description = descMatch ? stripTags(descMatch[1].trim()) : '';
    const content = contentMatch ? contentMatch[1].trim() : description;
    const pubDateStr = pubMatch ? pubMatch[1].trim() : null;

    let pubDate = null;
    if (pubDateStr) {
      pubDate = new Date(pubDateStr);
    }

    items.push({ title, link, description, content, pubDate });
  }

  return items;
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSummary(content, maxLength = 200) {
  const text = stripTags(content || '');
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url);
    if (!res.ok) {
      console.error(`[${feed.name}] HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const items = parseRSS(xml);

    // Filter to last 7 days
    const cutoff = new Date(Date.now() - ONE_WEEK_MS);
    const recent = items.filter(item => item.pubDate && item.pubDate > cutoff);

    console.log(`[${feed.name}] ${items.length} total, ${recent.length} in last 7 days`);
    return recent.map(item => ({ ...item, source: feed.name }));
  } catch (e) {
    console.error(`[${feed.name}] Error: ${e.message}`);
    return [];
  }
}

function toMarkdown(items) {
  const lines = ['# 前端技术资讯\n'];
  lines.push(`> 自动生成于 ${new Date().toLocaleString('zh-CN')}\n`);

  // Group by source
  const bySource = new Map();
  for (const item of items) {
    if (!bySource.has(item.source)) bySource.set(item.source, []);
    bySource.get(item.source).push(item);
  }

  for (const [source, sourceItems] of bySource) {
    lines.push(`## ${source}\n`);
    for (const item of sourceItems) {
      const dateStr = item.pubDate ? formatDate(item.pubDate) : '';
      lines.push(`### [${item.title}](${item.link})${dateStr ? ` (${dateStr})` : ''}\n`);
      const summary = getSummary(item.content || item.description);
      if (summary) lines.push(`${summary}\n`);
      lines.push('');
    }
  }

  return lines.join('');
}

async function main() {
  console.log('Fetching RSS feeds...\n');

  const allItems = [];
  for (const feed of FEEDS) {
    const items = await fetchFeed(feed);
    allItems.push(...items);
    await new Promise(r => setTimeout(r, 500)); // polite delay
  }

  // Sort by date, newest first
  allItems.sort((a, b) => (b.pubDate || 0) - (a.pubDate || 0));

  console.log(`\nTotal: ${allItems.length} items\n`);

  const markdown = toMarkdown(allItems);
  writeFileSync(OUTPUT_PATH, markdown, 'utf8');
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch(e => {
  console.error(`Fatal: ${e.message}`);
  process.exit(1);
});
