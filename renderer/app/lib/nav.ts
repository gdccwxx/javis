export type View = "chat" | "knowledge" | "agents" | "skills" | "traces" | "archive" | "models" | "git";

export const nav: { id: View; label: string; icon: string; badge?: string }[] = [
  { id: "chat", label: "大副对话", icon: "◌" },
  { id: "knowledge", label: "知识工作区", icon: "▤" },
  { id: "agents", label: "Agents", icon: "⌁" },
  { id: "skills", label: "Skills", icon: "⌘" },
  { id: "traces", label: "调用追溯", icon: "↯" },
  { id: "archive", label: "会话归档", icon: "◫" },
  { id: "models", label: "模型连接", icon: "◇" },
  { id: "git", label: "Git 变更", icon: "⌘", badge: "3" },
];
