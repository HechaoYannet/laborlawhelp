# Quick Start

本文档面向第一次接手 `laborlawhelp` / `laborlawhelp-middlend` 的使用者，目标是用最短路径完成：

1. 环境准备
2. 前后端启动
3. 手动跑通一次咨询流程
4. 验证刷新后会话恢复

默认先走 `mock` 联调路径，优先验证前后端集成与页面行为。文末再给出真实 OpenHarness / PKULaw 的可选验证方式。

## 1. 前置要求

- Node.js 20 LTS
- Python 3.10+
- Python 环境管理器：`uv` / `venv` / `conda` 任选其一
- 若系统没有全局 `pnpm`，直接使用 `corepack pnpm`

仓库根目录假设为：

```text
/home/chen-hao/repositories/laborhelper
```

涉及两个子项目：

- 前端：`laborlawhelp`
- 中间件后端：`laborlawhelp-middlend/backend`

## 2. 前端初始化

进入前端目录：

```bash
cd /home/chen-hao/repositories/laborhelper/laborlawhelp
```

安装依赖：

```bash
corepack pnpm install
```

创建前端本地环境文件：

```bash
cp .env.example .env.local
```

将 `.env.local` 至少改成下面这些值：

```env
NEXT_PUBLIC_APP_URL=http://localhost:5000
NEXT_PUBLIC_ENABLE_MIDDLEWARE_CHAT=true
NEXT_PUBLIC_MIDDLEND_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_ENABLE_LOCAL_FALLBACK=false
NEXT_PUBLIC_MIDDLEWARE_POLICY_VERSION=

HOSTNAME=localhost
PORT=5000
```

说明：

- `NEXT_PUBLIC_ENABLE_MIDDLEWARE_CHAT=true`：让咨询页走中间件主链路。
- `NEXT_PUBLIC_ENABLE_LOCAL_FALLBACK=false`：先不要混入本地回退，便于确认真实集成状态。
- `NEXT_PUBLIC_MIDDLEND_BASE_URL` 指向本地后端的 API 前缀，默认本地联调用 `http://localhost:8000/api/v1`。

## 3.1 后端本地联调环境

进入后端目录后，建议先复制模板：

```bash
cd /home/chen-hao/repositories/laborhelper/laborlawhelp-middlend/backend
cp .env.example .env
```

本地浏览器联调至少确认下面这些值：

```env
storage_backend=memory
auth_mode=anonymous
oh_use_mock=true
oh_mode=mock
cors_allow_origins=http://localhost:5000
cors_allow_credentials=true
cors_allow_methods=*
cors_allow_headers=*
```

说明：

- `cors_allow_origins` 需要覆盖前端开发地址，否则浏览器会在预检阶段拦截请求。
- 当前本地联调默认允许 `localhost:5000`。
- 如果你把前端换到别的端口，需要同步补充这个列表。

## 4. 后端初始化

进入后端目录：

```bash
cd /home/chen-hao/repositories/laborhelper/laborlawhelp-middlend/backend
```

后端依赖安装和运行方式不绑定 `uv`。如果你已经准备好自己的 Python 环境，直接在该环境里安装 `requirements.txt` 即可。

按当前联调手册，本地先复制模板并确认这些配置：

```bash
cp .env.example .env
```

```env
storage_backend=memory
auth_mode=anonymous
oh_use_mock=true
oh_mode=mock
cors_allow_origins=http://localhost:5000
cors_allow_credentials=true
cors_allow_methods=*
cors_allow_headers=*
```

本地手动验证建议优先使用内存存储 + mock 模式：

