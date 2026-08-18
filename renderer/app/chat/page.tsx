"use client";

import { FormEvent, useState } from "react";
import { Header } from "@/app/components/shared";

export default function ChatPage() {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);

  function send(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSent((items) => [...items, content]);
    setDraft("");
  }

  return <>
    <Header title="FirstMate desktop redesign" subtitle="sessions/2026-08-17-desktop-redesign.md · context loaded">
      <button className="btn">查看摘要</button><button className="btn primary">运行任务</button>
    </Header>
    <div className="chat"><div className="date">2026-08-17 / SESSION ACTIVE</div>
      <div className="message user"><div className="bubble">参考统一设计规范重构桌面端原型。重点看 Agent 的调用轨迹、Skill 和 Git 变更是否可追溯。</div><div className="avatar">DC</div></div>
      <div className="message"><div className="avatar">FM</div><div className="bubble"><strong>已创建任务草稿。</strong> 大副会读取设计规范，再交给界面船员产出原型。运行过程和文件变更将写入任务、trace 与输出目录。<div className="run"><header><span>tasks/task-20260817-003.yaml</span><span>RUNNING · 00:42</span></header><p><i>READ</i>读取 <code>DESIGN.md</code><small>0.2s</small></p><p><i className="model">MODEL</i>界面船员生成工作台方案<small>default-api</small></p><p><i className="write">WRITE</i>写入原型草稿<small>outputs/</small></p></div><span className="file">knowledge/decisions/design-system-v1.md</span></div></div>
      <div className="message"><div className="avatar">FM</div><div className="bubble"><strong>设计方向已收敛。</strong><br />界面只使用深色表面、细边框、单一电绿主动作。Agent 的 Plan / Read / Model / Tool / Write / Done 过程会在右侧检查器中持续记录，而不是藏进自然语言回复里。</div></div>
      {sent.map((item, index) => <div className="message user" key={`${item}-${index}`}><div className="bubble">{item}</div><div className="avatar">DC</div></div>)}
    </div>
    <form className="composer" onSubmit={send}><div><button type="button">＋</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="描述任务，或拖入工作区文件…" /><button className="send">↑</button></div><small>⌘/Ctrl + Enter 发送 · Shift + Enter 换行 · 所有调用会写入 traces/</small></form>
  </>;
}
