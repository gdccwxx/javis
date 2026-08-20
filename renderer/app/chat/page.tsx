"use client";

import { FormEvent, Fragment, useEffect, useRef, useState } from "react";
import { Header } from "@/app/components/shared";

type Run = { id: string; sessionPath: string; taskPath: string; tracePath: string; status: string; agentId?: string };
type Message = { id: string; role: "user" | "assistant"; content: string };
type BriefItem = { id: string; title: string; detail: string; status: string; path: string };
type Brief = { generatedAt: string; decisions: BriefItem[]; completed: BriefItem[]; inProgress: BriefItem[]; next: BriefItem[] };
type RecentSession = { path: string; id: string; title: string; time: string; status: string; agentId: string };
type ModelDefinition = { id: string; configured: boolean };

const emptyBrief: Brief = { generatedAt: "", decisions: [], completed: [], inProgress: [], next: [] };

export default function ChatPage() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [briefOpen, setBriefOpen] = useState(true);
  const [brief, setBrief] = useState<Brief>(emptyBrief);
  const [run, setRun] = useState<Run | null>(null);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [modelId, setModelId] = useState("");
  const [models, setModels] = useState<ModelDefinition[]>([]);
  const [runtimeNotice, setRuntimeNotice] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [materials, setMaterials] = useState<string[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  async function refreshBrief() {
    if (!window.firstmate) return;
    setBrief(await window.firstmate.workspace.brief());
  }
  function notifyWorkspaceChanged() {
    window.dispatchEvent(new Event("firstmate:workspace-changed"));
  }

  function openPendingItem(pending: BriefItem) {
    setBriefOpen(true);
    if (pending.path.startsWith("tasks/") && pending.id.startsWith("task-")) {
      setRun({ id: pending.id, taskPath: pending.path, sessionPath: `sessions/${pending.id}.md`, tracePath: `knowledge/traces/${pending.id}.json`, status: pending.status });
      setRuntimeNotice(`已打开待处理任务。确认后点击“运行任务”执行：${pending.title}`);
      return;
    }
    if (pending.path.startsWith("knowledge/decisions/")) {
      setRuntimeNotice(`已定位到待决策事项“${pending.title}”。请在回来后简报的“待我决定”分组中确认或暂缓。`);
      return;
    }
    setRuntimeNotice("待处理事项缺少可执行的本地路径，请在调用追溯中检查。");
  }

  function consumeStoredPending() {
    const rawPending = window.localStorage.getItem("firstmate:pending-item");
    if (!rawPending) return;
    window.localStorage.removeItem("firstmate:pending-item");
    try {
      openPendingItem(JSON.parse(rawPending) as BriefItem);
    } catch {
      setRuntimeNotice("待处理事项无法读取，请在调用追溯中检查对应文件。");
    }
  }
  async function openSession(session: RecentSession) {
    if (!window.firstmate) return;
    try {
      const source = await window.firstmate.workspace.read(session.path);
      const turns = parseSessionTurns(source);
      const taskPath = `tasks/${session.id}.yaml`;
      const taskSource = await window.firstmate.workspace.read(taskPath).catch(() => "");
      const status = taskSource.match(/^status:\s*(.+)$/m)?.[1]?.trim() ?? "unknown";
      const agentId = taskSource.match(/^agent:\s*(.+)$/m)?.[1]?.trim() ?? "first-mate";
      setMessages(turns);
      setRun({ id: session.id, sessionPath: session.path, taskPath, tracePath: `knowledge/traces/${session.id}.json`, status, agentId });
      setBriefOpen(false);
      setRuntimeNotice(`已恢复会话：${session.id}。`);
    } catch (error) {
      setRuntimeNotice(error instanceof Error ? `恢复会话失败：${error.message}` : "恢复会话失败。");
    }
  }
  function consumeStoredSession() {
    const rawSession = window.localStorage.getItem("firstmate:open-session");
    if (!rawSession) return;
    window.localStorage.removeItem("firstmate:open-session");
    try {
      void openSession(JSON.parse(rawSession) as RecentSession);
    } catch {
      setRuntimeNotice("会话引用无法读取。");
    }
  }
  function startNewConversation() {
    setMessages([]);
    setRun(null);
    setDraft("");
    setRuntimeNotice("已新建会话。输入任务后会在本地工作区创建会话、任务和调用记录。");
    setBriefOpen(false);
  }
  function consumeNewConversation() {
    if (window.localStorage.getItem("firstmate:new-conversation") !== "true") return;
    window.localStorage.removeItem("firstmate:new-conversation");
    startNewConversation();
  }

  useEffect(() => {
    void window.firstmate?.workspace.initialize().then(async () => {
      setWorkspaceReady(true);
      await refreshBrief();
      consumeStoredPending();
      consumeStoredSession();
      consumeNewConversation();
    });
    void window.firstmate?.models.list().then((items) => {
      setModels(items);
      setModelId(items.find((item) => item.configured)?.id ?? items[0]?.id ?? "");
    });
  }, []);
  useEffect(() => {
    const handleOpenPending = (event: Event) => {
      const pending = (event as CustomEvent<BriefItem>).detail;
      if (pending) openPendingItem(pending);
    };
    window.addEventListener("firstmate:open-pending", handleOpenPending);
    return () => window.removeEventListener("firstmate:open-pending", handleOpenPending);
  }, []);
  useEffect(() => {
    const handleOpenSession = (event: Event) => {
      const session = (event as CustomEvent<RecentSession>).detail;
      if (session) void openSession(session);
    };
    window.addEventListener("firstmate:open-session", handleOpenSession);
    return () => window.removeEventListener("firstmate:open-session", handleOpenSession);
  }, []);
  useEffect(() => {
    window.addEventListener("firstmate:new-conversation", startNewConversation);
    return () => window.removeEventListener("firstmate:new-conversation", startNewConversation);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      consumeStoredPending();
      consumeStoredSession();
      consumeNewConversation();
    }, 250);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [messages, runtimeNotice, run]);
  async function typewrite(id: string, content: string) {
    setMessages((items) => [...items, { id, role: "assistant", content: "" }]);
    const characters = Array.from(content);
    for (let index = 0; index < characters.length; index += 3) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 16));
      const chunk = characters.slice(index, index + 3).join("");
      setMessages((items) => items.map((item) => item.id === id ? { ...item, content: item.content + chunk } : item));
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const content = `${draft.trim()}${materials.length ? `\n\n已附加素材：\n${materials.map((path) => `- ${path}`).join("\n")}` : ""}`;
    if (!content || !window.firstmate || isSending) return;
    setIsSending(true);
    setMessages((items) => [...items, { id: `user-${Date.now()}`, role: "user", content }]);
    setDraft("");
    setMaterials([]);
    setRuntimeNotice("");
    try {
      const created = await window.firstmate.conversation.create(content, run?.id);
      setRun(created);
      await refreshBrief();
      notifyWorkspaceChanged();
      await runWithModel(created);
    } finally { setIsSending(false); }
  }
  async function importMaterials() {
    if (!window.firstmate || isSending) return;
    try {
      const imported = await window.firstmate.workspace.importMaterials();
      if (imported.length === 0) return;
      setMaterials((items) => [...items, ...imported]);
      setRuntimeNotice(`已导入 ${imported.length} 个素材文件。`);
    } catch (error) {
      setRuntimeNotice(error instanceof Error ? `导入素材失败：${error.message}` : "导入素材失败。");
    }
  }

  async function resolveDecision(item: BriefItem, choice: "确认并继续" | "暂不决定") {
    if (!window.firstmate) return;
    if (choice === "暂不决定") { setRuntimeNotice("该决策会保持打开，直到你确认处理。"); return; }
    try {
      await window.firstmate.decisions.resolve(item.id, choice);
      await refreshBrief();
    } catch (error) { setRuntimeNotice(error instanceof Error ? error.message : "写入决策失败"); }
  }
  async function runWithModel(task = run) {
    if (!task || !window.firstmate) { setRuntimeNotice("请先发送一条任务消息。"); return; }
    const models = await window.firstmate.models.list();
    const selectedModel = modelId || models.find((item) => item.configured)?.id || models[0]?.id;
    if (!selectedModel) { setRuntimeNotice("请先在模型连接页保存一个模型和 API Key。"); return; }
    setModelId(selectedModel);
    setRun({ ...task, status: "running" });
    try {
      const result = await window.firstmate.runtime.runTask(task.id, selectedModel);
      setRun((current) => current?.id === task.id ? { ...current, status: result.status } : current);
      await refreshBrief();
      notifyWorkspaceChanged();
      if (result.status === "completed") {
        await typewrite(`assistant-${task.id}`, result.output || "模型未返回文本结果。");
        setRuntimeNotice(`模型结果已写入 ${result.outputPath}`);
        return;
      }
      setRuntimeNotice("模型凭证未配置，任务保持等待状态。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "模型执行失败";
      setRun((current) => current?.id === task.id ? { ...current, status: "failed" } : current);
      await refreshBrief();
      notifyWorkspaceChanged();
      setRuntimeNotice(message.includes("insufficient_balance") || message.includes("402") ? "MiniMax 已收到请求，但账户余额不足（错误 1008）。充值或更换可用 API Key 后重试。" : message);
    }
  }

  return <>
    <Header title="大副对话" subtitle={workspaceReady ? "javis-wiki · 已从工作区恢复当前上下文" : "等待 Electron 工作区连接"}>
      <button className="btn" onClick={() => setBriefOpen((value) => !value)}>{briefOpen ? "收起简报" : "查看简报"}</button><select className="model-picker" value={modelId} onChange={(event) => setModelId(event.target.value)} aria-label="选择执行模型">{models.length === 0 ? <option value="">未配置模型</option> : models.map((model) => <option key={model.id} value={model.id}>{model.id}{model.configured ? "" : "（缺少凭证）"}</option>)}</select><button className="btn primary" onClick={() => void runWithModel()} disabled={!run || run.status === "running"}>{run?.status === "running" ? "正在运行" : "运行任务"}</button>
    </Header>
    <div className="chat" ref={chatRef}><div className="date">{brief.generatedAt ? `${new Date(brief.generatedAt).toLocaleDateString()} / WORKSPACE BRIEF` : "WORKSPACE BRIEF"}</div>
      {briefOpen && <section className="brief" aria-label="回来后简报"><header><b>回来后简报</b><span>当前工作区快照</span></header><div className="brief-grid">
        <BriefGroup label="待我决定" items={brief.decisions} empty="当前没有需要你决定的事项" action={(item) => <div className="decision"><b>需要你的确认</b><small>{item.path}</small><div><button onClick={() => void resolveDecision(item, "确认并继续")}>确认并继续</button><button onClick={() => void resolveDecision(item, "暂不决定")}>暂不决定</button></div></div>} />
        <BriefGroup label="最近完成" items={brief.completed} empty="当前没有新的完成事项" />
        <BriefGroup label="进行中" items={brief.inProgress} empty="当前没有进行中的工作" />
        <BriefGroup label="下一步" items={brief.next} empty="当前没有排队或阻塞工作" />
      </div></section>}
      {messages.length === 0 && <div className="message"><div className="avatar">FM</div><div className="bubble"><strong>工作区已连接。</strong> 发送任务后，我会把会话、任务、知识和 Trace 写入本地工作区。<span className="file">sessions/ · tasks/ · knowledge/ · outputs/</span></div></div>}
      {messages.map((message) => message.role === "user"
        ? <div className="message user" key={message.id}><div className="bubble">{message.content}</div><div className="avatar">DC</div></div>
        : <div className="message" key={message.id}><div className="avatar">FM</div><div className="bubble markdown-message"><MarkdownMessage content={message.content} /></div></div>)}
      {runtimeNotice && <div className="runtime-notice">{runtimeNotice}</div>}
      {run && <div className="message"><div className="avatar">FM</div><div className="bubble"><strong>{run.status === "completed" ? "任务已完成。" : run.status === "failed" ? "模型执行失败。" : run.status === "waiting_credentials" ? "任务等待模型凭证。" : run.status === "running" ? "任务正在运行。" : "任务草稿已创建，等待执行。"}</strong><div className="agent-route"><span>大副</span><i>→</i><span>{run.agentId === "journal" ? "日记智能体" : run.agentId || "待读取智能体"}</span><small>{run.agentId ?? "智能体信息将在读取任务文件后显示"}</small></div><div className="run"><header><span>{run.taskPath}</span><span>{taskStatusText(run.status)}</span></header><p><i>规划</i>创建会话与任务定义<small>{run.sessionPath}</small></p><p><i className={run.status === "completed" ? "write" : ""}>{run.status === "completed" ? "写入" : "追溯"}</i>{run.status === "completed" ? "结果与知识已写入" : "任务状态已写入追溯记录"}<small>{run.tracePath}</small></p></div><span className="file">{run.status === "completed" ? "结果、知识摘要与追溯记录已保存到本地工作区。" : run.status === "failed" ? "失败原因已写入调用追溯中。" : run.status === "waiting_credentials" ? "请在“模型连接”配置可用的模型凭证后重试。" : run.status === "running" ? "模型调用进行中，完成后会自动写入结果和知识摘要。" : "任务已落盘；选择“运行任务”后才会执行模型调用。"}</span></div></div>}
    </div>
    <form className="composer" onSubmit={send}>{materials.length > 0 && <div className="material-chips">{materials.map((path) => <span key={path}>{path}<button type="button" onClick={() => setMaterials((items) => items.filter((item) => item !== path))} aria-label={`移除 ${path}`}>×</button></span>)}</div>}<div className="compose-line"><button type="button" className="icon-btn" aria-label="添加文件" disabled={isSending} onClick={() => void importMaterials()}>＋</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={isSending ? "正在生成回复…" : "描述任务，或拖入工作区文件…"} disabled={isSending} /><button className="send" aria-label="发送" disabled={isSending}>{isSending ? "…" : "↑"}</button></div><small className="compose-help">{isSending ? "正在生成回复，完成后才能发送下一条" : "⌘/Ctrl + Enter 发送 · Shift + Enter 换行 · 所有调用会写入追溯记录"}</small></form>
  </>;
}

