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
- `uv`
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
NEXT_PUBLIC_APP_URL=http://127.0.0.1:5000
NEXT_PUBLIC_ENABLE_MIDDLEWARE_CHAT=true
NEXT_PUBLIC_MIDDLEND_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_ENABLE_LOCAL_FALLBACK=false
NEXT_PUBLIC_MIDDLEWARE_POLICY_VERSION=

HOSTNAME=127.0.0.1
PORT=5000
```

说明：

- `NEXT_PUBLIC_ENABLE_MIDDLEWARE_CHAT=true`：让咨询页走中间件主链路。
- `NEXT_PUBLIC_ENABLE_LOCAL_FALLBACK=false`：先不要混入本地回退，便于确认真实集成状态。
- `NEXT_PUBLIC_MIDDLEND_BASE_URL` 指向本地后端。

## 3. 后端初始化

进入后端目录：

```bash
cd /home/chen-hao/repositories/laborhelper/laborlawhelp-middlend/backend
```

后端依赖由 `uv` 按 `requirements.txt` 动态安装，不强制要求先手动建 venv。

本地手动验证建议优先使用内存存储 + mock 模式：

```bash
storage_backend=memory \
oh_use_mock=true \
oh_mode=library \
uv run --with-requirements requirements.txt uvicorn app.main:app --host 127.0.0.1 --port 8000
```

说明：

- `storage_backend=memory`：不用 PostgreSQL / Redis，最省事。
- `oh_use_mock=true`：不依赖真实 OpenHarness 服务，也不依赖 DeepSeek / PKULaw 连通性。
- `oh_mode=library`：保留当前运行模式形态，但实际优先走 mock。

如果你已经打开了 `backend/.env`，不用改文件，直接用上面的命令临时覆盖即可。

## 4. 启动前端

新开一个终端，回到前端目录：

```bash
cd /home/chen-hao/repositories/laborhelper/laborlawhelp
corepack pnpm dev
```

成功后你应看到开发服务监听在：

```text
http://127.0.0.1:5000
```

## 5. 手动验证一轮咨询流程

打开浏览器访问：

```text
http://127.0.0.1:5000/consultation
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

## 6. 验证刷新恢复

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

## 7. API 级快速排查

如果页面异常，优先看浏览器网络面板，确认这几个请求是否成功：

1. `POST /api/v1/cases`
2. `POST /api/v1/cases/{case_id}/sessions`
3. `POST /api/v1/sessions/{session_id}/chat/stream`
4. `GET /api/v1/sessions/{session_id}/messages`

当前匿名模式下，前端会自己生成 `X-Anonymous-Token`，所以首轮创建 `case` 不需要等后端额外签发 token。

## 8. 常见问题

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

可以切到真实模式，但前提是：

- `backend/.env` 中的模型 key、PKULaw token、MCP 配置都有效
- 本机能访问模型服务
- 本机的 PKULaw MCP 路径存在

启动方式示例：

```bash
cd /home/chen-hao/repositories/laborhelper/laborlawhelp-middlend/backend
uv run --with-requirements requirements.txt uvicorn app.main:app --host 127.0.0.1 --port 8000
```

真实模式下，建议再问一条需要法律依据的问题，例如：

```text
我被违法解除劳动合同，可以主张哪些赔偿？请给出法律依据。
```

预期会看到：

- `tool_call` / `tool_result`
- `final.references`
- 更明确的 `rule_version`

## 9. 最短验收清单

完成以下 6 项，就算本地 Quick Start 跑通：

1. `corepack pnpm install` 成功
2. 前端 `corepack pnpm dev` 成功
3. 后端 `uvicorn` 成功
4. `/consultation` 页面可以发送消息
5. 页面能收到流式回复
6. 刷新后历史消息仍能恢复
