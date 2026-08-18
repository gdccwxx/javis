"use client";

import { FormEvent, useState } from "react";

type View = "chat" | "knowledge" | "agents" | "skills" | "traces" | "archive" | "models" | "git";

const nav: { id: View; label: string; icon: string; badge?: string }[] = [
  { id: "chat", label: "大副对话", icon: "◌" },
  { id: "knowledge", label: "知识工作区", icon: "▤" },
  { id: "agents", label: "Agents", icon: "⌁" },
  { id: "skills", label: "Skills", icon: "⌘" },
  { id: "traces", label: "调用追溯", icon: "↯" },
  { id: "archive", label: "会话归档", icon: "◫" },
  { id: "models", label: "模型连接", icon: "◇" },
  { id: "git", label: "Git 变更", icon: "⌘", badge: "3" },
];

const agentCards = [
  ["ORCHESTRATOR", "First Mate / 大副", "读取用户目标与工作区上下文，拆解任务，分派船员，归档结果并生成提交草稿。", "ENABLED", "default-api", "3 skills", "agents/first-mate/agent.md"],
  ["RESEARCH", "Researcher / 研究船员", "检索、交叉验证和整理资料。只可读素材与知识，报告只能写入研究产物目录。", "ENABLED", "reasoning-api", "2 skills", "agents/researcher/agent.md"],
  ["INTERFACE", "Interface worker / 界面船员", "基于 DESIGN.md 规划页面、检查设计令牌，并输出可审阅的原型与实现建议。", "RUNNING", "default-api", "current task: 003", "agents/interface-worker/agent.md"],
  ["FILE", "File worker / 文件船员", "执行格式转换、文本提取与文件结构维护。当前停用，避免在未确认前写入工作区。", "DISABLED", "default-api", "write: outputs/files/**", "agents/file-worker/agent.md"],
];

const skillCards = [
  ["stow-context", "将原始会话、决策、调用事件和恢复指针整理为可提交的工作区草稿。", "first-mate", "input: session + trace", "agents/first-mate/skills/stow-context.md"],
  ["plan-workspace", "根据用户目标、可用 Agent、Skill 和输入文件生成可审阅的任务 DAG 与任务文件。", "first-mate", "output: tasks/*.yaml", "agents/first-mate/skills/plan-workspace.md"],
  ["audit-design-tokens", "扫描页面令牌、主动作数量和可访问性违规项。", "interface-worker", "v1.0", "skills/audit-design-tokens.md"],
  ["trace-review", "聚合任务运行过程，检查输入、输出与文件变更是否可回溯。", "first-mate", "output: knowledge/traces", "skills/trace-review.md"],
];

