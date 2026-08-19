import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("firstmate", {
  workspace: { choose: () => ipcRenderer.invoke("workspace:choose"), initialize: () => ipcRenderer.invoke("workspace:initialize"), snapshot: () => ipcRenderer.invoke("workspace:snapshot"), read: (relativePath: string) => ipcRenderer.invoke("workspace:read", relativePath), writeControlled: (relativePath: string, content: string) => ipcRenderer.invoke("workspace:writeControlled", relativePath, content) },
  sessions: { list: () => ipcRenderer.invoke("sessions:list") },
  tasks: { list: () => ipcRenderer.invoke("tasks:list") },
  traces: { list: () => ipcRenderer.invoke("traces:list") },
  models: { list: () => ipcRenderer.invoke("models:list"), save: (input: { id: string; baseUrl: string; model: string; apiKey?: string }) => ipcRenderer.invoke("models:save", input) },
  definitions: { list: () => ipcRenderer.invoke("definitions:list") },
  conversation: { create: (message: string) => ipcRenderer.invoke("conversation:create", message) },
  runtime: { runTask: (task: string, modelId: string) => ipcRenderer.invoke("runtime:runTask", task, modelId) },
});
