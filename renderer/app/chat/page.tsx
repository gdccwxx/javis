"use client";

import { FormEvent, useEffect, useState } from "react";
import { Header } from "@/app/components/shared";

type Run = { id: string; sessionPath: string; taskPath: string; tracePath: string; status: string };

export default function ChatPage() {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [briefOpen, setBriefOpen] = useState(true);
  const [decision, setDecision] = useState<"open" | "chosen" | "later">("open");
  const [run, setRun] = useState<Run | null>(null);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [modelId, setModelId] = useState("");
  const [runtimeNotice, setRuntimeNotice] = useState("");

  useEffect(() => { void window.firstmate?.workspace.initialize().then(() => setWorkspaceReady(true)); void window.firstmate?.models.list().then((models) => setModelId(models.find((item) => item.configured)?.id ?? models[0]?.id ?? "")); }, []);
  async function send(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSent((items) => [...items, content]);
    setDraft("");
    if (window.firstmate) setRun(await window.firstmate.conversation.create(content));
  }

  async function resolveDecision(choice: "本机执行" | "暂不决定") {
    if (!window.firstmate) return;
    if (choice === "暂不决定") { setDecision("later"); return; }
    try { await window.firstmate.decisions.resolve("runtime-location", choice); setDecision("chosen"); } catch (error) { setRuntimeNotice(error instanceof Error ? error.message : "写入决策失败"); }
  }
  async function runWithModel() {
    if (!run || !modelId || !window.firstmate) { setRuntimeNotice("请先在模型连接页保存一个模型和 API Key。"); return; }
    try { const result = await window.firstmate.runtime.runTask(run.id, modelId); setRuntimeNotice(result.status === "completed" ? `模型结果已写入 ${result.outputPath}` : "模型凭证未配置，任务保持等待状态。"); } catch (error) { setRuntimeNotice(error instanceof Error ? error.message : "模型执行失败"); }
  }

  return <>
    <Header title="FirstMate desktop redesign" subtitle={workspaceReady ? "javis-wiki · 工作区已连接" : "等待 Electron 工作区连接"}>
      <button className="btn" onClick={() => setBriefOpen((value) => !value)}>{briefOpen ? "收起简报" : "查看简报"}</button><button className="btn primary" onClick={() => void runWithModel()}>运行任务</button>
    </Header>
    <div className="chat"><div className="date">2026-08-19 / WORKSPACE BRIEF</div>
      {briefOpen && <section className="brief" aria-label="回来后简报"><header><b>回来后简报</b><span>完整当前快照 · 刚刚</span></header><div className="brief-grid"><article><label>待我决定 · {decision === "open" ? "1" : "0"}</label>{decision === "open" ? <><strong>选择 Runtime 执行位置</strong><p>2 个后续任务被阻塞，远端当前状态未知。</p><div className="decision"><b>建议：本机执行</b><small>decision-runtime-location · 可决定 · 阻塞 2 个任务</small><div><button onClick={() => void resolveDecision("本机执行")}>选择本机</button><button onClick={() => void resolveDecision("暂不决定")}>暂不决定</button></div></div></> : <><strong>{decision === "chosen" ? "已选择本机执行" : "已暂缓此决策"}</strong><p>{decision === "chosen" ? "决策已写入，两个被阻塞任务正在恢复。" : "决策保持打开，可在下一次简报中继续处理。"}</p></>}</article><article><label>最近完成 · {run ? "1" : "0"}</label><strong>{run ? "文件闭环已完成" : "等待新任务"}</strong><p>{run ? `${run.sessionPath}、${run.taskPath} 与 Trace 已写入工作区。` : "发送一条任务即可创建会话、任务与 Trace。"}</p></article><article><label>进行中 · 0</label><strong>本地 Runtime 已就绪</strong><p>模型未配置前，仅完成受控文件闭环。</p></article><article><label>下一步 · 1</label><strong>模型连接等待凭证</strong><p>完成模型页配置后可接入 OpenAI-compatible API。</p></article></div></section>}
      <div className="message user"><div className="bubble">参考统一设计规范重构桌面端原型。重点看 Agent 的调用轨迹、Skill 和文件产物是否可追溯。</div><div className="avatar">DC</div></div>
      <div className="message"><div className="avatar">FM</div><div className="bubble"><strong>工作区文件闭环已启用。</strong> 发送任务后，我会在 javis-wiki 写入会话、任务定义和 Trace。模型未配置时不会伪造 AI 结果。<span className="file">sessions/ · tasks/ · knowledge/traces/</span></div></div>
      {sent.map((item, index) => <div className="message user" key={`${item}-${index}`}><div className="bubble">{item}</div><div className="avatar">DC</div></div>)}
      {runtimeNotice && <div className="runtime-notice">{runtimeNotice}</div>}
      {run && <div className="message"><div className="avatar">FM</div><div className="bubble"><strong>任务文件已创建。</strong><div className="run"><header><span>{run.taskPath}</span><span>COMPLETED</span></header><p><i>PLAN</i>创建会话与任务定义<small>{run.sessionPath}</small></p><p><i className="write">WRITE</i>追加可追溯事件<small>{run.tracePath}</small></p></div><span className="file">模型任务等待在“模型连接”完成配置后执行。</span></div></div>}
    </div>
    <form className="composer" onSubmit={send}><div className="compose-line"><button type="button" className="icon-btn" aria-label="添加文件">＋</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="描述任务，或拖入工作区文件…" /><button className="send" aria-label="发送">↑</button></div><small className="compose-help">⌘/Ctrl + Enter 发送 · Shift + Enter 换行 · 所有调用会写入 traces/</small></form>
  </>;
}
