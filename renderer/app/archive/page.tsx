import { Header } from "@/app/components/shared";
import { CardGrid } from "@/app/components/data";

export default function ArchivePage() {
  return <>
    <Header title="会话归档" subtitle="sessions/ · 原始会话、AI 摘要、决策与恢复指针按文件保存">
      <button className="btn">筛选日期</button><button className="btn primary">新建会话</button>
    </Header>
    <div className="list"><div className="filter"><input placeholder="搜索会话、结论、文件或 Agent" /><button className="btn">仅有决策</button><button className="btn">未提交</button></div><CardGrid type="archive" /></div>
  </>;
}
