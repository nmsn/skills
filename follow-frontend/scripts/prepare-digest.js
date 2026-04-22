#!/usr/bin/env node
/**
 * follow-frontend: prepare-digest.js
 * Fetches content from X/Twitter (Rettiwt-API guest mode) and YouTube (Supadata API)
 * Outputs a single JSON blob for the agent to remix.
 *
 * Based on the same architecture as follow-builders by @zarazhangrui
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(__dirname, '..');
const CONFIG_DIR = join(process.env.HOME, '.follow-frontend');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');
const ENV_PATH = join(CONFIG_DIR, '.env');

// ── Load config ──────────────────────────────────────────────────────────────

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error('Config not found. Run onboarding first: say "set up follow-frontend"');
  }
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

function loadEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const env = {};
  readFileSync(ENV_PATH, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) env[m[1]] = m[2].trim();
  });
  return env;
}

// ── Load sources ─────────────────────────────────────────────────────────────

function loadSources() {
  const defaultPath = join(SKILL_DIR, 'config', 'default-sources.json');
  const userPath = join(CONFIG_DIR, 'sources.json');
  const defaults = JSON.parse(readFileSync(defaultPath, 'utf8'));

  if (existsSync(userPath)) {
    const user = JSON.parse(readFileSync(userPath, 'utf8'));
    // Merge: user additions + defaults, deduplicated by username/url
    const xMap = new Map(defaults.x_builders.map(b => [b.username, b]));
    (user.x_builders || []).forEach(b => xMap.set(b.username, b));
    const ytMap = new Map(defaults.youtube_channels.map(c => [c.url, c]));
    (user.youtube_channels || []).forEach(c => ytMap.set(c.url, c));
    return {
      x_builders: [...xMap.values()],
      youtube_channels: [...ytMap.values()]
    };
  }
  return defaults;
}

// ── Load prompts ──────────────────────────────────────────────────────────────

function loadPrompts() {
  const names = ['digest-intro', 'summarize-tweets', 'summarize-podcast', 'translate'];
  const prompts = {};
  for (const name of names) {
    const userPath = join(CONFIG_DIR, 'prompts', `${name}.md`);
    const defaultPath = join(SKILL_DIR, 'prompts', `${name}.md`);
    const path = existsSync(userPath) ? userPath : defaultPath;
    prompts[name.replace(/-/g, '_')] = readFileSync(path, 'utf8');
  }
  return prompts;
}

// ── Fetch X/Twitter via Rettiwt-API (guest mode) ─────────────────────────────

async function fetchXPosts(builders) {
  let Rettiwt;
  try {
    const mod = await import('rettiwt-api');
    Rettiwt = mod.Rettiwt;
  } catch {
    return { results: [], error: 'rettiwt-api not installed. Run: npm install rettiwt-api' };
  }

  const client = new Rettiwt();
  const results = [];
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // last 48h

  for (const builder of builders) {
    try {
      const timeline = await client.user.timeline(builder.username, 10);
      const tweets = (timeline?.list || [])
        .filter(t => new Date(t.createdAt) > cutoff)
        .filter(t => !t.replyTo) // skip replies
        .map(t => ({
          text: t.fullText,
          url: `https://x.com/${builder.username}/status/${t.id}`,
          createdAt: t.createdAt
        }));

      if (tweets.length > 0) {
        results.push({ ...builder, tweets });
      }
    } catch (e) {
      // non-fatal, skip this builder
    }
    // polite delay
    await new Promise(r => setTimeout(r, 800));
  }

  return { results, error: null };
}

// ── Fetch YouTube transcripts via Supadata ────────────────────────────────────

async function fetchYouTube(channels, supadataKey) {
  if (!supadataKey) {
    return { results: [], error: 'No SUPADATA_API_KEY in .env — skipping podcasts' };
  }

  const results = [];
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

  for (const channel of channels) {
    try {
      // Get recent videos from channel RSS
      const channelId = await resolveChannelId(channel.url);
      if (!channelId) continue;

      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const rssRes = await fetch(rssUrl);
      const rssText = await rssRes.text();

      const videoIds = [...rssText.matchAll(/yt:videoId>([^<]+)</g)]
        .map(m => m[1])
        .slice(0, 3);

      for (const videoId of videoIds) {
        // Check publish date from RSS
        const pubMatch = rssText.match(new RegExp(`${videoId}[\\s\\S]*?<published>([^<]+)<`));
        if (pubMatch && new Date(pubMatch[1]) < cutoff) continue;

        // Fetch title
        const titleMatch = rssText.match(new RegExp(`${videoId}[\\s\\S]*?<title>([^<]+)<`));
        const title = titleMatch ? titleMatch[1] : 'Unknown';

        // Fetch transcript via Supadata
        const transRes = await fetch(
          `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
          { headers: { 'x-api-key': supadataKey } }
        );
        if (!transRes.ok) continue;
        const transData = await transRes.json();

        results.push({
          name: channel.name,
          title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          transcript: (transData.content || '').slice(0, 8000) // cap at 8k chars
        });
        break; // one episode per channel per run
      }
    } catch {
      // non-fatal
    }
  }

  return { results, error: null };
}

async function resolveChannelId(channelUrl) {
  try {
    const res = await fetch(channelUrl);
    const html = await res.text();
    const m = html.match(/"channelId":"([^"]+)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const config = loadConfig();
  const env = loadEnv();
  const sources = loadSources();
  const prompts = loadPrompts();

  const errors = [];

  // Fetch X/Twitter
  const { results: xResults, error: xError } = await fetchXPosts(sources.x_builders);
  if (xError) errors.push(xError);

  // Fetch YouTube
  const { results: ytResults, error: ytError } = await fetchYouTube(
    sources.youtube_channels,
    env.SUPADATA_API_KEY
  );
  if (ytError) errors.push(ytError);

  const output = {
    config,
    x: xResults,
    podcasts: ytResults,
    prompts,
    stats: {
      xBuilders: xResults.length,
      podcastEpisodes: ytResults.length,
      fetchedAt: new Date().toISOString()
    },
    errors
  };

  process.stdout.write(JSON.stringify(output, null, 2));
}

main().catch(e => {
  process.stderr.write(`Fatal: ${e.message}\n`);
  process.exit(1);
});
