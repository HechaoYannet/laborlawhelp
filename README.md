# 劳动维权助手

面向劳动者与中小企业的劳动法辅助平台，覆盖案情提炼、赔偿测算、文书生成、风险分流与 HR 风险检查。

## 1. 快速接手（5 分钟）

### 1.1 环境要求

- Node.js 20 LTS（见 `.nvmrc`）
- pnpm >= 9（必须，已启用 `only-allow pnpm`）
- 建议操作系统：Windows / WSL / Linux / macOS

### 1.2 初始化

```bash
pnpm install
cp .env.example .env.local
```

### 1.3 启动与验证

```bash
pnpm dev
```

- 默认地址：`http://localhost:5000`
- 如需生产验证：

```bash
pnpm build
pnpm start
```

## 2. 命令坐标

### 2.1 标准命令（默认）

- `pnpm dev`：开发模式（入口 `scripts/dev.mjs` -> `src/server.ts`）
- `pnpm build`：构建 Next + 打包 Node server
- `pnpm start`：运行生产包（`dist/server.js`）
- `pnpm lint`：ESLint
- `pnpm ts-check`：TypeScript 检查

### 2.2 兼容命令（迁移期）

- `pnpm dev:coze`
- `pnpm build:coze`
- `pnpm start:coze`

仅用于兼容历史环境，不作为团队默认命令。

## 3. 关键文档索引

- `docs/architecture.md`：系统分层、核心流程、边界与技术债
- `docs/coze-legacy-and-env.md`：遗产兼容策略与环境变量规范
- `docs/plan.md`：项目坐标系、阶段目标、里程碑、交付标准
- `AGENTS.md`：AI 代理执行规范（Copilot/通用 Agent）
- `CLAUDE.md`：Claude Code 快速衔接说明

## 4. 仓库结构（接手者优先视角）

```text
src/
  app/
    page.tsx                  # 根路由重定向
    (home)/page.tsx           # 导航首页
    consultation/page.tsx     # 劳动者咨询主流程
    hr-risk/page.tsx          # HR 风险检查流程
    layout.tsx                # 全局布局与 Provider
  hooks/
    use-case-store.tsx        # 案情主状态
    use-speech-recognition.ts # 语音识别封装
  lib/
    calculation.ts            # 赔偿计算
    dialogue-flow.ts          # 对话规则流
    document-generator.ts     # 文书生成
    case-triage.ts            # 案件分流
    hr-risk-check.ts          # HR 风险规则
    types.ts                  # 领域类型
  server.ts                   # Node 自定义服务入口

scripts/
  dev.mjs                     # 跨平台开发脚本
  build.mjs                   # 跨平台构建脚本
  start.mjs                   # 跨平台启动脚本
```

## 5. 开发约束（高优先级）

- 使用 TypeScript strict 心智，禁止隐式 any。
- 禁止在 JSX 中直接使用 `Date.now()`、`Math.random()`（防 hydration 问题）。
- 组件优先复用 `src/components/ui/`（shadcn/ui）。
- 包管理器必须是 pnpm，不使用 npm/yarn。
- 自定义 server 为正式入口，不改为直接 `next dev` 作为默认路径。

## 6. 环境变量最小集合

### 6.1 必需/常用

- `NEXT_PUBLIC_APP_URL`：站点公开地址
- `NEXT_PUBLIC_ENABLE_DEV_INSPECTOR`：是否在开发模式启用 inspector
- `HOSTNAME`：服务监听地址
- `PORT`：服务监听端口

### 6.2 可选

- `DEPLOY_RUN_PORT`：生产启动端口覆盖

### 6.3 兼容（deprecated）

- `COZE_PROJECT_ENV`
- `COZE_WORKSPACE_PATH`

## 7. 交接清单（建议逐项勾选）

1. `pnpm install && pnpm dev` 可在本机正常启动。
2. `pnpm build` 无报错。
3. `.env.example` 与部署环境变量一致。
4. 阅读 `docs/architecture.md` 与 `docs/plan.md` 后，可独立说明系统主流程。
5. AI 协作入口文件 `AGENTS.md`、`CLAUDE.md` 已同步到最新流程。

## 8. 声明

- 平台输出仅供参考，不构成法律意见。
- 赔偿测算结果为初步估算，需律师复核。
- 仲裁时效通常为 1 年，需结合个案时间轴判断。
