# Codebase Documenter

分析代码库结构并生成结构化文档，支持 Quick（快速概览）和 Standard（完整分析）两种深度。

## 安装

```bash
# Claude Code
mkdir -p ~/.claude/skills && cp -r skills/codebase-documenter ~/.claude/skills/

# Codex
mkdir -p ~/.agents/skills && cp -r skills/codebase-documenter ~/.agents/skills/
```

## 使用

| 深度 | 触发词 | 输出 |
|------|--------|------|
| Quick（默认）| 分析项目结构 | 对话 + `docs/codebase/OVERVIEW.md` |
| Standard | 详细分析 / 完整文档 | 对话 + `README.md` + `ARCHITECTURE.md` |

## 前置要求

- Claude Code 或 Codex
- 无需额外 MCP（使用内置工具）

## License

MIT
