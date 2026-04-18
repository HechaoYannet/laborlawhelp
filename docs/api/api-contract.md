# API Contract (v1)

本文件定义 laborlawhelp 前端对接中间件的最小稳定契约。

## 1. Base

- Prefix: `/api/v1`
- Chat transport: `POST` + `text/event-stream`
- Owner strategy (phase-1): 匿名优先，使用 `X-Anonymous-Token`

## 2. Endpoints

### 2.1 创建案件

- Method: `POST`
- Path: `/api/v1/cases`
- Headers:
  - `Content-Type: application/json`
  - `X-Anonymous-Token` (optional)
- Body: `{}`
- 200 response (example):

```json
{
  "case_id": "case_123",
  "owner_type": "anonymous",
  "anonymous_token": "anon_xxx"
}
```

### 2.2 创建会话

- Method: `POST`
- Path: `/api/v1/cases/{case_id}/sessions`
- Headers:
  - `Content-Type: application/json`
  - `X-Anonymous-Token` (optional)
- Body: `{}`
- 200 response (example):

```json
{
  "session_id": "sess_123",
  "anonymous_token": "anon_xxx"
}
```

### 2.3 会话聊天（SSE）

- Method: `POST`
- Path: `/api/v1/sessions/{session_id}/chat`
- Headers:
  - `Content-Type: application/json`
  - `X-Anonymous-Token` or `Authorization`
- Body (example):

```json
{
  "message": "我被口头辞退了，月薪 8000",
  "client_seq": 12,
  "attachments": [
    {
      "id": "att_1",
      "name": "chat.png",
      "url": "https://example.com/chat.png",
      "mime_type": "image/png"
    }
  ]
}
```

- Response: `text/event-stream`

## 3. SSE Events

### 3.1 `message_start`

```json
{
  "message_id": "msg_xxx"
}
```

### 3.2 `content_delta`

```json
{
  "delta": "增量文本",
  "seq": 13
}
```

约束：`seq` 需单调递增，前端应丢弃重复或乱序增量。

### 3.3 `tool_call`

```json
{
  "tool_name": "labor_compensation_calc",
  "args": {}
}
```

### 3.4 `tool_result`

```json
{
  "tool_name": "labor_compensation_calc",
  "result_summary": "已完成赔偿测算"
}
```

### 3.5 `final`

```json
{
  "message_id": "msg_xxx",
  "summary": "结构化总结",
  "references": [
    {
      "title": "劳动合同法第47条",
      "url": "https://example.com/law47",
      "snippet": "经济补偿按工作年限..."
    }
  ],
  "rule_version": "2026.04"
}
```

### 3.6 `message_end`

```json
{
  "message_id": "msg_xxx"
}
```

### 3.7 `error`

```json
{
  "code": "OH_SERVICE_ERROR",
  "message": "服务暂时不可用",
  "retryable": true
}
```
