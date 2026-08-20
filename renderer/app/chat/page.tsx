"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Header } from "@/app/components/shared";

type Run = { id: string; sessionPath: string; taskPath: string; tracePath: string; status: string };
type Message = { id: string; role: "user" | "assistant"; content: string };
type BriefItem = { id: string; title: string; detail: string; status: string; path: string };
type Brief = { generatedAt: string; decisions: BriefItem[]; completed: BriefItem[]; inProgress: BriefItem[]; next: BriefItem[] };
type RecentSession = { path: string; id: string; time: string };

const emptyBrief: Brief = { generatedAt: "", decisions: [], completed: [], inProgress: [], next: [] };

export default function ChatPage() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [briefOpen, setBriefOpen] = useState(true);
  const [brief, setBrief] = useState<Brief>(emptyBrief);
  const [run, setRun] = useState<Run | null>(null);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [modelId, setModelId] = useState("");
  const [runtimeNotice, setRuntimeNotice] = useState("");
  const [isSending, setIsSending] = useState(false);
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
      const userMessage = source.match(/## 用户消息\s*\n+([\s\S]*?)(?:\n## |$)/)?.[1]?.trim() ?? "";
      const taskPath = `tasks/${session.id}.yaml`;
      const outputPath = `outputs/${session.id}/result.md`;
      const taskSource = await window.firstmate.workspace.read(taskPath).catch(() => "");
      const status = taskSource.match(/^status:\s*(.+)$/m)?.[1]?.trim() ?? "unknown";
      const outputSource = status === "completed" ? await window.firstmate.workspace.read(outputPath).catch(() => "") : "";
      const assistantMessage = outputSource.replace(/^#.*?\n+/s, "").trim();
      setMessages([
        ...(userMessage ? [{ id: `session-user-${session.id}`, role: "user" as const, content: userMessage }] : []),
        ...(assistantMessage ? [{ id: `session-assistant-${session.id}`, role: "assistant" as const, content: assistantMessage }] : []),
      ]);
      setRun({ id: session.id, sessionPath: session.path, taskPath, tracePath: `knowledge/traces/${session.id}.json`, status });
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

  useEffect(() => {
    void window.firstmate?.workspace.initialize().then(async () => {
      setWorkspaceReady(true);
      await refreshBrief();
      consumeStoredPending();
      consumeStoredSession();
    });
    void window.firstmate?.models.list().then((models) => setModelId(models.find((item) => item.configured)?.id ?? models[0]?.id ?? ""));
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
    const timer = window.setInterval(() => {
      consumeStoredPending();
      consumeStoredSession();
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
    const content = draft.trim();
    if (!content || !window.firstmate || isSending) return;
    setIsSending(true);
    setMessages((items) => [...items, { id: `user-${Date.now()}`, role: "user", content }]);
    setDraft("");
    setRuntimeNotice("");
    try {
      const created = await window.firstmate.conversation.create(content);
      setRun(created);
      await refreshBrief();
      notifyWorkspaceChanged();
      await runWithModel(created);
    } finally { setIsSending(false); }
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
      <button className="btn" onClick={() => setBriefOpen((value) => !value)}>{briefOpen ? "收起简报" : "查看简报"}</button><button className="btn primary" onClick={() => void runWithModel()} disabled={!run || run.status === "running"}>{run?.status === "running" ? "正在运行" : "运行任务"}</button>
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
        : <div className="message" key={message.id}><div className="avatar">FM</div><div className="bubble">{message.content}</div></div>)}
      {runtimeNotice && <div className="runtime-notice">{runtimeNotice}</div>}
      {run && <div className="message"><div className="avatar">FM</div><div className="bubble"><strong>{run.status === "completed" ? "任务已完成。" : run.status === "failed" ? "模型执行失败。" : run.status === "waiting_credentials" ? "任务等待模型凭证。" : run.status === "running" ? "任务正在运行。" : "任务草稿已创建，等待执行。"}</strong><div className="run"><header><span>{run.taskPath}</span><span>{run.status.toUpperCase()}</span></header><p><i>PLAN</i>创建会话与任务定义<small>{run.sessionPath}</small></p><p><i className={run.status === "completed" ? "write" : ""}>{run.status === "completed" ? "WRITE" : "TRACE"}</i>{run.status === "completed" ? "结果与知识已写入" : "任务状态已写入 Trace"}<small>{run.tracePath}</small></p></div><span className="file">{run.status === "completed" ? "结果、知识摘要与 Trace 已保存到本地工作区。" : run.status === "failed" ? "失败原因已写入 Trace，可在调用追溯中查看。" : run.status === "waiting_credentials" ? "请在“模型连接”配置可用的模型凭证后重试。" : run.status === "running" ? "模型调用进行中，完成后会自动写入结果和知识摘要。" : "任务已落盘；选择“运行任务”后才会执行模型调用。"}</span></div></div>}
    </div>
    <form className="composer" onSubmit={send}><div className="compose-line"><button type="button" className="icon-btn" aria-label="添加文件" disabled={isSending}>＋</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={isSending ? "正在生成回复…" : "描述任务，或拖入工作区文件…"} disabled={isSending} /><button className="send" aria-label="发送" disabled={isSending}>{isSending ? "…" : "↑"}</button></div><small className="compose-help">{isSending ? "正在生成回复，完成后才能发送下一条" : "⌘/Ctrl + Enter 发送 · Shift + Enter 换行 · 所有调用会写入 traces/"}</small></form>
  </>;
}

function BriefGroup({ label, items, empty, action }: { label: string; items: BriefItem[]; empty: string; action?: (item: BriefItem) => React.ReactNode }) {
  return <article><label>{label} · {items.length}</label>{items.length === 0 ? <><strong>{empty}</strong><p>该分组由工作区任务、决策和 Trace 文件聚合生成。</p></> : items.slice(0, 2).map((item) => <div key={item.id} className="brief-item"><strong>{item.title}</strong><p>{item.detail}</p><small>{item.path} · {item.status}</small>{action?.(item)}</div>)}</article>;
}
