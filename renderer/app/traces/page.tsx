"use client";

import { useEffect, useState } from "react";
import { Header } from "@/app/components/shared";

type Trace = { id: string; time: string; phase: string; actor: string; detail: string };

export default function TracesPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [events, setEvents] = useState<Trace[]>([]);
  const [selected, setSelected] = useState("");
  async function load(path: string) { if (!window.firstmate) return; setSelected(path); setEvents(JSON.parse(await window.firstmate.workspace.read(path))); }
  useEffect(() => { void window.firstmate?.traces.list().then((items) => { setFiles(items); if (items[0]) void load(items[0]); }); }, []);
  return <><Header title="调用追溯" subtitle="knowledge/traces/ · 读取、模型、工具、写入和产物均可反查"><button className="btn">导出 Trace</button></Header><div className="list"><div className="filter"><select value={selected} onChange={(event) => void load(event.target.value)}><option value="">选择 Trace 文件</option>{files.map((file) => <option key={file}>{file}</option>)}</select></div><table><thead><tr><th>TIME</th><th>PHASE</th><th>ACTOR</th><th>DETAIL</th></tr></thead><tbody>{events.length === 0 ? <tr><td colSpan={4}>暂无 Trace。发送任务后会生成追溯文件。</td></tr> : events.map((event) => <tr key={event.id}><td>{new Date(event.time).toLocaleTimeString()}</td><td><span className={`phase ${event.phase.toLowerCase()}`}>{event.phase}</span></td><td>{event.actor}</td><td>{event.detail}</td></tr>)}</tbody></table></div></>;
}
