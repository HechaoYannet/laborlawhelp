# AGENT.md

本文件为兼容部分工具链（如 ClaudeCode）而提供的入口说明。

请优先阅读并遵循以下文档：

1. AGENTS.md
2. README.md
3. docs/architecture.md
4. docs/mcp-llm-architecture.md
5. docs/plan.md
6. docs/coze-legacy-and-env.md

统一约束：

1. 使用 pnpm，不使用 npm/yarn。
2. 默认运行入口为 src/server.ts。
3. 严禁泄露服务端密钥到客户端。
4. 所有新能力必须可降级。
