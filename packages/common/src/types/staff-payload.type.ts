import { BasePayload } from "./base-payload.type";
import { Role } from "../enums/role.enum";

export type StaffPayload = BasePayload & {
  role: Role;
};
