# design-search

使用 Playwright MCP 从 Dribbble 和 Pinterest 搜索设计灵感。

## 安装

```bash
# Claude Code
mkdir -p ~/.claude/skills && cp -r skills/design-search ~/.claude/skills/

# Codex
mkdir -p ~/.agents/skills && cp -r skills/design-search ~/.agents/skills/
```

## 前置要求

- [Claude Code](https://claude.com/claude-code) 或 [Claude API](https://anthropic.com)
- [Playwright MCP](https://github.com/modelcontextprotocol/servers?tab=readme-ov-file#playwright) 已配置

## 使用方法

当用户请求设计灵感时自动触发：

| 触发方式 | 示例 |
|----------|------|
| 中文 | "搜索 xxx 设计"、"找 xxx 相关设计" |
| English | "design inspiration for xxx" |

## License

MIT
