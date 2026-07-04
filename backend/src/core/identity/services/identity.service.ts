import { Inject, Injectable } from '@nestjs/common';
import {
  Credential,
  Organization,
  Permission,
  Person,
  Role,
} from '../types/identity.types';
import { RolePermission } from '../types/role-permission.types';
import { IdentityRepositoryPort } from '../repositories/identity-repository.interface';

export const IDENTITY_REPOSITORY = 'IDENTITY_REPOSITORY';

@Injectable()
export class IdentityService {
  constructor(
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IdentityRepositoryPort,
  ) {}

  createPerson(input: Omit<Person, 'id' | 'createdAt'>): Promise<Person> {
    return this.identityRepository.createPerson(input);
  }

  listPersons(): Promise<Person[]> {
    return this.identityRepository.listPersons();
  }

  getPerson(id: string): Promise<Person | undefined> {
    return this.identityRepository.getPerson(id);
  }

  createOrganization(input: Omit<Organization, 'id' | 'createdAt'>): Promise<Organization> {
    return this.identityRepository.createOrganization(input);
  }

  listOrganizations(): Promise<Organization[]> {
    return this.identityRepository.listOrganizations();
  }

  getOrganization(id: string): Promise<Organization | undefined> {
    return this.identityRepository.getOrganization(id);
  }

  createRole(input: Omit<Role, 'id' | 'createdAt'>): Promise<Role> {
    return this.identityRepository.createRole(input);
  }

  listRoles(): Promise<Role[]> {
    return this.identityRepository.listRoles();
  }

  getRole(id: string): Promise<Role | undefined> {
    return this.identityRepository.getRole(id);
  }

  createPermission(input: Omit<Permission, 'id' | 'createdAt'>): Promise<Permission> {
    return this.identityRepository.createPermission(input);
  }

  listPermissions(): Promise<Permission[]> {
    return this.identityRepository.listPermissions();
  }

  getPermission(id: string): Promise<Permission | undefined> {
    return this.identityRepository.getPermission(id);
  }

  assignPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission> {
    return this.identityRepository.assignPermissionToRole(roleId, permissionId);
  }

  listRolePermissions(roleId: string): Promise<Permission[]> {
    return this.identityRepository.listRolePermissions(roleId);
  }

  createCredential(input: Omit<Credential, 'id' | 'createdAt'>): Promise<Credential> {
    return this.identityRepository.createCredential(input);
  }

  listCredentials(): Promise<Credential[]> {
    return this.identityRepository.listCredentials();
  }
}