function parseSessionTurns(source: string): Message[] {
  const lines = source.split(/\r?\n/);
  const messages: Message[] = [];
  let heading = "";
  let buffer: string[] = [];
  const flush = () => {
    const content = buffer.join("\n").trim();
    if (!content) return;
    if (heading.startsWith("用户消息")) messages.push({ id: `user-${messages.length}`, role: "user", content });
    if (heading.startsWith("First Mate 输出")) messages.push({ id: `assistant-${messages.length}`, role: "assistant", content });
  };
  for (const line of lines) {
    const nextHeading = line.match(/^##\s+(.+)$/)?.[1];
    if (nextHeading) {
      flush();
      heading = nextHeading;
      buffer = [];
      continue;
    }
    if (heading.startsWith("用户消息") || heading.startsWith("First Mate 输出")) buffer.push(line);
  }
  flush();
  return messages;
}

function BriefGroup({ label, items, empty, action }: { label: string; items: BriefItem[]; empty: string; action?: (item: BriefItem) => React.ReactNode }) {
  return <article><label>{label} · {items.length}</label>{items.length === 0 ? <><strong>{empty}</strong><p>该分组由工作区任务、决策和 Trace 文件聚合生成。</p></> : items.slice(0, 2).map((item) => <div key={item.id} className="brief-item"><strong>{item.title}</strong><p>{item.detail}</p><small>{item.path} · {item.status}</small>{action?.(item)}</div>)}</article>;
}

function InlineMarkdown({ value }: { value: string }) {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{parts.map((part, index) => part.startsWith("**") && part.endsWith("**")
    ? <strong key={index}>{part.slice(2, -2)}</strong>
    : part.startsWith("`") && part.endsWith("`")
      ? <code key={index}>{part.slice(1, -1)}</code>
      : <Fragment key={index}>{part}</Fragment>)}</>;
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) { index += 1; continue; }
    if (line.startsWith("```")) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? "").startsWith("```")) { code.push(lines[index] ?? ""); index += 1; }
      nodes.push(<pre className="message-code" key={`code-${index}`}>{code.join("\n")}</pre>);
      index += 1;
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Tag = `h${heading[1].length + 2}` as "h3" | "h4" | "h5";
      nodes.push(<Tag key={`heading-${index}`}><InlineMarkdown value={heading[2]} /></Tag>);
      index += 1;
      continue;
    }
    if (/^[-*_]{3,}\s*$/.test(line)) { nodes.push(<hr key={`rule-${index}`} />); index += 1; continue; }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index] ?? "")) { items.push((lines[index] ?? "").replace(/^[-*]\s+/, "")); index += 1; }
      nodes.push(<ul key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}><InlineMarkdown value={item} /></li>)}</ul>);
      continue;
    }
    const tags = line.match(/#[\p{L}\p{N}_-]+/gu);
    if (tags?.length) {
      const label = line.replace(/#[\p{L}\p{N}_-]+/gu, "").replace(/[*_：:\s]+/g, " ").trim() || "标签";
      nodes.push(<div className="message-tags" key={`tags-${index}`}><span>{label}</span>{tags.map((tag) => <b key={tag}>{tag}</b>)}</div>);
      index += 1;
      continue;
    }
    const tableDivider = lines[index + 1] ?? "";
    if (line.includes("|") && /^\s*\|?[\s:|-]+\|[\s:|-]+/.test(tableDivider)) {
      const headers = splitTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && (lines[index] ?? "").includes("|") && (lines[index] ?? "").trim()) {
        rows.push(splitTableRow(lines[index] ?? ""));
        index += 1;
      }
      nodes.push(<div className="message-table-wrap" key={`table-${index}`}><table className="message-table"><thead><tr>{headers.map((header, headerIndex) => <th key={headerIndex}><InlineMarkdown value={header} /></th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((_, cellIndex) => <td key={cellIndex}><InlineMarkdown value={row[cellIndex] ?? ""} /></td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    nodes.push(<p key={`paragraph-${index}`}><InlineMarkdown value={line} /></p>);
    index += 1;
  }
  return <>{nodes}</>;
}

function splitTableRow(line: string) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function taskStatusText(status: string) {
  const labels: Record<string, string> = { queued: "待运行", running: "运行中", waiting_credentials: "缺少凭证", waiting_input: "等待补充", completed: "已完成", failed: "失败", cancelled: "已取消" };
  return labels[status] ?? status;
}
