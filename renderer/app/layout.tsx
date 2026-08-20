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
  return <html lang="zh-CN">
    <head>
      <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: firstmate:; font-src 'self' data:; connect-src 'self' firstmate:;" />
    </head>
    <body><Shell>{children}</Shell></body>
  </html>;
}