function Header({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return <header className="pagehead"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="actions">{children}</div></header>;
}

function Status({ value }: { value: string }) { return <span className={`status ${value === "RUNNING" ? "running" : value === "ENABLED" || value === "READY" || value === "COMMITTED" ? "ready" : "off"}`}>{value}</span>; }

function CardGrid({ type }: { type: "agents" | "skills" | "archive" }) {
  const cards = type === "agents" ? agentCards : type === "skills" ? skillCards : [
    ["ACTIVE", "FirstMate desktop redesign", "设计规范重构、原型审阅与调用追溯定义。已生成 1 条决策和 5 条 Trace。", "UNCOMMITTED", "sessions/raw/2026-08-17-desktop-redesign.md", "summary ready", "3 outputs"],
    ["ARCHIVED", "文件优先架构评审", "确认模型、Agent、Skill、知识、会话、任务与产物都以可版本化文件为真实来源。", "COMMITTED", "sessions/raw/2026-08-05-file-first.md", "commit 8f3d1a2", "2 decisions"],
    ["ARCHIVED", "Electron 技术路线", "确认 v1 使用 Electron 壳、React + Next.js 页面、主进程 IPC 与独立 Agent Runtime。", "COMMITTED", "sessions/raw/2026-08-14-electron.md", "commit b6719ce", "1 decision"],
    ["RESTORE", "恢复指针", "下次启动会优先读取当前工作区的未完成任务、未提交 Git 变更和最近上下文摘要。", "DRAFT", "sessions/summaries/current-context.md", "updated now", "workspace state"],
  ];
  return <div className="grid">{cards.map((card) => <article className="card" key={card[1]}><div className="card-top"><span className="kind">{card[0]}</span><Status value={type === "skills" ? "ENABLED" : card[3]} /></div><h3>{card[1]}</h3><p>{card[2]}</p><div className="card-foot"><span className="tag primary">{card[4]}</span><span className="tag">{card[5]}</span><span className="tag path">{card[6]}</span></div></article>)}</div>;
}

export default function Home() {
  const [view, setView] = useState<View>("chat");
  const [platform, setPlatform] = useState<"mac" | "win">("mac");
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);

  function send(event: FormEvent) { event.preventDefault(); if (draft.trim()) { setSent([...sent, draft.trim()]); setDraft(""); } }

  return <div className="fm-app"><div className="proto-title"><div><h2>FirstMate / desktop workspace</h2><p>DESIGN.md v1.0 · Electron · React + Next.js</p></div><div className="platform"><button className={platform === "mac" ? "active" : ""} onClick={() => setPlatform("mac")}>macOS</button><button className={platform === "win" ? "active" : ""} onClick={() => setPlatform("win")}>Windows</button></div></div>
    <div className={`shell ${platform === "win" ? "windows" : ""}`}>
      <header className="appbar"><div className="dots"><i /><i /><i /></div><div className="winmark">▣ FIRSTMATE</div><span className="workspace">~/firstmate-workspace</span><span className="spacer" /><span className="connection"><i />runtime connected</span></header>
      <aside className="sidebar"><button className="new" onClick={() => { setView("chat"); setSent([]); }}>＋ 新建会话</button><nav><span>WORKSPACE</span>{nav.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={view === item.id ? "active" : ""}><b>{item.icon}</b><label>{item.label}</label>{item.badge && <em>{item.badge}</em>}</button>)}<div className="recent"><span>RECENT SESSIONS</span><button>FirstMate desktop redesign<small>刚刚 · 5 个 trace 事件</small></button><button>文件协议评审<small>昨天 · 已提交</small></button><button>参考仓库研究<small>08-05 · 2 个产物</small></button></div></nav></aside>
      <main className="main">
        {view === "chat" && <section className="view chat-view"><Header title="FirstMate desktop redesign" subtitle="sessions/2026-08-17-desktop-redesign.md · context loaded"><button className="btn">查看摘要</button><button className="btn primary">运行任务</button></Header><div className="chat"><div className="date">2026-08-17 / SESSION ACTIVE</div><div className="message user"><div className="bubble">参考统一设计规范重构桌面端原型。重点看 Agent 的调用轨迹、Skill 和 Git 变更是否可追溯。</div><div className="avatar">DC</div></div><div className="message"><div className="avatar">FM</div><div className="bubble"><strong>已创建任务草稿。</strong> 大副会读取设计规范，再交给界面船员产出原型。运行过程和文件变更将写入任务、trace 与输出目录。<div className="run"><header><span>tasks/task-20260817-003.yaml</span><span>RUNNING · 00:42</span></header><p><i>READ</i>读取 <code>DESIGN.md</code><small>0.2s</small></p><p><i className="model">MODEL</i>界面船员生成工作台方案<small>default-api</small></p><p><i className="write">WRITE</i>写入原型草稿<small>outputs/</small></p></div><span className="file">knowledge/decisions/design-system-v1.md</span></div></div><div className="message"><div className="avatar">FM</div><div className="bubble"><strong>设计方向已收敛。</strong><br />界面只使用深色表面、细边框、单一电绿主动作。Agent 的 Plan / Read / Model / Tool / Write / Done 过程会在右侧检查器中持续记录，而不是藏进自然语言回复里。</div></div>{sent.map((item, index) => <div className="message user" key={`${item}-${index}`}><div className="bubble">{item}</div><div className="avatar">DC</div></div>)}</div><form className="composer" onSubmit={send}><div><button type="button">＋</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="描述任务，或拖入工作区文件…" /><button className="send">↑</button></div><small>⌘/Ctrl + Enter 发送 · Shift + Enter 换行 · 所有调用会写入 traces/</small></form></section>}
        {view === "knowledge" && <section className="view"><Header title="知识工作区" subtitle="knowledge/ · Git 文件是唯一真实来源"><button className="btn">查看 diff</button><button className="btn primary">编辑文件</button></Header><div className="knowledge"><aside><input placeholder="筛选文件" /><p>⌄ knowledge</p><p className="indent">⌄ decisions</p><button>◇ design-system-v1.md</button><p className="indent">◇ file-first-architecture.md</p><p className="indent">⌄ traces</p><p className="indent">◇ task-20260817-003.json</p><p className="indent">⌄ summaries</p><p className="indent">◇ desktop-redesign.md</p></aside><article><span className="path">knowledge / decisions / design-system-v1.md</span><h2>统一设计系统决策</h2><small>来源：session 2026-08-17 · 未提交变更 · 关联 trace 5 个</small><div className="callout">结论：FirstMate v1 默认采用深色工程化工作台。电绿色只用于主动作、连接和当前活动状态；所有运行过程通过 trace 文件可追溯。</div><h3>决策依据</h3><ul><li>文件、Git、模型、Skill 与 Agent 调用需要长期高密度审阅，营销化大留白会浪费工作面积。</li><li>细边框和表面阶梯清晰区分文件树、编辑区、调用过程和检查器。</li><li>调用轨迹必须显示 Agent、Skill、模型、时间、输入和输出。</li></ul><span className="file">DESIGN.md</span> <span className="file">outputs/FirstMate_Desktop_Prototype.html</span></article></div></section>}
        {view === "agents" && <section className="view"><Header title="Agents" subtitle="agents/ · 角色、模型、权限、Skill 与运行状态均由文件定义"><button className="btn">校验所有定义</button><button className="btn primary">新建 Agent</button></Header><div className="list"><div className="filter"><input placeholder="搜索名称、模型、权限或文件路径" /><button className="btn">仅启用</button><button className="btn">按状态</button></div><CardGrid type="agents" /></div></section>}
        {view === "skills" && <section className="view"><Header title="Skills" subtitle="agents/*/skills/ · 每个 Skill 都是可编辑、可版本化的 Markdown 文件"><button className="btn">校验定义</button><button className="btn primary">新建 Skill</button></Header><div className="list"><div className="filter"><input placeholder="搜索 Agent、Skill、模型或路径" /><button className="btn">仅启用</button></div><CardGrid type="skills" /></div></section>}
        {view === "traces" && <section className="view"><Header title="调用追溯" subtitle="knowledge/traces/ · 读取、模型、工具、写入和产物均可反查"><button className="btn">导出 Trace</button><button className="btn primary">打开任务</button></Header><div className="list"><div className="metrics"><div><b>5</b><span>TRACE EVENTS</span></div><div><b>13.9s</b><span>ELAPSED</span></div><div><b>3</b><span>OUTPUT FILES</span></div></div><TraceTable /></div></section>}
        {view === "archive" && <section className="view"><Header title="会话归档" subtitle="sessions/ · 原始会话、AI 摘要、决策与恢复指针按文件保存"><button className="btn">筛选日期</button><button className="btn primary">新建会话</button></Header><div className="list"><div className="filter"><input placeholder="搜索会话、结论、文件或 Agent" /><button className="btn">仅有决策</button><button className="btn">未提交</button></div><CardGrid type="archive" /></div></section>}
        {view === "models" && <section className="view"><Header title="模型连接" subtitle="models/ · 只保存 API 定义和凭证引用，不保存模型或密钥"><button className="btn primary">新增模型</button></Header><div className="list"><div className="warning">凭证只存于系统安全存储。页面、trace、会话和 Git 文件不会读取或显示 API 密钥原文。</div><ModelTable /></div></section>}
        {view === "git" && <section className="view"><Header title="Git 变更" subtitle="main · ~/firstmate-workspace · Agent 变更等待确认"><button className="btn">提交历史</button></Header><div className="list"><div className="metrics"><div><b>3</b><span>CHANGED FILES</span></div><div><b className="plus">+116</b><span>ADDITIONS</span></div><div><b className="minus">−18</b><span>DELETIONS</span></div></div><GitTable /><div className="commit"><b>创建本地提交</b><input defaultValue="feat(design): adopt dark agent workspace system" /><footer><span>已选择 3 个文件</span><button className="btn primary">确认提交</button></footer></div></div></section>}
      </main>
      <aside className="inspector"><section><header><span>LIVE TRACE</span><Status value="RUNNING" /></header>{[["Plan · 拆解设计重构任务", "17:42:08 · first-mate · 0.3s", ""], ["Read · DESIGN.md", "17:42:09 · stow-context · 0.2s", ""], ["Model · default-api", "17:42:10 · interface-worker · 12.8s", "model"], ["Write · HTML prototype draft", "17:42:23 · outputs/ · 0.6s", "tool"], ["Done · 写入 Git 草稿", "17:42:24 · 3 files changed", "done"]].map(([title, meta, tone]) => <div className="trace" key={title}><i className={tone} /><b>{title}</b><small>{meta}</small></div>)}</section><section><header><span>ACTIVE CONTEXT</span><span>3 FILES</span></header><p>MD · DESIGN.md</p><p>MD · PRD_FirstMate_Mobile.md</p><p>MD · knowledge/decisions/design-system-v1.md</p></section><section><header><span>GIT STATUS</span><em>UNCOMMITTED</em></header><p className="change">DESIGN.md <b className="plus">+78</b></p><p className="change">decision record <b className="plus">+24</b></p><p className="change">prototype <b className="minus">−12</b></p><button className="btn wide">审阅变更</button></section><section><div className="warning">运行完成后，先审阅文件 diff，再创建 Git 提交。系统不会自动提交。</div></section></aside>
    </div></div>;
}

