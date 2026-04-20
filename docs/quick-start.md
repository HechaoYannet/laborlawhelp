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

## 1.1 环境文件位置

本地联调时，前后端分别读取不同的环境文件：

- 前端读取：`/home/chen-hao/repositories/laborhelper/laborlawhelp/.env.local`
- 后端读取：`/home/chen-hao/repositories/laborhelper/laborlawhelp-middlend/backend/.env`

建议按下面的方式区分：

- 页面地址、前端是否启用中间件聊天、前端请求的 API 地址，修改前端 `.env.local`
- 后端运行模式（mock / remote / library）、OpenHarness 配置、PKULaw MCP 配置，修改后端 `.env`

### 更改了 env 文件后

环境变量文件改完后，已经在运行的开发进程不会自动读取新值，需要重启对应服务。

如果你修改的是前端 `laborlawhelp/.env.local`，执行：

```bash
cd /home/chen-hao/repositories/laborhelper/laborlawhelp
corepack pnpm dev
```

如果前端已经在运行，先停止原来的 `pnpm dev`，再重新执行上面的命令。

如果你修改的是后端 `laborlawhelp-middlend/backend/.env`，执行：

```bash
cd /home/chen-hao/repositories/laborhelper/laborlawhelp-middlend/backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

如果后端已经在运行，先停止原来的 `uvicorn` 进程，再重新执行上面的命令。

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

先注意两个前提：

1. 启动 middlend 后端的那个 Python 环境里，必须已经能导入 OpenHarness。这里不要求单独再起一个 OpenHarness 进程，也不强制必须使用 `uv`；`conda` / `venv` / `uv` 都可以。关键是：启动后端的同一个 Python 环境里，既装好了 `backend/requirements.txt`，又能 `import openharness`。
需要理解一点：`library` 模式不要求你“单独再准备一个 OpenHarness 运行环境”，而是要求 **middlend 当前使用的这个 Python 环境本身已经能找到 OpenHarness 代码**。
适配当前项目的openharness仓库地址：

```text
https://github.com/ChenHaoFromZ/openharness_adapted_for_lawhelper.git
```

如果是直接把openharness和middlend装在同一个工作区，那么有middlend基本可以找到openharness的python环境，仅按前面步骤，在新的 `conda` 环境中安装依赖并启动 middlend 就已经能正常和 OpenHarness 协同，说明这个 `conda` 环境事实上已经满足了 `import openharness` 的条件。这种情况下，不需要执行下列步骤。

更一般的条件下，openharness在middlend的导入方式有两类，都是为了达成“当前 Python 环境能导入 openharness”这个目标。

方式一：在你自己的 Python 环境里安装 backend 依赖，并把本地 OpenHarness 以 editable 方式装进去。比如使用 `conda`：

```bash
conda activate laborhelper
cd /home/chen-hao/repositories/laborhelper/laborlawhelp-middlend/backend
python -m pip install -r requirements.txt
python -m pip install -e ../../OpenHarness
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

方式二：如果当前环境还不能导入 OpenHarness，再使用 `uv run --with-editable ...` 作为临时兜底方案：

```bash
cd /home/chen-hao/repositories/laborhelper/laborlawhelp-middlend/backend
uv run --with-editable ../../OpenHarness --with-requirements requirements.txt uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

文档中的这条 `uv run` 命令只是兜底手段，不是 `library` 模式的标准前提，也不是你当前这套跑通方式的必经步骤。

1. 当前后端配置校验在 `oh_use_mock=false` 时，仍会检查 `oh_base_url`、`oh_stream_path` 和 `oh_api_key`。即使你走的是 `library` 模式，也建议保留一组占位值，避免启动阶段直接报错。

##### 8.4.2.1 最小可跑示范

如果你只是想先确认 library runtime 能跑通，不接 PKULaw，可以先用下面这组：

```env
oh_use_mock=false
oh_mode=library

# 当前配置校验仍要求保留 remote 三项，占位即可
oh_base_url=http://127.0.0.1:8080
oh_stream_path=/api/v1/stream-run
oh_api_key=sk-placeholder-for-library-mode

oh_lib_model=deepseek-chat
oh_lib_api_format=openai
oh_lib_base_url=https://api.deepseek.com/v1
oh_lib_api_key=YOUR_MODEL_KEY
oh_lib_max_turns=20
#注意max_turns要足够大，能覆盖完整的咨询流程，否则可能在中途就因为达到 max_turns 而停止对话。
oh_lib_cwd=/absolute/path/to/laborlawhelp-middlend/backend
oh_lib_tool_policy=legal_minimal
OPENHARNESS_MAX_TOKENS=8192
```

这组配置适用于兼容 OpenAI 协议的模型服务。若你换成别的提供方，只要同时替换 `oh_lib_model`、`oh_lib_base_url`、`oh_lib_api_key` 即可。

##### 8.4.2.2 带 PKULaw 的完整示范

如果目标是验证“模型回答 + 法律依据检索 + citations 回填”整条链路，建议直接用下面这组：

```env
oh_use_mock=false
oh_mode=library

