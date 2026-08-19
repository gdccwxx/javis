"use client";

import { useEffect, useState } from "react";
import { Header } from "@/app/components/shared";

export default function SkillsPage() {
  const [skills, setSkills] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [content, setContent] = useState("暂无 Skill 定义。Skill 文件应位于 javis-wiki/agents/<agent-id>/skills/*.md。");
  async function load(path: string) { if (!window.firstmate) return; setSelected(path); setContent(await window.firstmate.workspace.read(path)); }
  useEffect(() => { void window.firstmate?.definitions.list().then((value) => { setSkills(value.skills); if (value.skills[0]) void load(value.skills[0]); }); }, []);
  return <><Header title="Skills" subtitle="agents/*/skills/ · 每个 Skill 都是工作区中可版本化的 Markdown 文件"><button className="btn">校验定义</button><button className="btn primary">新建 Skill</button></Header><div className="archive-layout"><aside>{skills.length === 0 ? <p>暂无 Skill 定义</p> : skills.map((skill) => <button key={skill} className={skill === selected ? "selected" : ""} onClick={() => void load(skill)}>{skill.replace("agents/", "")}</button>)}</aside><article><div className="path">{selected || "agents/*/skills/"}</div><pre className="document-content">{content}</pre></article></div></>;
}
