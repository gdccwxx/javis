import { Header } from "@/app/components/shared";
import { CardGrid } from "@/app/components/data";

export default function AgentsPage() {
  return <>
    <Header title="Agents" subtitle="agents/ · 角色、模型、权限、Skill 与运行状态均由文件定义">
      <button className="btn">校验所有定义</button><button className="btn primary">新建 Agent</button>
    </Header>
    <div className="list"><div className="filter"><input placeholder="搜索名称、模型、权限或文件路径" /><button className="btn">仅启用</button><button className="btn">按状态</button></div><CardGrid type="agents" /></div>
  </>;
}
