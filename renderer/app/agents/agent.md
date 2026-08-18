# Page · Agents

## 职责

- 列出 `agents/*/agent.md` 定义：角色、模型、权限、Skill、运行状态。
- 支持新建 Agent、校验定义文件。

## 归属 Agent

- 管理对象：`agents/*/agent.md`（每个文件夹一个 Agent）。

## 交互

- 卡片展示 Agent 的默认模型、读写范围、Skill 数量与状态。
- 校验 → 对 YAML/Markdown frontmatter 做 schema 校验，输出诊断。

## 约束

- 权限只增不减需要用户确认；停用状态不可静默恢复。
