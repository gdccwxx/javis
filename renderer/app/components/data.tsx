import { Status } from "@/app/components/shared";

export function ModelTable() {
  return <table><thead><tr><th>MODEL</th><th>PROTOCOL</th><th>CAPABILITIES</th><th>CREDENTIAL</th><th>STATUS</th><th /></tr></thead><tbody>{[["default-api", "models/default.yaml", "chat · tools", "Keychain / DEFAULT", "READY"], ["reasoning-api", "models/reasoning.yaml", "reasoning · long ctx", "Keychain / REASONING", "READY"], ["coding-api", "models/coding.yaml", "code · tools", "missing", "OFFLINE"]].map((row) => <tr key={row[0]}><td><b>{row[0]}</b><small>{row[1]}</small></td><td>OpenAI-compatible</td><td>{row[2]}</td><td>{row[3]}</td><td><Status value={row[4]} /></td><td><button className="btn">编辑</button></td></tr>)}</tbody></table>;
}

export function TraceTable() {
  const rows = [["17:42:08", "PLAN", "first-mate", "session goal → tasks/task-20260817-003.yaml", "0.3s"], ["17:42:09", "READ", "stow-context", "DESIGN.md → context bundle", "0.2s"], ["17:42:10", "MODEL", "interface-worker / default-api", "context bundle → prototype plan", "12.8s"], ["17:42:23", "WRITE", "interface-worker", "prototype plan → outputs/FirstMate_Desktop_Prototype.html", "0.6s"], ["17:42:24", "DONE", "first-mate", "output + diff → knowledge/traces/task-20260817-003.json", "0.0s"]];
  return <table><thead><tr><th>TIME</th><th>PHASE</th><th>ACTOR / RESOURCE</th><th>INPUT → OUTPUT</th><th>ELAPSED</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><td>{row[0]}</td><td><span className={`phase ${row[1].toLowerCase()}`}>{row[1]}</span></td><td><b>{row[2]}</b></td><td>{row[3]}</td><td>{row[4]}</td></tr>)}</tbody></table>;
}

export function GitTable() {
  return <table><thead><tr><th>FILE</th><th>CHANGE</th><th>TRACE</th><th /></tr></thead><tbody>{[["DESIGN.md", "root design specification", "+78", "−0", "task-20260817-003"], ["knowledge/decisions/design-system-v1.md", "decision record", "+24", "−6", "stow-context"], ["outputs/FirstMate_Desktop_Prototype.html", "interactive prototype", "+14", "−12", "interface-worker"]].map((row) => <tr key={row[0]}><td><b>{row[0]}</b><small>{row[1]}</small></td><td><i className="plus">{row[2]}</i> <i className="minus">{row[3]}</i></td><td>{row[4]}</td><td><button className="btn">查看 diff</button></td></tr>)}</tbody></table>;
}

export function CardGrid({ type }: { type: "agents" | "skills" | "archive" }) {
  const agents = [
    ["ORCHESTRATOR", "First Mate / 大副", "读取用户目标与工作区上下文，拆解任务，分派船员，归档结果并生成提交草稿。", "ENABLED", "default-api", "3 skills", "agents/first-mate/agent.md"],
    ["RESEARCH", "Researcher / 研究船员", "检索、交叉验证和整理资料。只可读素材与知识，报告只能写入研究产物目录。", "ENABLED", "reasoning-api", "2 skills", "agents/researcher/agent.md"],
    ["INTERFACE", "Interface worker / 界面船员", "基于 DESIGN.md 规划页面、检查设计令牌，并输出可审阅的原型与实现建议。", "RUNNING", "default-api", "current task: 003", "agents/interface-worker/agent.md"],
    ["FILE", "File worker / 文件船员", "执行格式转换、文本提取与文件结构维护。当前停用，避免在未确认前写入工作区。", "DISABLED", "default-api", "write: outputs/files/**", "agents/file-worker/agent.md"],
  ];
  const skills = [
    ["stow-context", "将原始会话、决策、调用事件和恢复指针整理为可提交的工作区草稿。", "first-mate", "input: session + trace", "agents/first-mate/skills/stow-context.md"],
    ["plan-workspace", "根据用户目标、可用 Agent、Skill 和输入文件生成可审阅的任务 DAG 与任务文件。", "first-mate", "output: tasks/*.yaml", "agents/first-mate/skills/plan-workspace.md"],
    ["audit-design-tokens", "扫描页面令牌、主动作数量和可访问性违规项。", "interface-worker", "v1.0", "skills/audit-design-tokens.md"],
    ["trace-review", "聚合任务运行过程，检查输入、输出与文件变更是否可回溯。", "first-mate", "output: knowledge/traces", "skills/trace-review.md"],
  ];
  const archive = [
    ["ACTIVE", "FirstMate desktop redesign", "设计规范重构、原型审阅与调用追溯定义。已生成 1 条决策和 5 条 Trace。", "UNCOMMITTED", "sessions/raw/2026-08-17-desktop-redesign.md", "summary ready", "3 outputs"],
    ["ARCHIVED", "文件优先架构评审", "确认模型、Agent、Skill、知识、会话、任务与产物都以可版本化文件为真实来源。", "COMMITTED", "sessions/raw/2026-08-05-file-first.md", "commit 8f3d1a2", "2 decisions"],
    ["ARCHIVED", "Electron 技术路线", "确认 v1 使用 Electron 壳、React + Next.js 页面、主进程 IPC 与独立 Agent Runtime。", "COMMITTED", "sessions/raw/2026-08-14-electron.md", "commit b6719ce", "1 decision"],
    ["RESTORE", "恢复指针", "下次启动会优先读取当前工作区的未完成任务、未提交 Git 变更和最近上下文摘要。", "DRAFT", "sessions/summaries/current-context.md", "updated now", "workspace state"],
  ];
  const cards = type === "agents" ? agents : type === "skills" ? skills : archive;
  return <div className="grid">{cards.map((card) => <article className="card" key={card[1]}><div className="card-top"><span className="kind">{card[0]}</span><Status value={type === "skills" ? "ENABLED" : card[3]} /></div><h3>{card[1]}</h3><p>{card[2]}</p><div className="card-foot"><span className="tag primary">{card[4]}</span><span className="tag">{card[5]}</span><span className="tag path">{card[6]}</span></div></article>)}</div>;
}
