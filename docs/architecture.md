# 劳动维权助手架构说明

本文档用于帮助新成员在 30 分钟内建立对系统的全局认知，并快速定位可修改点。

## 1. 架构总览

项目采用 Next.js App Router + 自定义 Node server 的单仓前端架构，核心由四层组成：

1. 交互层：`src/app/*` 页面与 UI 组件。
2. 状态层：`src/hooks/use-case-store.tsx`、`src/hooks/use-speech-recognition.ts`。
3. 领域与服务层：`src/lib/*`（本地规则与 HR 风控） + `src/features/consultation/*`（中间件 API、结果卡组件）。
4. 运行层：`src/server.ts` 与 `scripts/*.mjs`。

## 2. 目录职责

### 2.1 交互层

- `src/app/page.tsx`：根路由跳转。
- `src/app/(home)/page.tsx`：导航首页。
- `src/app/consultation/page.tsx`：劳动者咨询主流程（约 1400 行，已完成 V1 重构：提取 4 个 Hook 到 src/hooks/，提取工具函数到 src/lib/）。
- `src/app/hr-risk/page.tsx`：企业端 HR 风险检查主流程。
- `src/app/layout.tsx`：全局 metadata、Provider、开发辅助注入。
- `src/features/consultation/components/*`：咨询结果卡（要素抽取、测算、文书、律师转介）展示层。

### 2.2 状态层

- `src/hooks/use-case-store.tsx`：对话状态管理（消息列表、咨询信息、会话上下文）。已清理 20+ 未用操作，保留最小接口。
- `src/hooks/use-streaming-chat.ts`：SSE 流式编排（onContentDelta/onToolCall/onToolResult/onFinal/onMessageEnd）。
- `src/hooks/use-scroll-management.ts`：滚动跟随状态机（三种模式：none/bottom/streaming，ResizeObserver 保障）。
- `src/hooks/use-device-detect.ts`：matchMedia 响应式检测（宽屏/横屏/紧凑横屏）。
- `src/hooks/use-composer.ts`：输入框自动高度、键盘吸底、composer 高度追踪。
- `src/hooks/use-speech-recognition.ts`：浏览器 Web Speech API 封装。

### 2.3 领域层

- `src/lib/types.ts`：领域模型定义。
- `src/lib/consultation-utils.ts`：咨询工具函数（normalizeToolEvents/sanitizeAssistantText/splitStableMarkdown/shortenId/humanizeToolName 等）。
- `src/lib/consultation-constants.ts`：字段标签与值标签映射（FIELD_LABELS/VALUE_LABELS）及格式化函数。
- `src/lib/calculation.ts`：赔偿测算引擎。
- `src/lib/document-generator.ts`：文书模板生成。
- `src/lib/case-triage.ts`：案件复杂度评估与分流。
- `src/lib/hr-risk-check.ts`：HR 风险规则与报告生成。
- `src/features/consultation/services/middleware-api.ts`：咨询页中间件 API 与 SSE 解析入口。

### 2.4 运行层

- `src/server.ts`：Node 侧 Next server 入口。
- `scripts/dev.mjs`：开发启动（监听 server.ts）。
- `scripts/build.mjs`：构建（next build + tsup server）。
- `scripts/start.mjs`：生产启动（dist/server.js）。

## 3. 核心业务流程

### 3.1 劳动者咨询流程

1. 进入咨询页，初始化或恢复中间件 `case/session` 上下文。
2. 用户通过文本或语音输入案情，前端调用 `/sessions/{session_id}/chat/stream`。
3. 页面按 SSE 事件更新消息与工具状态：`message_start/content_delta/tool_call/tool_result/final/message_end/error`。
4. `tool_result` 事件若包含 `card_type/card_title/card_payload/card_actions`，前端渲染结构化结果卡。
5. 页面落地会话与轨迹信息（`case_id/session_id/trace_id/seq`），支持刷新后恢复。

### 3.2 文书生成流程

1. 读取案情与计算结果。
2. 调用文书生成器生成文本。
3. 支持导出文本供仲裁材料整理。

### 3.3 HR 风险流程

1. 录入企业用工场景。
2. 规则函数逐项检查。
3. 输出风险等级、优先问题与整改建议。

## 4. 当前边界与事实

1. 咨询主链路为中间件 SSE（`cases -> sessions -> /chat/stream`），正式路径不再自动回退本地规则回复。
2. 语音识别依赖浏览器 Web Speech API。
3. 前端会保留 `case_id/session_id/trace_id/stream_seq`，并在咨询页展示工具轨迹、结构化摘要和 PKULaw 引用结果。
4. 前端在匿名模式下会本地生成 `X-Anonymous-Token`，并将匿名会话信息持久化到本地。
5. 前端会通过后端 `GET /sessions/{session_id}/messages` 在刷新后恢复会话历史。
6. `tool_result` 已扩展结构化卡片协议：`card_type/card_title/card_payload/card_actions`，用于驱动要素卡、测算卡、文书卡、律师转介卡。
7. 仓库中暂无可执行 MCP server/client 链路，但前端已对接中间件返回的 MCP 工具事件与引用结果。
8. `consultation/page.tsx` 仍存在较多状态编排逻辑，已完成卡片组件拆分，后续可继续下沉会话编排与事件处理。

## 5. 主要技术债

1. ~~`consultation/page.tsx` 承载逻辑较重，需逐步拆出服务层。~~ （已完成 V1 重构：提取 4 个 Hook + 2 个 lib 文件，从 ~2250 行降至 ~1400 行）
2. `src/features/consultation/components/consultation-result-cards.tsx` 仍较重（~940 行），可考虑按卡片类型拆分。
3. 历史 Coze 兼容变量仍存在于部分脚本与运行时分支。
4. 领域规则测试覆盖有待补齐，变更回归成本偏高。

## 6. 接手建议

1. 第一步先跑通 `pnpm dev` 和 `pnpm build`。
2. 第二步阅读 `docs/plan.md` 了解当前阶段目标。
3. 第三步从单一流程切入改造，避免并行重构多个层级。
