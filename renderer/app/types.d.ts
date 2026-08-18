export {};

declare global {
  interface Window {
    firstmate?: {
      workspace: {
        choose(): Promise<{ name: string; files: string[] }>;
        snapshot(): Promise<{ name: string; files: string[] }>;
        read(relativePath: string): Promise<string>;
      };
    };
  }
}
