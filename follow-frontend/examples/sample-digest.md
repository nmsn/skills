📅 前端动态 · 2025年1月15日

━━━━━━━━━━━━━━━
🎙️ 本周播客
━━━━━━━━━━━━━━━

🎙️ Syntax · 「Bun 1.2 新特性深度解析」

本集 Wes 和 Scott 邀请了 Jarred Sumner 聊 Bun 1.2 的几个关键更新。讨论围绕 Bun Shell（内置 $`...` 语法替代 shelljs）和新的 S3/SQLite 原生 API 展开，重点是 Bun 正在刻意减少项目对第三方依赖的需求。

核心讨论：
• Bun Shell 的设计目标是让 Node.js 脚本完全跨平台，不依赖系统 bash
• 内置 S3 客户端比 @aws-sdk/client-s3 快 3-5 倍，主要因为零依赖
• Jarred 透露 Bun 正在开发原生 PostgreSQL 客户端，预计 Q2 发布

🔗 https://www.youtube.com/watch?v=example

━━━━━━━━━━━━━━━
🔥 Builder 动态
━━━━━━━━━━━━━━━

Evan You（Vue / Vite 作者）宣布 Vite 6.1 正式发布，核心是 Environment API 的稳定化。这个 API 让构建工具能为 client、SSR、edge 分别维护独立的模块图，解决了长期以来 SSR 插件无法复用 client 配置的问题。Rolldown（Rust 版 Rollup）也已合并进 Vite 6.1 作为可选构建器。
🔗 https://x.com/youyuxi/status/1234567890

Rich Harris（Svelte 作者 @ Vercel）在一篇长文中回应了「Svelte 是否过于激进」的争议：他认为编译时优化是前端框架的正确方向，运行时虚拟 DOM 是历史包袱而非特性，并预测 2025 年会有更多框架转向编译优先策略。
🔗 https://x.com/Rich_Harris/status/1234567891

shadcn 发布了 shadcn/ui 的 CLI 重构版本，现在支持直接从 GitHub 安装社区组件（`npx shadcn add github/user/repo/component`），不再局限于官方组件库。这本质上是在构建一个去中心化的组件生态。
🔗 https://x.com/shadcn/status/1234567892

Anthony Fu（Vue / Vite / Nuxt 核心）分享了他用 Nuxt 4 + Nitro 2 部署到 Cloudflare Workers 的实测数据：冷启动从 800ms 降到 120ms，原因是 Nitro 2 默认启用了 ESM tree-shaking，剔除了 90% 的 Node.js polyfill。
🔗 https://x.com/antfu7/status/1234567893

━━━━━━━━━━━━━━━
💡 本期一句话
━━━━━━━━━━━━━━━

「运行时虚拟 DOM 是历史包袱而非特性。」— Rich Harris
🔗 https://x.com/Rich_Harris/status/1234567891
