#!/usr/bin/env node
/**
 * follow-frontend: deliver.js
 * Delivers the digest via Telegram or Email.
 * Reads config from ~/.follow-frontend/config.json
 * Reads message from --file flag or stdin.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CONFIG_DIR = join(process.env.HOME, '.follow-frontend');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');
const ENV_PATH = join(CONFIG_DIR, '.env');

function loadEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const env = {};
  readFileSync(ENV_PATH, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) env[m[1]] = m[2].trim();
  });
  return env;
}

async function sendTelegram(token, chatId, text) {
  // Telegram has a 4096 char limit per message; split if needed
  const chunks = [];
  for (let i = 0; i < text.length; i += 4000) {
    chunks.push(text.slice(i, i + 4000));
  }
  for (const chunk of chunks) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: chunk })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Telegram error: ${JSON.stringify(err)}`);
    }
  }
}

async function sendEmail(apiKey, to, subject, body) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'follow-frontend <digest@resend.dev>',
      to: [to],
      subject,
      text: body
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }
}

async function main() {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  const env = loadEnv();

  // Read message from --file flag or stdin
  let message;
  const fileFlag = process.argv.indexOf('--file');
  if (fileFlag !== -1 && process.argv[fileFlag + 1]) {
    message = readFileSync(process.argv[fileFlag + 1], 'utf8');
  } else {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    message = chunks.join('');
  }

  if (!message.trim()) {
    process.stderr.write('No message to deliver\n');
    process.exit(1);
  }

  const method = config.delivery?.method || 'stdout';

  if (method === 'telegram') {
    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = config.delivery.chatId;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set in .env');
    if (!chatId) throw new Error('delivery.chatId not set in config.json');
    await sendTelegram(token, chatId, message);
    process.stderr.write('✅ Delivered via Telegram\n');

  } else if (method === 'email') {
    const apiKey = env.RESEND_API_KEY;
    const to = config.delivery.email;
    if (!apiKey) throw new Error('RESEND_API_KEY not set in .env');
    if (!to) throw new Error('delivery.email not set in config.json');
    const today = new Date().toLocaleDateString('zh-CN');
    await sendEmail(apiKey, to, `前端动态 · ${today}`, message);
    process.stderr.write('✅ Delivered via Email\n');

  } else {
    // stdout — just print, agent handles it
    process.stdout.write(message);
  }
}

main().catch(e => {
  process.stderr.write(`Delivery failed: ${e.message}\n`);
  process.exit(1);
});
