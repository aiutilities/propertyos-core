import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/postgres';
import { IdentityRepositoryPort } from './identity-repository.interface';
import {
  Credential,
  Organization,
  Permission,
  Person,
  Role,
} from '../types/identity.types';
import { RolePermission } from '../types/role-permission.types';
import { PersonRole } from '../types/person-role.types';

@Injectable()
export class PostgresIdentityRepository implements IdentityRepositoryPort {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async createPerson(input: Omit<Person, 'id' | 'createdAt'>): Promise<Person> {
    const id = randomUUID();

    const result = await this.pool.query(
      `
      INSERT INTO persons (id, display_name, email, phone, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        id,
        input.displayName,
        input.email ?? null,
        input.phone ?? null,
        input.status,
      ],
    );

    return this.mapPerson(result.rows[0]);
  }

  async listPersons(): Promise<Person[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM persons
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapPerson(row));
  }

  async getPerson(id: string): Promise<Person | undefined> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM persons
      WHERE id = $1
      AND deleted_at IS NULL
      `,
      [id],
    );

    return result.rows[0] ? this.mapPerson(result.rows[0]) : undefined;
  }

  async createOrganization(
    input: Omit<Organization, 'id' | 'createdAt'>,
  ): Promise<Organization> {
    const id = randomUUID();

    const result = await this.pool.query(
      `
      INSERT INTO organizations (id, name, type)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [id, input.name, input.type],
    );

    return this.mapOrganization(result.rows[0]);
  }

  async listOrganizations(): Promise<Organization[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM organizations
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapOrganization(row));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM organizations
      WHERE id = $1
      AND deleted_at IS NULL
      `,
      [id],
    );

    return result.rows[0] ? this.mapOrganization(result.rows[0]) : undefined;
  }

  async createRole(input: Omit<Role, 'id' | 'createdAt'>): Promise<Role> {
    const id = randomUUID();

    const result = await this.pool.query(
      `
      INSERT INTO roles (id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [id, input.name, input.description ?? null],
    );

    return this.mapRole(result.rows[0]);
  }

  async listRoles(): Promise<Role[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM roles
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapRole(row));
  }

  async getRole(id: string): Promise<Role | undefined> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM roles
      WHERE id = $1
      AND deleted_at IS NULL
      `,
      [id],
    );

    return result.rows[0] ? this.mapRole(result.rows[0]) : undefined;
  }

  async createPermission(
    input: Omit<Permission, 'id' | 'createdAt'>,
  ): Promise<Permission> {
    const id = randomUUID();

    const result = await this.pool.query(
      `
      INSERT INTO permissions (id, permission_key, description)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [id, input.key, input.description ?? null],
    );

    return this.mapPermission(result.rows[0]);
  }

  async listPermissions(): Promise<Permission[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM permissions
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapPermission(row));
  }

  async getPermission(id: string): Promise<Permission | undefined> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM permissions
      WHERE id = $1
      AND deleted_at IS NULL
      `,
      [id],
    );

    return result.rows[0] ? this.mapPermission(result.rows[0]) : undefined;
  }

  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission> {
    const existing = await this.pool.query(
      `
      SELECT *
      FROM role_permissions
      WHERE role_id = $1
      AND permission_id = $2
      `,
      [roleId, permissionId],
    );

    if (existing.rows[0]) {
      return this.mapRolePermission(existing.rows[0]);
    }

    const id = randomUUID();

    const result = await this.pool.query(
      `
      INSERT INTO role_permissions (id, role_id, permission_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [id, roleId, permissionId],
    );

    return this.mapRolePermission(result.rows[0]);
  }

  async listRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await this.pool.query(
      `
      SELECT p.*
      FROM permissions p
      INNER JOIN role_permissions rp
        ON rp.permission_id = p.id
      WHERE rp.role_id = $1
      AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
      `,
      [roleId],
    );

    return result.rows.map((row) => this.mapPermission(row));
  }

  async assignRoleToPerson(
    personId: string,
    roleId: string,
  ): Promise<PersonRole> {
    const existing = await this.pool.query(
      `
      SELECT *
      FROM person_roles
      WHERE person_id = $1
      AND role_id = $2
      `,
      [personId, roleId],
    );

    if (existing.rows[0]) {
      return this.mapPersonRole(existing.rows[0]);
    }

    const id = randomUUID();

    const result = await this.pool.query(
      `
      INSERT INTO person_roles (id, person_id, role_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [id, personId, roleId],
    );

    return this.mapPersonRole(result.rows[0]);
  }

  async listPersonRoles(personId: string): Promise<Role[]> {
    const result = await this.pool.query(
      `
      SELECT r.*
      FROM roles r
      INNER JOIN person_roles pr
        ON pr.role_id = r.id
      WHERE pr.person_id = $1
      AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC
      `,
      [personId],
    );

    return result.rows.map((row) => this.mapRole(row));
  }

  async createCredential(
    input: Omit<Credential, 'id' | 'createdAt'>,
  ): Promise<Credential> {
    const id = randomUUID();

    const result = await this.pool.query(
      `
      INSERT INTO credentials (id, person_id, credential_type, credential_value)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [id, input.personId, input.type, input.value],
    );

    return this.mapCredential(result.rows[0]);
  }

  async listCredentials(): Promise<Credential[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM credentials
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapCredential(row));
  }

  private mapPerson(row: any): Person {
    return {
      id: row.id,
      displayName: row.display_name,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  private mapOrganization(row: any): Organization {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      createdAt: row.created_at,
    };
  }

  private mapRole(row: any): Role {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      createdAt: row.created_at,
    };
  }

  private mapPermission(row: any): Permission {
    return {
      id: row.id,
      key: row.permission_key,
      description: row.description ?? undefined,
      createdAt: row.created_at,
    };
  }

  private mapRolePermission(row: any): RolePermission {
    return {
      id: row.id,
      roleId: row.role_id,
      permissionId: row.permission_id,
      createdAt: row.created_at,
    };
  }

  private mapPersonRole(row: any): PersonRole {
    return {
      id: row.id,
      personId: row.person_id,
      roleId: row.role_id,
      createdAt: row.created_at,
    };
  }

  private mapCredential(row: any): Credential {
    return {
      id: row.id,
      personId: row.person_id,
      type: row.credential_type,
      value: row.credential_value,
      createdAt: row.created_at,
    };
  }
}
