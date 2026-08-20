import { app, BrowserWindow, dialog, ipcMain, Menu, net, protocol, safeStorage } from "electron";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
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
type AgentDefinition = { id: string; title: string; modelId: string; skills: string[]; writeScope: string[]; enabled: boolean; prompt: string; path: string };
type TaskStatus = "queued" | "running" | "waiting_credentials" | "waiting_input" | "completed" | "failed" | "cancelled";
type TracePhase = "PLAN" | "QUEUED" | "READ" | "MODEL" | "WRITE" | "DONE" | "FAILED" | "BLOCKED" | "DECISION";
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
let mainWindow: BrowserWindow | null = null;
let workspaceRoot = DEFAULT_WORKSPACE;

function now() { return new Date().toISOString(); }
function knowledgeTime(date = new Date()) {
  const part = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}/${part(date.getMonth() + 1)}/${part(date.getDate())} ${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`;
}
function knowledgeTitle(value: string) {
  const summary = value.match(/^(?:摘要|总结|summary)\s*[:：]\s*(.+)$/im)?.[1] ?? value.split(/\r?\n/).find((line) => line.trim() && !line.trim().startsWith("#")) ?? value;
  return summary.replace(/\s+/g, " ").trim().slice(0, 80) || "未命名知识";
}
function writeKnowledge(task: string, prompt: string, summary?: string) {
  const title = knowledgeTitle(summary ?? prompt).replace(/^\d{4}[/-]\d{1,2}[/-]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?\s*[-—:：]?\s*/, "");
  const relativePath = `knowledge/entries/${task}.md`;
  const body = summary ? `## 总结\n\n${summary.trim()}\n` : "## 总结\n\n等待模型返回。\n";
  writeControlled(relativePath, `# ${title}\n\n- 时间：${knowledgeTime()}\n- 用户 Prompt：${prompt}\n\n${body}`);
  return relativePath;
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
function updateSessionResult(task: string, status: "已完成" | "失败", output: string) {
  const relativePath = `sessions/${task}.md`;
  const source = readFileSync(assertWorkspacePath(relativePath), "utf8");
  const summary = status === "已完成"
    ? `已完成。核心结果：${knowledgeTitle(output)}`
    : `任务失败：${output}`;
  const next = source
    .replace(/^- 状态：.*$/m, `- 状态：${status}`)
    .replace(/^## 摘要[\s\S]*$/m, `## First Mate 输出\n\n${output.trim()}\n\n## 摘要\n\n${summary}\n`);
  writeControlled(relativePath, next);
  return relativePath;
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
function readTaskStatus(task: string) {
  const file = assertWorkspacePath(`tasks/${task}.yaml`);
  return readFileSync(file, "utf8").match(/^status:\s*(.+)$/m)?.[1]?.trim() ?? "unknown";
}
function updateTaskStatus(task: string, status: TaskStatus) {
  const relativePath = `tasks/${task}.yaml`;
  const source = readFileSync(assertWorkspacePath(relativePath), "utf8");
  writeControlled(relativePath, source.replace(/^status:\s*.*$/m, `status: ${status}`).replace(/^updated_at:.*$/m, "").trimEnd() + `\nupdated_at: ${now()}\n`);
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
    return { id, title: goal, detail: trace ? `任务状态：${status} · ${trace}` : `任务状态：${status}`, status, path };
  } catch { return null; }
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
    return saveDefinition(relativePath, `---\nid: ${agentId}\nmodel: default-api\nwrite_scope: [tasks, outputs, knowledge, sessions]\nenabled: true\n---\n\n# ${name}\n\n请描述该 Agent 的职责、输入输出约定与权限边界。\n`);
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
function createConversation(message: string) {
  ensureWorkspace();
  const id = taskId();
  const assignedAgent = routeAgent(message);
  const sessionPath = `sessions/${id}.md`;
  const taskPath = `tasks/${id}.yaml`;
  writeControlled(sessionPath, `# ${id}\n\n- 时间：${now()}\n- 状态：进行中\n\n## 用户消息\n\n${message}\n\n## 摘要\n\n等待任务结果；关闭或完成后可继续沉淀为恢复上下文。\n`);
  writeControlled(taskPath, `id: ${id}\nstatus: queued\ncreated_at: ${now()}\nupdated_at: ${now()}\nagent: ${assignedAgent.id}\nskills: [${assignedAgent.skills.join(", ")}]\ngoal: ${JSON.stringify(message)}\ninput_files: [${sessionPath}, knowledge/entries/${id}.md]\noutput_dir: outputs/${id}\n`);
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
    appendTrace(task, "READ", { status: "running", agentId: assignedAgent.id, skillIds: assignedAgent.skills, modelId: selectedModelId, inputFiles: [`tasks/${task}.yaml`, `sessions/${task}.md`, `knowledge/entries/${task}.md`, assignedAgent.path], detail: `已解析用户目标（${Array.from(goal).length} 字符），由 ${assignedAgent.id} 读取上下文与 Agent 定义` });
    appendTrace(task, "MODEL", { status: "running", agentId: assignedAgent.id, skillIds: assignedAgent.skills, modelId: selectedModelId, inputFiles: [`tasks/${task}.yaml`, assignedAgent.path], detail: `${assignedAgent.id} 调用 ${definition.provider} API（用户目标 ${Array.from(goal).length} 字符）` });
    const system = `${assignedAgent.prompt}\n\n你是 FirstMate 工作区中的 ${assignedAgent.id}。仅输出可审阅的任务结果，不包含密钥。`;
    const endpoint = definition.provider === "anthropic-compatible"
      ? (definition.baseUrl.endsWith("/v1/messages") ? definition.baseUrl : `${definition.baseUrl}/v1/messages`)
      : (definition.baseUrl.endsWith("/chat/completions") ? definition.baseUrl : `${definition.baseUrl}/chat/completions`);
    const body = definition.provider === "anthropic-compatible"
      ? { model: definition.model, max_tokens: 4096, system, messages: [{ role: "user", content: goal }] }
      : { model: definition.model, messages: [{ role: "system", content: system }, { role: "user", content: goal }], temperature: 0.2, max_completion_tokens: 4096 };
    const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
    const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(`模型调用失败：${response.status} ${await response.text()}`);
    const payload = await response.json() as { choices?: { message?: { content?: string } }[]; content?: { type?: string; text?: string }[] };
    const rawOutput = definition.provider === "anthropic-compatible" ? payload.content?.filter((item) => item.type === "text").map((item) => item.text).join("\n").trim() : payload.choices?.[0]?.message?.content?.trim();
    const output = rawOutput?.replace(/^\s*<think>[\s\S]*?<\/think>\s*/i, "").trim();
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
ipcMain.handle("workspace:brief", () => workspaceBrief());
ipcMain.handle("workspace:supervision", () => supervisionSnapshot());
ipcMain.handle("sessions:list",  () => workspaceSnapshot().files.filter((item) => item.kind === "file" && item.path.startsWith("sessions/")).map((item) => item.path));
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
ipcMain.handle("conversation:create", (_event, message: string) => createConversation(message));
ipcMain.handle("runtime:runTask", (_event, task: string, modelId: string) => runTask(task, modelId));
app.whenReady().then(async () => { if (process.platform === "darwin") app.dock.setIcon(APP_ICON); ensureWorkspace(); registerRendererProtocol(); await createWindow(); app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) void createWindow(); }); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
