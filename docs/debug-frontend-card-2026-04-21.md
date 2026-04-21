# 2026-04-21 补充 debug 记录

## 问题复现与修复

### 1. 卡片内容 [object Object] 展示
- 修复：所有卡片内容渲染时，遇到对象类型自动结构化展开，避免直接输出 [object Object]。

### 2. 对话气泡头像重复渲染
- 修复：只渲染最后一条 assistant 消息的头像，避免多头像。

### 3. 卡片自动消失逻辑
- 修复：只展示最后一轮的卡片，用户继续对话后旧卡片自动消失。

---

## 代码变更说明
- 见 consultation-result-cards.tsx、page.tsx

---

## 验证建议
- 继续对话，观察卡片内容、头像、卡片消失是否正常。

---

# 2026-04-21 前端卡片交互 debug 记录

## 问题与修复内容

### 1. 卡片内容异常
- 问题：卡片展示 applicant、respondent、employment、termination 等字段为 [object Object]。
- 修复：完善卡片渲染逻辑，对对象类型字段进行结构化渲染，避免直接输出对象。

### 2. 对话气泡头像异常
- 问题：上一个对话未结束时，产生了新的机器人头像气泡。
- 修复：检查消息流渲染逻辑，确保同一轮对话未结束前不重复渲染新机器人头像。

### 3. 卡片自动消失逻辑
- 检查：确认卡片在对话继续时是否自动消失，若未自动消失则补充逻辑。

---

## 代码变更说明
- 变更时间：2026-04-21
- 变更人：GitHub Copilot
- 涉及文件：
  - src/features/consultation/components/consultation-result-cards.tsx
  - src/app/consultation/page.tsx
  - src/features/consultation/components/lawyer-referral-panel.tsx
- 主要内容：
  - 修复卡片内容结构化渲染
  - 修复对话气泡头像重复渲染
  - 检查/补充卡片自动消失逻辑

---

## 详细修改内容
- 见下方代码 diff 及注释。

---

## 后续验证
- 请重点关注：
  - 卡片内容是否还出现 [object Object]
  - 对话气泡头像是否重复
  - 卡片是否能在对话继续时自动消失

---

# 2026-04-21 Prompt 重复话术 debug 记录

## 问题现象
- 对话开头出现重复或不该对用户可见的内部流程话术，例如“我将按照劳动争议智能分诊工作流为您分析”“首先，我需要加载工作流技能，然后收集更多信息”。

## 根因判断
- 后端 OpenHarness 增强 prompt 强制模型先走 skill 工作流，但没有明确禁止把内部执行过程说给用户。
- 前端流式展示层对这类内部流程话术没有做兜底清洗，因此模型一旦吐出，就会直接展示。

## 修复内容
- 在后端 prompt 中新增约束：禁止向用户暴露技能加载、工作流步骤、工具调用顺序，并禁止重复自我介绍或开场白。
- 在前端会话页新增文本清洗：移除已知内部流程话术，并对连续重复段落做去重。
- 增加后端测试，确保新的 prompt 约束已经注入。

## 涉及文件
- laborlawhelp-middlend/backend/app/adapters/openharness/prompting.py
- laborlawhelp-middlend/backend/tests/test_openharness_client_enrichment.py
- laborlawhelp/src/app/consultation/page.tsx

## 验证建议
- 重新发起“被口头辞退”类咨询，确认首段回答不再出现“加载工作流技能”“收集更多信息”等内部描述。
- 观察流式输出与最终消息，确认相邻重复开场白不会再次展示。

---

