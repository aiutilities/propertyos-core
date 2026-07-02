import { Injectable } from '@nestjs/common';
import {
  AuthorizationDecision,
  RoleAssignment,
  RolePermission,
} from '../types/authorization.types';

@Injectable()
export class AuthorizationService {
  private readonly roleAssignments: RoleAssignment[] = [];
  private readonly rolePermissions: RolePermission[] = [];

  assignRoleToPerson(personId: string, roleId: string): RoleAssignment {
    const assignment: RoleAssignment = {
      personId,
      roleId,
      createdAt: new Date(),
    };

    this.roleAssignments.push(assignment);
    return assignment;
  }

  grantPermissionToRole(roleId: string, permissionKey: string): RolePermission {
    const rolePermission: RolePermission = {
      roleId,
      permissionKey,
      createdAt: new Date(),
    };

    this.rolePermissions.push(rolePermission);
    return rolePermission;
  }

  hasPermission(personId: string, permissionKey: string): AuthorizationDecision {
    const personRoleIds = this.roleAssignments
      .filter((assignment) => assignment.personId === personId)
      .map((assignment) => assignment.roleId);

    const allowed = this.rolePermissions.some(
      (rolePermission) =>
        personRoleIds.includes(rolePermission.roleId) &&
        rolePermission.permissionKey === permissionKey,
    );

    return {
      personId,
      permissionKey,
      allowed,
      reason: allowed
        ? 'Person has permission through assigned role.'
        : 'Person does not have permission through assigned roles.',
    };
  }

  listRoleAssignments(): RoleAssignment[] {
    return [...this.roleAssignments];
  }

  listRolePermissions(): RolePermission[] {
    return [...this.rolePermissions];
  }
}
