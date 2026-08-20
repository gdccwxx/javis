"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/app/components/shared";

type Entry = { path: string; kind: "file" | "directory" };
type KnowledgeEntry = { path: string; title: string; time: string; content: string; status: string; agent: string; sessionPath: string; taskPath: string; outputPath: string };

function parseKnowledge(path: string, content: string): KnowledgeEntry {
  const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const metadata = frontmatter?.[1] ?? "";
  const field = (name: string) => metadata.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";
  const title = content.slice(frontmatter?.[0].length ?? 0).match(/^#\s+(.+)$/m)?.[1]?.trim() || path.split("/").at(-1)?.replace(/\.md$/, "") || "未命名知识";
  const time = field("created_at") || content.match(/^- 时间：(.+)$/m)?.[1]?.trim() || "未记录时间";
  return { path, title, time, content, status: field("status") || "历史记录", agent: field("agent") || "first-mate", sessionPath: field("source_session"), taskPath: field("source_task"), outputPath: field("source_output") };
}

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [selected, setSelected] = useState("");
  const [content, setContent] = useState("正在连接 javis-wiki 工作区…");
  const [filter, setFilter] = useState("");
  const [rawView, setRawView] = useState(false);
  const [treeWidth, setTreeWidth] = useState(280);
  const resizing = useRef(false);
  const treeWidthRef = useRef(280);
  const knowledgeRef = useRef<HTMLDivElement>(null);
  const files = useMemo(() => entries.filter((entry) => `${entry.title} ${entry.time} ${entry.content}`.toLowerCase().includes(filter.toLowerCase())), [entries, filter]);
  const current = entries.find((entry) => entry.path === selected);

  async function load(path: string) {
    setSelected(path);
    if (!window.firstmate) return;
    try { setContent(await window.firstmate.workspace.read(path)); } catch { setContent("知识记录无法读取。"); }
  }
  function beginResize(event: React.PointerEvent<HTMLDivElement>) {
    resizing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add("knowledge-resizing");
  }
  function resize(event: React.PointerEvent<HTMLDivElement>) {
    if (!resizing.current) return;
    const containerLeft = knowledgeRef.current?.getBoundingClientRect().left ?? 0;
    const nextWidth = Math.min(480, Math.max(220, Math.round(event.clientX - containerLeft)));
    treeWidthRef.current = nextWidth;
    setTreeWidth(nextWidth);
  }
  function endResize() {
    if (!resizing.current) return;
    resizing.current = false;
    document.body.classList.remove("knowledge-resizing");
    window.localStorage.setItem("firstmate:knowledge-tree-width", String(treeWidthRef.current));
  }
  useEffect(() => {
    const savedWidth = Number(window.localStorage.getItem("firstmate:knowledge-tree-width"));
    if (Number.isFinite(savedWidth) && savedWidth >= 220 && savedWidth <= 480) {
      treeWidthRef.current = savedWidth;
      setTreeWidth(savedWidth);
    }
    void window.firstmate?.workspace.initialize().then(async (snapshot) => {
      const paths = snapshot.files.filter((entry: Entry) => entry.kind === "file" && entry.path.startsWith("knowledge/entries/")).map((entry: Entry) => entry.path);
      const documents = await Promise.all(paths.map(async (path) => parseKnowledge(path, await window.firstmate!.workspace.read(path))));
      documents.sort((left, right) => right.time.localeCompare(left.time));
      setEntries(documents);
      if (documents[0]) await load(documents[0].path);
      else setContent("知识库已初始化。发送一条消息后，会以你的 Prompt 创建知识记录；模型返回后会自动补充总结。");
    });
  }, []);

  return <>
    <Header title="知识库" subtitle="每次对话沉淀为可追溯知识记录"><button className="btn primary" onClick={() => setRawView((value) => !value)} disabled={!selected}>{rawView ? "查看格式化内容" : "查看原始文件"}</button></Header>
    <div ref={knowledgeRef} className="knowledge" style={{ "--knowledge-tree-width": `${treeWidth}px` } as React.CSSProperties}><aside className="tree"><input className="tree-search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="搜索标题、时间或正文内容" /><div className="tree-row folder">⌄ 知识记录</div>{files.length === 0 && <div className="tree-row indent">未找到匹配的知识记录</div>}{files.map((entry) => <button key={entry.path} className={`tree-row indent ${entry.path === selected ? "selected" : ""}`} onClick={() => { setRawView(false); void load(entry.path); }} title={entry.title}><span className="tree-icon" aria-hidden="true">◇</span><span className="tree-title">{entry.title}</span><small>{entry.time}</small></button>)}</aside><div className="tree-resizer" role="separator" aria-label="调整知识列表宽度" aria-orientation="vertical" onPointerDown={beginResize} onPointerMove={resize} onPointerUp={endResize} onPointerCancel={endResize} /><article className="document"><div className="path">{selected || "knowledge/entries/"}</div><h2>{current?.title ?? "知识记录"}</h2><div className="docmeta">{current?.time ?? "未记录时间"} · 来源：javis-wiki · 工作区文件直接读取</div>{current && <div className="knowledge-meta"><span>状态：{current.status}</span><span>智能体：{current.agent}</span>{current.outputPath && <span>已生成产物</span>}</div>}<div className="callout">知识记录按摘要、基本信息、用户输入、处理结果和关联文件组织；原始 YAML 元数据可在“查看原始文件”中检查。</div>{rawView ? <pre className="document-content">{content}</pre> : <MarkdownPreview content={content} />}</article></div>
  </>;
}

