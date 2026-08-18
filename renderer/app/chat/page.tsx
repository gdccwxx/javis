"use client";

import { FormEvent, useState } from "react";
import { Header } from "@/app/components/shared";

export default function ChatPage() {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [briefOpen, setBriefOpen] = useState(true);
  const [decision, setDecision] = useState<"open" | "chosen" | "later">("open");

  function send(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSent((items) => [...items, content]);
    setDraft("");
  }

  return <>
    <Header title="FirstMate desktop redesign" subtitle="sessions/2026-08-17-desktop-redesign.md · context loaded">
      <button className="btn" onClick={() => setBriefOpen((value) => !value)}>{briefOpen ? "收起简报" : "查看简报"}</button><button className="btn primary">运行任务</button>
    </Header>
    <div className="chat"><div className="date">2026-08-18 / WORKSPACE BRIEF</div>
      {briefOpen && <section className="brief" aria-label="回来后简报"><header><b>回来后简报</b><span>完整当前快照 · 20:32</span></header><div className="brief-grid"><article><label>待我决定 · {decision === "open" ? "1" : "0"}</label>{decision === "open" ? <><strong>选择 Runtime 执行位置</strong><p>2 个后续任务被阻塞，远端当前状态未知。</p><div className="decision"><b>建议：本机执行</b><small>decision-runtime-location · 可决定 · 阻塞 2 个任务</small><div><button onClick={() => setDecision("chosen")}>选择本机</button><button onClick={() => setDecision("later")}>暂不决定</button></div></div></> : <><strong>{decision === "chosen" ? "已选择本机执行" : "已暂缓此决策"}</strong><p>{decision === "chosen" ? "决策已写入，两个被阻塞任务正在恢复。" : "决策保持打开，可在下一次简报中继续处理。"}</p></>}</article><article><label>最近完成 · 2</label><strong>设计系统决策已沉淀</strong><p>已生成知识决策、Trace 和本地恢复点。</p></article><article><label>进行中 · 1</label><strong>界面船员正在补全工作台</strong><p>当前阶段：Write · 预计回报 20:40。</p></article><article><label>下一步 · 2</label><strong>模型连接校验等待凭证</strong><p>1 项等待外部结果，1 项等待上方决策。</p></article></div></section>}
      <div className="message user"><div className="bubble">参考统一设计规范重构桌面端原型。重点看 Agent 的调用轨迹、Skill 和文件产物是否可追溯。</div><div className="avatar">DC</div></div>
      <div className="message"><div className="avatar">FM</div><div className="bubble"><strong>已创建任务草稿。</strong> 大副会读取设计规范，再交给界面船员产出原型。运行过程和文件变更将写入任务、trace 与输出目录。<div className="run"><header><span>tasks/task-20260818-011.yaml</span><span>RUNNING · 00:42</span></header><p><i>READ</i>读取 <code>DESIGN.md</code><small>0.2s</small></p><p><i className="model">MODEL</i>界面船员生成工作台方案<small>default-api</small></p><p><i className="write">WRITE</i>写入原型草稿<small>outputs/</small></p></div><span className="file">knowledge/decisions/design-system-v1.md</span></div></div>
      <div className="message"><div className="avatar">FM</div><div className="bubble"><strong>设计方向已收敛。</strong><br />你离开后，系统会继续工作；回来时，简报会明确列出待你决定、最近完成、进行中和下一步。不会把运行、等待和决策混成一条状态。</div></div>
      {sent.map((item, index) => <div className="message user" key={`${item}-${index}`}><div className="bubble">{item}</div><div className="avatar">DC</div></div>)}
    </div>
    <form className="composer" onSubmit={send}><div className="compose-line"><button type="button" className="icon-btn" aria-label="添加文件">＋</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="描述任务，或拖入工作区文件…" /><button className="send" aria-label="发送">↑</button></div><small className="compose-help">⌘/Ctrl + Enter 发送 · Shift + Enter 换行 · 所有调用会写入 traces/</small></form>
  </>;
}
