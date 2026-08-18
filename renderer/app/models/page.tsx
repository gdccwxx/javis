import { Header } from "@/app/components/shared";
import { ModelTable } from "@/app/components/data";

export default function ModelsPage() {
  return <>
    <Header title="模型连接" subtitle="models/ · 只保存 API 定义和凭证引用，不保存模型或密钥">
      <button className="btn primary">新增模型</button>
    </Header>
    <div className="list"><div className="warning">凭证只存于系统安全存储。页面、trace、会话和 Git 文件不会读取或显示 API 密钥原文。</div><div style={{ marginTop: 18 }}><ModelTable /></div></div>
  </>;
}
