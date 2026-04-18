# Coze 遗产与环境变量治理

本文档定义迁移期兼容边界，确保新开发不再被历史 Coze 语义绑架，同时保留必要兼容能力。

## 1. 遗产现状

1. 脚本层仍保留 `dev:coze`、`build:coze`、`start:coze`。
2. `scripts/*.mjs` 与 `src/server.ts` 存在对 Coze 变量的兼容读取。
3. 默认开发路径已是标准命令链路，不依赖 Coze 平台。

## 2. 变量分层规范

### 2.1 客户端变量（可暴露）

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ENABLE_DEV_INSPECTOR`
- `NEXT_PUBLIC_ENABLE_MIDDLEWARE_CHAT`
- `NEXT_PUBLIC_MIDDLEND_BASE_URL`
- `NEXT_PUBLIC_ENABLE_LOCAL_FALLBACK`

### 2.2 服务端变量（不可暴露）

- `NODE_ENV`
- `HOSTNAME`
- `PORT`
- `DEPLOY_RUN_PORT`（可选）

### 2.3 兼容变量（deprecated）

- `COZE_PROJECT_ENV`
- `COZE_WORKSPACE_PATH`
- `NEXT_PUBLIC_MIDDLEWARE_API_BASE_URL`
- `NEXT_PUBLIC_ENABLE_LOCAL_RULE_FALLBACK`

规则：兼容变量只用于兜底读取，不用于新功能设计。

## 3. 执行策略

1. 默认仅使用 `pnpm dev/build/start`。
2. 兼容命令仅在外部历史环境确有需求时使用。
3. 新增脚本或模块时，不再引入新的 `COZE_*` 变量依赖。
4. 文档示例统一以标准变量命名展示。

## 4. 清理优先级

### 4.1 高优先级

1. 避免新增 Coze 术语文案。
2. 运行逻辑优先 `NODE_ENV`，Coze 变量仅作为兼容 fallback。

### 4.2 中优先级

1. 评估 `coze-coding-dev-sdk` 是否被实际调用。
2. 评估 `react-dev-inspector` 是否仍满足团队调试需求。

### 4.3 低优先级

1. 清理历史 `.sh` 链路（确认外部环境无依赖后执行）。

## 5. 安全基线

1. 若后续接入 LLM/MCP/API Key，密钥只能放服务端环境变量。
2. `.env.example` 仅保留键名与说明，不写真实值。
3. 所有变量必须在文档中注明：用途、作用域、是否必填、默认值。

## 6. 面向接手人的结论

当前仓库可按标准 Node + pnpm 工程理解和维护。Coze 相关内容属于迁移兼容层，不是主流程依赖。
