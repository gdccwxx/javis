"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, Status } from "@/app/components/shared";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/chat";
  const active = pathname === "/" ? "chat" : pathname.split("/")[1];
  const [platform, setPlatform] = useState<"mac" | "win">("mac");
  const [away, setAway] = useState(false);
  const [guardOpen, setGuardOpen] = useState(false);

  return <div className="fm-app"><div className="proto-title"><div><h2>FirstMate / desktop workspace</h2><p>DESIGN.md v1.0 · Electron · React + Next.js</p></div><div className="platform"><button className={platform === "mac" ? "active" : ""} onClick={() => setPlatform("mac")}>macOS</button><button className={platform === "win" ? "active" : ""} onClick={() => setPlatform("win")}>Windows</button></div></div>
    <div className={`shell ${platform === "win" ? "windows" : ""}`}>
      <header className="appbar"><div className="dots"><i /><i /><i /></div><div className="winmark">▣ FIRSTMATE</div><span className="workspace">~/firstmate-workspace</span><span className="spacer" /><button className={guardOpen ? "guard attention" : "guard"} onClick={() => setGuardOpen((value) => !value)}>{guardOpen ? "● 需要人工关注" : "● 保障正常"}</button><button className={away ? "away active" : "away"} aria-pressed={away} onClick={() => setAway((value) => !value)}>{away ? "离开中 · 批量汇总" : "离开模式"}</button><span className="connection"><i />runtime connected</span></header>
      <aside className="sidebar"><Link className="new" href="/chat">＋ 新建会话</Link><nav><span>WORKSPACE</span>{nav.map((item) => <Link key={item.id} href={`/${item.id}`} className={active === item.id ? "active" : ""}><b>{item.icon}</b><label>{item.label}</label>{item.badge && <em>{item.badge}</em>}</Link>)}<div className="recent"><span>RECENT SESSIONS</span><button>FirstMate desktop redesign<small>刚刚 · 5 个 trace 事件</small></button><button>文件协议评审<small>昨天 · 已维护</small></button><button>参考仓库研究<small>08-05 · 2 个产物</small></button></div></nav></aside>
      <main className="main"><section className="view">{children}</section></main>
      <aside className="inspector"><section><header><span>运行保障</span><Status value={guardOpen ? "ATTENTION" : "健康"} /></header><div className="guard-panel"><b>{guardOpen ? "需要人工关注" : "监督链路正常"}</b><small>{guardOpen ? "模型连接校验等待你确认，其他任务仍在安全运行。" : "最后健康：20:31 · 受监督任务：2 · 下次检查：20:36"}</small></div><header className="subhead"><span>外部等待</span><span>2 项</span></header><div className="awaiting"><b>模型连接校验</b><span>结果待确认 · models/reasoning.yaml · 20:38 前</span><button className="btn">查看结果</button></div><div className="awaiting"><b>界面船员回报</b><span>等待回报 · task-20260818-011 · 20:40 前</span><button className="btn">重新触发</button></div></section><section><header><span>LIVE TRACE</span><Status value="RUNNING" /></header>{[["Plan · 拆解设计重构任务", "17:42:08 · first-mate · 0.3s", ""], ["Read · DESIGN.md", "17:42:09 · stow-context · 0.2s", ""], ["Model · default-api", "17:42:10 · interface-worker · 12.8s", "model"], ["Write · HTML prototype draft", "17:42:23 · outputs/ · 0.6s", "tool"], ["Done · 写入维护草稿", "17:42:24 · 3 files changed", "done"]].map(([title, meta, tone]) => <div className="trace" key={title}><i className={tone} /><b>{title}</b><small>{meta}</small></div>)}</section><section><header><span>ACTIVE CONTEXT</span><span>3 FILES</span></header><p>MD · DESIGN.md</p><p>MD · PRD_FirstMate_Mobile.md</p><p>MD · knowledge/decisions/design-system-v1.md</p></section><section><div className="warning">运行完成后会形成可审阅成果。需要你决定的事项会保留在回来后简报中，系统不会自动替你批准。</div></section></aside>
    </div></div>;
}
