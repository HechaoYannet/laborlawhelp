# 劳动维权助手 - 项目文档

## 项目概述

本项目是一个面向劳动者和中小企业的劳动法咨询与维权平台，通过智能引导帮助用户理清案情、测算赔偿、准备材料。

### 核心功能

1. **AI案情提炼** - 通过对话引导用户描述情况，提取关键法律信息
2. **本地化赔偿计算** - 按西安司法口径测算各项赔偿金额
3. **一键文书生成** - 自动生成仲裁申请书、证据目录、计算明细表、行动清单
4. **繁简分流与律师推荐** - 评估案件复杂度，精准匹配合作律师
5. **HR风险预警** - 为企业提供用工风险检查与合规建议

---

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **状态管理**: Zustand + persist
- **语音识别**: Web Speech API

---

## 目录结构

```
src/
├── app/
│   ├── page.tsx                 # 首页（重定向到咨询页）
│   ├── (home)/page.tsx         # 导航首页
│   ├── consultation/            # 劳动者维权咨询
│   │   └── page.tsx            # 主咨询页面
│   └── hr-risk/                # HR风险预警
│       └── page.tsx            # HR风险检查页面
├── components/ui/               # Shadcn UI 组件库
├── hooks/
│   ├── use-case-store.ts       # 案情状态管理
│   └── use-speech-recognition.ts # 语音识别Hook
└── lib/
    ├── types.ts                 # 核心类型定义
    ├── calculation.ts           # 赔偿计算引擎
    ├── dialogue-flow.ts        # 对话流程引擎
    ├── document-generator.ts    # 文书生成模块
    ├── case-triage.ts          # 繁简分流与律师推荐
    └── hr-risk-check.ts        # HR风险检查模块
```

---

## 核心模块说明

### 1. 案情状态管理 (`use-case-store.ts`)

使用 Zustand 管理全局状态，包含：
- 案情信息 (CaseProfile)
- 时间轴 (Timeline)
- 计算结果 (CalculationResult)
- 生成文书 (Documents)
- 对话消息 (Messages)

### 2. 赔偿计算引擎 (`calculation.ts`)

按西安本地口径计算：
- 违法解除赔偿金 (2N)
- 代通知金
- 未签合同双倍工资
- 工资拖欠
- 加班费
- 未休年假
- 社保欠缴

### 3. 文书生成 (`document-generator.ts`)

生成四类文书：
- 仲裁申请书
- 证据目录
- 赔偿计算明细表
- 维权行动清单

### 4. 繁简分流 (`case-triage.ts`)

评估维度：
- 争议金额
- 证据完整度
- 法律关系复杂度
- 是否涉及工伤
- 是否接近时效

---

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码
- 禁止隐式 `any` 和 `as any`
- 组件使用 'use client' 指令

### Hydration 问题防范

- 严禁在 JSX 中直接使用 Date.now()、Math.random()
- 使用 useEffect + useState 确保客户端渲染

### 语音功能

- 使用 Web Speech API 实现实时语音转文字
- 支持中文识别 (zh-CN)
- 需要用户授权麦克风权限

---

## 运行命令

```bash
# 开发环境
pnpm dev

# 构建
pnpm build

# 生产环境
pnpm start
```

### AI/跨平台开发约束

- 默认使用 `pnpm`，禁止使用 `npm`/`yarn`
- 本地标准 Node 版本为 20 LTS（见仓库 `.nvmrc`）
- Windows 与 WSL 均使用以下命令：`pnpm dev` / `pnpm build` / `pnpm start`
- Coze 环境兼容命令：`pnpm dev:coze` / `pnpm build:coze` / `pnpm start:coze`
- 自定义服务器入口为 `src/server.ts`，不要改为直接 `next dev` 作为默认入口

---

## 注意事项

1. 本平台提供的信息仅供参考，不构成法律意见
2. 赔偿计算结果为系统初步测算，不替代律师复核
3. 仲裁时效为1年，需在时效内提交申请
4. 文书生成为模板填充，需用户根据实际情况修改
