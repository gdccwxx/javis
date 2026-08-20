import { nav } from "@/app/lib/nav";

export function Header({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return <header className="pagehead"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="actions">{children}</div></header>;
}

export function Status({ value }: { value: string }) {
  return <span className={`status ${value === "RUNNING" || value === "运行中" ? "running" : value === "ENABLED" || value === "READY" || value === "COMMITTED" || value === "健康" || value === "已完成" ? "ready" : "off"}`}>{value}</span>;
}

export { nav };
