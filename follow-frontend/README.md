# follow-frontend

前端技术 digest —— 追踪框架作者、运行时团队、构建工具创造者的最新动态，每天（或每周）推送到你的消息 App。

**哲学：关注正在构建东西的人，而不是转发科技新闻的博主。**

## 追踪方向

- 前端框架：React / Vue / Svelte / Astro / SolidJS
- 运行时：Bun / Deno / Node.js / Cloudflare Workers
- 构建工具：Vite / esbuild / SWC / Turbopack / Parcel
- CSS / 设计系统：Tailwind / Radix / shadcn / CSS Modules
- 全栈 / Edge Runtime：Next.js / Nuxt / Remix / Hono

## 你会收到什么

每天（或每周）一份中文 digest，包含：

- 追踪的框架作者、创始人、核心维护者在 X 上的最新观点和动态
- 前端播客精华（Syntax、Fireship、ThePrimeagen 等）
- 所有内容附原文链接

示例见 [examples/sample-digest.md](examples/sample-digest.md)

## 快速开始

### OpenClaw

```bash
# 从 ClawhHub 安装（即将支持）
clawhub install follow-frontend

# 或手动安装
git clone https://github.com/your-username/follow-frontend.git ~/skills/follow-frontend
cd ~/skills/follow-frontend/scripts && npm install
```

安装后，说「set up follow-frontend」或输入 `/fe`，Agent 会引导你完成配置。

### Claude Code

```bash
git clone https://github.com/your-username/follow-frontend.git ~/.claude/skills/follow-frontend
cd ~/.claude/skills/follow-frontend/scripts && npm install
```

## 环境要求

- Node.js v18+
- Supadata API key（可选，用于 YouTube 播客转录，免费注册：https://supadata.ai）

X/Twitter 内容通过 Rettiwt-API 以 guest 模式免费抓取，不需要 API key，不需要登录。

## 默认追踪名单

### X/Twitter Builder（30 位）

Evan You（Vue/Vite）、Rich Harris（Svelte）、Guillermo Rauch（Vercel CEO）、
Jarred Sumner（Bun）、Anthony Fu（Vue/Vite/Nuxt 核心）、shadcn、
Adam Wathan（Tailwind）、Matt Pocock（TypeScript）、Tanner Linsley（TanStack）、
Devon Govett（Parcel）、Ryan Carniato（SolidJS）、Fred K. Schott（Astro）……
[完整名单见 config/default-sources.json]

### 播客（5 个）

- [Syntax](https://www.youtube.com/@syntaxfm) — Wes Bos & Scott Tolinski，前端全栈
- [Fireship](https://www.youtube.com/@Fireship) — 高密度前端技术更新
- [Jack Herrington](https://www.youtube.com/@jherr) — React / 模块联邦深度讲解
- [ThePrimeagen](https://www.youtube.com/@ThePrimeagen) — 性能 / Bun / Rust + JS
- [Matt Pocock](https://www.youtube.com/@mattpocockuk) — TypeScript 进阶

## 自定义

所有设置通过对话修改，无需编辑文件：

- 「加 @antfu7 到追踪列表」
- 「把 Fireship 频道去掉」
- 「改成每周一推送」
- 「摘要再短一点」
- 「看我的当前设置」

如果你想直接编辑 prompt 风格，修改 `prompts/` 目录下的 Markdown 文件，plain English 写法，无需写代码。

## 工作原理

1. 定时 cron job 在你设定的时间触发
2. `scripts/prepare-digest.js` 抓取数据：
   - YouTube 播客转录（Supadata API）
   - X/Twitter 推文（Rettiwt-API guest 模式，无需登录）
3. Agent 把原始数据按 `prompts/` 里的规范 remix 成中文 digest
4. `scripts/deliver.js` 推送到你的消息 App（Telegram / Email）

## 隐私

- API key 只存在本地 `~/.follow-frontend/.env`，只发往 Supadata（用于 YouTube 转录）
- X 内容通过 guest 模式抓取，不需要任何账号
- 所有配置和记录都在本地

## 致谢

架构参考 [follow-builders](https://github.com/zarazhangrui/follow-builders) by @zarazhangrui

## License

MIT
