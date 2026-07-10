import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RolePermission } from '../types/role-permission.types';
import {
  Credential,
  Organization,
  Permission,
  Person,
  Role,
} from '../types/identity.types';

@Injectable()
export class IdentityRepository {
  private readonly persons: Person[] = [];
  private readonly organizations: Organization[] = [];
  private readonly roles: Role[] = [];
  private readonly permissions: Permission[] = [];
  private readonly credentials: Credential[] = [];
  private readonly rolePermissions: RolePermission[] = [];

  createPerson(input: Omit<Person, 'id' | 'createdAt'>): Person {
    const person: Person = {
      id: randomUUID(),
      ...input,
      createdAt: new Date(),
    };

    this.persons.push(person);
    return person;
  }

  listPersons(): Person[] {
    return [...this.persons];
  }

  getPerson(id: string): Person | undefined {
    return this.persons.find((person) => person.id === id);
  }

  createOrganization(input: Omit<Organization, 'id' | 'createdAt'>): Organization {
    const organization: Organization = {
      id: randomUUID(),
      ...input,
      createdAt: new Date(),
    };

    this.organizations.push(organization);
    return organization;
  }

  listOrganizations(): Organization[] {
    return [...this.organizations];
  }

  getOrganization(id: string): Organization | undefined {
    return this.organizations.find((organization) => organization.id === id);
  }

  createRole(input: Omit<Role, 'id' | 'createdAt'>): Role {
    const role: Role = {
      id: randomUUID(),
      ...input,
      createdAt: new Date(),
    };

    this.roles.push(role);
    return role;
  }

  listRoles(): Role[] {
    return [...this.roles];
  }

  getRole(id: string): Role | undefined {
    return this.roles.find((role) => role.id === id);
  }

  createPermission(input: Omit<Permission, 'id' | 'createdAt'>): Permission {
    const permission: Permission = {
      id: randomUUID(),
      ...input,
      createdAt: new Date(),
    };

    this.permissions.push(permission);
    return permission;
  }

  listPermissions(): Permission[] {
    return [...this.permissions];
  }

  getPermission(id: string): Permission | undefined {
    return this.permissions.find((permission) => permission.id === id);
  }

  assignPermissionToRole(roleId: string, permissionId: string): RolePermission {
    const existing = this.rolePermissions.find(
      (rolePermission) =>
        rolePermission.roleId === roleId &&
        rolePermission.permissionId === permissionId,
    );

    if (existing) {
      return existing;
    }

    const rolePermission: RolePermission = {
      id: randomUUID(),
      roleId,
      permissionId,
      createdAt: new Date(),
    };

    this.rolePermissions.push(rolePermission);
    return rolePermission;
  }

  listRolePermissions(roleId: string): Permission[] {
    const permissionIds = this.rolePermissions
      .filter((rolePermission) => rolePermission.roleId === roleId)
      .map((rolePermission) => rolePermission.permissionId);

    return this.permissions.filter((permission) =>
      permissionIds.includes(permission.id),
    );
  }

  createCredential(input: Omit<Credential, 'id' | 'createdAt'>): Credential {
    const credential: Credential = {
      id: randomUUID(),
      ...input,
      createdAt: new Date(),
    };

    this.credentials.push(credential);
    return credential;
  }

  listCredentials(): Credential[] {
    return [...this.credentials];
  }
}
