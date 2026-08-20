"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, Status } from "@/app/components/shared";

type BriefItem = { id: string; title: string; detail: string; status: string; path: string };
type TraceEvent = { id: string; time: string; phase: string; status: string; agentId: string; modelId?: string; detail: string };
type Supervision = { status: "healthy" | "attention"; message: string; detail: string; activeTasks: number; waitingTotal: number; waitingTasks: BriefItem[]; recentEvents: TraceEvent[]; contextFiles: string[] };
const emptySupervision: Supervision = { status: "healthy", message: "正在读取本地工作区状态", detail: "尚无可展示的任务与 Trace 数据。", activeTasks: 0, waitingTotal: 0, waitingTasks: [], recentEvents: [], contextFiles: [] };
type RecentSession = { path: string; id: string; time: string };

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
      setRecentSessions(sessions.slice(-5).reverse().map((path) => ({
        path,
        id: path.replace(/^sessions\//, "").replace(/\.md$/, ""),
        time: path.match(/task-(\d+)/)?.[1] ? new Date(Number(path.match(/task-(\d+)/)?.[1])).toLocaleString() : "本地会话",
      })));
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

  return <div className={`fm-app theme-${themeMode}`}>
    <div className="shell">
      <header className={`appbar ${isMac ? "macos" : ""}`}><span className="workspace">javis-wiki</span><span className="window-drag-region" aria-label="拖动窗口" /><button className="theme-toggle" onClick={toggleTheme} aria-label={themeMode === "dark" ? "切换至白天模式" : "切换至暗黑模式"}>{themeMode === "dark" ? "☀ 白天" : "◐ 暗黑"}</button><span className={needsAttention ? "guard attention" : "guard"}>{needsAttention ? "● 需要人工关注" : "● 保障正常"}</span><span className="connection"><i />本地工作区已连接</span></header>
      <aside className="sidebar"><Link className="new" href="/chat">＋ 新建会话</Link><nav><span>WORKSPACE</span>{nav.map((item) => <Link key={item.id} href={`/${item.id}`} className={active === item.id ? "active" : ""}><b>{item.icon}</b><label>{item.label}</label>{item.badge && <em>{item.badge}</em>}</Link>)}<div className="recent"><span>RECENT SESSIONS</span>{recentSessions.length === 0 ? <p>暂无会话</p> : recentSessions.map((session) => <button key={session.path} onClick={() => openRecentSession(session)}><b>{session.id}</b><small>{session.time} · 点击恢复</small></button>)}</div></nav></aside>
      <main className="main"><section className="view">{children}</section></main>
      <aside className="inspector"><section><header><span>运行保障</span><Status value={needsAttention ? "ATTENTION" : "健康"} /></header><div className="guard-panel"><b>{supervision.message}</b><small>{supervision.detail}</small></div><header className="subhead"><span>待处理事项</span><span>{supervision.waitingTotal} 项{supervision.waitingTotal > supervision.waitingTasks.length ? ` · 显示前 ${supervision.waitingTasks.length} 项` : ""}</span></header>{supervision.waitingTasks.length === 0 ? <p>当前没有排队、阻塞或等待输入的本地事项。</p> : supervision.waitingTasks.map((item) => <div className="awaiting" key={item.id}><b>{item.title}</b><span>{item.detail}</span><div className="awaiting-footer"><small>{item.path}</small><button className="btn" onClick={() => openPendingItem(item)}>{item.path.startsWith("knowledge/decisions/") ? "打开决策" : "处理任务"}</button></div></div>)}</section><section><header><span>LIVE TRACE</span><Status value={supervision.activeTasks > 0 ? "RUNNING" : "健康"} /></header>{supervision.recentEvents.length === 0 ? <p>尚未记录 Trace 事件。</p> : supervision.recentEvents.map((event) => <div className="trace" key={event.id}><i className={event.phase === "MODEL" ? "model" : event.phase === "WRITE" ? "tool" : event.phase === "DONE" ? "done" : ""} /><b>{event.phase} · {event.agentId}</b><small>{new Date(event.time).toLocaleTimeString()} · {event.status} · {event.detail}</small></div>)}</section><section><header><span>ACTIVE CONTEXT</span><span>{supervision.contextFiles.length} FILES</span></header>{supervision.contextFiles.length === 0 ? <p>当前没有可恢复的知识文件。</p> : supervision.contextFiles.map((path) => <p key={path}>FILE · {path}</p>)}</section><section><div className="warning">状态由本地任务、决策和 Trace 文件聚合。需要你决定的事项会保留在回来后简报中，系统不会自动替你批准。</div></section></aside>
    </div></div>;
}
