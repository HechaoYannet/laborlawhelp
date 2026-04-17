# AGENTS 指南（仓库执行标准）

本文件用于约束 AI Coding Agent 在本仓库中的行为，目标是让不同工具（Copilot、Claude Code、其他 Agent）在同一规范下无缝衔接。

## 1. 任务目标

1. 保证项目可运行、可构建、可交接。
2. 优先做“最小充分改动”，避免大范围无关重构。
3. 文档、代码、脚本保持一致，不出现“文档与实现脱节”。

## 2. 快速上下文读取顺序

Agent 启动后，建议按顺序读取：

1. `README.md`
2. `docs/architecture.md`
3. `docs/plan.md`
4. `docs/coze-legacy-and-env.md`
5. `CLAUDE.md`（如当前 Agent 由 Claude Code 执行）

## 3. 硬性工程约束

1. 包管理器必须为 pnpm，不使用 npm/yarn。
2. Node 版本以 `.nvmrc` 为准（20 LTS）。
3. 默认入口为 `pnpm dev` / `pnpm build` / `pnpm start`。
4. 服务端入口是 `src/server.ts`，禁止将默认开发入口切回裸 `next dev`。
5. TypeScript 禁止引入隐式 any 与 `as any`。

## 4. 代码修改策略

1. 先定位边界：改动前确认影响范围（UI、状态、领域逻辑、脚本）。
2. 单点改动优先：尽量在单模块闭环完成，不跨层扩散。
3. 保持兼容：迁移期兼容变量可保留，但新逻辑不再绑定 Coze 私有语义。
4. 修改后至少执行一次构建或类型检查。

## 5. 文档更新策略

1. 任何功能或脚本行为变化，必须同步更新对应文档。
2. 优先维护以下文件：
   - `README.md`（接手入口）
   - `docs/architecture.md`（结构与流程）
   - `docs/plan.md`（里程碑与进度）
   - `docs/coze-legacy-and-env.md`（环境治理）
3. 删除过期模板说明与泛化教程，保留对本仓库有执行价值的信息。

## 6. AI 工具协作约定

1. Agent 输出需包含：改了什么、为什么改、如何验证。
2. 涉及运行命令时，默认使用 PowerShell 兼容写法。
3. 若遇到不确定上下文，先补充读取文档再改代码。
4. 若发现现有变更与任务冲突，先说明冲突再继续，避免覆盖他人改动。

## 7. 完成定义（Definition of Done）

1. 文档与代码一致。
2. 关键命令可执行（至少 `pnpm build` 可通过）。
3. 变更说明可被接手人独立复现。
4. 新增规则已落到文档，而非只存在于聊天记录。
