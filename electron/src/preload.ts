import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("firstmate", {
  workspace: {
    choose: () => ipcRenderer.invoke("workspace:choose"),
    snapshot: () => ipcRenderer.invoke("workspace:snapshot"),
    read: (relativePath: string) => ipcRenderer.invoke("workspace:read", relativePath),
  },
});
