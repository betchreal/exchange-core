import { Role } from "../enums/role.enum";

export type SessionContext = {
  ip?: string;
  ua?: string;
  role?: Role;
};
