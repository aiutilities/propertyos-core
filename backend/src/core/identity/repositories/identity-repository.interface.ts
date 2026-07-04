import {
  Credential,
  Organization,
  Permission,
  Person,
  Role,
} from '../types/identity.types';
import { RolePermission } from '../types/role-permission.types';
import { PersonRole } from '../types/person-role.types';

export interface IdentityRepositoryPort {
  createPerson(input: Omit<Person, 'id' | 'createdAt'>): Promise<Person>;
  listPersons(): Promise<Person[]>;
  getPerson(id: string): Promise<Person | undefined>;

  createOrganization(input: Omit<Organization, 'id' | 'createdAt'>): Promise<Organization>;
  listOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;

  createRole(input: Omit<Role, 'id' | 'createdAt'>): Promise<Role>;
  listRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;

  createPermission(input: Omit<Permission, 'id' | 'createdAt'>): Promise<Permission>;
  listPermissions(): Promise<Permission[]>;
  getPermission(id: string): Promise<Permission | undefined>;

  assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission>;
  listRolePermissions(roleId: string): Promise<Permission[]>;

  createCredential(input: Omit<Credential, 'id' | 'createdAt'>): Promise<Credential>;
  listCredentials(): Promise<Credential[]>;

  assignRoleToPerson(personId: string, roleId: string): Promise<PersonRole>;
  listPersonRoles(personId: string): Promise<Role[]>;
}
