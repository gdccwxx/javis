export {};

type WorkspaceEntry = { path: string; kind: "file" | "directory" };
type WorkspaceSnapshot = { name: string; root: string; files: WorkspaceEntry[] };
type ModelDefinition = { id: string; baseUrl: string; model: string; credentialRef: string; configured: boolean };

declare global {
  interface Window {
    firstmate?: {
      workspace: { choose(): Promise<WorkspaceSnapshot>; initialize(): Promise<WorkspaceSnapshot>; snapshot(): Promise<WorkspaceSnapshot>; read(relativePath: string): Promise<string>; writeControlled(relativePath: string, content: string): Promise<{ relativePath: string }> };
      sessions: { list(): Promise<string[]> };
      tasks: { list(): Promise<{ path: string; status: string }[]> };
      traces: { list(): Promise<string[]> };
      models: { list(): Promise<ModelDefinition[]>; save(input: { id: string; baseUrl: string; model: string; apiKey?: string }): Promise<ModelDefinition> };
      definitions: { list(): Promise<{ agents: string[]; skills: string[] }> };
      conversation: { create(message: string): Promise<{ id: string; sessionPath: string; taskPath: string; tracePath: string; status: string }> };
      runtime: { runTask(task: string, modelId: string): Promise<{ status: string; outputPath?: string; output?: string }> };
    };
  }
}
