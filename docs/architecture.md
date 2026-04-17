# 劳动维权助手架构说明

## 1. 项目分层

- 展示与交互层
  - src/app/page.tsx：根路由，重定向到咨询页。
  - src/app/(home)/page.tsx：导航首页，提供劳动者端与企业端入口。
  - src/app/consultation/page.tsx：劳动者咨询主界面，包含消息流、语音输入、信息提取、计算与建议输出。
  - src/app/hr-risk/page.tsx：HR 风险检查界面，调用风险检查函数并生成汇总报告。
  - src/app/layout.tsx：全局布局、metadata、全局 Provider 注入。

- 状态层
  - src/hooks/use-case-store.tsx：全局案情状态容器（Context + useState），维护案情卡、时间轴、计算结果、文书、对话消息、分流结果。
  - src/hooks/use-speech-recognition.ts：浏览器 Web Speech API 封装，提供 transcript、isListening、start/stop。

- 领域逻辑层
  - src/lib/types.ts：领域模型定义（案情、计算、文书、分流、HR 风险）。
  - src/lib/dialogue-flow.ts：对话阶段、引导问题、规则提取、案情摘要。
  - src/lib/calculation.ts：赔偿测算引擎（违法解除、未签合同、拖欠工资、年假等）。
  - src/lib/document-generator.ts：仲裁申请书、证据目录、计算明细、行动清单生成。
  - src/lib/case-triage.ts：案件复杂度评估与律师推荐。
  - src/lib/hr-risk-check.ts：企业端风险检查规则与综合报告。

- 运行与构建层
  - src/server.ts：自定义 Next HTTP server 入口。
  - scripts/dev.mjs：开发启动脚本（pnpm tsx watch src/server.ts）。
  - scripts/build.mjs：生产构建脚本（next build + tsup）。
  - scripts/start.mjs：生产启动脚本（node dist/server.js）。
  - next.config.ts：Next 配置（包括 allowedDevOrigins 与远程图片策略）。

## 2. 核心工作流

### 2.1 劳动者咨询流

1. 入口：src/app/page.tsx 重定向到 src/app/consultation/page.tsx。
2. 页面初始化：consultation 页面注入首条助手消息。
3. 用户输入：文本输入或 use-speech-recognition 返回 transcript。
4. 信息提取：页面内 extractInfo 对输入做规则抽取。
5. 动态处理：
   - 赔偿问题触发 src/lib/calculation.ts。
   - 律师问题触发 src/lib/case-triage.ts。
   - 总结问题触发 src/lib/dialogue-flow.ts。
6. 输出：页面以打字机效果渲染助手回复，并维护消息历史。

### 2.2 文书生成流

1. 上游数据：CaseProfile + CalculationResult + TimelineEvent。
2. 调用：src/lib/document-generator.ts 的 generateDocument。
3. 输出：DocumentContent（文本内容），可通过 downloadDocument 导出 txt。

### 2.3 HR 风险评估流

1. 入口：src/app/hr-risk/page.tsx。
2. 单场景检查：调用 src/lib/hr-risk-check.ts 的场景函数。
3. 综合报告：调用 generateComprehensiveRiskReport 生成 overallLevel 与 priorityItems。
4. 输出：风险卡片、告警建议、详情弹窗。

## 3. 现状依赖关系

- UI 层直接调用领域层函数，未经过统一服务层。
- consultation 页面承载了过多业务逻辑（状态、提取、编排、渲染混杂）。
- use-case-store 的全局状态与 consultation 页本地状态并存，存在状态源重复。

## 4. Agent/MCP/LLM/Speech 现状

- Speech：当前仅使用浏览器 Web Speech API（src/hooks/use-speech-recognition.ts）。
- LLM：当前未发现真实外部 LLM API 请求，主要是规则引擎与模板回复。
- MCP：未发现仓库内可执行 MCP server/client 代码链路。
- Agent：以流程文档和本地规则编排为主，不是独立代理执行框架。

## 5. 主要技术债与风险点

- Coze 环境变量与文案绑定残留在布局、服务入口、脚本与配置中。
- 业务逻辑集中在页面文件，缺乏 Application Service 层。
- 对话提取大量使用正则和 any，扩展成本高，稳定性有限。
- 依赖集合偏重，部分包与当前业务路径不匹配，需后续做依赖审计。

## 6. 近期演进建议（不含大重构）

1. 统一环境变量命名并提供 .env.example。
2. 将 layout/server 先从 COZE_PROJECT_ENV 切换到标准 NODE_ENV 逻辑。
3. 在 consultation 页面拆出 service 层（提取、编排、响应生成），减少页面耦合。
4. 引入可测试的 message id 生成策略，去除随机值带来的可重复性问题。
