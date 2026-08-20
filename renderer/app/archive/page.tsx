"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/app/components/shared";

type SessionRecord = { id: string; path: string; createdAt: string; status: string; agentId: string; summary: string; hasOutput: boolean };

function formatSessionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const part = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}/${part(date.getMonth() + 1)}/${part(date.getDate())} ${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`;
}

export default function ArchivePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selected, setSelected] = useState("");
  const [content, setContent] = useState("暂无会话。大副对话发送任务后会创建可恢复会话。");
  async function load(path: string) { if (!window.firstmate) return; setSelected(path); setContent(await window.firstmate.workspace.read(path)); }
  useEffect(() => { void window.firstmate?.sessions.list().then((items) => { setSessions(items); if (items[0]) void load(items[0].path); }); }, []);
  function createSession() { router.push("/chat"); }
  return <><Header title="会话归档" subtitle="sessions/ · 展示工作区保留的全部结构化会话记录"><button className="btn primary" onClick={createSession}>新建会话</button></Header><div className="archive-layout"><aside>{sessions.length === 0 ? <p>暂无会话</p> : sessions.map((session) => <button key={session.path} className={`archive-session ${session.path === selected ? "selected" : ""}`} onClick={() => void load(session.path)}><div className="archive-session-head"><b>{session.id}</b><em className={session.status === "已完成" ? "completed" : session.status === "失败" ? "failed" : ""}>{session.status}</em></div><small>{formatSessionTime(session.createdAt)} · {session.agentId}</small><span>{session.summary || "等待生成摘要"}</span></button>)}</aside><article><div className="path">{selected || "sessions/"}</div><pre className="document-content">{content}</pre></article></div></>;
}
