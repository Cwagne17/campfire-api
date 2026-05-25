export enum ParkRole {
  RANGER = "ranger",
  LEAD_RANGER = "lead_ranger",
  PARK_ADMIN = "park_admin",
}

export interface AuthenticatedUser {
  id: string;
  username?: string;
  roles: ParkRole[];
  groups: string[];
  claims: Record<string, unknown>;
}
