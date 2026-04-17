# MCP / LLM 架构与文件组织说明

本文档用于解释项目中与 MCP、LLM 增强相关的文件结构、组织形式与技术原理，目标是让新人和 AI 代理在最短时间内建立可执行认知。

## 1. 设计目标

1. 在不破坏现有本地规则链路的前提下引入法律检索增强。
2. 通过服务端网关隔离密钥、超时与错误处理，避免前端直接接触敏感能力。
3. 保持“可回退、可观测、可审计”的工程底线。

## 2. 文件结构（MCP/LLM 相关）

```text
src/
  app/
    api/
      mcp/
        tools/
          route.ts            # 列出可用 MCP tools
        query/
          route.ts            # 接收查询请求并执行规则编排
  lib/
    mcp/
      types.ts                # MCP 查询契约与类型
      config.ts               # 环境变量解析与运行配置
      client.ts               # stdio MCP 客户端封装（含超时/重试/OTel）
      orchestrator.ts         # 规则编排逻辑（意图识别 -> 工具选择 -> 调用）
    security/
      mcp-guard.ts            # 来源校验、网关 key 校验
config/
  pkulaw-mcp-router.toml      # Sidecar 路由器配置
```

## 3. 组织形式与分层原则

### 3.1 API 层（src/app/api/mcp/*）

职责：

1. 入参校验与错误码标准化。
2. 统一鉴权（来源校验、内部 key）。
3. 把业务请求委托给 orchestrator，不承载复杂业务逻辑。

约束：

1. Route Handler 只在 nodejs runtime 运行。
2. 不直接暴露上游原始密钥和内部错误栈。

### 3.2 Orchestrator 层（src/lib/mcp/orchestrator.ts）

职责：

1. 基于用户问题做轻量意图识别。
2. 根据意图在工具列表中排序并选取候选工具。
3. 逐个调用工具并汇总结果，生成统一响应。

约束：

1. 编排器只处理“调用策略”，不负责底层进程通信。
2. 所有异常要转化为可识别失败类型，并保留 fallback message。

### 3.3 Client 层（src/lib/mcp/client.ts）

职责：

1. 维护对 pkulaw-mcp-router 的 stdio 连接。
2. 提供 listTools / callTool 两个核心能力。
3. 封装超时、重试、日志与 OTel span。

约束：

1. 所有调用需受 MCP_REQUEST_TIMEOUT_MS 约束。
2. 重试上限通过 MCP_REQUEST_RETRIES 控制。
3. 必须支持失败快速返回，避免阻塞上游请求。

### 3.4 Security 层（src/lib/security/mcp-guard.ts）

职责：

1. 基于 MCP_ALLOWED_ORIGINS 做来源控制。
2. 基于 MCP_GATEWAY_API_KEY 做内部访问控制。

约束：

1. 默认允许无 key 的本地开发。
2. 生产建议启用 key + 反向代理白名单。

## 4. 技术原理（端到端）

以“用户提问法条依据”为例：

1. 前端在 consultation 页面判断用户意图（法条/案例/依据类问题）。
2. 前端 POST 到 /api/mcp/query。
3. route.ts 调用 mcp-guard 完成请求校验。
4. route.ts 解析 payload 并调用 queryMcpWithRules。
5. orchestrator 先 listMcpTools，再按意图打分排序并选取 topN。
6. client 使用 StdioClientTransport 启动 sidecar 进程并 callTool。
7. 聚合工具文本结果，返回结构化响应。
8. 前端渲染摘要内容；若失败则回退本地流程文案。

## 5. 关键环境变量

```text
PKULAW_MCP_TOKEN           # 上游 token（仅服务端）
MCP_ROUTER_COMMAND         # 默认 npx.cmd (Windows)
MCP_ROUTER_ARGS            # 默认启动参数
MCP_ROUTER_CWD             # 可选工作目录
MCP_REQUEST_TIMEOUT_MS     # 单次请求超时
MCP_REQUEST_RETRIES        # 请求重试次数
MCP_GATEWAY_API_KEY        # 内部调用密钥（可选）
MCP_ALLOWED_ORIGINS        # 允许来源（可选）
```

## 6. 故障与降级策略

1. Sidecar 不可用：route 返回错误并在前端进入本地规则回复。
2. 工具调用超时：client 捕获异常并重试（不超过上限）。
3. 全部工具失败：orchestrator 返回 fallbackMessage。
4. 来源非法或 key 错误：直接 401/403 拒绝请求。

## 7. 可观测性要求

1. 每次 listTools / callTool 记录 span。
2. 打印结构化日志字段：event、intent、toolCount、resultCount、timestamp。
3. 后续接入 OTel exporter 时保持 trace 贯通（前端请求 -> API -> MCP client）。

## 8. 未来扩展建议

1. 将工具参数从通用 query/keyword/text 升级为“按工具名模板映射”。
2. 将 Sidecar 连接从“每请求新建连接”演进为“连接池/常驻进程”。
3. 引入 LLM Function Calling 作为二阶段能力：规则优先、LLM 兜底。
4. 增加审计维度：用户会话、请求追踪、敏感字段脱敏日志。