# 当前配置校验仍要求保留 remote 三项，占位即可
oh_base_url=http://127.0.0.1:8080
oh_stream_path=/api/v1/stream-run
oh_api_key=sk-placeholder-for-library-mode

oh_lib_model=deepseek-chat
oh_lib_api_format=openai
oh_lib_base_url=https://api.deepseek.com/v1
oh_lib_api_key=YOUR_MODEL_KEY
oh_lib_max_turns=20
oh_lib_cwd=/absolute/path/to/laborlawhelp-middlend/backend
oh_lib_tool_policy=legal_minimal
OPENHARNESS_MAX_TOKENS=8192

PKULAW_MCP_ENABLED=true
PKULAW_MCP_COMMAND=/usr/bin/env
PKULAW_MCP_ARGS=PATH=/usr/bin:/bin npx -y pkulaw-mcp-router@0.2.2 serve --config /absolute/path/to/laborlawhelp-middlend/backend/pkulaw-config.toml
PKULAW_MCP_CONFIG=/absolute/path/to/laborlawhelp-middlend/backend/pkulaw-config.toml
PKULAW_MCP_TOKEN=YOUR_PKULAW_TOKEN
PKULAW_MCP_SERVER_NAME=pkulaw
```

如果你就是按当前仓库结构联调，可以把 `PKULAW_MCP_CONFIG` 写成：

```env
PKULAW_MCP_CONFIG=/home/chen-hao/repositories/laborhelper/laborlawhelp-middlend/backend/pkulaw-config.toml
```

部署细节：

- `oh_lib_model`、`oh_lib_base_url` 和 `oh_lib_api_key` 至少要能让 OpenHarness runtime 连接到可用的大模型提供方。
- `oh_lib_cwd` 建议指向 middlend backend 根目录，便于 runtime 解析相对路径和工具资源。
- `backend/agent-skills/` 需要保留在工作区内，OpenHarness 会把这里的技能目录作为额外工具来源。
- 当前代码会把权限模式强制为 `FULL_AUTO`，并默认注册本地劳动法工具，所以本地 `PKULAW_MCP_*` 和技能目录可用性很关键。
- `oh_lib_tool_policy=legal_minimal` 适合本地联调，能保留 skill、PKULaw 检索，以及少量本地劳动法工具。
- `PKULAW_MCP_COMMAND` 填的是“启动器”，不是 `pkulaw-mcp-router` 包名本身。`pkulaw-mcp-router` 是放在 `PKULAW_MCP_ARGS` 里的被执行目标；如果本机 `npx` 已在 PATH 上，也可以把 `PKULAW_MCP_COMMAND` 简写成 `npx`，并把 `PKULAW_MCP_ARGS` 保持为空。

> **PKULAW_MCP_COMMAND 与 PKULAW_MCP_ARGS 的修改注意**
>
> 当 `PKULAW_MCP_ARGS` 为空时，OpenHarness 会 fallback 到一组 **npx 专用**的默认参数：
>
> ```text
> -y pkulaw-mcp-router@latest serve --config <config_path>
> ```
>
> 如果你把 `PKULAW_MCP_COMMAND` 换成了 `npx` 以外的命令（例如 `/usr/bin/env`），
> 而 `PKULAW_MCP_ARGS` 留空，`/usr/bin/env` 会收到 `-y` 这个它不认识的选项，
> 导致报错 `/usr/bin/env: invalid option -- 'y'` 并触发 `ASGI callable returned without completing response`。
>
> 解决方式：**只要改了 `PKULAW_MCP_COMMAND`，就必须同时填写 `PKULAW_MCP_ARGS`**。
>
> 推荐的两种写法：
>
> 写法一：直接用 `npx`（推荐，最简单）：
>
> ```env
> PKULAW_MCP_COMMAND=npx
> PKULAW_MCP_ARGS=
> ```
>
> 此时 `PKULAW_MCP_ARGS` 留空即可，代码会自动拼好 npx 参数。
>
> 写法二：通过 `/usr/bin/env` 注入 PATH 后调用 `npx`：
>
> ```env
> PKULAW_MCP_COMMAND=/usr/bin/env
> PKULAW_MCP_ARGS=PATH=/usr/bin:/bin npx -y pkulaw-mcp-router@0.2.2 serve --config /absolute/path/to/pkulaw-config.toml
> ```
>
> 注意 `PKULAW_MCP_ARGS` 里的完整参数会经过 `shlex.split()` 拆分，所以不要额外加引号包裹整行。

如果你自己的 Python 环境不是通过上面的 `uv run --with-editable ../../OpenHarness` 启动，也要保证至少满足其一：

- 已把 `../../OpenHarness` 以 editable 方式安装进当前环境。
- 或者把 `../../OpenHarness/src` 放进 `PYTHONPATH`。

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

## 11. OpenHarness 环境如何与中间件协同

这一节只针对 `library` 模式。

在 `library` 模式下，**不会单独启动一个 OpenHarness HTTP 服务**。真正的执行方式是：middlend 后端在自己的 Python 进程内直接导入 `openharness`，构建 runtime，然后把 OpenHarness 产生的流式事件转成中间件自己的流式输出，再返回给前端。

可以把链路理解成下面 6 步：

1. 浏览器向 middlend 发送 `POST /api/v1/sessions/{session_id}/chat/stream`。
2. middlend 后端读取 `.env` 里的 `oh_mode=library` 和 `oh_lib_*` 配置，在当前 Python 环境里导入 `openharness`。
3. 后端调用 OpenHarness 的 `build_runtime(...)` 构建 runtime，并把 `backend/agent-skills` 作为额外技能目录加载进去。
4. 后端继续注册本地劳动法工具，例如赔偿计算、文书生成、事实提取，并按 `oh_lib_tool_policy` 过滤最终可用工具；如果配置了 `PKULAW_MCP_*`，还会把 PKULaw MCP 一并接入。
5. 后端把用户问题补上中间件指令、地域规则、工具使用规则后，再调用 OpenHarness 的 `engine.submit_message(...)`。
6. OpenHarness 返回的 `text`、`tool_call`、`tool_result`、`final` 等事件，会被 middlend 转成自己的流式 chunk，最后再推给前端页面。

这意味着，`library` 模式是否能跑通，核心不在于“有没有单独起一个 OpenHarness 服务”，而在于“当前启动后端的 Python 环境，能不能正确导入并执行你这份 OpenHarness 代码”。

如果你已经在 `conda` 环境里按前面的初始化步骤跑通了后端和前端，那就说明这个环境已经满足了上面的条件；此时不需要再额外创建一个单独的 OpenHarness 环境。

### 11.1 要做哪些操作，程序才能正常运行

至少满足下面这些条件：

1. 你已经把要使用的 OpenHarness 代码下载到本地，并确保启动 middlend 的当前 Python 环境能够找到它。若你使用的是自己改装的仓库版本，要保证当前环境里加载到的就是这份版本。
2. 启动 middlend 后端的同一个 Python 环境里，同时具备两类依赖：
   - `laborlawhelp-middlend/backend/requirements.txt`
   - 可导入的 `openharness`
3. `backend/.env` 已切到 `library` 模式，并至少配置好 `oh_use_mock=false`、`oh_mode=library`、`oh_lib_model`、`oh_lib_base_url`、`oh_lib_api_key`、`oh_lib_cwd`。
4. 如果要启用法律依据检索，还需要补齐 `PKULAW_MCP_CONFIG`、`PKULAW_MCP_TOKEN`、`PKULAW_MCP_COMMAND`、`PKULAW_MCP_ARGS` 等配置。
5. 每次修改 `backend/.env` 后，都要重启后端进程，让新的 OpenHarness / MCP 配置重新生效。
6. `backend/agent-skills/` 目录要保留在工作区内，否则 library runtime 无法加载当前项目依赖的额外技能。
7. 若当前环境已经能跑通，就不要额外再叠加第二套 OpenHarness 启动方式；保持“同一个 Python 环境同时运行 middlend 并导入 OpenHarness”即可，路径更简单，也更符合当前项目的 library 模式设计。

### 11.2 最小自检动作

如果你使用的是自己的 `conda` 环境，可以先做这三个自检：

```bash
conda activate laborhelper
python -c "import openharness; print('openharness import ok')"
python -c "from openharness.ui import runtime; print('openharness runtime ok')"
python -c "from openharness.engine import stream_events; print('openharness events ok')"
```

只要这三条通过，就说明当前 Python 环境已经能支撑 middlend 进入 `library` 模式。接着再启动后端并观察日志：

- 看到 `oh_local_tools_registered`，说明本地劳动法工具已注册。
- 看到 `oh_library_tool_policy=legal_minimal applied`，说明工具策略已生效。
- 看到 `oh_library_bundle_ready`，说明 OpenHarness runtime、技能目录和 MCP 绑定已完成。
- 看到 `oh_library_submit`，说明中间件已经把当前轮用户输入正式提交给 OpenHarness。

如果这些日志都出现了，而前端仍然异常，再继续排查模型配置、PKULaw MCP 配置或具体工具调用错误。
