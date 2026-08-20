export {};

type WorkspaceEntry = { path: string; kind: "file" | "directory" };
type WorkspaceSnapshot = { name: string; root: string; files: WorkspaceEntry[] };
type ModelDefinition = { id: string; provider: "openai-compatible" | "anthropic-compatible"; baseUrl: string; model: string; credentialRef: string; configured: boolean };
type BriefItem = { id: string; title: string; detail: string; status: string; path: string };
type WorkspaceBrief = { generatedAt: string; decisions: BriefItem[]; completed: BriefItem[]; inProgress: BriefItem[]; next: BriefItem[] };
type TraceEvent = { id: string; taskId: string; time: string; phase: string; status: string; agentId: string; skillIds: string[]; modelId?: string; inputFiles: string[]; outputFiles: string[]; durationMs?: number; detail: string };
type SupervisionSnapshot = { status: "healthy" | "attention"; message: string; detail: string; activeTasks: number; waitingTotal: number; waitingTasks: BriefItem[]; recentEvents: TraceEvent[]; contextFiles: string[] };
type SessionRecord = { id: string; path: string; title: string; createdAt: string; status: string; agentId: string; summary: string; hasOutput: boolean };

declare global {
  interface Window {
    firstmate?: {
      workspace: { choose(): Promise<WorkspaceSnapshot>; initialize(): Promise<WorkspaceSnapshot>; snapshot(): Promise<WorkspaceSnapshot>; brief(): Promise<WorkspaceBrief>; supervision(): Promise<SupervisionSnapshot>; read(relativePath: string): Promise<string>; writeControlled(relativePath: string, content: string): Promise<{ relativePath: string }>; importMaterials(): Promise<string[]> };
      sessions: { list(): Promise<SessionRecord[]> };
      tasks: { list(): Promise<{ path: string; status: string }[]> };
      traces: { list(): Promise<string[]> };
      models: { list(): Promise<ModelDefinition[]>; save(input: { id: string; provider: "openai-compatible" | "anthropic-compatible"; baseUrl: string; model: string; apiKey?: string }): Promise<ModelDefinition> };
      definitions: { list(): Promise<{ agents: string[]; skills: string[] }>; save(relativePath: string, content: string): Promise<{ relativePath: string; kind: "agent" | "skill" }>; create(kind: "agent" | "skill", input: { agentId: string; name: string }): Promise<{ relativePath: string; kind: "agent" | "skill" }> };
      decisions: { resolve(id: string, choice: string): Promise<{ relativePath: string }> };
      conversation: { create(message: string, existingTask?: string): Promise<{ id: string; sessionPath: string; taskPath: string; tracePath: string; status: string; agentId: string }> };
      runtime: { runTask(task: string, modelId: string): Promise<{ status: string; outputPath?: string; output?: string }> };
    };
  }
}
