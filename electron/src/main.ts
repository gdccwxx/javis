import { app, BrowserWindow, dialog, ipcMain, net, protocol, safeStorage } from "electron";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, normalize, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

protocol.registerSchemesAsPrivileged([{ scheme: "firstmate", privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

const DEFAULT_WORKSPACE = "/Users/dechenguo/WorkBuddy/2026-08-05-17-29-01/javis-wiki";
const CONTROLLED_ROOTS = ["tasks", "outputs", "knowledge", "sessions"];
type Entry = { path: string; kind: "file" | "directory" };
type ModelDefinition = { id: string; baseUrl: string; model: string; credentialRef: string; configured: boolean };
let mainWindow: BrowserWindow | null = null;
let workspaceRoot = DEFAULT_WORKSPACE;

function now() { return new Date().toISOString(); }
function taskId() { return `task-${Date.now()}`; }
function ensureWorkspace(root = workspaceRoot) {
  for (const directory of ["agents", "agents/first-mate/skills", "knowledge", "knowledge/traces", "knowledge/decisions", "sessions", "tasks", "outputs", "models", "materials"]) mkdirSync(resolve(root, directory), { recursive: true });
  const agentPath = resolve(root, "agents/first-mate/agent.md");
  const skillPath = resolve(root, "agents/first-mate/skills/stow-context.md");
  if (!existsSync(agentPath)) writeFileSync(agentPath, "---\nid: first-mate\nmodel: default-api\nwrite_scope: [tasks, outputs, knowledge, sessions]\n---\n\n# First Mate\n\n负责读取用户目标、创建任务、监督受控产物并沉淀会话。\n", "utf8");
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
function updateTaskStatus(task: string, status: string) {
  const relativePath = `tasks/${task}.yaml`;
  const source = readFileSync(assertWorkspacePath(relativePath), "utf8");
  writeControlled(relativePath, source.replace(/^status:\s*.*$/m, `status: ${status}`).replace(/^updated_at:.*$/m, "").trimEnd() + `\nupdated_at: ${now()}\n`);
}
function appendTrace(task: string, phase: string, actor: string, detail: string) {
  const relativePath = `knowledge/traces/${task}.json`;
  const tracePath = assertWorkspacePath(relativePath, true);
  const events = existsSync(tracePath) ? JSON.parse(readFileSync(tracePath, "utf8")) : [];
  events.push({ id: `${task}-${events.length + 1}`, time: now(), phase, actor, detail });
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
  return readdirSync(resolve(workspaceRoot, "models"), { withFileTypes: true }).filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name)).map((entry) => {
    const source = readFileSync(resolve(workspaceRoot, "models", entry.name), "utf8");
    const credentialRef = yamlField(source, "credential_ref");
    return { id: yamlField(source, "id") || entry.name.replace(/\.ya?ml$/, ""), baseUrl: yamlField(source, "base_url"), model: yamlField(source, "model"), credentialRef, configured: Boolean(credentialRef && readCredential(credentialRef)) };
  });
}
function validateBaseUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("模型地址只允许 http 或 https");
  return url.toString().replace(/\/$/, "");
}
function saveModel(input: { id: string; baseUrl: string; model: string; apiKey?: string }) {
  const id = input.id.trim().replace(/[^a-zA-Z0-9_-]/g, "-");
  if (!id || !input.model.trim()) throw new Error("模型 ID 和模型名不能为空");
  const baseUrl = validateBaseUrl(input.baseUrl.trim());
  const credentialRef = `FIRSTMATE_${id.toUpperCase().replace(/-/g, "_")}_API_KEY`;
  if (input.apiKey?.trim()) saveCredential(credentialRef, input.apiKey.trim());
  const path = resolve(workspaceRoot, "models", `${id}.yaml`);
  writeFileSync(path, `id: ${id}\nprovider: openai-compatible\nbase_url: ${baseUrl}\nmodel: ${input.model.trim()}\ncredential_ref: ${credentialRef}\n`, "utf8");
  return modelDefinitions().find((item) => item.id === id);
}
function createConversation(message: string) {
  ensureWorkspace();
  const id = taskId();
  const sessionPath = `sessions/${id}.md`;
  const taskPath = `tasks/${id}.yaml`;
  writeControlled(sessionPath, `# ${id}\n\n- 时间：${now()}\n- 用户：${message}\n`);
  writeControlled(taskPath, `id: ${id}\nstatus: queued\ncreated_at: ${now()}\nagent: first-mate\ngoal: ${JSON.stringify(message)}\noutput_dir: outputs/${id}\n`);
  appendTrace(id, "PLAN", "first-mate", "创建任务与会话文件");
  appendTrace(id, "QUEUED", "first-mate", "等待模型连接或执行授权");
  return { id, sessionPath, taskPath, tracePath: `knowledge/traces/${id}.json`, status: "queued" };
}
async function runTask(task: string, modelId: string) {
  const definition = modelDefinitions().find((item) => item.id === modelId);
  if (!definition) throw new Error("未找到模型定义");
  const apiKey = readCredential(definition.credentialRef);
  if (!apiKey) { updateTaskStatus(task, "waiting_credentials"); appendTrace(task, "BLOCKED", "first-mate", "模型凭证未配置"); return { status: "waiting_credentials" }; }
  updateTaskStatus(task, "running");
  appendTrace(task, "READ", "first-mate", "读取任务与会话上下文");
  appendTrace(task, "MODEL", `${modelId}`, "调用 OpenAI-compatible API");
  try {
    const taskSource = readFileSync(assertWorkspacePath(`tasks/${task}.yaml`), "utf8");
    const goal = yamlField(taskSource, "goal");
    const response = await fetch(`${definition.baseUrl}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: definition.model, messages: [{ role: "system", content: "你是 FirstMate。仅输出可审阅的任务结果，不包含密钥。" }, { role: "user", content: goal }], temperature: 0.2 }) });
    if (!response.ok) throw new Error(`模型调用失败：${response.status}`);
    const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
    const output = payload.choices?.[0]?.message?.content?.trim() || "模型未返回文本结果";
    const outputPath = `outputs/${task}/result.md`;
    writeControlled(outputPath, `# ${task} 输出\n\n${output}\n`);
    updateTaskStatus(task, "completed");
    appendTrace(task, "WRITE", modelId, outputPath);
    appendTrace(task, "DONE", "first-mate", "模型结果已写入受控产物目录");
    return { status: "completed", outputPath, output };
  } catch (error) {
    updateTaskStatus(task, "failed");
    appendTrace(task, "FAILED", modelId, error instanceof Error ? error.message : "未知模型错误");
    throw error;
  }
}
function registerRendererProtocol() {
  const outputRoot = resolve(__dirname, "../../renderer/out");
  protocol.handle("firstmate", (request) => {
    const url = new URL(request.url);
    const requestedPath = decodeURIComponent(url.pathname);
    const assetPath = requestedPath === "/" || requestedPath.endsWith("/") ? `${requestedPath}index.html` : requestedPath;
    const filePath = resolve(outputRoot, `.${assetPath}`);
    if (relative(outputRoot, filePath).startsWith("..")) return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(filePath).toString());
  });
}
async function createWindow() {
  mainWindow = new BrowserWindow({ width: 1440, height: 920, minWidth: 1060, minHeight: 720, title: "FirstMate", backgroundColor: "#101010", webPreferences: { preload: resolve(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  const devUrl = process.env.FIRSTMATE_RENDERER_URL;
  if (devUrl) await mainWindow.loadURL(devUrl); else await mainWindow.loadURL("firstmate://app/chat/");
}
ipcMain.handle("workspace:choose", async () => { const result = await dialog.showOpenDialog(mainWindow!, { properties: ["openDirectory", "createDirectory"] }); if (!result.canceled && result.filePaths[0]) workspaceRoot = result.filePaths[0]; return workspaceSnapshot(); });
ipcMain.handle("workspace:initialize", () => { ensureWorkspace(); return workspaceSnapshot(); });
ipcMain.handle("workspace:snapshot", () => workspaceSnapshot());
ipcMain.handle("workspace:read", (_event, relativePath: string) => readFileSync(assertWorkspacePath(relativePath), "utf8"));
ipcMain.handle("workspace:writeControlled", (_event, relativePath: string, content: string) => writeControlled(relativePath, content));
ipcMain.handle("sessions:list", () => workspaceSnapshot().files.filter((item) => item.kind === "file" && item.path.startsWith("sessions/")).map((item) => item.path));
ipcMain.handle("tasks:list", () => workspaceSnapshot().files.filter((item) => item.kind === "file" && item.path.startsWith("tasks/")).map((item) => ({ path: item.path, status: readTaskStatus(basename(item.path, ".yaml")) })));
ipcMain.handle("traces:list", () => workspaceSnapshot().files.filter((item) => item.kind === "file" && item.path.startsWith("knowledge/traces/")).map((item) => item.path));
ipcMain.handle("models:list", () => modelDefinitions());
ipcMain.handle("models:save", (_event, input) => saveModel(input));
ipcMain.handle("definitions:list", () => {
  const files = workspaceSnapshot().files.filter((item) => item.kind === "file").map((item) => item.path);
  return { agents: files.filter((path) => /^agents\/[^/]+\/agent\.md$/.test(path)), skills: files.filter((path) => /^agents\/[^/]+\/skills\/[^/]+\.md$/.test(path)) };
});
ipcMain.handle("conversation:create", (_event, message: string) => createConversation(message));
ipcMain.handle("runtime:runTask", (_event, task: string, modelId: string) => runTask(task, modelId));
app.whenReady().then(async () => { ensureWorkspace(); registerRendererProtocol(); await createWindow(); app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) void createWindow(); }); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
