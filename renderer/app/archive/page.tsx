"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/app/components/shared";

export default function ArchivePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [content, setContent] = useState("暂无会话。大副对话发送任务后会创建可恢复会话。");
  async function load(path: string) { if (!window.firstmate) return; setSelected(path); setContent(await window.firstmate.workspace.read(path)); }
  useEffect(() => { void window.firstmate?.sessions.list().then((items) => { const recent = items.slice(-10).reverse(); setSessions(recent); if (recent[0]) void load(recent[0]); }); }, []);
  function createSession() { router.push("/chat"); }
  return <><Header title="会话归档" subtitle="sessions/ · 展示工作区保留的最近 10 条原始会话、摘要与恢复信息"><button className="btn primary" onClick={createSession}>新建会话</button></Header><div className="archive-layout"><aside>{sessions.length === 0 ? <p>暂无会话</p> : sessions.map((session) => <button key={session} className={session === selected ? "selected" : ""} onClick={() => void load(session)}>{session.replace("sessions/", "")}</button>)}</aside><article><div className="path">{selected || "sessions/"}</div><pre className="document-content">{content}</pre></article></div></>;
}
