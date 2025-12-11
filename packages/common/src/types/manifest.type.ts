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
  allowCurrencyCodes?: string[];
  webhook?: {
    supported: boolean;
    endpoint?: string;
  };
  supportedPairs?: Record<string, string[]>;
  configSchema: Record<string, any>;
};
