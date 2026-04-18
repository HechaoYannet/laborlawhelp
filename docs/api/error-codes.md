# Error Codes (v1)

本文件定义中间件错误码语义及前端交互策略。

## 1. Standard Mapping

| HTTP | Code | Meaning | Frontend Action |
| --- | --- | --- | --- |
| 400 | BAD_REQUEST | 请求参数不合法 | 提示用户修正输入 |
| 401 | UNAUTHORIZED | 认证无效或过期 | 清理登录态并引导登录 |
| 403 | FORBIDDEN | 无权访问该 case/session | 返回案件选择或重建会话 |
| 409 | SESSION_LOCKED | 同一会话并发冲突 | 提示稍后重试 |
| 410 | ANONYMOUS_SESSION_EXPIRED | 游客会话过期 | 自动重建 case/session 并提示 |
| 429 | RATE_LIMITED | 请求过于频繁 | 指数退避重试（2s/4s） |
| 500 | OH_SERVICE_ERROR | OpenHarness 执行失败 | 友好提示并允许重试 |
| 503 | SERVICE_UNAVAILABLE | 依赖服务暂不可用 | 提示稍后重试 |

## 2. SSE `error` Event

流内错误统一事件格式：

```text
event: error
data: {"code":"OH_SERVICE_ERROR","message":"服务暂时不可用","retryable":true}
```

前端处理建议：

1. 终止当前流并解锁输入状态。
2. 将错误映射为 `code/message/retryable` 存入会话状态。
3. 若 `retryable=true`，显示重试入口。
4. 若开关允许，且满足回退策略，可切换到本地回退模式并显式标注。
