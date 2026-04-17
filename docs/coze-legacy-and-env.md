# Coze 遗产清单与环境变量治理

## 1. 已识别 Coze 遗产

- 平台配置
  - .coze：定义 coze 容器运行入口与 nodejs-24 要求。

- 脚本与环境变量
  - scripts/*.sh 与 scripts/*.mjs 中出现 COZE_WORKSPACE_PATH。
  - src/server.ts 与 src/app/layout.tsx 中出现 COZE_PROJECT_ENV。

- 品牌与元数据
  - src/app/layout.tsx 的 metadata 中包含 Coze 文案与链接。

- 开发辅助依赖
  - react-dev-inspector 系列依赖与布局注入逻辑。

- Next 配置
  - next.config.ts 中 allowedDevOrigins 包含 *.dev.coze.site。

## 2. 保留与清理策略

- 可保留（兼容层）
  - package.json 的 dev:coze/build:coze/start:coze（仅用于迁移期）。
  - scripts/*.sh（仅迁移期保留，不作为默认入口）。

- 应清理（迷惑性来源）
  - layout metadata 中 Coze 品牌文案与站点信息。
  - 运行时对 COZE_PROJECT_ENV 的强依赖（改为 NODE_ENV + 可选开关）。

- 待评估后清理
  - coze-coding-dev-sdk 依赖是否有实际业务使用。
  - react-dev-inspector 是否需要仅在本地开发显式开关。

## 3. Env 设计（行业通用）

建议分层：

- 客户端可见变量（NEXT_PUBLIC_*）
  - NEXT_PUBLIC_APP_URL：站点公开地址。
  - NEXT_PUBLIC_ENABLE_DEV_INSPECTOR：开发模式下是否启用 inspector。

- 服务端变量
  - NODE_ENV：development/production。
  - HOSTNAME：服务监听 host。
  - PORT：服务监听端口。
  - DEPLOY_RUN_PORT：生产启动端口（可选）。

- 迁移兼容变量（deprecated）
  - COZE_PROJECT_ENV。
  - COZE_WORKSPACE_PATH。

## 4. API key 与安全要求

- 未发现当前业务代码中真实外部 LLM/MCP API key 调用。
- 若后续接入 LLM/MCP，必须满足：
  - 仅服务端读取密钥，禁止 NEXT_PUBLIC_* 暴露密钥。
  - 使用 .env.local（本地）与部署平台 Secret（线上）。
  - 提供 .env.example 仅包含键名与注释，不包含真实值。
  - 文档中明确每个变量的用途、作用域、默认值与是否必填。

## 5. MCP/Agent/Speech 现状说明

- Speech：本地浏览器 Web Speech API，未使用第三方语音 SDK。
- Agent：主要为前端规则编排，不是独立 Agent runtime。
- MCP：未发现可执行 MCP workflow 代码。

结论：当前最关键的是先做工程治理与职责拆分，再按需引入真实 LLM/MCP 能力。
