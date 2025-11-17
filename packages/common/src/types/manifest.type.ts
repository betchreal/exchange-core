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
    signature?: "none" /*| і подумати, які ще треба*/;
  };
  configSchema: Record<string, any>;
};
