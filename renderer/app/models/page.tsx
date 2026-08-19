"use client";

import { FormEvent, useEffect, useState } from "react";
import { Header } from "@/app/components/shared";

type Model = { id: string; baseUrl: string; model: string; credentialRef: string; configured: boolean };

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [form, setForm] = useState({ id: "default-api", baseUrl: "", model: "", apiKey: "" });
  const [notice, setNotice] = useState("");
  async function refresh() { if (window.firstmate) setModels(await window.firstmate.models.list()); }
  useEffect(() => { void refresh(); }, []);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!window.firstmate) return;
    try { await window.firstmate.models.save(form); setForm((value) => ({ ...value, apiKey: "" })); setNotice("模型定义与系统安全存储凭证已保存。"); await refresh(); } catch (error) { setNotice(error instanceof Error ? error.message : "保存失败"); }
  }
  return <>
    <Header title="模型连接" subtitle="models/ · API 定义在工作区；API Key 仅保存在 macOS 安全存储"><button className="btn primary">新增模型</button></Header>
    <div className="list"><div className="warning">密钥不会写入 YAML、会话、Trace 或 Git。模型运行只由 Electron 主进程读取系统安全存储。</div>{notice && <div className="model-notice">{notice}</div>}<div className="model-layout"><form className="model-form" onSubmit={save}><h3>添加 OpenAI-compatible 模型</h3><label>模型 ID<input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="default-api" /></label><label>Base URL<input value={form.baseUrl} onChange={(event) => setForm({ ...form, baseUrl: event.target.value })} placeholder="https://api.example.com/v1" /></label><label>模型名<input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} placeholder="gpt-4o-mini" /></label><label>API Key<input type="password" value={form.apiKey} onChange={(event) => setForm({ ...form, apiKey: event.target.value })} placeholder="仅保存到系统安全存储" /></label><button className="btn primary">保存模型连接</button></form><table><thead><tr><th>MODEL</th><th>BASE URL</th><th>MODEL</th><th>CREDENTIAL</th><th>STATUS</th></tr></thead><tbody>{models.length === 0 ? <tr><td colSpan={5}>尚未配置模型。保存一个 OpenAI-compatible 模型后才能执行任务。</td></tr> : models.map((item) => <tr key={item.id}><td><b>{item.id}</b></td><td>{item.baseUrl}</td><td>{item.model}</td><td>{item.credentialRef}</td><td><span className={item.configured ? "status ready" : "status off"}>{item.configured ? "READY" : "MISSING KEY"}</span></td></tr>)}</tbody></table></div></div>
  </>;
}
