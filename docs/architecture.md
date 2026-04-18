# 劳动维权助手架构说明

本文档用于帮助新成员在 30 分钟内建立对系统的全局认知，并快速定位可修改点。

## 1. 架构总览

项目采用 Next.js App Router + 自定义 Node server 的单仓前端架构，核心由四层组成：

1. 交互层：`src/app/*` 页面与 UI 组件。
2. 状态层：`src/hooks/use-case-store.tsx`、`src/hooks/use-speech-recognition.ts`。
3. 领域层：`src/lib/*`（计算、文书、分流、风控规则）。
4. 运行层：`src/server.ts` 与 `scripts/*.mjs`。

## 2. 目录职责

### 2.1 交互层

- `src/app/page.tsx`：根路由跳转。
- `src/app/(home)/page.tsx`：导航首页。
- `src/app/consultation/page.tsx`：劳动者咨询主流程。
- `src/app/hr-risk/page.tsx`：企业端 HR 风险检查主流程。
- `src/app/demo/*`：演示数据与旧版步骤页兼容代码。
- `src/app/layout.tsx`：全局 metadata、Provider、开发辅助注入。

### 2.2 状态层

- `src/hooks/use-case-store.tsx`：案情主状态（案情、时间线、消息、计算结果、文书等）。
- `src/hooks/use-speech-recognition.ts`：浏览器 Web Speech API 封装。
- `src/features/demo/state/use-dismiss-demo-store.ts`：旧版演示页状态（本地存储，兼容保留）。

### 2.3 领域层

- `src/lib/types.ts`：领域模型定义。
- `src/lib/dialogue-flow.ts`：对话阶段与规则提取。
- `src/lib/calculation.ts`：赔偿测算引擎。
- `src/lib/document-generator.ts`：文书模板生成。
- `src/lib/case-triage.ts`：案件复杂度评估与分流。
- `src/lib/hr-risk-check.ts`：HR 风险规则与报告生成。
- `src/features/demo/data/dismiss-demo-data.ts`：演示固定数据与文案。
- `src/features/demo/services/dismiss-chat-demo.ts`：咨询页内的硬编码演示脚本与固定案情数据。

### 2.4 运行层

- `src/server.ts`：Node 侧 Next server 入口。
- `scripts/dev.mjs`：开发启动（监听 server.ts）。
- `scripts/build.mjs`：构建（next build + tsup server）。
- `scripts/start.mjs`：生产启动（dist/server.js）。

## 3. 核心业务流程

### 3.1 劳动者咨询流程

1. 进入咨询页，初始化对话上下文。
2. 用户通过文本或语音输入案情。
3. 规则提取模块识别关键字段。
4. 根据意图分发到计算/总结/分流模块。
5. 页面渲染回复、更新消息历史与状态。

### 3.2 文书生成流程

1. 读取案情与计算结果。
2. 调用文书生成器生成文本。
3. 支持导出文本供仲裁材料整理。

### 3.3 HR 风险流程

1. 录入企业用工场景。
2. 规则函数逐项检查。
3. 输出风险等级、优先问题与整改建议。

### 3.4 违法辞退演示流程

1. 从首页演示卡片进入 `/consultation?demo=dismiss`。
2. 直接在现有 AI 对话界面内完成 8 轮固定问答。
3. 聊天内容内给出案情摘要、陕西口径测算、文书建议与分流建议。
4. 全流程仅消费前端固定数据，不触发真实 API。
5. 该链路仅作为 UI 与交互样板，不作为正式版运行依赖；正式版复现请参考 `docs/咨询页正式版UI复现指南.md`。

## 4. 当前边界与事实

1. 当前为规则驱动系统，未接入真实外部 LLM API。
2. 语音识别依赖浏览器 Web Speech API。
3. 仓库中暂无可执行 MCP server/client 链路。
4. UI 层与领域层存在直接调用，服务层边界仍较薄。
5. 演示链路由 consultation 页面内的 query 参数切换，聊天内容保持在同一界面中展示。
6. 正式版需要复用当前聊天式 UI 的结构，不保留 demo query、固定脚本与硬编码案情。

## 5. 主要技术债

1. `consultation/page.tsx` 承载逻辑较重，需逐步拆出服务层。
2. 历史 Coze 兼容变量仍存在于部分脚本与运行时分支。
3. 领域规则测试覆盖有待补齐，变更回归成本偏高。

## 6. 接手建议

1. 第一步先跑通 `pnpm dev` 和 `pnpm build`。
2. 第二步阅读 `docs/plan.md` 了解当前阶段目标。
3. 第三步从单一流程切入改造，避免并行重构多个层级。
