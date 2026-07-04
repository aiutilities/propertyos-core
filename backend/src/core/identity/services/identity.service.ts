import { Injectable } from '@nestjs/common';
import { IdentityRepository } from '../repositories/identity.repository';
import { RolePermission } from '../types/role-permission.types';
import {
  Credential,
  Organization,
  Permission,
  Person,
  Role,
} from '../types/identity.types';

@Injectable()
export class IdentityService {
  constructor(private readonly identityRepository: IdentityRepository) {}

  createPerson(input: Omit<Person, 'id' | 'createdAt'>): Person {
    return this.identityRepository.createPerson(input);
  }

  listPersons(): Person[] {
    return this.identityRepository.listPersons();
  }

  getPerson(id: string): Person | undefined {
    return this.identityRepository.getPerson(id);
  }

  createOrganization(input: Omit<Organization, 'id' | 'createdAt'>): Organization {
    return this.identityRepository.createOrganization(input);
  }

  listOrganizations(): Organization[] {
    return this.identityRepository.listOrganizations();
  }

  getOrganization(id: string): Organization | undefined {
    return this.identityRepository.getOrganization(id);
  }

  createRole(input: Omit<Role, 'id' | 'createdAt'>): Role {
    return this.identityRepository.createRole(input);
  }

  listRoles(): Role[] {
    return this.identityRepository.listRoles();
  }

  getRole(id: string): Role | undefined {
    return this.identityRepository.getRole(id);
  }

  createPermission(input: Omit<Permission, 'id' | 'createdAt'>): Permission {
    return this.identityRepository.createPermission(input);
  }

  listPermissions(): Permission[] {
    return this.identityRepository.listPermissions();
  }

  getPermission(id: string): Permission | undefined {
    return this.identityRepository.getPermission(id);
  }

  assignPermissionToRole(
    roleId: string,
    permissionId: string,
  ): RolePermission {
    return this.identityRepository.assignPermissionToRole(
      roleId,
      permissionId,
    );
  }

  listRolePermissions(roleId: string): Permission[] {
    return this.identityRepository.listRolePermissions(roleId);
  }

  createCredential(input: Omit<Credential, 'id' | 'createdAt'>): Credential {
    return this.identityRepository.createCredential(input);
  }

  listCredentials(): Credential[] {
    return this.identityRepository.listCredentials();
  }
}
