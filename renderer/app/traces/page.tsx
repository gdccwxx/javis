"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/app/components/shared";

type Trace = {
  id: string;
  taskId?: string;
  time: string;
  phase: string;
  status?: string;
  actor?: string;
  agentId?: string;
  skillIds?: string[];
  modelId?: string;
  inputFiles?: string[];
  outputFiles?: string[];
  durationMs?: number;
  detail: string;
};

type TraceFile = { path: string; taskId: string; events: Trace[]; updatedAt: string };

const phaseLabel: Record<string, string> = {
  PLAN: "规划",
  QUEUED: "排队",
  READ: "读取",
  MODEL: "模型调用",
  WRITE: "写入",
  DONE: "完成",
  FAILED: "失败",
  BLOCKED: "已阻塞",
  DECISION: "决策",
};

const statusLabel: Record<string, string> = {
  queued: "待运行",
  running: "运行中",
  waiting_credentials: "缺少凭证",
  waiting_input: "等待补充",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
  recorded: "已记录",
};

function displayTaskId(path: string) {
  return path.replace(/^knowledge\/traces\//, "").replace(/\.json$/, "");
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  const part = (number: number) => String(number).padStart(2, "0");
  if (isToday) return `${part(date.getHours())}:${part(date.getMinutes())}`;
  return `${date.getFullYear()}年${part(date.getMonth() + 1)}月${part(date.getDate())}日 ${part(date.getHours())}:${part(date.getMinutes())}`;
}

export default function TracesPage() {
  const [files, setFiles] = useState<TraceFile[]>([]);
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("");
  const [notice, setNotice] = useState("");
  const visibleFiles = useMemo(() => files.filter((file) => `${file.taskId} ${file.events.map((event) => `${event.agentId ?? event.actor ?? ""} ${event.detail}`).join(" ")}`.toLowerCase().includes(filter.toLowerCase())), [files, filter]);
  const current = files.find((file) => file.path === selected);

  async function refresh() {
    const firstmate = window.firstmate;
    if (!firstmate) return;
    const paths = await firstmate.traces.list();
    const loaded = await Promise.all(paths.map(async (path) => {
      try {
        const parsed: unknown = JSON.parse(await firstmate.workspace.read(path));
        const events = Array.isArray(parsed) ? parsed.filter((event): event is Trace => Boolean(event) && typeof event === "object" && typeof (event as Trace).id === "string") : [];
        return { path, taskId: displayTaskId(path), events, updatedAt: events.at(-1)?.time ?? "" };
      } catch {
        return { path, taskId: displayTaskId(path), events: [], updatedAt: "" };
      }
    }));
    loaded.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    setFiles(loaded);
    if (!selected && loaded[0]) setSelected(loaded[0].path);
  }

  useEffect(() => { void refresh(); }, []);

  function selectTrace(path: string) {
    setSelected(path);
    const file = files.find((item) => item.path === path);
    setNotice(file?.events.length ? "" : "该调用记录为空或无法解析。");
  }

  return <><Header title="调用追溯" subtitle="knowledge/traces/ · 按任务查看规划、智能体、模型、输入和产物" />
    <div className="trace-workspace">
      <aside className="trace-list">
        <input className="tree-search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="搜索任务、智能体或记录内容" />
        <div className="tree-row folder">⌄ 调用记录</div>
        {visibleFiles.length === 0 && <div className="tree-row indent">未找到匹配的调用记录</div>}
        {visibleFiles.map((file) => <button key={file.path} className={`trace-list-row ${file.path === selected ? "selected" : ""}`} onClick={() => selectTrace(file.path)} title={file.taskId}>
          <span className="tree-icon" aria-hidden="true">↯</span>
          <span className="trace-list-title">{file.taskId}</span>
          <small>{file.events.length} 项 · {file.updatedAt ? formatTime(file.updatedAt) : "无事件"}</small>
        </button>)}
      </aside>
      <article className="trace-document">
        <div className="path">{current?.path ?? "knowledge/traces/"}</div>
        <h2>{current?.taskId ?? "调用记录"}</h2>
        <div className="docmeta">{current ? `事件数：${current.events.length} · 最近更新：${current.updatedAt ? formatTime(current.updatedAt) : "未记录"}` : "选择一条调用记录查看详情"}</div>
        {notice && <div className="model-notice">{notice}</div>}
        {!current ? <div className="callout">调用记录会在任务规划、读取、模型调用、写入和完成时持续写入。</div> : current.events.length === 0 ? <div className="callout">该记录没有可展示的事件。</div> : <div className="trace-event-list">{current.events.map((event) => <section className="trace-event" key={event.id}>
          <header><span className={`phase ${event.phase.toLowerCase()}`}>{phaseLabel[event.phase] ?? event.phase}</span><b>执行者：{event.agentId ?? event.actor ?? "未知智能体"}</b><small>时间：{formatTime(event.time)} · 状态：{statusLabel[event.status ?? "recorded"] ?? event.status ?? "已记录"}</small></header>
          <p>{event.detail}</p>
          <dl>
            <dt>阶段</dt><dd>{phaseLabel[event.phase] ?? event.phase}</dd>
            <dt>执行者</dt><dd>{event.agentId ?? event.actor ?? "未知智能体"}</dd>
            {event.modelId && <><dt>模型</dt><dd>{event.modelId}</dd></>}
            {event.skillIds?.length ? <><dt>技能</dt><dd>{event.skillIds.join("、")}</dd></> : null}
            {event.durationMs !== undefined && <><dt>耗时</dt><dd>{(event.durationMs / 1000).toFixed(1)} 秒</dd></>}
            {event.inputFiles?.length ? <><dt>输入</dt><dd>{event.inputFiles.join(" · ")}</dd></> : null}
            {event.outputFiles?.length ? <><dt>输出</dt><dd>{event.outputFiles.join(" · ")}</dd></> : null}
          </dl>
        </section>)}</div>}
      </article>
    </div>
  </>;
}
