# Claude Code 接手指南

本文件面向 Claude Code 执行场景，目标是让新会话在最短时间进入可执行状态。

## 1. 会话起手动作

1. 先读 `README.md`，确认项目目标与命令入口。
2. 读取 `docs/architecture.md`，建立模块边界认知。
3. 读取 `docs/plan.md`，确认当前里程碑与任务优先级。
4. 读取 `docs/coze-legacy-and-env.md`，避免误用兼容变量。
5. 读取 `AGENTS.md`，遵循仓库统一执行规范。

## 2. 必须遵守的工程约束

1. 包管理器只能使用 pnpm。
2. Node 版本遵循 `.nvmrc`（20 LTS）。
3. 默认运行入口为 `pnpm dev/build/start`。
4. `src/server.ts` 是服务入口，不切回裸 `next dev` 作为默认方案。
5. TypeScript 不引入隐式 any 或 `as any`。

## 3. 执行风格

1. 优先最小充分改动，不做无关重构。
2. 修改实现后，同步更新相关文档。
3. 若发现兼容层逻辑，保持向后兼容但不扩散到新代码。
4. 输出说明需包含：改了什么、为什么改、如何验证。

## 4. 常用验证命令

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm ts-check
```

说明：至少保证 `pnpm build` 通过；若涉及运行时行为变更，额外验证 `pnpm dev`。

## 5. 交接标准

1. 文档与代码一致。
2. 接手者可按 README 在 30 分钟内跑通。
3. 关键改动可在 `docs/plan.md` 找到对应里程碑与状态。
4. 不在会话中留下“仅口头规则”，必须落盘到文档。
