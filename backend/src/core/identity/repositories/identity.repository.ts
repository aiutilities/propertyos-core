import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
