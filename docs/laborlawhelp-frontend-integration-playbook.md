# laborlawhelp 前端对接改造指南（面向中间件 + OpenHarness）

## 1. 文档目的
本指南用于把 laborlawhelp 前端从“本地规则驱动”迁移为“中间件 SSE 驱动”，并保持当前 UI 交互体验不倒退。

目标读者：
- 前端开发（主）
- 联调开发（前后端协同）
- 测试同学（接口与流式验收）

如果你当前目标是“先把环境配起来并手动跑通一轮流程”，优先看 [docs/quick-start.md](./quick-start.md)。

---

## 2. 现状与目标

## 2.1 前端现状（来自 laborlawhelp 仓库）
当前咨询链路已进入“中间件唯一主路径”阶段：
- 已支持 `create case -> create session -> chat SSE` 的主链路。
- 已接入 `message_start/content_delta/tool_call/tool_result/final/message_end/error` 事件消费。
- 已支持前端本地自举匿名 token，并在刷新后恢复匿名 session 与消息历史。

当前仍需收口项：
- 继续将页面内网络/事件映射逻辑下沉到 feature API 层。
- 将页面内会话恢复与 SSE 映射进一步下沉到 feature / adapter 层。
- 错误码映射与重试策略按 `docs/api/error-codes.md` 进一步细化。

## 2.2 迁移目标
将咨询主链路改为：
1. 先创建 case
2. 再创建 session
3. 最后调用 `POST /sessions/{session_id}/chat/stream` 消费 SSE

即：
- 前端负责输入、展示、状态机。
- 后端负责推理、工具调用、摘要、引用。
- 生产路径不自动切换本地回退回复。

---

## 3. 对接边界与契约
本项目后端契约以以下文档为准：
- `docs/api/api-contract.md`
- `docs/api/error-codes.md`

关键接口顺序：
1. `POST /api/v1/cases`
2. `POST /api/v1/cases/{case_id}/sessions`
3. `POST /api/v1/sessions/{session_id}/chat/stream`（SSE）
4. `GET /api/v1/sessions/{session_id}/messages`（刷新恢复）

核心 SSE 事件：
- `message_start`
- `content_delta`
- `tool_call`
- `tool_result`
- `final`
- `message_end`
- `error`

`tool_result` 扩展字段（可选）：
- `card_type`
- `card_title`
- `card_payload`
- `card_actions`

说明：前端必须忽略未知事件与未知字段，确保协议向前兼容。

---

## 4. 前端状态模型改造（必须）
`use-case-store.tsx` 已有会话域状态（含 `caseId/sessionId/streamSeq/status/mode`），建议继续向下述目标模型靠拢，避免状态散落在页面层。

## 4.1 建议新增状态
```ts
interface BackendSessionState {
  owner: {
    owner_type: 'anonymous' | 'user'
    anonymous_token?: string
    access_token?: string
    refresh_token?: string
  }
  case_id?: string
  session_id?: string
  session_status?: 'active' | 'ended' | 'expired'
  current_message_id?: string
  trace_id?: string
  is_streaming: boolean
  last_seq: number
  last_error?: {
    code: string
    message: string
    retryable: boolean
  }
  final_payload?: {
    summary?: string
    references?: Array<{ title?: string; url?: string; snippet?: string }>
    rule_version?: string
    finish_reason?: string
  }
}
```

## 4.2 建议新增 action
```ts
setBackendOwner(...)
setCaseSession(caseId: string, sessionId: string)
ensureAnonymousOwnerToken(...)
startStreaming(messageId: string)
appendDelta(seq: number, delta: string)
setToolStatus(...)
setFinalPayload(...)
restoreMessages(...)
endStreaming()
setStreamError(...)
resetBackendSession()
```

---

## 5. 目录与模块拆分建议
当前中间件调用已落在 `features/consultation/services/middleware-api.ts`，建议按下述结构继续拆分，降低 `consultation/page.tsx` 复杂度：