function InlineMarkdown({ value }: { value: string }) {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{parts.map((part, index) => part.startsWith("**") && part.endsWith("**")
    ? <strong key={index}>{part.slice(2, -2)}</strong>
    : part.startsWith("`") && part.endsWith("`")
      ? <code key={index}>{part.slice(1, -1)}</code>
      : <Fragment key={index}>{part}</Fragment>)}</>;
}

function MarkdownPreview({ content }: { content: string }) {
  const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
  const lines = withoutFrontmatter.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) { index += 1; continue; }
    if (line.startsWith("```")) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? "").startsWith("```")) { code.push(lines[index] ?? ""); index += 1; }
      nodes.push(<pre className="markdown-code" key={`code-${index}`}>{code.join("\n")}</pre>);
      index += 1;
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Tag = `h${heading[1].length}` as "h1" | "h2" | "h3";
      nodes.push(<Tag key={`heading-${index}`}><InlineMarkdown value={heading[2]} /></Tag>);
      index += 1;
      continue;
    }
    if (/^[-*_]{3,}\s*$/.test(line)) { nodes.push(<hr key={`rule-${index}`} />); index += 1; continue; }
    if (line.startsWith("> ")) { nodes.push(<blockquote key={`quote-${index}`}><InlineMarkdown value={line.slice(2)} /></blockquote>); index += 1; continue; }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index] ?? "")) { items.push((lines[index] ?? "").replace(/^[-*]\s+/, "")); index += 1; }
      nodes.push(<ul key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}><InlineMarkdown value={item} /></li>)}</ul>);
      continue;
    }
    const tableDivider = lines[index + 1] ?? "";
    if (line.includes("|") && /^\s*\|?[\s:|-]+\|[\s:|-]+/.test(tableDivider)) {
      const headers = splitTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && (lines[index] ?? "").includes("|") && (lines[index] ?? "").trim()) {
        rows.push(splitTableRow(lines[index] ?? ""));
        index += 1;
      }
      nodes.push(<div className="markdown-table-wrap" key={`table-${index}`}><table className="markdown-table"><thead><tr>{headers.map((header, headerIndex) => <th key={headerIndex}><InlineMarkdown value={header} /></th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((_, cellIndex) => <td key={cellIndex}><InlineMarkdown value={row[cellIndex] ?? ""} /></td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    nodes.push(<p key={`paragraph-${index}`}><InlineMarkdown value={line} /></p>);
    index += 1;
  }
  return <div className="markdown-preview">{nodes}</div>;
}

function splitTableRow(line: string) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}
