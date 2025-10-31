import { PluginType } from "../enums/plugin-type.enum";

export type Manifest = {
  name: string;
  version: string;
  type: PluginType;
  timeouts: {
    callMs: number;
    bootMs: number;
  };
  net: {
    egressAllowList: string[];
  };
  configSchema: Record<string, any>;
};

// додати allowXml!
