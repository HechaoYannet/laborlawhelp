# 劳动维权助手架构说明

## 1. 分层架构

### 1.1 展示与交互层

1. src/app/page.tsx：根路由入口（重定向到咨询页）。
2. src/app/(home)/page.tsx：业务入口导航。
3. src/app/consultation/page.tsx：劳动者咨询主界面。
4. src/app/hr-risk/page.tsx：HR 风险检查页面。
5. src/app/layout.tsx：全局布局与 provider 注入。

### 1.2 应用服务层（API / 编排）

1. src/app/api/mcp/tools/route.ts：MCP 工具发现接口。
2. src/app/api/mcp/query/route.ts：MCP 规则编排查询接口。
3. src/lib/mcp/orchestrator.ts：意图识别、工具排序、调用聚合。

### 1.3 领域能力层

1. src/lib/calculation.ts：赔偿计算引擎。
2. src/lib/document-generator.ts：文书生成。
3. src/lib/case-triage.ts：繁简分流与推荐。
4. src/lib/dialogue-flow.ts：对话引导与案情总结。
5. src/lib/hr-risk-check.ts：HR 风险规则。
6. src/lib/types.ts：领域模型定义。

### 1.4 基础设施层

1. src/server.ts：自定义 Node 入口与 Next request handler。
2. src/lib/mcp/client.ts：MCP stdio 客户端。
3. src/lib/mcp/config.ts：MCP 运行配置解析。
4. src/lib/security/mcp-guard.ts：来源校验与网关 key 校验。
5. scripts/*.mjs：跨平台 dev/build/start 脚本。

## 2. 关键调用链路

### 2.1 咨询主链路

1. 用户在 consultation 页面输入问题。
2. 本地规则先执行：信息提取、测算、流程引导。
3. 命中“法规/案例依据”意图时，前端调用 /api/mcp/query。
4. API 进入 mcp-guard 校验，再进入 orchestrator 编排。
5. orchestrator 通过 mcp client 调用 sidecar（pkulaw-mcp-router）。
6. 返回结构化结果给前端渲染；失败时回退本地规则回复。

### 2.2 MCP 工具发现链路

1. 调用 /api/mcp/tools。
2. route 通过 mcp client 执行 listTools。
3. 返回工具清单用于调试与编排验证。

## 3. 运行拓扑

```text
Browser UI
  -> Next App Router (Route Handler)
    -> MCP Orchestrator
      -> MCP Client (stdio)
        -> pkulaw-mcp-router (sidecar process)
          -> PKULAW upstream services (SSE/HTTP)
```

## 4. 关键设计原则

1. 默认本地规则可用：外部依赖失败不影响基础咨询链路。
2. 服务端隔离敏感信息：token 不进入浏览器。
3. 可观测优先：关键调用记录结构化日志和 span。
4. 限制爆炸半径：超时、重试、输入长度、工具数量均受控。

## 5. 当前风险与技术债

1. consultation 页面逻辑仍偏重，建议继续拆分 service 层。
2. orchestrator 工具参数目前是通用模板，后续需按工具特征细化。
3. mcp client 当前为每请求短连模式，后续可优化为常驻连接。
4. 审计与脱敏字段仍需企业级完善（traceId/sessionId/operator）。

## 6. 演进路线（架构视角）

1. 近期：完善参数模板映射与结果质量过滤。
2. 中期：接入 OTel exporter、告警与健康检查。
3. 远期：引入 LLM function-calling 作为规则编排增强层。
