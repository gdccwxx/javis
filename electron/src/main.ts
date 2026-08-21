import { app, BrowserWindow, dialog, ipcMain, Menu, net, protocol, safeStorage } from "electron";
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, normalize, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

app.setName("FirstMate");
const APP_ICON = resolve(__dirname, "../assets/firstmate-icon.png");

protocol.registerSchemesAsPrivileged([{ scheme: "firstmate", privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

const DEFAULT_WORKSPACE = "/Users/dechenguo/WorkBuddy/2026-08-05-17-29-01/javis-wiki";
const CONTROLLED_ROOTS = ["tasks", "outputs", "knowledge", "sessions"];
type Entry = { path: string; kind: "file" | "directory" };
type Provider = "openai-compatible" | "anthropic-compatible";
type ModelDefinition = { id: string; provider: Provider; baseUrl: string; model: string; credentialRef: string; configured: boolean };
type AgentDefinition = { id: string; title: string; modelId: string; skills: string[]; capabilities: string[]; writeScope: string[]; enabled: boolean; prompt: string; path: string };
type TaskStatus = "queued" | "running" | "waiting_credentials" | "waiting_input" | "completed" | "failed" | "cancelled";
type TracePhase = "PLAN" | "QUEUED" | "READ" | "MODEL" | "TOOL" | "WRITE" | "DONE" | "FAILED" | "BLOCKED" | "DECISION";
type TraceEvent = {
  id: string;
  taskId: string;
  time: string;
  phase: TracePhase;
  status: TaskStatus | "recorded";
  agentId: string;
  skillIds: string[];
  modelId?: string;
  inputFiles: string[];
  outputFiles: string[];
  durationMs?: number;
  detail: string;
};
type BriefItem = { id: string; title: string; detail: string; status: string; path: string };
type WorkspaceBrief = { generatedAt: string; decisions: BriefItem[]; completed: BriefItem[]; inProgress: BriefItem[]; next: BriefItem[] };
type SupervisionSnapshot = {
  status: "healthy" | "attention";
  message: string;
  detail: string;
  activeTasks: number;
  waitingTotal: number;
  waitingTasks: BriefItem[];
  recentEvents: TraceEvent[];
  contextFiles: string[];
};
type SessionRecord = { id: string; path: string; title: string; createdAt: string; status: string; agentId: string; summary: string; hasOutput: boolean };
let mainWindow: BrowserWindow | null = null;
let workspaceRoot = DEFAULT_WORKSPACE;

function now() { return new Date().toISOString(); }
function knowledgeTime(date = new Date()) {
  const part = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}/${part(date.getMonth() + 1)}/${part(date.getDate())} ${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`;
}
function knowledgeTitle(value: string) {
  const summary = value.match(/^(?:摘要|总结|summary)\s*[:：]\s*(.+)$/im)?.[1] ?? value.split(/\r?\n/).find((line) => line.trim() && !line.trim().startsWith("#")) ?? value;
  return summary.replace(/[*_`#]/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "未命名知识";
}
function markdownQuote(value: string) {
  return value.trim().split(/\r?\n/).map((line) => `> ${line || " "}`).join("\n");
}
function outputSummary(value: string) {
  const clean = value.replace(/^---[\s\S]*?---\s*/m, "").replace(/^#{1,6}\s+.+$/gm, "").replace(/[*_`>#|]/g, " ").replace(/\s+/g, " ").trim();
  return clean.slice(0, 180) || "任务已完成，详见处理结果。";
}
function writeKnowledge(task: string, prompt: string, output?: string) {
  const taskPath = `tasks/${task}.yaml`;
  const taskSource = existsSync(assertWorkspacePath(taskPath)) ? readFileSync(assertWorkspacePath(taskPath), "utf8") : "";
  const agentId = yamlField(taskSource, "agent") || "first-mate";
  const status = output ? "已完成" : "待处理";
  const title = agentId === "journal"
    ? `日记 · ${knowledgeTime().slice(0, 10).replace(/\//g, "-")}`
    : knowledgeTitle(prompt).replace(/^\d{4}[/-]\d{1,2}[/-]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?\s*[-—:：]?\s*/, "");
  const relativePath = `knowledge/entries/${task}.md`;
  const resultSection = output
    ? `## 处理结果\n\n${output.trim()}\n`
    : "## 处理结果\n\n> 任务已创建，等待智能体执行。\n";
  writeControlled(relativePath, `---
type: knowledge-entry
id: ${task}
created_at: ${now()}
status: ${status}
agent: ${agentId}
source_session: sessions/${task}.md
source_task: ${taskPath}
source_output: ${output ? `outputs/${task}/result.md` : ""}
---

# ${title}

## 摘要

${output ? outputSummary(output) : "已记录用户输入，等待任务结果补充。"}

## 基本信息

| 字段 | 内容 |
| --- | --- |
| 状态 | ${status} |
| 执行智能体 | ${agentId} |
| 创建时间 | ${knowledgeTime()} |
| 来源会话 | \`sessions/${task}.md\` |
| 来源任务 | \`${taskPath}\` |
${output ? `| 结果产物 | \`outputs/${task}/result.md\` |
` : ""}

## 用户输入

${markdownQuote(prompt)}

${resultSection}
## 关联文件

- \`sessions/${task}.md\`
- \`${taskPath}\`
- \`knowledge/traces/${task}.json\`
${output ? `- \`outputs/${task}/result.md\`
` : ""}`);
  return relativePath;
}
function migrateLegacyKnowledgeEntries() {
  const directory = resolve(workspaceRoot, "knowledge/entries");
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !/^task-.+\.md$/.test(entry.name)) continue;
    const task = entry.name.replace(/\.md$/, "");
    const knowledgePath = `knowledge/entries/${entry.name}`;
    const source = readFileSync(assertWorkspacePath(knowledgePath), "utf8");
    if (source.startsWith("---\ntype: knowledge-entry\n")) continue;
    const taskPath = `tasks/${task}.yaml`;
    if (!existsSync(assertWorkspacePath(taskPath))) continue;
    const taskSource = readFileSync(assertWorkspacePath(taskPath), "utf8");
    const goal = taskGoal(taskSource);
    const outputPath = `outputs/${task}/result.md`;
    const output = existsSync(assertWorkspacePath(outputPath))
      ? readFileSync(assertWorkspacePath(outputPath), "utf8").replace(/^#.*?\n+/s, "").trim()
      : undefined;
    writeKnowledge(task, goal || "历史知识记录", output);
  }
}
function taskGoal(source: string) {
  const raw = source.match(/^goal:\s*(.+)$/m)?.[1]?.trim();
  if (!raw) return "";
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : "";
  } catch {
    return raw.replace(/^["']|["']$/g, "");
  }
}
function attachedMaterialPaths(goal: string) {
  const paths = Array.from(goal.matchAll(/^\s*-\s+(materials\/[^\r\n]+)\s*$/gm), (match) => match[1]?.trim() ?? "");
  return [...new Set(paths)].filter((path) => /^materials\/[^/]+$/.test(path));
}
function taskMaterialPaths(source: string) {
  const input = source.match(/^input_files:\s*\[([^\]]*)\]\s*$/m)?.[1] ?? "";
  return [...new Set(input.split(",").map((item) => item.trim()).filter((path) => /^materials\/[^/]+$/.test(path)))];
}
function materialContext(paths: string[]) {
  const files: string[] = [];
  const sections: string[] = [];
  let remaining = 60000;
  for (const relativePath of paths) {
    if (remaining <= 0) break;
    try {
      const fullPath = assertWorkspacePath(relativePath);
      const extension = relativePath.split(".").at(-1)?.toLowerCase();
      if (extension !== "md" && extension !== "txt") {
        sections.push(`### ${relativePath}\n\n此素材已导入，但当前本地 Runtime 仅能直接读取 Markdown / TXT；请基于文件名保留引用，不要假设其内容。`);
        files.push(relativePath);
        continue;
      }
      const source = readFileSync(fullPath, "utf8");
      const excerpt = source.slice(0, remaining);
      sections.push(`### ${relativePath}\n\n${excerpt}${source.length > excerpt.length ? "\n\n[内容已截断]" : ""}`);
      files.push(relativePath);
      remaining -= excerpt.length;
    } catch {
      sections.push(`### ${relativePath}\n\n素材无法读取。不要编造其内容。`);
      files.push(relativePath);
    }
  }
  return { files, content: sections.join("\n\n---\n\n") };
}
type ParsedToolCall = { name: "Read" | "ReadMultipleFiles"; paths: string[] };
function parseModelToolCall(output: string): ParsedToolCall | null {
  const name = output.match(/<invoke\s+name="([^"]+)">/i)?.[1];
  if (name !== "Read" && name !== "ReadMultipleFiles") return null;
  const singlePath = output.match(/<parameter\s+name="file_path">([\s\S]*?)<\/parameter>/i)?.[1]?.trim();
  const multiplePaths = output.match(/<parameter\s+name="file_paths">([\s\S]*?)<\/parameter>/i)?.[1]?.trim();
  if (name === "Read" && singlePath) return { name, paths: [singlePath] };
  if (name === "ReadMultipleFiles" && multiplePaths) {
    try {
      const parsed: unknown = JSON.parse(multiplePaths);
      if (Array.isArray(parsed) && parsed.every((path) => typeof path === "string")) return { name, paths: parsed };
    } catch {
      return null;
    }
  }
  return null;
}
function executeModelToolCall(call: ParsedToolCall) {
  const safePaths = call.paths.filter((path) => path && !path.includes("\0") && !path.startsWith("/") && !path.includes("..")).slice(0, 12);
  if (safePaths.length === 0) return { files: [] as string[], content: "工具调用未提供有效的工作区相对路径。" };
  const result = materialContext(safePaths);
  return { ...result, content: `工具 ${call.name} 的执行结果：\n\n${result.content || "未读取到可用内容。"}` };
}
function sessionConversation(task: string) {
  const source = readFileSync(assertWorkspacePath(`sessions/${task}.md`), "utf8");
  const lines = source.split(/\r?\n/);
  const turns: string[] = [];
  let section = "";
  const buffer: string[] = [];
  const flush = () => {
    const value = buffer.join("\n").trim();
    if (!value || !section) return;
    if (section.startsWith("用户消息")) turns.push(`用户：${value}`);
    if (section.startsWith("First Mate 输出")) turns.push(`助手：${value}`);
  };
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/)?.[1];
    if (heading) {
      flush();
      section = heading;
      buffer.length = 0;
      continue;
    }
    if (section && section !== "当前摘要" && section !== "摘要") buffer.push(line);
  }
  flush();
  return turns.join("\n\n");
}
function updateSessionResult(task: string, status: "已完成" | "失败", output: string) {
  const relativePath = `sessions/${task}.md`;
  const source = readFileSync(assertWorkspacePath(relativePath), "utf8");
  const summary = status === "已完成"
    ? `已完成。核心结果：${knowledgeTitle(output)}`
    : `任务失败：${output}`;
  const turn = (source.match(/^## 用户消息/gm) ?? []).length;
  const withoutSummary = source
    .replace(/\n## 摘要[\s\S]*?(?=\n## 用户消息 · 第|\n## First Mate 输出 · 第|$)/g, "")
    .replace(/\n## 当前摘要[\s\S]*$/g, "")
    .trimEnd();
  const next = withoutSummary
    .replace(/^- 状态：.*$/m, `- 状态：${status}`)
    + `\n\n## First Mate 输出 · 第 ${turn} 轮\n\n${output.trim()}\n\n## 当前摘要\n\n${summary}\n`;
  writeControlled(relativePath, next);
  return relativePath;
}
function sessionRecord(path: string): SessionRecord | null {
  try {
    const source = readFileSync(assertWorkspacePath(path), "utf8");
    const id = basename(path, ".md");
    const createdAt = source.match(/^- 时间：(.+)$/m)?.[1]?.trim() ?? "";
    const status = source.match(/^- 状态：(.+)$/m)?.[1]?.trim() ?? "未知";
    const summary = source.match(/^## 摘要\s*\n+([\s\S]*?)(?:\n## |$)/m)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
    const firstMessage = source.match(/^## 用户消息(?: · 第 \d+ 轮)?\s*\n+([\s\S]*?)(?:\n## |$)/m)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
    const taskSource = existsSync(assertWorkspacePath(`tasks/${id}.yaml`)) ? readFileSync(assertWorkspacePath(`tasks/${id}.yaml`), "utf8") : "";
    return { id, path, title: knowledgeTitle(firstMessage || summary || id), createdAt, status, agentId: yamlField(taskSource, "agent") || "first-mate", summary, hasOutput: existsSync(assertWorkspacePath(`outputs/${id}/result.md`)) };
  } catch { return null; }
}
function taskId() { return `task-${Date.now()}`; }
function ensureWorkspace(root = workspaceRoot) {
  for (const directory of ["agents", "skills", "knowledge", "knowledge/entries", "knowledge/traces", "knowledge/decisions", "knowledge/summaries", "sessions", "tasks", "outputs", "models", "materials"]) mkdirSync(resolve(root, directory), { recursive: true });
  const agentPath = resolve(root, "agents/first-mate/agent.md");
  const skillPath = resolve(root, "skills/stow-context.md");
  if (!existsSync(agentPath)) writeFileSync(agentPath, "---\nid: first-mate\nmodel: default-api\nskills: [stow-context]\nwrite_scope: [tasks, outputs, knowledge, sessions]\n---\n\n# First Mate\n\n负责读取用户目标、创建任务、监督受控产物并沉淀会话。\n", "utf8");
  if (!existsSync(skillPath)) writeFileSync(skillPath, "# stow-context\n\n将会话、任务和 Trace 整理到 javis-wiki 的受控目录。\n", "utf8");
}
function assertWorkspacePath(input: string, writable = false): string {
  if (!input || input.includes("\0") || input.startsWith("/")) throw new Error("无效文件路径");
  const workspaceRealRoot = realpathSync(workspaceRoot);
  const fullPath = resolve(workspaceRealRoot, input);
  const fromRoot = relative(workspaceRealRoot, fullPath);
  if (fromRoot.startsWith("..") || fromRoot === "" || normalize(fromRoot) === ".") throw new Error("只能访问当前工作区中的文件");
  if (writable && !CONTROLLED_ROOTS.some((directory) => fromRoot === directory || fromRoot.startsWith(`${directory}/`))) throw new Error("只允许写入 tasks、outputs、knowledge、sessions");
  const existingPath = writable ? dirname(fullPath) : fullPath;
  if (existsSync(existingPath) && relative(workspaceRealRoot, realpathSync(existingPath)).startsWith("..")) throw new Error("不允许通过符号链接访问工作区外的路径");
  return fullPath;
}
function listTree(current = workspaceRoot, prefix = ""): Entry[] {
  return readdirSync(current, { withFileTypes: true }).filter((entry) => !entry.name.startsWith(".") && entry.name !== "node_modules" && !entry.isSymbolicLink()).flatMap((entry) => {
    const itemPath = `${prefix}${entry.name}`;
    const fullPath = resolve(current, entry.name);
    if (lstatSync(fullPath).isSymbolicLink()) return [];
    return entry.isDirectory() ? [{ path: itemPath, kind: "directory" as const }, ...listTree(fullPath, `${itemPath}/`)] : [{ path: itemPath, kind: "file" as const }];
  });
}
function workspaceSnapshot() { ensureWorkspace(); return { name: basename(workspaceRoot), root: workspaceRoot, files: listTree().slice(0, 500) }; }
function writeControlled(relativePath: string, content: string) {
  const path = assertWorkspacePath(relativePath, true);
  mkdirSync(dirname(path), { recursive: true });
  if (relative(realpathSync(workspaceRoot), realpathSync(dirname(path))).startsWith("..")) throw new Error("不允许通过符号链接写入工作区外的路径");
  writeFileSync(path, content, "utf8");
  return { relativePath };
}
function importMaterials() {
  const result = dialog.showOpenDialogSync(mainWindow!, {
    title: "导入素材",
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "支持的素材", extensions: ["md", "txt", "pdf", "docx", "pptx", "xlsx", "png", "jpg", "jpeg", "webp"] }, { name: "所有文件", extensions: ["*"] }],
  });
  if (!result?.length) return [];
  const materialRoot = resolve(workspaceRoot, "materials");
  mkdirSync(materialRoot, { recursive: true });
  const imported = result.map((sourcePath) => {
    const originalName = basename(sourcePath).replace(/[^\p{L}\p{N}._ -]/gu, "-");
    const extensionIndex = originalName.lastIndexOf(".");
    const base = extensionIndex > 0 ? originalName.slice(0, extensionIndex) : originalName;
    const extension = extensionIndex > 0 ? originalName.slice(extensionIndex) : "";
    let targetName = originalName;
    let counter = 2;
    while (existsSync(resolve(materialRoot, targetName))) targetName = `${base}-${counter++}${extension}`;
    copyFileSync(sourcePath, resolve(materialRoot, targetName));
    return `materials/${targetName}`;
  });
  return imported;
}
function readTaskStatus(task: string) {
  const file = assertWorkspacePath(`tasks/${task}.yaml`);
  return readFileSync(file, "utf8").match(/^status:\s*(.+)$/m)?.[1]?.trim() ?? "unknown";
}
function updateTaskStatus(task: string, status: TaskStatus) {
  const relativePath = `tasks/${task}.yaml`;
  const source = readFileSync(assertWorkspacePath(relativePath), "utf8");
  writeControlled(relativePath, source.replace(/^status:\s*.*$/m, `status: ${status}`).replace(/^updated_at:.*$/m, "").trimEnd() + `\nupdated_at: ${now()}\n`);
}
function updateTaskGoal(task: string, goal: string) {
  const relativePath = `tasks/${task}.yaml`;
  const source = readFileSync(assertWorkspacePath(relativePath), "utf8");
  const materialFiles = [...new Set([...taskMaterialPaths(source), ...attachedMaterialPaths(goal)])];
  const inputFiles = [`sessions/${task}.md`, `knowledge/entries/${task}.md`, ...materialFiles];
  const next = source
    .replace(/^status:\s*.*$/m, "status: queued")
    .replace(/^goal:\s*.*$/m, `goal: ${JSON.stringify(goal)}`)
    .replace(/^input_files:\s*.*$/m, `input_files: [${inputFiles.join(", ")}]`)
    .replace(/^updated_at:.*$/m, "")
    .trimEnd() + `\nupdated_at: ${now()}\n`;
  writeControlled(relativePath, next);
}
function appendTrace(task: string, phase: TracePhase, input: {
  status?: TaskStatus | "recorded";
  agentId?: string;
  skillIds?: string[];
  modelId?: string;
  inputFiles?: string[];
  outputFiles?: string[];
  durationMs?: number;
  detail: string;
}) {
  const relativePath = `knowledge/traces/${task}.json`;
  const tracePath = assertWorkspacePath(relativePath, true);
  const rawEvents: unknown = existsSync(tracePath) ? JSON.parse(readFileSync(tracePath, "utf8")) : [];
  const events = Array.isArray(rawEvents) ? rawEvents : [];
  const event: TraceEvent = {
    id: `${task}-${events.length + 1}`,
    taskId: task,
    time: now(),
    phase,
    status: input.status ?? "recorded",
    agentId: input.agentId ?? "first-mate",
    skillIds: input.skillIds ?? ["stow-context"],
    inputFiles: input.inputFiles ?? [],
    outputFiles: input.outputFiles ?? [],
    ...(input.modelId ? { modelId: input.modelId } : {}),
    ...(input.durationMs === undefined ? {} : { durationMs: input.durationMs }),
    detail: input.detail,
  };
  events.push(event);
  writeControlled(relativePath, `${JSON.stringify(events, null, 2)}\n`);
  return { relativePath, events };
}
function credentialFile() { return resolve(app.getPath("userData"), "firstmate-credentials.json"); }
function credentialStore(): Record<string, string> { return existsSync(credentialFile()) ? JSON.parse(readFileSync(credentialFile(), "utf8")) : {}; }
function saveCredential(reference: string, secret: string) {
  if (!safeStorage.isEncryptionAvailable()) throw new Error("当前系统安全存储不可用，无法保存 API Key");
  const values = credentialStore();
  values[reference] = safeStorage.encryptString(secret).toString("base64");
  writeFileSync(credentialFile(), `${JSON.stringify(values, null, 2)}\n`, "utf8");
}
function readCredential(reference: string) {
  const encrypted = credentialStore()[reference];
  if (!encrypted || !safeStorage.isEncryptionAvailable()) return null;
  return safeStorage.decryptString(Buffer.from(encrypted, "base64"));
}
function yamlField(source: string, field: string) { return source.match(new RegExp(`^${field}:\\s*[\"']?([^\\n\"']+)[\"']?\\s*$`, "m"))?.[1]?.trim() ?? ""; }
function modelDefinitions(): ModelDefinition[] {
  ensureWorkspace();
  return readdirSync(resolve(workspaceRoot, "models"), { withFileTypes: true }).filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name)).flatMap((entry) => {
    try {
      const source = readFileSync(resolve(workspaceRoot, "models", entry.name), "utf8");
      const credentialRef = yamlField(source, "credential_ref");
      const baseUrl = yamlField(source, "base_url");
      const declaredProvider = yamlField(source, "provider");
      const provider: Provider = declaredProvider === "anthropic-compatible" || baseUrl.includes("/anthropic") ? "anthropic-compatible" : "openai-compatible";
      return [{ id: yamlField(source, "id") || entry.name.replace(/\.ya?ml$/, ""), provider, baseUrl, model: yamlField(source, "model"), credentialRef, configured: Boolean(credentialRef && readCredential(credentialRef)) }];
    } catch { return []; }
  });
}
function yamlList(source: string, field: string) {
  const value = source.match(new RegExp(`^${field}:\\s*\\[([^\\]]*)\\]\\s*$`, "m"))?.[1] ?? "";
  return value.split(",").map((item) => item.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
}
function agentDefinition(agentId: string): AgentDefinition {
  const safeId = agentId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const relativePath = `agents/${safeId}/agent.md`;
  const source = readFileSync(assertWorkspacePath(relativePath), "utf8");
  const normalizedSource = source.replace(/^---\s*\n---\s*\n/, "---\n");
  const frontmatter = normalizedSource.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const metadata = frontmatter?.[1] ?? normalizedSource;
  const prompt = frontmatter?.[2]?.trim() ?? normalizedSource.trim();
  const id = yamlField(metadata, "id");
  if (!id) throw new Error(`Agent 定义缺少 id：${relativePath}`);
  return {
    id,
    title: prompt.match(/^#\s+(.+)$/m)?.[1]?.trim() || id,
    modelId: yamlField(metadata, "model") || "default-api",
    skills: yamlList(metadata, "skills"),
    capabilities: yamlList(metadata, "capabilities"),
    writeScope: yamlList(metadata, "write_scope"),
    enabled: yamlField(metadata, "enabled") !== "false",
    prompt,
    path: relativePath,
  };
}
function routeAgent(goal: string) {
  if (/^\s*(?:日记|diary|journal)\s*[：:]/i.test(goal)) {
    try {
      const journal = agentDefinition("journal");
      if (journal.enabled) return journal;
    } catch {
      // journal Agent 未配置时回退到大副。
    }
  }
  return agentDefinition("first-mate");
}
function workspaceFiles(prefix: string, matcher: (path: string) => boolean) {
  return workspaceSnapshot().files.filter((item) => item.kind === "file" && item.path.startsWith(prefix) && matcher(item.path)).map((item) => item.path);
}
function briefTitle(value: string) {
  return value.replace(/^["']|["']$/g, "").replace(/\s+/g, " ").trim().slice(0, 88) || "未命名事项";
}
function traceSummary(taskId: string) {
  const relativePath = `knowledge/traces/${taskId}.json`;
  try {
    const source = readFileSync(assertWorkspacePath(relativePath), "utf8");
    const events: unknown = JSON.parse(source);
    if (!Array.isArray(events) || events.length === 0) return "";
    const last = events.at(-1);
    if (!last || typeof last !== "object") return "";
    const record = last as Record<string, unknown>;
    const phase = typeof record.phase === "string" ? record.phase : "TRACE";
    const detail = typeof record.detail === "string" ? record.detail : "";
    return detail ? `${phase} · ${briefTitle(detail)}` : phase;
  } catch { return ""; }
}
function taskBrief(path: string): BriefItem | null {
  try {
    const source = readFileSync(assertWorkspacePath(path), "utf8");
    const id = yamlField(source, "id") || basename(path, ".yaml");
    const status = yamlField(source, "status") || "queued";
    const goal = briefTitle(yamlField(source, "goal"));
    const trace = traceSummary(id);
    return { id, title: goal, detail: trace ? `任务状态：${taskStatusLabel(status)} · ${trace}` : `任务状态：${taskStatusLabel(status)}`, status, path };
  } catch { return null; }
}
function taskStatusLabel(status: string) {
  const labels: Record<string, string> = { queued: "待运行", running: "运行中", waiting_credentials: "缺少凭证", waiting_input: "等待补充", completed: "已完成", failed: "失败", cancelled: "已取消", unknown: "未知" };
  return labels[status] ?? status;
}
function decisionBrief(path: string): BriefItem | null {
  try {
    const source = readFileSync(assertWorkspacePath(path), "utf8");
    const title = source.match(/^#\s+(.+)$/m)?.[1]?.trim() || basename(path, ".md");
    const status = source.match(/^- 状态：(.+)$/m)?.[1]?.trim() || "可决定";
    const detail = source.match(/^- 影响：(.+)$/m)?.[1]?.trim() || "需要你确认后才能继续相关任务。";
    return { id: basename(path, ".md"), title, detail, status, path };
  } catch { return null; }
}
function workspaceBrief(): WorkspaceBrief {
  ensureWorkspace();
  const tasks = workspaceFiles("tasks/", (path) => /\.ya?ml$/.test(path)).map(taskBrief).filter((item): item is BriefItem => item !== null);
  const decisions = workspaceFiles("knowledge/decisions/", (path) => path.endsWith(".md")).map(decisionBrief).filter((item): item is BriefItem => item !== null).filter((item) => item.status !== "已路由");
  const completed = tasks.filter((item) => item.status === "completed");
  const inProgress = tasks.filter((item) => item.status === "running");
  const next = tasks.filter((item) => ["queued", "waiting_input", "waiting_credentials", "failed", "cancelled"].includes(item.status));
  return { generatedAt: now(), decisions, completed, inProgress, next };
}
function supervisionSnapshot(): SupervisionSnapshot {
  const brief = workspaceBrief();
  const allWaitingTasks = [...brief.decisions, ...brief.next];
  const waitingTasks = allWaitingTasks.slice(0, 4);
  const traceFiles = workspaceFiles("knowledge/traces/", (path) => path.endsWith(".json"));
  const recentEvents = traceFiles.flatMap((path) => {
    try {
      const parsed: unknown = JSON.parse(readFileSync(assertWorkspacePath(path), "utf8"));
      return Array.isArray(parsed) ? parsed.filter((event): event is TraceEvent => Boolean(event) && typeof event === "object" && typeof (event as TraceEvent).time === "string") : [];
    } catch { return []; }
  }).sort((left, right) => right.time.localeCompare(left.time)).slice(0, 5);
  const hasAttention = allWaitingTasks.length > 0 || brief.inProgress.length > 0;
  const contextFiles = workspaceFiles("knowledge/", (path) => /\.(md|ya?ml|json)$/.test(path)).slice(-3);
  return {
    status: hasAttention ? "attention" : "healthy",
    message: hasAttention ? "有需要跟进的本地事项" : "本地工作区状态正常",
    detail: hasAttention
      ? `进行中：${brief.inProgress.length} · 待处理：${allWaitingTasks.length} · 最近 Trace：${recentEvents.length}`
      : `没有运行中或待处理的任务 · 最近 Trace：${recentEvents.length}`,
    activeTasks: brief.inProgress.length,
    waitingTotal: allWaitingTasks.length,
    waitingTasks,
    recentEvents,
    contextFiles,
  };
}
function definitionKind(path: string) {
  if (/^agents\/[^/]+\/agent\.md$/.test(path)) return "agent";
  if (/^skills\/[^/]+\.md$/.test(path)) return "skill";
  throw new Error("只允许保存 Agent 定义或工作区共享 Skill 文件");
}
function saveDefinition(relativePath: string, content: string) {
  const kind = definitionKind(relativePath);
  if (!content.trim()) throw new Error("定义内容不能为空");
  if (kind === "agent") {
    const id = content.match(/^id:\s*([a-zA-Z0-9_-]+)\s*$/m)?.[1];
    const model = content.match(/^model:\s*([a-zA-Z0-9_-]+)\s*$/m)?.[1];
    if (!id || !model) throw new Error("Agent 定义必须在 frontmatter 中包含 id 和 model");
  }
  const path = assertWorkspacePath(relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.trimEnd() + "\n", "utf8");
  appendTrace(`definition-${basename(relativePath, ".md")}`, "WRITE", {
    status: "recorded",
    agentId: "user",
    skillIds: [],
    outputFiles: [relativePath],
    detail: `已保存${kind === "agent" ? " Agent" : " Skill"}定义`,
  });
  return { relativePath, kind };
}
function createDefinition(kind: "agent" | "skill", input: { agentId: string; name: string }) {
  const agentId = input.agentId.trim().replace(/[^a-zA-Z0-9_-]/g, "-");
  const name = input.name.trim().replace(/[^a-zA-Z0-9_-]/g, "-");
  if (!name || (kind === "agent" && !agentId)) throw new Error("请填写有效的 ID 和名称");
  const relativePath = kind === "agent" ? `agents/${agentId}/agent.md` : `skills/${name}.md`;
  if (existsSync(assertWorkspacePath(relativePath))) throw new Error("同名定义已存在");
  if (kind === "agent") {
    return saveDefinition(relativePath, `---\nid: ${agentId}\nmodel: default-api\nskills: []\ncapabilities: [file_read, file_write]\nwrite_scope: [tasks, outputs, knowledge, sessions]\nenabled: true\n---\n\n# ${name}\n\n请描述该 Agent 的职责、输入输出约定、可用能力与权限边界。\n`);
  }
  return saveDefinition(relativePath, `# ${name}\n\n## 用途\n\n请描述该共享 Skill 的工作流程、输入、输出与限制。任何 Agent 可在自身定义的 \`skills\` 字段中引用它。\n`);
}
function validateBaseUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("模型地址只允许 http 或 https");
  return url.toString().replace(/\/$/, "");
}
function saveModel(input: { id: string; provider: Provider; baseUrl: string; model: string; apiKey?: string }) {
  const id = input.id.trim().replace(/[^a-zA-Z0-9_-]/g, "-");
  if (!id || !input.model.trim()) throw new Error("模型 ID 和模型名不能为空");
  if (input.provider !== "openai-compatible" && input.provider !== "anthropic-compatible") throw new Error("不支持的模型协议");
  const baseUrl = validateBaseUrl(input.baseUrl.trim());
  const credentialRef = `FIRSTMATE_${id.toUpperCase().replace(/-/g, "_")}_API_KEY`;
  if (input.apiKey?.trim()) saveCredential(credentialRef, input.apiKey.trim());
  const path = resolve(workspaceRoot, "models", `${id}.yaml`);
  writeFileSync(path, `id: ${id}\nprovider: ${input.provider}\nbase_url: ${baseUrl}\nmodel: ${input.model.trim()}\ncredential_ref: ${credentialRef}\n`, "utf8");
  return modelDefinitions().find((item) => item.id === id);
}
function resolveDecision(id: string, choice: string) {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "-");
  if (!safeId || !choice.trim()) throw new Error("决策信息不完整");
  const relativePath = `knowledge/decisions/${safeId}.md`;
  writeControlled(relativePath, `# ${safeId}\n\n- 时间：${now()}\n- 状态：已路由\n- 选择：${choice.trim()}\n- 影响：解除依赖此决策的任务后才可继续执行。\n`);
  appendTrace(`decision-${safeId}`, "DECISION", { status: "recorded", agentId: "user", skillIds: [], outputFiles: [relativePath], detail: `${safeId}: ${choice.trim()}` });
  return { relativePath };
}
function appendSessionTurn(sessionPath: string, message: string) {
  const source = readFileSync(assertWorkspacePath(sessionPath), "utf8");
  const turn = (source.match(/^## 用户消息/gm) ?? []).length + 1;
  const next = source
    .replace(/\n## 当前摘要[\s\S]*$/g, "")
    .replace(/^- 状态：.*$/m, "- 状态：进行中")
    .trimEnd() + `\n\n## 用户消息 · 第 ${turn} 轮\n\n${message}\n`;
  writeControlled(sessionPath, next);
}
function createConversation(message: string, existingTask?: string) {
  ensureWorkspace();
  const id = existingTask?.replace(/[^a-zA-Z0-9_-]/g, "-") || taskId();
  const assignedAgent = routeAgent(message);
  const sessionPath = `sessions/${id}.md`;
  const taskPath = `tasks/${id}.yaml`;
  if (existingTask && existsSync(assertWorkspacePath(sessionPath)) && existsSync(assertWorkspacePath(taskPath))) {
    appendSessionTurn(sessionPath, message);
    updateTaskGoal(id, message);
    writeKnowledge(id, message);
    appendTrace(id, "PLAN", { status: "queued", agentId: "first-mate", skillIds: ["stow-context"], inputFiles: [sessionPath, assignedAgent.path], outputFiles: [taskPath, `knowledge/entries/${id}.md`], detail: `大副将第 ${((readFileSync(assertWorkspacePath(sessionPath), "utf8").match(/^## 用户消息/gm) ?? []).length)} 轮消息交接给 ${assignedAgent.id}` });
    appendTrace(id, "QUEUED", { status: "queued", agentId: assignedAgent.id, skillIds: assignedAgent.skills, inputFiles: [taskPath, assignedAgent.path], detail: `等待 ${assignedAgent.id} 继续执行当前会话` });
    return { id, sessionPath, taskPath, tracePath: `knowledge/traces/${id}.json`, status: "queued", agentId: assignedAgent.id };
  }
  writeControlled(sessionPath, `# ${id}\n\n- 时间：${now()}\n- 状态：进行中\n\n## 用户消息\n\n${message}\n\n## 摘要\n\n等待任务结果；关闭或完成后可继续沉淀为恢复上下文。\n`);
  const materialFiles = attachedMaterialPaths(message);
  writeControlled(taskPath, `id: ${id}\nstatus: queued\ncreated_at: ${now()}\nupdated_at: ${now()}\nagent: ${assignedAgent.id}\nskills: [${assignedAgent.skills.join(", ")}]\ngoal: ${JSON.stringify(message)}\ninput_files: [${sessionPath}, knowledge/entries/${id}.md${materialFiles.length ? `, ${materialFiles.join(", ")}` : ""}]\noutput_dir: outputs/${id}\n`);
  writeKnowledge(id, message);
  appendTrace(id, "PLAN", { status: "queued", agentId: "first-mate", skillIds: ["stow-context"], inputFiles: [sessionPath, assignedAgent.path], outputFiles: [taskPath, `knowledge/entries/${id}.md`], detail: `大副创建任务并分派给 ${assignedAgent.id}` });
  if (assignedAgent.id !== "first-mate") appendTrace(id, "READ", { status: "queued", agentId: "first-mate", skillIds: ["stow-context"], inputFiles: [assignedAgent.path], detail: `加载 ${assignedAgent.id} Agent 定义并完成任务交接` });
  appendTrace(id, "QUEUED", { status: "queued", agentId: assignedAgent.id, skillIds: assignedAgent.skills, inputFiles: [taskPath, assignedAgent.path], detail: `等待 ${assignedAgent.id} 执行授权` });
  return { id, sessionPath, taskPath, tracePath: `knowledge/traces/${id}.json`, status: "queued", agentId: assignedAgent.id };
}
async function runTask(task: string, modelId: string) {
  const taskSource = readFileSync(assertWorkspacePath(`tasks/${task}.yaml`), "utf8");
  const assignedAgentId = yamlField(taskSource, "agent") || "first-mate";
  const assignedAgent = agentDefinition(assignedAgentId);
  if (!assignedAgent.enabled) throw new Error(`Agent 已停用：${assignedAgent.id}`);
  const selectedModelId = modelId || assignedAgent.modelId;
  const definition = modelDefinitions().find((item) => item.id === selectedModelId);
  if (!definition) throw new Error("未找到模型定义");
  const apiKey = readCredential(definition.credentialRef);
  if (!apiKey) { updateTaskStatus(task, "waiting_credentials"); appendTrace(task, "BLOCKED", { status: "waiting_credentials", agentId: assignedAgent.id, skillIds: assignedAgent.skills, modelId: selectedModelId, detail: "模型凭证未配置" }); return { status: "waiting_credentials" }; }
  updateTaskStatus(task, "running");
  const startedAt = Date.now();
  try {
    const goal = taskGoal(taskSource);
    if (!goal) throw new Error("任务目标为空，无法调用模型");
    const conversation = sessionConversation(task);
    const materialFiles = [...new Set([...taskMaterialPaths(taskSource), ...attachedMaterialPaths(conversation), ...attachedMaterialPaths(goal)])];
    const materials = materialContext(materialFiles);
    const modelInput = [conversation || goal, materials.content ? `## 已授权读取的本地素材\n\n${materials.content}` : ""].filter(Boolean).join("\n\n---\n\n");
    const turnCount = (conversation.match(/^用户：/gm) ?? []).length;
    appendTrace(task, "READ", { status: "running", agentId: assignedAgent.id, skillIds: assignedAgent.skills, modelId: selectedModelId, inputFiles: [`tasks/${task}.yaml`, `sessions/${task}.md`, `knowledge/entries/${task}.md`, assignedAgent.path, ...materials.files], detail: `已解析用户目标（${Array.from(goal).length} 字符）、${turnCount} 轮会话上下文，并读取 ${materials.files.length} 个已授权素材` });
    appendTrace(task, "MODEL", { status: "running", agentId: assignedAgent.id, skillIds: assignedAgent.skills, modelId: selectedModelId, inputFiles: [`tasks/${task}.yaml`, `sessions/${task}.md`, assignedAgent.path, ...materials.files], detail: `${assignedAgent.id} 调用 ${definition.provider} API（当前第 ${turnCount} 轮）` });
    const system = `${assignedAgent.prompt}\n\n你是 FirstMate 工作区中的 ${assignedAgent.id}。用户已显式附加的本地素材内容会在消息中提供，请直接基于这些内容工作；不得声称无法访问已提供的 Markdown / TXT 素材，也不得编造未读取的素材内容。不要输出任何工具调用、XML 工具标签或“请读取文件”的请求；素材已由本地 Runtime 读取并放入上下文。仅输出可审阅的最终结果，不包含密钥。`;
    const endpoint = definition.provider === "anthropic-compatible"
      ? (definition.baseUrl.endsWith("/v1/messages") ? definition.baseUrl : `${definition.baseUrl}/v1/messages`)
      : (definition.baseUrl.endsWith("/chat/completions") ? definition.baseUrl : `${definition.baseUrl}/chat/completions`);
    const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
    const callModel = async (content: string) => {
      const body = definition.provider === "anthropic-compatible"
        ? { model: definition.model, max_tokens: 4096, system, messages: [{ role: "user", content }] }
        : { model: definition.model, messages: [{ role: "system", content: system }, { role: "user", content }], temperature: 0.2, max_completion_tokens: 4096 };
      const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
      if (!response.ok) throw new Error(`模型调用失败：${response.status} ${await response.text()}`);
      const payload = await response.json() as { choices?: { message?: { content?: string } }[]; content?: { type?: string; text?: string }[] };
      return (definition.provider === "anthropic-compatible"
        ? payload.content?.filter((item) => item.type === "text").map((item) => item.text).join("\n").trim()
        : payload.choices?.[0]?.message?.content?.trim())?.replace(/^\s*<think>[\s\S]*?<\/think>\s*/i, "").trim() ?? "";
    };
    let rawOutput = await callModel(modelInput);
    const toolCall = parseModelToolCall(rawOutput);
    if (toolCall) {
      const toolResult = executeModelToolCall(toolCall);
      appendTrace(task, "TOOL", {
        status: "running",
        agentId: assignedAgent.id,
        skillIds: assignedAgent.skills,
        modelId: selectedModelId,
        inputFiles: toolResult.files,
        detail: `${assignedAgent.id} 执行模型请求的 ${toolCall.name}，读取 ${toolResult.files.length} 个本地素材`,
      });
      rawOutput = await callModel(`${modelInput}\n\n---\n\n## 工具执行结果\n\n${toolResult.content}\n\n请基于以上工具结果直接输出最终答案。不要再输出工具调用 XML、工具标签或文件读取请求。`);
      if (parseModelToolCall(rawOutput)) throw new Error("模型重复请求工具调用，当前 Runtime 仅允许每轮执行一次受控本地读取");
    }
    const output = rawOutput;
    if (!output) throw new Error("模型未返回可展示的文本结果");
    const outputPath = `outputs/${task}/result.md`;
    writeControlled(outputPath, `# ${task} 输出\n\n${output}\n`);
    writeKnowledge(task, goal, output);
    const sessionResultPath = updateSessionResult(task, "已完成", output);
    updateTaskStatus(task, "completed");
    appendTrace(task, "WRITE", { status: "completed", agentId: assignedAgent.id, skillIds: assignedAgent.skills, modelId: selectedModelId, outputFiles: [outputPath, `knowledge/entries/${task}.md`, sessionResultPath], durationMs: Date.now() - startedAt, detail: `${assignedAgent.id} 已写入结果、知识摘要与会话归档` });
    appendTrace(task, "DONE", { status: "completed", agentId: "first-mate", skillIds: ["stow-context"], modelId: selectedModelId, outputFiles: [outputPath, sessionResultPath], durationMs: Date.now() - startedAt, detail: `大副汇总 ${assignedAgent.id} 结果并完成归档` });
    return { status: "completed", outputPath, output };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "未知模型错误";
    updateTaskStatus(task, "failed");
    const sessionResultPath = updateSessionResult(task, "失败", detail);
    appendTrace(task, "FAILED", { status: "failed", agentId: assignedAgent.id, skillIds: assignedAgent.skills, modelId: selectedModelId, outputFiles: [sessionResultPath], durationMs: Date.now() - startedAt, detail });
    throw error;
  }
}
function registerRendererProtocol() {
  const outputRoot = app.isPackaged ? resolve(process.resourcesPath, "renderer", "out") : resolve(__dirname, "../../renderer/out");
  protocol.handle("firstmate", async (request) => {
    const url = new URL(request.url);
    const requestedPath = decodeURIComponent(url.pathname);
    const assetPath = requestedPath === "/" || requestedPath.endsWith("/") ? `${requestedPath}index.html` : requestedPath;
    const filePath = resolve(outputRoot, `.${assetPath}`);
    if (relative(outputRoot, filePath).startsWith("..")) return new Response("Not found", { status: 404 });
    const response = await net.fetch(pathToFileURL(filePath).toString());
    const headers = new Headers(response.headers);
    headers.set("Content-Security-Policy", "default-src 'self' firstmate: data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' firstmate: data:; font-src 'self' data:; connect-src 'self' firstmate:");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  });
}
async function createWindow() {
  mainWindow = new BrowserWindow({ width: 1440, height: 920, minWidth: 1120, minHeight: 720, title: "FirstMate", icon: APP_ICON, backgroundColor: "#101010", titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default", webPreferences: { preload: resolve(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  mainWindow.webContents.on("context-menu", (_event, params) => {
    Menu.buildFromTemplate([{ label: "刷新", accelerator: "CmdOrCtrl+R", click: () => mainWindow?.webContents.reload() }, { type: "separator" }, { role: "copy", label: "复制" }, { role: "paste", label: "粘贴" }, { role: "selectAll", label: "全选" }, { type: "separator" }, { role: "toggleDevTools", label: "开发者工具" }]).popup({ window: mainWindow ?? undefined, x: params.x, y: params.y });
  });
  const devUrl = process.env.FIRSTMATE_RENDERER_URL;
  if (devUrl) await mainWindow.loadURL(devUrl); else await mainWindow.loadURL("firstmate://app/chat/");
}
ipcMain.handle("workspace:choose", async () => { const result = await dialog.showOpenDialog(mainWindow!, { properties: ["openDirectory", "createDirectory"] }); if (!result.canceled && result.filePaths[0]) workspaceRoot = result.filePaths[0]; return workspaceSnapshot(); });
ipcMain.handle("workspace:initialize", () => { ensureWorkspace(); return workspaceSnapshot(); });
ipcMain.handle("workspace:snapshot", () => workspaceSnapshot());
ipcMain.handle("workspace:read", (_event, relativePath: string) => readFileSync(assertWorkspacePath(relativePath), "utf8"));
ipcMain.handle("workspace:writeControlled", (_event, relativePath: string, content: string) => writeControlled(relativePath, content));
ipcMain.handle("workspace:importMaterials", () => importMaterials());
ipcMain.handle("workspace:brief", () => workspaceBrief());
ipcMain.handle("workspace:supervision", () => supervisionSnapshot());
ipcMain.handle("sessions:list",  () => workspaceSnapshot().files.filter((item) => item.kind === "file" && /^sessions\/task-[^/]+\.md$/.test(item.path)).map((item) => sessionRecord(item.path)).filter((item): item is SessionRecord => item !== null).sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
ipcMain.handle("tasks:list", () => workspaceSnapshot().files.filter((item) => item.kind === "file" && item.path.startsWith("tasks/")).map((item) => ({ path: item.path, status: readTaskStatus(basename(item.path, ".yaml")) })));
ipcMain.handle("traces:list", () => workspaceSnapshot().files.filter((item) => item.kind === "file" && item.path.startsWith("knowledge/traces/")).map((item) => item.path));
ipcMain.handle("models:list", () => modelDefinitions());
ipcMain.handle("models:save", (_event, input) => saveModel(input));
ipcMain.handle("definitions:list", () => {
  const files = workspaceSnapshot().files.filter((item) => item.kind === "file").map((item) => item.path);
  return { agents: files.filter((path) => /^agents\/[^/]+\/agent\.md$/.test(path)), skills: files.filter((path) => /^skills\/[^/]+\.md$/.test(path)) };
});
ipcMain.handle("definitions:save", (_event, relativePath: string, content: string) => saveDefinition(relativePath, content));
ipcMain.handle("definitions:create", (_event, kind: "agent" | "skill", input: { agentId: string; name: string }) => createDefinition(kind, input));
ipcMain.handle("decisions:resolve", (_event, id: string, choice: string) => resolveDecision(id, choice));
ipcMain.handle("conversation:create", (_event, message: string, existingTask?: string) => createConversation(message, existingTask));
ipcMain.handle("runtime:runTask", (_event, task: string, modelId: string) => runTask(task, modelId));
app.whenReady().then(async () => { if (process.platform === "darwin") app.dock.setIcon(APP_ICON); ensureWorkspace(); migrateLegacyKnowledgeEntries(); registerRendererProtocol(); await createWindow(); app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) void createWindow(); }); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
