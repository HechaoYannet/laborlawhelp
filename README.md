# 劳动维权助手

面向劳动者与中小企业的劳动法咨询与维权平台。当前版本重点能力：

1. 案情对话采集与结构化提炼
2. 西安口径赔偿测算
3. 文书模板生成（申请书、证据目录、计算清单、行动清单）
4. 案件复杂度评估与律师推荐
5. HR 合规风险检查
6. MCP 法律检索增强（基于 pkulaw-mcp-router）

## 1. 开发者快速接手（5 分钟）

### 1.1 环境要求

1. Node.js 20 LTS（见 .nvmrc）
2. pnpm 9+
3. Windows PowerShell 或 WSL Bash

### 1.2 启动步骤

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

默认访问地址：<http://localhost:5000>

### 1.3 MCP 联调步骤（可选）

```bash
pnpm mcp:inspect
pnpm mcp:serve
```

说明：MCP 相关密钥和参数均为服务端变量，严禁以 NEXT_PUBLIC_ 暴露。

## 2. 核心命令

```bash
# app
pnpm dev
pnpm build
pnpm start

# quality
pnpm ts-check
pnpm lint

# mcp router
pnpm mcp:serve
pnpm mcp:inspect
pnpm mcp:discover

# migration compatibility
pnpm dev:coze
pnpm build:coze
pnpm start:coze
```

## 3. 文档索引

1. docs/architecture.md: 系统分层、调用关系、故障边界
2. docs/mcp-llm-architecture.md: MCP/LLM 文件组织、技术原理、链路说明
3. docs/coze-legacy-and-env.md: 遗留兼容策略与环境变量规范
4. docs/plan.md: 项目坐标系、里程碑、验收标准
5. AGENTS.md / AGENT.md: AI 编程代理接管规范与交接协议

## 4. 当前目录（简版）

```text
src/
  app/
    consultation/page.tsx
    hr-risk/page.tsx
    api/mcp/tools/route.ts
    api/mcp/query/route.ts
  hooks/
    use-case-store.tsx
    use-speech-recognition.ts
  lib/
    calculation.ts
    dialogue-flow.ts
    document-generator.ts
    case-triage.ts
    hr-risk-check.ts
    mcp/
      config.ts
      client.ts
      orchestrator.ts
      types.ts
    security/
      mcp-guard.ts
  server.ts
config/
  pkulaw-mcp-router.toml
docs/
```

## 5. 工程约束（必须遵守）

1. 包管理器只能使用 pnpm。
2. 默认入口必须是 src/server.ts，不要直接改为 next dev 作为标准启动方式。
3. TypeScript 以 strict 心智开发，禁止隐式 any。
4. 前端不得泄露任何 MCP/LLM 密钥。
5. 所有新增能力必须有回退路径（降级到本地规则流程）。

## 6. 合规声明

1. 本平台输出仅供参考，不构成正式法律意见。
2. 赔偿结果为系统测算值，不替代律师复核与仲裁裁判。
3. 用户需在仲裁时效内（通常 1 年）依法主张权利。

```tsx
// src/lib/store.ts
import { create } from 'zustand';

interface Store {
  count: number;
  increment: () => void;
}

export const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### 集成数据库

推荐使用 Prisma 或 Drizzle ORM，在 `src/lib/db.ts` 中配置。

## 技术栈

- **框架**: Next.js 16.1.1 (App Router)
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS v4
- **表单**: React Hook Form + Zod
- **图标**: Lucide React
- **字体**: Geist Sans & Geist Mono
- **包管理器**: pnpm 9+
- **TypeScript**: 5.x

## 参考文档

- [Next.js 官方文档](https://nextjs.org/docs)
- [shadcn/ui 组件文档](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com)

## 重要提示

1. **必须使用 pnpm** 作为包管理器
2. **优先使用 shadcn/ui 组件** 而不是从零开发基础组件
3. **遵循 Next.js App Router 规范**，正确区分服务端/客户端组件
4. **使用 TypeScript** 进行类型安全开发
5. **使用 `@/` 路径别名** 导入模块（已配置）
