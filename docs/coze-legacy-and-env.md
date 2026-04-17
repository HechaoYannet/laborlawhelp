# Coze 遗留与环境变量治理

本文档说明迁移期遗留项的处理策略，并给出当前版本的环境变量规范。

## 1. 遗留项清单（现状）

1. 兼容脚本仍保留：dev:coze / build:coze / start:coze。
2. 兼容变量仍可识别：COZE_PROJECT_ENV、COZE_WORKSPACE_PATH。
3. 运行主链路已切换到标准 Node 环境变量（NODE_ENV/HOSTNAME/PORT）。

## 2. 保留与清理策略

### 2.1 保留（短期）

1. Coze 兼容命令：用于迁移期回归验证。
2. 兼容变量识别：避免历史部署配置立即失效。

### 2.2 清理（中期）

1. 文案层面不再使用 Coze 品牌相关描述。
2. 逐步下线 COZE_* 变量依赖，统一到标准命名。
3. 对未使用依赖（如 coze-coding-dev-sdk）执行审计后再移除。

## 3. 环境变量分层规范

### 3.1 客户端变量（NEXT_PUBLIC_*）

1. NEXT_PUBLIC_APP_URL
2. NEXT_PUBLIC_ENABLE_DEV_INSPECTOR

要求：不能放置任何密钥、token、内部地址。

### 3.2 服务端基础变量

1. NODE_ENV
2. HOSTNAME
3. PORT
4. DEPLOY_RUN_PORT（可选）

### 3.3 MCP 服务端变量

1. PKULAW_MCP_TOKEN
2. MCP_ROUTER_COMMAND
3. MCP_ROUTER_ARGS
4. MCP_ROUTER_CWD（可选）
5. MCP_REQUEST_TIMEOUT_MS
6. MCP_REQUEST_RETRIES
7. MCP_GATEWAY_API_KEY（可选）
8. MCP_ALLOWED_ORIGINS（可选）

### 3.4 兼容变量（deprecated）

1. COZE_PROJECT_ENV
2. COZE_WORKSPACE_PATH

## 4. 安全规范

1. 所有密钥仅在服务端读取与使用。
2. .env.example 仅保留键名与注释，不提供真实值。
3. 生产环境密钥通过平台 Secret 管理，禁止写入仓库。
4. 日志输出中不得包含 token、身份证号、手机号等敏感信息。

## 5. 变更流程建议

1. 新增变量时必须同步更新 .env.example 与 README。
2. 变更变量语义时必须同步更新 docs/architecture.md 与 docs/plan.md。
3. 删除变量前至少经历一个版本的 deprecated 过渡。

## 6. 当前结论

1. Coze 遗留已降级为兼容层，不再是主运行依赖。
2. MCP 能力已接入服务端链路，后续重点是安全、观测和质量治理。
