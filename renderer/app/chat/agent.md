# Page · 大副对话

## 职责

- 承载用户与 First Mate / 大副的会话。
- 展示消息流、任务运行卡片、引用来源与输入框。

## 归属 Agent

- 主 Agent：`agents/first-mate/agent.md`
- 会话沉淀：`sessions/raw/<session-id>.md`

## 交互

- 用户提交消息 → 大副读取上下文 → 生成任务草稿 → 写入 `tasks/*.yaml`。
- 运行过程中的 READ / MODEL / WRITE 阶段在消息卡片内展示，同时推送右侧 LIVE TRACE。

## 约束

- 密钥、明文凭证不出现在消息与页面。
- 所有调用写入 `knowledge/traces/`。
