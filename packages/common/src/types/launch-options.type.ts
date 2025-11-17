import type { Manifest } from "./manifest.type";

export type LaunchOptions = {
  dir: string;
  manifest: Manifest;
  encryptedConfig: string;
};