function ModelTable() { return <table><thead><tr><th>MODEL</th><th>PROTOCOL</th><th>CAPABILITIES</th><th>CREDENTIAL</th><th>STATUS</th><th /></tr></thead><tbody>{[["default-api", "models/default.yaml", "chat · tools", "Keychain / DEFAULT", "READY"], ["reasoning-api", "models/reasoning.yaml", "reasoning · long ctx", "Keychain / REASONING", "READY"], ["coding-api", "models/coding.yaml", "code · tools", "missing", "OFFLINE"]].map((row) => <tr key={row[0]}><td><b>{row[0]}</b><small>{row[1]}</small></td><td>OpenAI-compatible</td><td>{row[2]}</td><td>{row[3]}</td><td><Status value={row[4]} /></td><td><button className="btn">编辑</button></td></tr>)}</tbody></table>; }
function TraceTable() { const rows = [["17:42:08", "PLAN", "first-mate", "session goal → tasks/task-20260817-003.yaml", "0.3s"], ["17:42:09", "READ", "stow-context", "DESIGN.md → context bundle", "0.2s"], ["17:42:10", "MODEL", "interface-worker / default-api", "context bundle → prototype plan", "12.8s"], ["17:42:23", "WRITE", "interface-worker", "prototype plan → outputs/FirstMate_Desktop_Prototype.html", "0.6s"], ["17:42:24", "DONE", "first-mate", "output + diff → knowledge/traces/task-20260817-003.json", "0.0s"]]; return <table><thead><tr><th>TIME</th><th>PHASE</th><th>ACTOR / RESOURCE</th><th>INPUT → OUTPUT</th><th>ELAPSED</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><td>{row[0]}</td><td><span className={`phase ${row[1].toLowerCase()}`}>{row[1]}</span></td><td><b>{row[2]}</b></td><td>{row[3]}</td><td>{row[4]}</td></tr>)}</tbody></table>; }
function GitTable() { return <table><thead><tr><th>FILE</th><th>CHANGE</th><th>TRACE</th><th /></tr></thead><tbody>{[["DESIGN.md", "root design specification", "+78", "−0", "task-20260817-003"], ["knowledge/decisions/design-system-v1.md", "decision record", "+24", "−6", "stow-context"], ["outputs/FirstMate_Desktop_Prototype.html", "interactive prototype", "+14", "−12", "interface-worker"]].map((row) => <tr key={row[0]}><td><b>{row[0]}</b><small>{row[1]}</small></td><td><i className="plus">{row[2]}</i> <i className="minus">{row[3]}</i></td><td>{row[4]}</td><td><button className="btn">查看 diff</button></td></tr>)}</tbody></table>; }
