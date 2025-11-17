export type BootOptions = {
  entry: string;
  cwd: string;
  env: Record<string, string>;
  timeoutMs: number;
};
