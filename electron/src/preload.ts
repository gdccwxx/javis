import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("firstmate", {
  workspace: { choose: () => ipcRenderer.invoke("workspace:choose"), initialize: () => ipcRenderer.invoke("workspace:initialize"), snapshot: () => ipcRenderer.invoke("workspace:snapshot"), brief: () => ipcRenderer.invoke("workspace:brief"), supervision: () => ipcRenderer.invoke("workspace:supervision"), read: (relativePath: string) => ipcRenderer.invoke("workspace:read", relativePath), writeControlled: (relativePath: string, content: string) => ipcRenderer.invoke("workspace:writeControlled", relativePath, content) },
  sessions: { list: () => ipcRenderer.invoke("sessions:list") },
  tasks: { list: () => ipcRenderer.invoke("tasks:list") },
  traces: { list: () => ipcRenderer.invoke("traces:list") },
  models: { list: () => ipcRenderer.invoke("models:list"), save: (input: { id: string; provider: "openai-compatible" | "anthropic-compatible"; baseUrl: string; model: string; apiKey?: string }) => ipcRenderer.invoke("models:save", input) },
  definitions: { list: () => ipcRenderer.invoke("definitions:list"), save: (relativePath: string, content: string) => ipcRenderer.invoke("definitions:save", relativePath, content), create: (kind: "agent" | "skill", input: { agentId: string; name: string }) => ipcRenderer.invoke("definitions:create", kind, input) },
  decisions: { resolve: (id: string, choice: string) => ipcRenderer.invoke("decisions:resolve", id, choice) },
  conversation: { create: (message: string) => ipcRenderer.invoke("conversation:create", message) },
  runtime: { runTask: (task: string, modelId: string) => ipcRenderer.invoke("runtime:runTask", task, modelId) },
});
