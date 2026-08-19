"use client";

import { useEffect, useState } from "react";
import { Header } from "@/app/components/shared";

export default function AgentsPage() {
  const [agents, setAgents] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [content, setContent] = useState("暂无 Agent 定义。请在 javis-wiki/agents/<agent-id>/agent.md 创建定义文件。");
  async function load(path: string) { if (!window.firstmate) return; setSelected(path); setContent(await window.firstmate.workspace.read(path)); }
  useEffect(() => { void window.firstmate?.definitions.list().then((value) => { setAgents(value.agents); if (value.agents[0]) void load(value.agents[0]); }); }, []);
  return <><Header title="Agents" subtitle="agents/ · 角色、权限与运行定义由工作区文件提供"><button className="btn">校验定义</button><button className="btn primary">新建 Agent</button></Header><div className="archive-layout"><aside>{agents.length === 0 ? <p>暂无 Agent 定义</p> : agents.map((agent) => <button key={agent} className={agent === selected ? "selected" : ""} onClick={() => void load(agent)}>{agent.replace("agents/", "")}</button>)}</aside><article><div className="path">{selected || "agents/"}</div><pre className="document-content">{content}</pre></article></div></>;
}
