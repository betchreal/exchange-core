import { PrincipalType } from "../enums/principal-type.enum";

export type BasePayload = {
  sub: number;
  sid: string;
  consumer: PrincipalType;
};
