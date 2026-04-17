# 交接与 AI 代理协作手册

本文档用于保证项目移交后，新的开发者和 AI 编程代理（Copilot / ClaudeCode）可以无缝衔接。

## 1. 交接最小包

交接时必须提供：

1. 可运行代码（pnpm install 后可启动）
2. .env.example 与环境变量说明
3. 文档集：README、AGENTS、architecture、mcp-llm-architecture、plan
4. 最近一次验证记录（ts-check/lint/build）

## 2. 新人接手流程

1. 阅读顺序：README -> AGENTS.md -> docs/architecture.md -> docs/plan.md。
2. 运行：pnpm install && cp .env.example .env.local && pnpm dev。
3. MCP 联调：pnpm mcp:inspect。
4. 主链路定位：consultation 页面 -> /api/mcp/query -> mcp orchestrator -> mcp client。

## 3. AI 代理协作流程

### 3.1 任务输入模板

建议每次给代理明确提供：

1. 目标：本次要完成什么业务结果。
2. 范围：允许修改哪些目录/文件。
3. 约束：安全、兼容、性能、文档同步要求。
4. 验收：必须通过哪些命令与检查。

### 3.2 代理执行原则

1. 先读文档，再改代码。
2. 先最小变更，再迭代增强。
3. 修改后必须更新文档与验证记录。
4. 发现风险先报告，不盲目扩大改动面。

### 3.3 统一验收命令

```bash
pnpm ts-check
pnpm lint
pnpm build
```

如涉及 MCP：

```bash
pnpm mcp:inspect
```

## 4. 常见接管失败点与规避

1. 失败点：忽略自定义 server.ts，直接按 next dev 心智改启动链路。
   规避：默认入口固定为 src/server.ts。

2. 失败点：把服务端密钥下发到客户端。
   规避：严格使用服务端环境变量，前端仅调用 API。

3. 失败点：新增外部依赖但没有降级方案。
   规避：所有外部调用都必须可回退本地规则。

4. 失败点：只改代码不改文档，导致下一个接手者无法理解。
   规避：把文档更新视为同等级交付物。

## 5. 交接完成检查清单

1. 新人 30 分钟内可跑通本地环境。
2. 新人 1 小时内可定位主链路和关键文件。
3. AI 代理可依据 AGENTS.md 独立完成一个小功能。
4. 文档与当前代码状态一致，无明显过期信息。
