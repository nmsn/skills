# 翻译规范

本 skill 默认输出中文，以下规范用于保证专业术语一致性。

## 技术术语处理

**保留英文原文的词汇**（直接用英文，不翻译）：
- 框架 / 库名：React、Vue、Svelte、Astro、SolidJS、Qwik
- 运行时：Bun、Deno、Node.js、Cloudflare Workers、Edge Runtime
- 构建工具：Vite、Turbopack、esbuild、SWC、Rollup、Parcel
- CSS 工具：Tailwind、CSS Modules、Vanilla Extract、Panda CSS
- 协议 / 规范：RSC (React Server Components)、ESM、CJS、WASM

**使用约定中文译名**：
- bundle → 产物 / 打包产物
- hydration → 注水 / 客户端激活
- tree-shaking → 摇树优化
- code splitting → 代码分割
- hot module replacement → 热更新 (HMR)
- server-side rendering → 服务端渲染 (SSR)
- static site generation → 静态站点生成 (SSG)
- type inference → 类型推导

## 风格

- 写给工程师看，不要过度书面化
- 保留说话人的语气（如果原文很直接，中文也要直接）
- 专有名词第一次出现可以加括号注英文，之后直接用中文
