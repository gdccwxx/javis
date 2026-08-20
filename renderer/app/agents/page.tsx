"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/app/components/shared";

type ModelDefinition = { id: string; configured: boolean };

export default function AgentsPage() {
  const [agents, setAgents] = useState<string[]>([]);
  const [models, setModels] = useState<ModelDefinition[]>([]);
  const [selected, setSelected] = useState("");
  const [content, setContent] = useState("暂无 Agent 定义。请在 javis-wiki/agents/<agent-id>/agent.md 创建定义文件。");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [agentName, setAgentName] = useState("");
  const createDialogRef = useRef<HTMLDialogElement>(null);
  async function load(path: string) { if (!window.firstmate) return; setSelected(path); setContent(await window.firstmate.workspace.read(path)); }
  async function refresh() {
    if (!window.firstmate) return;
    const value = await window.firstmate.definitions.list();
    setAgents(value.agents);
    return value;
  }
  async function save() {
    if (!window.firstmate || !selected) return;
    try { await window.firstmate.definitions.save(selected, content); setNotice("Agent 定义已保存，并已写入 Trace。"); } catch (error) { setNotice(error instanceof Error ? error.message : "保存失败"); }
  }
  async function create() {
    if (!window.firstmate) return;
    if (!agentId.trim() || !agentName.trim()) {
      setNotice("请填写 Agent ID 和名称。");
      return;
    }
    try {
      const created = await window.firstmate.definitions.create("agent", { agentId, name: agentName });
      await refresh();
      await load(created.relativePath);
      setNotice("新 Agent 已创建，并已写入 Trace。");
      setAgentId("");
      setAgentName("");
      setCreating(false);
      createDialogRef.current?.close();
    } catch (error) { setNotice(error instanceof Error ? error.message : "新建 Agent 失败"); }
  }
  useEffect(() => { void refresh().then((value) => { if (value?.agents[0]) void load(value.agents[0]); }); }, []);
  useEffect(() => { void window.firstmate?.models.list().then(setModels); }, []);
  function setAgentModel(modelId: string) {
    if (!selected) return;
    const next = content.match(/^model:\s*.*$/m)
      ? content.replace(/^model:\s*.*$/m, `model: ${modelId}`)
      : content.replace(/^---\s*\n/, `---\nmodel: ${modelId}\n`);
    setContent(next);
    setNotice(`已选择默认模型 ${modelId}；点击“保存定义”后写入 Agent 文件。`);
  }
  function openCreateDialog() {
    setCreating(true);
    createDialogRef.current?.showModal();
  }
  function closeCreateDialog() {
    setCreating(false);
    createDialogRef.current?.close();
  }
  return <><Header title="智能体" subtitle="agents/ · 角色、权限、模型与运行定义由工作区文件提供"><select className="model-picker" value={content.match(/^model:\s*(.+)$/m)?.[1]?.trim() ?? ""} onChange={(event) => setAgentModel(event.target.value)} disabled={!selected} aria-label="设置智能体默认模型"><option value="">选择默认模型</option>{models.map((model) => <option key={model.id} value={model.id}>{model.id}{model.configured ? "" : "（缺少凭证）"}</option>)}</select><button className="btn" onClick={() => void save()} disabled={!selected}>保存定义</button><button className="btn primary" onClick={openCreateDialog}>新建智能体</button></Header><dialog ref={createDialogRef} className="create-dialog" onCancel={closeCreateDialog} onClose={() => setCreating(false)}><form method="dialog" onSubmit={(event) => { event.preventDefault(); void create(); }}><header><div><b>新建智能体</b><small>创建后会生成可编辑的 Markdown 定义文件。</small></div><button className="dialog-close" type="button" onClick={closeCreateDialog} aria-label="关闭">×</button></header><label>智能体 ID<input value={agentId} onChange={(event) => setAgentId(event.target.value)} placeholder="例如 researcher" autoFocus /></label><label>显示名称<input value={agentName} onChange={(event) => setAgentName(event.target.value)} placeholder="例如 研究智能体" /></label>{notice && creating && <div className="model-notice">{notice}</div>}<footer><button className="btn" type="button" onClick={closeCreateDialog}>取消</button><button className="btn primary" type="submit">创建智能体</button></footer></form></dialog><div className="archive-layout"><aside>{agents.length === 0 ? <p>暂无智能体定义</p> : agents.map((agent) => <button key={agent} className={agent === selected ? "selected" : ""} onClick={() => void load(agent)}>{agent.replace("agents/", "")}</button>)}</aside><article><div className="path">{selected || "agents/"}</div>{notice && <div className="model-notice">{notice}</div>}<textarea className="definition-editor" value={content} onChange={(event) => setContent(event.target.value)} aria-label="智能体定义 Markdown 编辑器" /></article></div></>;
}
