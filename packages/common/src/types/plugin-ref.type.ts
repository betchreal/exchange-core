import { PluginType } from "../enums/plugin-type.enum";

export type PluginRef = Readonly<{
  type: PluginType;
  id: number;
}>;
