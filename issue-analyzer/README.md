# Issue Analyzer

获取 GitHub issues 列表，分析代码结构，评估修改难度，定位需修改的文件/函数。

## 功能特性

- **Quick 模式**: `gh issue list` + 基础分析，文件级修改定位
- **Standard 模式**: 委托 `codebase-documenter` skill 深度分析，函数级修改定位
- **状态判断**: 已完成 / 修改中 / 可认领
- **难度评估**: 高 / 中 / 低

## 安装

```bash
# Claude Code
mkdir -p ~/.claude/skills && cp -r skills/issue-analyzer ~/.claude/skills/

# Codex
mkdir -p ~/.agents/skills && cp -r skills/issue-analyzer ~/.agents/skills/
```

## 使用

| 深度 | 触发词 | 输出 |
|------|--------|------|
| Quick（默认）| 分析 issues | issue 列表 + 文件级定位 |
| Standard | 详细分析 issue | issue 列表 + 函数级定位 |

## 前置要求

- GitHub CLI (`gh`) 已安装并登录
- Claude Code 或 Codex
- 无需额外 MCP

## License

MIT