```text
src/
  features/
    consultation/
      api/
        client.ts                 # 通用 request 封装
        chat-stream.ts            # SSE 解析器
        endpoints.ts              # cases/sessions/chat 调用
      services/
        consultation-profile.ts   # 已有，继续保留
      adapters/
        sse-event-mapper.ts       # SSE 事件 -> store action
```

说明：
- `page.tsx` 只保留交互与渲染。
- API 调用与 SSE 解析下沉到 `features/consultation/api/*`。

---

## 6. 网络层实现建议

## 6.1 环境变量
新增并约定：
- `NEXT_PUBLIC_MIDDLEND_BASE_URL`

示例：
```env
NEXT_PUBLIC_MIDDLEND_BASE_URL=http://localhost:8000
```

兼容说明（迁移窗口内）：
- 旧变量 `NEXT_PUBLIC_MIDDLEWARE_API_BASE_URL` 作为 fallback 读取，后续里程碑移除。

不要暴露：
- JWT secret
- 服务端私钥
- OpenHarness key

## 6.2 通用请求封装
建议提供：
- 首次进入页面时自动生成匿名 token（如 `anon-<uuid>`）并持久化
- 自动附加 `X-Anonymous-Token` 或 `Authorization`
- 统一错误解析（映射到 `code/message/retryable`）
- 自动透传 `X-Trace-Id`（如存在）

---

## 7. SSE 解析器（正式版协议实现）

## 7.1 行为要求
1. 使用 `fetch + ReadableStream`（POST），不使用 `EventSource`。
2. 以 `\n\n` 作为帧边界解析 SSE。
3. 使用 `TextDecoder(stream:true)` 处理 UTF-8 分片，避免中文截断乱码。
4. 对 `content_delta.seq` 做单调校验，丢弃重复或倒序分片。
5. 忽略未知事件和未知字段，禁止因扩展字段导致整流失败。
6. 以 `message_end` 作为当前 assistant 消息完成信号；`final` 与 `error` 不能替代 `message_end`。
7. 若收到 `error`，应保留当前消息与轨迹并进入可重试状态，而不是抛弃已到达增量内容。

