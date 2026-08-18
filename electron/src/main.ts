import { app, BrowserWindow, dialog, ipcMain, net, protocol } from "electron";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, normalize, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

protocol.registerSchemesAsPrivileged([{
  scheme: "firstmate",
  privileges: { standard: true, secure: true, supportFetchAPI: true },
}]);

let mainWindow: BrowserWindow | null = null;
let workspaceRoot: string | null = null;

function assertWorkspacePath(input: string): string {
  if (!workspaceRoot) throw new Error("请先选择工作区");
  if (!input || input.includes("\0")) throw new Error("无效文件路径");
  const fullPath = resolve(workspaceRoot, input);
  const pathFromRoot = relative(workspaceRoot, fullPath);
  if (pathFromRoot.startsWith("..") || pathFromRoot === "" || normalize(pathFromRoot) === ".") {
    throw new Error("只能访问当前工作区中的文件");
  }
  return fullPath;
}

function workspaceSnapshot() {
  if (!workspaceRoot) return { name: "未打开工作区", files: [] as string[] };
  const files = readdirSync(workspaceRoot, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .slice(0, 30)
    .map((entry) => entry.name + (entry.isDirectory() ? "/" : ""));
  return { name: basename(workspaceRoot), files };
}

function registerRendererProtocol() {
  const outputRoot = resolve(__dirname, "../../renderer/out");

  protocol.handle("firstmate", (request) => {
    const url = new URL(request.url);
    const requestedPath = decodeURIComponent(url.pathname);
    const assetPath = requestedPath === "/" || requestedPath.endsWith("/")
      ? `${requestedPath}index.html`
      : requestedPath;
    const filePath = resolve(outputRoot, `.${assetPath}`);
    const pathFromRoot = relative(outputRoot, filePath);

    if (pathFromRoot.startsWith("..") || pathFromRoot === "") {
      return new Response("Not found", { status: 404 });
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1060,
    minHeight: 720,
    title: "FirstMate",
    backgroundColor: "#101010",
    webPreferences: {
      preload: resolve(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const devUrl = process.env.FIRSTMATE_RENDERER_URL;
  if (devUrl) await mainWindow.loadURL(devUrl);
  else await mainWindow.loadURL("firstmate://app/chat/");
}

ipcMain.handle("workspace:choose", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, { properties: ["openDirectory", "createDirectory"] });
  if (!result.canceled && result.filePaths[0]) workspaceRoot = result.filePaths[0];
  return workspaceSnapshot();
});

ipcMain.handle("workspace:snapshot", () => workspaceSnapshot());

ipcMain.handle("workspace:read", (_event, relativePath: string) => {
  const fullPath = assertWorkspacePath(relativePath);
  if (!existsSync(fullPath)) throw new Error("文件不存在");
  return readFileSync(fullPath, "utf8");
});

app.whenReady().then(async () => {
  registerRendererProtocol();
  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
