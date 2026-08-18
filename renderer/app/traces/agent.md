# Page · 调用追溯

## 职责

- 按时间线展示 `knowledge/traces/` 中的调用事件：PLAN / READ / MODEL / TOOL / WRITE / DONE。
- 每个事件可反查输入、输出、耗时与关联文件。

## 归属 Agent

- 记录者：所有 Agent 的调用统一写 `knowledge/traces/<task-id>.json`。

## 交互

- 表格按时间排序；支持导出与打开关联任务。

## 约束

- trace 不可篡改；只允许追加与归档。
