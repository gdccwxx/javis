"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, Status } from "@/app/components/shared";

type BriefItem = { id: string; title: string; detail: string; status: string; path: string };
type TraceEvent = { id: string; time: string; phase: string; status: string; agentId: string; modelId?: string; detail: string };
type Supervision = { status: "healthy" | "attention"; message: string; detail: string; activeTasks: number; waitingTotal: number; waitingTasks: BriefItem[]; recentEvents: TraceEvent[]; contextFiles: string[] };
const emptySupervision: Supervision = { status: "healthy", message: "正在读取本地工作区状态", detail: "尚无可展示的任务与 Trace 数据。", activeTasks: 0, waitingTotal: 0, waitingTasks: [], recentEvents: [], contextFiles: [] };
type RecentSession = { path: string; id: string; title: string; time: string; status: string; agentId: string };
const phaseLabel: Record<string, string> = { PLAN: "规划", QUEUED: "排队", READ: "读取", MODEL: "模型调用", WRITE: "写入", DONE: "完成", FAILED: "失败", BLOCKED: "已阻塞", DECISION: "决策" };
const statusLabel: Record<string, string> = { queued: "待运行", running: "运行中", waiting_credentials: "缺少凭证", waiting_input: "等待补充", completed: "已完成", failed: "失败", cancelled: "已取消", recorded: "已记录" };

export default function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/chat";
  const active = pathname === "/" ? "chat" : pathname.split("/")[1];
  const [isMac, setIsMac] = useState(false);
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [supervision, setSupervision] = useState<Supervision>(emptySupervision);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  useEffect(() => {
    setIsMac(navigator.userAgent.includes("Macintosh"));
    const savedTheme = window.localStorage.getItem("firstmate:theme");
    if (savedTheme === "light" || savedTheme === "dark") setThemeMode(savedTheme);
    else if (window.matchMedia("(prefers-color-scheme: light)").matches) setThemeMode("light");
    async function refresh() {
      if (!window.firstmate) return;
      setSupervision(await window.firstmate.workspace.supervision());
      const sessions = await window.firstmate.sessions.list();
      setRecentSessions(sessions.slice(0, 5).map((session) => ({ path: session.path, id: session.id, title: session.title, time: formatSessionTime(session.createdAt), status: session.status, agentId: session.agentId })));
    }
    void refresh();
    const handleWorkspaceChanged = () => void refresh();
    window.addEventListener("firstmate:workspace-changed", handleWorkspaceChanged);
    const timer = window.setInterval(() => void refresh(), 1500);
    return () => {
      window.removeEventListener("firstmate:workspace-changed", handleWorkspaceChanged);
      window.clearInterval(timer);
    };
  }, []);

  const needsAttention = supervision.status === "attention";
  function toggleTheme() {
    setThemeMode((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem("firstmate:theme", next);
      return next;
    });
  }
  function openPendingItem(item: BriefItem) {
    window.localStorage.setItem("firstmate:pending-item", JSON.stringify(item));
    if (pathname === "/chat") {
      window.dispatchEvent(new CustomEvent("firstmate:open-pending", { detail: item }));
      return;
    }
    router.push("/chat");
  }
  function openRecentSession(session: RecentSession) {
    window.localStorage.setItem("firstmate:open-session", JSON.stringify(session));
    if (pathname === "/chat") {
      window.dispatchEvent(new CustomEvent("firstmate:open-session", { detail: session }));
      return;
    }
    router.push("/chat");
  }
  function createNewConversation() {
    if (pathname === "/chat") {
      window.dispatchEvent(new Event("firstmate:new-conversation"));
      return;
    }
    window.localStorage.setItem("firstmate:new-conversation", "true");
    router.push("/chat");
  }

  return <div className={`fm-app theme-${themeMode}`}>
    <div className="shell">
      <header className={`appbar ${isMac ? "macos" : ""}`}><span className="workspace">javis-wiki</span><span className="window-drag-region" aria-label="拖动窗口" /><button className="theme-toggle" onClick={toggleTheme} aria-label={themeMode === "dark" ? "切换至白天模式" : "切换至暗黑模式"}>{themeMode === "dark" ? "☀ 白天" : "◐ 暗黑"}</button><span className={needsAttention ? "guard attention" : "guard"}>{needsAttention ? "● 需要人工关注" : "● 保障正常"}</span><span className="connection"><i />本地工作区已连接</span></header>
      <aside className="sidebar"><button className="new" onClick={createNewConversation}>＋ 新建会话</button><nav><span>工作区</span>{nav.map((item) => <Link key={item.id} href={`/${item.id}`} className={active === item.id ? "active" : ""}><b>{item.icon}</b><label>{item.label}</label>{item.badge && <em>{item.badge}</em>}</Link>)}<div className="recent"><span>最近会话</span>{recentSessions.length === 0 ? <p>暂无会话</p> : recentSessions.map((session) => <button key={session.path} onClick={() => openRecentSession(session)} title={`恢复会话：${session.title}`}><b>{session.title}</b><small>{session.time} · {session.status} · {session.agentId}</small></button>)}</div></nav></aside>
      <main className="main"><section className="view">{children}</section></main>
      <aside className="inspector"><section><header><span>运行保障</span><Status value={needsAttention ? "需要关注" : "健康"} /></header><div className="guard-panel"><b>{supervision.message}</b><small>{supervision.detail}</small></div><header className="subhead"><span>待处理事项</span><span>{supervision.waitingTotal} 项{supervision.waitingTotal > supervision.waitingTasks.length ? ` · 显示前 ${supervision.waitingTasks.length} 项` : ""}</span></header>{supervision.waitingTasks.length === 0 ? <p>当前没有排队、阻塞或等待输入的本地事项。</p> : supervision.waitingTasks.map((item) => <div className="awaiting" key={item.id}><b>{item.title}</b><span>{item.detail}</span><div className="awaiting-footer"><small>{item.path}</small><button className="btn" onClick={() => openPendingItem(item)}>{item.path.startsWith("knowledge/decisions/") ? "打开决策" : "处理任务"}</button></div></div>)}</section><section><header><span>实时调用记录</span><Status value={supervision.activeTasks > 0 ? "运行中" : "健康"} /></header>{supervision.recentEvents.length === 0 ? <p>尚未记录调用事件。</p> : supervision.recentEvents.map((event) => <div className="trace" key={event.id}><i className={event.phase === "MODEL" ? "model" : event.phase === "WRITE" ? "tool" : event.phase === "DONE" ? "done" : ""} /><b>{phaseLabel[event.phase] ?? event.phase} · {event.agentId}</b><small>{new Date(event.time).toLocaleTimeString()} · {statusLabel[event.status] ?? event.status} · {event.detail}</small></div>)}</section><section><header><span>当前上下文</span><span>{supervision.contextFiles.length} 个文件</span></header>{supervision.contextFiles.length === 0 ? <p>当前没有可恢复的知识文件。</p> : supervision.contextFiles.map((path) => <p key={path}>文件 · {path}</p>)}</section><section><div className="warning">状态由本地任务、决策和调用记录聚合。需要你决定的事项会保留在回来后简报中，系统不会自动替你批准。</div></section></aside>
    </div></div>;
}

function formatSessionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "本地会话";
  const part = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}/${part(date.getMonth() + 1)}/${part(date.getDate())} ${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`;
}
