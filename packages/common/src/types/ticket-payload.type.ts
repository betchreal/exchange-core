import { PluginType } from "../enums/plugin-type.enum";

export type TicketPayload = {
  iss: string;
  sub: `${string}@${string}`;
  iat: number;
  exp: number;
  jti: string;
  type: PluginType;
};
