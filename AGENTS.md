# 劳动维权助手 - Agent 接管规范

本文件用于人类开发者与 AI 编程代理（Copilot、ClaudeCode 等）快速建立统一上下文，避免接管后出现环境、规范和架构认知偏差。

## 1. 项目目标

1. 为劳动者提供案情梳理、赔偿测算、文书生成和维权路径指引。
2. 为企业提供 HR 风险检查与合规建议。
3. 通过 MCP 法律检索能力增强咨询质量，并保持可回退的本地规则链路。

## 2. 技术基线

1. Next.js 16 + App Router
2. React 19 + TypeScript 5（strict）
3. Tailwind CSS 4 + shadcn/ui
4. 自定义 Node 入口：src/server.ts
5. MCP 接入：pkulaw-mcp-router（stdio）+ 服务端 Route Handler

## 3. 启动与验证命令

```bash
pnpm install
cp .env.example .env.local

pnpm dev
pnpm ts-check
pnpm lint

pnpm mcp:inspect
pnpm mcp:serve
```

## 4. 关键目录与职责

```text
src/app/consultation/page.tsx      # 劳动者咨询主流程
src/app/hr-risk/page.tsx           # HR 风险检查界面
src/app/api/mcp/tools/route.ts     # MCP 工具发现
src/app/api/mcp/query/route.ts     # MCP 规则编排查询入口

src/lib/mcp/config.ts              # MCP 运行配置解析
src/lib/mcp/client.ts              # MCP stdio 客户端封装（含 OTel）
src/lib/mcp/orchestrator.ts        # 规则编排器（意图->工具）
src/lib/security/mcp-guard.ts      # 鉴权与来源校验

src/lib/calculation.ts             # 赔偿计算核心
src/lib/document-generator.ts      # 文书生成
src/lib/case-triage.ts             # 繁简分流与推荐
```

## 5. 不可破坏的工程约束

1. 只能使用 pnpm，禁止 npm/yarn。
2. 默认运行入口保留 src/server.ts，不改为 next dev 直启。
3. 禁止在客户端暴露 MCP/LLM 密钥。
4. 所有外部能力接入必须有降级回退，不影响本地规则流程可用。
5. 变更需通过 pnpm ts-check 和 pnpm lint。

## 6. 文档优先级（接管顺序）

1. README.md
2. docs/architecture.md
3. docs/mcp-llm-architecture.md
4. docs/plan.md
5. docs/coze-legacy-and-env.md

## 7. 交接完成定义（Definition of Done）

1. 新人可在 30 分钟内完成本地启动和基础联调。
2. 新人可在 1 小时内定位咨询主链路和 MCP 查询链路。
3. AI 代理可在无额外口头解释下完成一次端到端文档驱动开发任务。

## 8. 合规与风险声明

1. 平台输出不构成正式法律意见。
2. 涉及个人信息字段的日志、导出和调试输出必须脱敏。
3. 法律引用应尽量提供可追溯来源，避免“无出处结论”。
