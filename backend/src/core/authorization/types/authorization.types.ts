export interface RoleAssignment {
  personId: string;
  roleId: string;
  createdAt: Date;
}

export interface RolePermission {
  roleId: string;
  permissionKey: string;
  createdAt: Date;
}

export interface AuthorizationDecision {
  personId: string;
  permissionKey: string;
  allowed: boolean;
  reason: string;
}
