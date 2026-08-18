import { Header } from "@/app/components/shared";

export default function KnowledgePage() {
  return <>
    <Header title="知识工作区" subtitle="knowledge/ · 文件是唯一真实来源，版本由后台维护">
      <button className="btn">查看来源</button><button className="btn primary">编辑文件</button>
    </Header>
    <div className="knowledge"><aside className="tree"><input className="tree-search" placeholder="筛选文件" /><div className="tree-row folder">⌄ knowledge</div><div className="tree-row indent folder">⌄ decisions</div><button className="tree-row indent selected">◇ design-system-v1.md</button><div className="tree-row indent">◇ file-first-architecture.md</div><div className="tree-row indent folder">⌄ traces</div><div className="tree-row indent">◇ task-20260817-003.json</div><div className="tree-row indent folder">⌄ summaries</div><div className="tree-row indent">◇ desktop-redesign.md</div></aside><article className="document"><div className="path">knowledge / decisions / design-system-v1.md</div><h2>统一设计系统决策</h2><div className="docmeta">来源：session 2026-08-17 · 未提交变更 · 关联 trace 5 个</div><div className="callout">结论：FirstMate v1 默认采用深色工程化工作台。电绿色只用于主动作、连接和当前活动状态；所有运行过程通过 trace 文件可追溯。</div><h3>决策依据</h3><ul><li>文件、Git、模型、Skill 与 Agent 调用需要长期高密度审阅，营销化大留白会浪费工作面积。</li><li>细边框和表面阶梯能清晰区分文件树、编辑区、调用过程和检查器，避免厚重阴影。</li><li>调用轨迹必须显示 Agent、Skill、模型、时间、输入和输出，而不是只给“正在思考”。</li></ul><h3>关联资产</h3><span className="file">DESIGN.md</span> <span className="file">outputs/FirstMate_Desktop_Prototype.html</span></article></div>
  </>;
}
