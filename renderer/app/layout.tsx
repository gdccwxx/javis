import type { Metadata } from "next";
import "./globals.css";
import "./supervision.css";
import "./calibration.css";
import Shell from "@/app/shell";

export const metadata: Metadata = {
  title: "FirstMate",
  description: "文件优先的桌面 Agent 工作台",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><Shell>{children}</Shell></body></html>;
}
