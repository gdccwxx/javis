import { Header } from "@/app/components/shared";
import { GitTable } from "@/app/components/data";

export default function GitPage() {
  return <>
    <Header title="Git 变更" subtitle="main · ~/firstmate-workspace · Agent 变更等待确认">
      <button className="btn">提交历史</button>
    </Header>
    <div className="list"><div className="metrics"><div><b>3</b><span>CHANGED FILES</span></div><div><b className="plus">+116</b><span>ADDITIONS</span></div><div><b className="minus">−18</b><span>DELETIONS</span></div></div><GitTable /><div className="commit"><b>创建本地提交</b><input defaultValue="feat(design): adopt dark agent workspace system" /><footer><span>已选择 3 个文件</span><button className="btn primary">确认提交</button></footer></div></div>
  </>;
}