```bash
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

说明：

- `storage_backend=memory`：不用 PostgreSQL / Redis，最省事。
- `auth_mode=anonymous`：本地联调先用匿名模式，便于直接跑通前后端。
- `oh_use_mock=true`：不依赖真实 OpenHarness 服务，也不依赖 DeepSeek / PKULaw 连通性。
- `oh_mode=mock`：与本地联调手册一致，优先走 mock。
- `cors_allow_origins`：必须覆盖前端开发地址，否则浏览器预检会被拦截。

如果你已经在使用自己的虚拟环境，也可以先激活环境，再执行 `python -m pip install -r requirements.txt` 和 `python -m uvicorn ...`。如果你愿意使用 `uv`，也可以在等价环境下运行相同服务，但这不是前提。

## 5. 启动前端

新开一个终端，回到前端目录：

```bash
cd /home/chen-hao/repositories/laborhelper/laborlawhelp
corepack pnpm dev
```

成功后你应看到开发服务监听在：

```text
http://localhost:5000
```

## 6. 手动验证一轮咨询流程

打开浏览器访问：

```text
http://localhost:5000/consultation
```

建议输入这句测试文案：

```text
我今天被口头辞退了，公司没给书面通知。
```

预期结果：

1. 页面能正常发送，不报 401 / 403。
2. 页面会进入流式状态，而不是一次性整段返回。
3. 中间会出现工具状态，mock 模式下一般会看到 `intent_router`。
4. 最终会出现助手回复。
5. 侧边栏或移动端摘要区域会显示：
   - 会话状态
   - 工具执行结果
   - 会话总结
   - `rule_version`

mock 模式下，典型最终文本会接近：

```text
根据你提供的信息，先不要签署任何自愿离职文件。建议立即固定证据，包括劳动合同、工资记录和辞退沟通截图。可以先按未依法解除劳动合同方向准备仲裁材料。
```

## 7. 验证刷新恢复

在同一个咨询页面完成一次问答后，直接刷新浏览器。

预期结果：

1. 页面不会丢失本次匿名会话。
2. 前端会自动恢复：
   - `anonymousToken`
   - `caseId`
   - `sessionId`
   - 历史消息列表
3. 刷新后仍能继续发送下一条消息。

如果刷新后消息全没了，优先检查：

- 浏览器 `localStorage` 是否被禁用
- 前端 `.env.local` 是否确实启用了中间件链路
- 后端是否还在运行

## 8. API 级快速排查

如果页面异常，优先看浏览器网络面板，确认这几个请求是否成功：

1. `POST /api/v1/cases`
2. `POST /api/v1/cases/{case_id}/sessions`
3. `POST /api/v1/sessions/{session_id}/chat/stream`
4. `GET /api/v1/sessions/{session_id}/messages`

当前匿名模式下，前端会自己生成 `X-Anonymous-Token`，所以首轮创建 `case` 不需要等后端额外签发 token。

## 9. 常见问题

### 8.1 `pnpm: command not found`

使用：

```bash
corepack pnpm install
corepack pnpm dev
```

不要要求系统里必须先装全局 `pnpm`。

### 8.2 前端能打开，但发送时报 401

说明匿名 owner token 没带上或后端没收到。

优先检查：

- 你是否真的访问的是 `/consultation`
- 前端是否是最新代码
- 浏览器网络面板中 `POST /api/v1/cases` 是否带了 `X-Anonymous-Token`

### 8.3 后端启动了，但关闭时报 OpenHarness import 错误

当前代码已经修复 mock 模式关闭时的这个问题。若仍出现，请确认后端代码已更新到最新工作区状态。

### 8.4 想验证真实 OpenHarness / PKULaw，而不是 mock

真实模式分两类：

1. `remote`：后端作为客户端，直接请求独立部署的 OpenHarness 服务。
2. `library`：后端进程内加载 OpenHarness runtime，不再单独跑 OpenHarness HTTP 服务。

两种模式都建议先在 `backend/.env` 中关闭 mock：

```env
oh_use_mock=false
oh_mode=remote
```

或者：

```env
oh_use_mock=false
oh_mode=library
```

#### 8.4.1 remote 模式

适合 OpenHarness 已经单独部署、并对外提供流式接口的场景。`backend/app/adapters/openharness_client.py` 会拼接下面这个地址：

```text
{oh_base_url}{oh_stream_path}
```

推荐配置如下：

```env
oh_mode=remote
oh_use_mock=false
oh_base_url=http://127.0.0.1:8080
oh_stream_path=/api/v1/stream-run
oh_api_key=sk-your-openharness-token
oh_connect_timeout_sec=5
oh_read_timeout_sec=60
oh_first_chunk_timeout_sec=15
oh_retry_max_attempts=3
oh_retry_backoff_seconds=1,2,4
oh_protocol_error_threshold=20
```

部署细节：

- OpenHarness 服务必须能被后端进程所在机器访问，不能只绑定在容器内部回环地址。
- `oh_stream_path` 必须和 OpenHarness 实际发布的流接口一致；如果你通过反向代理暴露服务，代理层也要保留这个路径。
- `oh_api_key` 会以 `Authorization: Bearer <token>` 的形式发送给 OpenHarness。
- 如果 OpenHarness 在内网或容器网络里，先在后端机器上用 `curl` 或浏览器验证接口可达，再启动前端。

建议的启动顺序：

```bash
# 1. 启动 OpenHarness 服务 / 网关
# 2. 确认流接口可访问 怎么确认：
#    curl -H "Authorization: Bearer <token>" http://127.0.0.1:8080/api/v1/stream-run

