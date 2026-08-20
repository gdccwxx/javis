"use client";

import { useEffect, useState } from "react";
import { Header } from "@/app/components/shared";

type Trace = { id: string; time: string; phase: string; actor?: string; agentId?: string; detail: string };

export default function TracesPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [events, setEvents] = useState<Trace[]>([]);
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  async function load(path: string) {
    if (!window.firstmate) return;
    setSelected(path);
    try {
      const parsed: unknown = JSON.parse(await window.firstmate.workspace.read(path));
      if (!Array.isArray(parsed)) throw new Error("Trace 文件不是事件数组");
      setEvents(parsed.filter((event): event is Trace => Boolean(event) && typeof event === "object" && typeof (event as Trace).id === "string"));
      setNotice("");
    } catch (error) {
      setEvents([]);
      setNotice(error instanceof Error ? `无法读取 Trace：${error.message}` : "无法读取 Trace。");
    }
  }
  useEffect(() => { void window.firstmate?.traces.list().then((items) => { setFiles(items); if (items[0]) void load(items[0]); }); }, []);
  return <><Header title="调用追溯" subtitle="knowledge/traces/ · 读取、模型、工具、写入和产物均可反查" /><div className="list"><div className="filter"><select value={selected} onChange={(event) => void load(event.target.value)}><option value="">选择 Trace 文件</option>{files.map((file) => <option key={file}>{file}</option>)}</select></div>{notice && <div className="model-notice">{notice}</div>}<table><thead><tr><th>TIME</th><th>PHASE</th><th>ACTOR</th><th>DETAIL</th></tr></thead><tbody>{events.length === 0 ? <tr><td colSpan={4}>暂无 Trace。发送任务后会生成追溯文件。</td></tr> : events.map((event) => <tr key={event.id}><td>{new Date(event.time).toLocaleTimeString()}</td><td><span className={`phase ${event.phase.toLowerCase()}`}>{event.phase}</span></td><td>{event.actor ?? event.agentId ?? "unknown"}</td><td>{event.detail}</td></tr>)}</tbody></table></div></>;
}
