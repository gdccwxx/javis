"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/app/components/shared";

export default function SkillsPage() {
  const [skills, setSkills] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [content, setContent] = useState("暂无 Skill 定义。Skill 文件应位于 javis-wiki/agents/<agent-id>/skills/*.md。");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [skillName, setSkillName] = useState("");
  const createDialogRef = useRef<HTMLDialogElement>(null);
  async function load(path: string) { if (!window.firstmate) return; setSelected(path); setContent(await window.firstmate.workspace.read(path)); }
  async function refresh() {
    if (!window.firstmate) return;
    const value = await window.firstmate.definitions.list();
    setSkills(value.skills);
    return value;
  }
  async function save() {
    if (!window.firstmate || !selected) return;
    try { await window.firstmate.definitions.save(selected, content); setNotice("Skill 文件已保存，并已写入 Trace。"); } catch (error) { setNotice(error instanceof Error ? error.message : "保存失败"); }
  }
  async function create() {
    if (!window.firstmate) return;
    if (!skillName.trim()) {
      setNotice("请填写 Skill 名称。");
      return;
    }
    try {
      const created = await window.firstmate.definitions.create("skill", { agentId: "shared", name: skillName });
      await refresh();
      await load(created.relativePath);
      setNotice("新 Skill 已创建，并已写入 Trace。");
      setSkillName("");
      setCreating(false);
      createDialogRef.current?.close();
    } catch (error) { setNotice(error instanceof Error ? error.message : "新建 Skill 失败"); }
  }
  useEffect(() => { void refresh().then((value) => { if (value?.skills[0]) void load(value.skills[0]); }); }, []);
  function openCreateDialog() {
    setCreating(true);
    createDialogRef.current?.showModal();
  }
  function closeCreateDialog() {
    setCreating(false);
    createDialogRef.current?.close();
  }
  return <><Header title="Skills" subtitle="skills/ · 工作区共享、可由多个 Agent 引用的 Markdown 工作流程"><button className="btn" onClick={() => void save()} disabled={!selected}>保存 Skill</button><button className="btn primary" onClick={openCreateDialog}>新建 Skill</button></Header><dialog ref={createDialogRef} className="create-dialog" onCancel={closeCreateDialog} onClose={() => setCreating(false)}><form method="dialog" onSubmit={(event) => { event.preventDefault(); void create(); }}><header><div><b>新建共享 Skill</b><small>Skill 存放在工作区，可被多个 Agent 在定义文件中引用。</small></div><button className="dialog-close" type="button" onClick={closeCreateDialog} aria-label="关闭">×</button></header><label>Skill 名称<input value={skillName} onChange={(event) => setSkillName(event.target.value)} placeholder="例如 verify-sources" autoFocus /></label>{notice && creating && <div className="model-notice">{notice}</div>}<footer><button className="btn" type="button" onClick={closeCreateDialog}>取消</button><button className="btn primary" type="submit">创建 Skill</button></footer></form></dialog><div className="archive-layout"><aside>{skills.length === 0 ? <p>暂无共享 Skill</p> : skills.map((skill) => <button key={skill} className={skill === selected ? "selected" : ""} onClick={() => void load(skill)}>{skill.replace("skills/", "")}</button>)}</aside><article><div className="path">{selected || "skills/"}</div>{notice && <div className="model-notice">{notice}</div>}<textarea className="definition-editor" value={content} onChange={(event) => setContent(event.target.value)} aria-label="Skill Markdown 编辑器" /></article></div></>;
}
