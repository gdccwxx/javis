import { Header } from "@/app/components/shared";
import { CardGrid } from "@/app/components/data";

export default function SkillsPage() {
  return <>
    <Header title="Skills" subtitle="agents/*/skills/ · 每个 Skill 都是可编辑、可版本化的 Markdown 文件">
      <button className="btn">校验定义</button><button className="btn primary">新建 Skill</button>
    </Header>
    <div className="list"><div className="filter"><input placeholder="搜索 Agent、Skill、模型或路径" /><button className="btn">仅启用</button></div><CardGrid type="skills" /></div>
  </>;
}
