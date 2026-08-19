"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/app/components/shared";

type Entry = { path: string; kind: "file" | "directory" };

export default function KnowledgePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState("knowledge/decisions/design-system-v1.md");
  const [content, setContent] = useState("正在连接 javis-wiki 工作区…");
  const [filter, setFilter] = useState("");
  const files = useMemo(() => entries.filter((entry) => entry.kind === "file" && entry.path.startsWith("knowledge/") && entry.path.toLowerCase().includes(filter.toLowerCase())), [entries, filter]);

  async function load(path: string) {
    setSelected(path);
    if (!window.firstmate) return;
    try { setContent(await window.firstmate.workspace.read(path)); } catch { setContent("文件尚不存在。发送一条大副任务后，系统会生成 sessions、tasks 与 knowledge/traces 文件。"); }
  }
  useEffect(() => {
    void window.firstmate?.workspace.initialize().then((snapshot) => {
      setEntries(snapshot.files);
      const firstKnowledgeFile = snapshot.files.find((entry) => entry.kind === "file" && entry.path.startsWith("knowledge/"));
      if (firstKnowledgeFile) void load(firstKnowledgeFile.path);
      else setContent("知识目录已初始化。发送一条大副任务后，系统会生成可追溯的 knowledge/traces 文件。");
    });
  }, []);

  return <>
    <Header title="知识工作区" subtitle="javis-wiki / knowledge · 文件是唯一真实来源">
      <button className="btn">查看来源</button><button className="btn primary">编辑文件</button>
    </Header>
    <div className="knowledge"><aside className="tree"><input className="tree-search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="筛选文件" /><div className="tree-row folder">⌄ knowledge</div>{files.length === 0 && <div className="tree-row indent">暂无可读取文件</div>}{files.map((entry) => <button key={entry.path} className={`tree-row indent ${entry.path === selected ? "selected" : ""}`} onClick={() => void load(entry.path)}>◇ {entry.path.replace("knowledge/", "")}</button>)}</aside><article className="document"><div className="path">{selected}</div><h2>{selected.split("/").at(-1) ?? "知识文件"}</h2><div className="docmeta">来源：javis-wiki · 工作区文件直接读取 · 变更经受控 IPC 写入</div><div className="callout">知识、会话、任务和调用记录都以工作区文件为真实来源。页面只呈现状态，不持有独立业务真相。</div><pre className="document-content">{content}</pre></article></div>
  </>;
}
