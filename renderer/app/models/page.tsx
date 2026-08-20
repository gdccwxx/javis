"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Header } from "@/app/components/shared";

type Model = { id: string; provider: "openai-compatible" | "anthropic-compatible"; baseUrl: string; model: string; credentialRef: string; configured: boolean };

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [form, setForm] = useState<{ id: string; provider: "openai-compatible" | "anthropic-compatible"; baseUrl: string; model: string; apiKey: string }>({ id: "default-api", provider: "openai-compatible", baseUrl: "", model: "", apiKey: "" });
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const createDialogRef = useRef<HTMLDialogElement>(null);
  async function refresh() { if (window.firstmate) setModels(await window.firstmate.models.list()); }
  useEffect(() => { void refresh(); }, []);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!window.firstmate) return;
    try {
      await window.firstmate.models.save(form);
      setForm({ id: "default-api", provider: "openai-compatible", baseUrl: "", model: "", apiKey: "" });
      setNotice("模型定义与系统安全存储凭证已保存。");
      await refresh();
      setCreating(false);
      createDialogRef.current?.close();
    } catch (error) { setNotice(error instanceof Error ? error.message : "保存失败"); }
  }
  function openCreateDialog() {
    setCreating(true);
    createDialogRef.current?.showModal();
  }
  function closeCreateDialog() {
    setCreating(false);
    createDialogRef.current?.close();
  }
  return <>
    <Header title="模型连接" subtitle="models/ · 支持 OpenAI 与 Anthropic 兼容协议；API Key 仅保存在 macOS 安全存储"><button className="btn primary" onClick={openCreateDialog}>新增模型</button></Header>
    <dialog ref={createDialogRef} className="create-dialog model-dialog" onCancel={closeCreateDialog} onClose={() => setCreating(false)}><form method="dialog" onSubmit={save}><header><div><b>新增模型连接</b><small>模型定义保存到工作区；API Key 仅写入系统安全存储。</small></div><button className="dialog-close" type="button" onClick={closeCreateDialog} aria-label="关闭">×</button></header><label>协议<select value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value as "openai-compatible" | "anthropic-compatible" })}><option value="openai-compatible">OpenAI-compatible</option><option value="anthropic-compatible">Anthropic-compatible</option></select></label><label>模型 ID<input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="例如 default-api" autoFocus /></label><label>Base URL<input value={form.baseUrl} onChange={(event) => setForm({ ...form, baseUrl: event.target.value })} placeholder={form.provider === "anthropic-compatible" ? "https://api.example.com/anthropic" : "https://api.example.com/v1"} /></label><label>模型名<input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} placeholder="例如 gpt-4o-mini" /></label><label>API Key<input type="password" value={form.apiKey} onChange={(event) => setForm({ ...form, apiKey: event.target.value })} placeholder="仅保存到系统安全存储" /></label>{notice && creating && <div className="model-notice">{notice}</div>}<footer><button className="btn" type="button" onClick={closeCreateDialog}>取消</button><button className="btn primary" type="submit">保存模型连接</button></footer></form></dialog>
    <div className="list"><div className="warning">密钥不会写入 YAML、会话、Trace 或 Git。模型运行只由 Electron 主进程读取系统安全存储。</div>{notice && <div className="model-notice">{notice}</div>}<table className="model-table"><thead><tr><th>MODEL</th><th>PROVIDER</th><th>BASE URL</th><th>MODEL</th><th>CREDENTIAL</th><th>STATUS</th></tr></thead><tbody>{models.length === 0 ? <tr><td colSpan={6}>尚未配置模型。点击“新增模型”创建一个兼容接口模型。</td></tr> : models.map((item) => <tr key={item.id}><td><b>{item.id}</b></td><td>{item.provider}</td><td>{item.baseUrl}</td><td>{item.model}</td><td>{item.credentialRef}</td><td><span className={item.configured ? "status ready" : "status off"}>{item.configured ? "READY" : "MISSING KEY"}</span></td></tr>)}</tbody></table></div>
  </>;
}