## 7.2 建议骨架
```ts
export async function streamChat(
  args: {
    baseUrl: string
    sessionId: string
    payload: {
      message: string
      client_seq: number
      attachments?: Array<{ id: string; name: string; url: string; mime_type: string }>
    }
    headers: Record<string, string>
    onEvent: (event: string, data: any) => void
  }
) {
  const res = await fetch(`${args.baseUrl}/api/v1/sessions/${args.sessionId}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...args.headers,
    },
    body: JSON.stringify(args.payload),
  })

  if (!res.ok || !res.body) {
    throw new Error(`chat request failed: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n\n')
    buffer = frames.pop() || ''

    for (const frame of frames) {
      const lines = frame.split('\n')
      const eventLine = lines.find((l) => l.startsWith('event:'))
      const dataLine = lines.find((l) => l.startsWith('data:'))
      if (!eventLine || !dataLine) continue

      const event = eventLine.slice(6).trim()
      const raw = dataLine.slice(5).trim()

      try {
        const data = JSON.parse(raw)
        args.onEvent(event, data)
      } catch {
        // 非法 data 跳过，不中断整流
      }
    }
  }
}
```

---

## 8. consultation 页面改造点（按函数级别）

## 8.1 需要替换的现有逻辑
在 laborlawhelp 前端中，以下逻辑应改为真实 SSE 驱动：
1. `getAssistantResponse()`
2. `pendingResponse` 打字机 `useEffect`
3. `handleSend` 中直接等待本地 response 的路径

## 8.2 新的发送流程
`handleSend` 应改为：
1. 前端先 `addMessage(user)`。
2. 若无 `case_id`：创建 case。
3. 若无 `session_id`：创建 session。
4. 发送 chat stream 请求。
5. 按事件更新 store 与 UI。
6. 页面刷新时优先通过 `session_id + anonymous_token` 调 `GET /sessions/{session_id}/messages` 恢复会话。

## 8.3 事件到 UI 的映射建议
- `message_start`：创建 assistant 占位消息并记录 `message_id/trace_id`。
- `content_delta`：按 `seq` 追加文本到 assistant 消息。
- `tool_call`：显示“处理中”状态条。
- `tool_result`：更新工具状态摘要；若存在 `card_type/card_payload`，在消息流中渲染结构化结果卡。
- `final`：更新右侧会话总结、引用信息、规则版本、完成原因。
- `error`：展示错误提示与重试按钮，同时保留已接收内容。
- `message_end`：结束 loading，允许下次输入（流收尾唯一信号）。

## 8.4 匿名 owner 策略
- 当前后端匿名模式要求 `X-Anonymous-Token`。
- 前端首进页面时应本地生成匿名 token，而不是等待后端签发。
- token、`case_id`、`session_id`、`stream_seq` 应一并持久化，避免刷新后丢失 owner 归属。

---

## 9. 正式版链路约束（中间件唯一）
1. `handleSend` 必须走 `cases -> sessions -> chat/stream` 的 SSE 流程。
2. 生产路径禁止自动拼接本地规则回复作为失败兜底。
3. 本地模块（`calculation/dialogue-flow/document-generator/case-triage`）仅用于离线开发验证。
4. 中间件错误场景按 `error` 事件和 `retryable` 提示用户重试。

---

## 10. 错误码与前端交互策略
参考 `docs/api/error-codes.md`，建议统一处理：

- `BAD_REQUEST`：提示用户修正输入。
- `UNAUTHORIZED`：清理 token 并引导登录。
- `FORBIDDEN`：提示无权访问，返回案件选择。
- `SESSION_LOCKED`：提示稍后重试。
- `ANONYMOUS_SESSION_EXPIRED`：创建新会话并提示用户。
- `RATE_LIMITED`：退避重试（如 2s/4s）。
- `OH_SERVICE_ERROR`：友好错误文案 + 重试。

---

## 11. 分步实施计划（建议 3 次 PR）

### PR-1：打底能力
- 新增 API 客户端与 SSE 解析器。
- `use-case-store` 增加 case/session/stream 状态。
- 不改 UI 展示，仅接入调试日志。

### PR-2：主链路切换
- `consultation/page.tsx` 切换到真实 cases/sessions/chat/stream。
- 接入全部 SSE 事件映射。
- 保留本地模块仅用于离线开发验证，不进入生产自动回退路径。

### PR-3：体验收口
- 右侧摘要/引用/流程状态改为 `final` 事件驱动。
- 完善错误态与重试。
- 增加 e2e 场景与联调验收文档。

---

## 12. 联调验收清单

## 12.1 功能验收
1. 首次发送时自动完成 case + session 创建。
2. 聊天请求使用 POST 并成功消费 SSE。
3. `content_delta` 文本连续、无乱序。
4. `final` 信息可更新到会话摘要区域。
5. `message_end` 后输入框恢复可用。
6. `tool_result` 的 `card_*` 字段可驱动要素卡/测算卡/文书卡/律师卡渲染。

## 12.2 异常验收
1. 模拟 409：前端能提示并重试。
2. 模拟 410：前端能重建会话。
3. 模拟 429：前端有退避策略。
4. 模拟 500：前端展示友好错误，不崩溃。

## 12.3 质量验收
1. `pnpm build` 通过。
2. `pnpm lint` 通过。
3. `pnpm ts-check` 通过。

---

## 13. 与当前中间件文档的关系
建议阅读顺序：
1. `docs/api/api-contract.md`
2. `docs/api/error-codes.md`
3. `docs/guide/frontend-integration.md`
4. 本文档（仓库定制改造手册）

本文件关注“如何改 laborlawhelp 前端代码”；
`frontend-integration.md` 关注“通用前端对接原则”。
