import { Header } from "@/app/components/shared";
import { TraceTable } from "@/app/components/data";

export default function TracesPage() {
  return <>
    <Header title="调用追溯" subtitle="knowledge/traces/ · 读取、模型、工具、写入和产物均可反查">
      <button className="btn">导出 Trace</button><button className="btn primary">打开任务</button>
    </Header>
    <div className="list"><div className="metrics"><div><b>5</b><span>TRACE EVENTS</span></div><div><b>13.9s</b><span>ELAPSED</span></div><div><b>3</b><span>OUTPUT FILES</span></div></div><TraceTable /></div>
  </>;
}