# 3. 启动 middlend 后端
# 4. 启动前端
```

#### 8.4.2 library 模式

适合希望由 middlend 直接加载 OpenHarness runtime 的场景。此模式下，后端会在 Python 进程中构建 runtime，并使用 `backend/agent-skills` 作为额外技能目录。

推荐配置如下：

```env
oh_mode=library
oh_use_mock=false
oh_lib_model=你的模型名
oh_lib_api_format=openai
oh_lib_base_url=http://127.0.0.1:8001/v1
oh_lib_api_key=your-model-api-key
oh_lib_max_turns=10
oh_lib_cwd=/absolute/path/to/laborlawhelp-middlend/backend
oh_lib_tool_policy=legal_minimal
```

部署细节：

- `oh_lib_model`、`oh_lib_base_url` 和 `oh_lib_api_key` 至少要能让 OpenHarness runtime 连接到可用的大模型提供方。
- `oh_lib_cwd` 建议指向 middlend backend 根目录，便于 runtime 解析相对路径和工具资源。
- `backend/agent-skills/` 需要保留在工作区内，OpenHarness 会把这里的技能目录作为额外工具来源。
- 当前代码会把权限模式强制为 `FULL_AUTO`，并默认注册本地劳动法工具，所以本地 `PKULAW_MCP_*` 和技能目录可用性很关键。
- `oh_lib_tool_policy=legal_minimal` 适合本地联调，能保留 PKULaw、技能控制和少量本地劳动法工具。

如果需要核验法律依据，还要补齐 `PKULAW_MCP_*`：

```env
PKULAW_MCP_ENABLED=true
PKULAW_MCP_COMMAND=node
PKULAW_MCP_ARGS=...
PKULAW_MCP_CONFIG=...
PKULAW_MCP_TOKEN=你的PKULaw访问令牌
PKULAW_MCP_SERVER_NAME=pkulaw
```

#### 8.4.3 预发/正式部署建议

- 前端只需要指向后端的 `/api/v1`，不需要直连 OpenHarness。
- 后端需要和 OpenHarness、PKULaw MCP、模型服务打通网络。
- 如果使用 `postgres` 存储，先部署 PostgreSQL 和 Redis，再启动 middlend。
- 如果使用 `anonymous`，前端浏览器侧不需要额外登录；如果切到 `jwt`，则要先完成鉴权链路。
- 日志里重点看 `OH_*` 错误、`SESSION_LOCKED`、`RATE_LIMITED` 和 OpenHarness 超时。

#### 8.4.4 最小自检

后端启动后，先检查：

```bash
curl http://127.0.0.1:8000/
```

预期返回服务状态 JSON。然后再问一条需要法律依据的问题，例如：

```text
我被违法解除劳动合同，可以主张哪些赔偿？请给出法律依据。
```

预期会看到：

- `tool_call` / `tool_result`
- `final.references`
- 更明确的 `rule_version`

如果走 remote 模式，OpenHarness 服务侧也应该能看到对应的流式请求日志；如果走 library 模式，则主要看 middlend 后端日志中的 `oh_library_bundle_ready`、`oh_library_submit` 和 `oh_protocol_*` 记录。

## 10. 最短验收清单

完成以下 6 项，就算本地 Quick Start 跑通：

1. `corepack pnpm install` 成功
2. 前端 `corepack pnpm dev` 成功
3. 后端 `uvicorn` 成功
4. `/consultation` 页面可以发送消息
5. 页面能收到流式回复
6. 刷新后历史消息仍能恢复
