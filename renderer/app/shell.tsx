"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, Status } from "@/app/components/shared";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/chat";
  const active = pathname === "/" ? "chat" : pathname.split("/")[1];
  const [platform, setPlatform] = useState<"mac" | "win">("mac");

  return <div className="fm-app"><div className="proto-title"><div><h2>FirstMate / desktop workspace</h2><p>DESIGN.md v1.0 · Electron · React + Next.js</p></div><div className="platform"><button className={platform === "mac" ? "active" : ""} onClick={() => setPlatform("mac")}>macOS</button><button className={platform === "win" ? "active" : ""} onClick={() => setPlatform("win")}>Windows</button></div></div>
    <div className={`shell ${platform === "win" ? "windows" : ""}`}>
      <header className="appbar"><div className="dots"><i /><i /><i /></div><div className="winmark">▣ FIRSTMATE</div><span className="workspace">~/firstmate-workspace</span><span className="spacer" /><span className="connection"><i />runtime connected</span></header>
      <aside className="sidebar"><Link className="new" href="/chat">＋ 新建会话</Link><nav><span>WORKSPACE</span>{nav.map((item) => <Link key={item.id} href={`/${item.id}`} className={active === item.id ? "active" : ""}><b>{item.icon}</b><label>{item.label}</label>{item.badge && <em>{item.badge}</em>}</Link>)}<div className="recent"><span>RECENT SESSIONS</span><button>FirstMate desktop redesign<small>刚刚 · 5 个 trace 事件</small></button><button>文件协议评审<small>昨天 · 已提交</small></button><button>参考仓库研究<small>08-05 · 2 个产物</small></button></div></nav></aside>
      <main className="main"><section className="view">{children}</section></main>
      <aside className="inspector"><section><header><span>LIVE TRACE</span><Status value="RUNNING" /></header>{[["Plan · 拆解设计重构任务", "17:42:08 · first-mate · 0.3s", ""], ["Read · DESIGN.md", "17:42:09 · stow-context · 0.2s", ""], ["Model · default-api", "17:42:10 · interface-worker · 12.8s", "model"], ["Write · HTML prototype draft", "17:42:23 · outputs/ · 0.6s", "tool"], ["Done · 写入 Git 草稿", "17:42:24 · 3 files changed", "done"]].map(([title, meta, tone]) => <div className="trace" key={title}><i className={tone} /><b>{title}</b><small>{meta}</small></div>)}</section><section><header><span>ACTIVE CONTEXT</span><span>3 FILES</span></header><p>MD · DESIGN.md</p><p>MD · PRD_FirstMate_Mobile.md</p><p>MD · knowledge/decisions/design-system-v1.md</p></section><section><header><span>GIT STATUS</span><em>UNCOMMITTED</em></header><p className="change">DESIGN.md <b className="plus">+78</b></p><p className="change">decision record <b className="plus">+24</b></p><p className="change">prototype <b className="minus">−12</b></p><button className="btn wide">审阅变更</button></section><section><div className="warning">运行完成后，先审阅文件 diff，再创建 Git 提交。系统不会自动提交。</div></section></aside>
    </div></div>;
}
