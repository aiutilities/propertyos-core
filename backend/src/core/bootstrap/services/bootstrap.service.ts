import { BadRequestException, Injectable } from '@nestjs/common';

import { Permissions } from '../../auth/constants/permissions';
import { IdentityService } from '../../identity/services/identity.service';
import { Permission, Role } from '../../identity/types/identity.types';

type BootstrapStatus = {
  setupRequired: boolean;
  personCount: number;
  administratorRoleExists: boolean;
};

@Injectable()
export class BootstrapService {
  constructor(private readonly identityService: IdentityService) {}

  async getStatus(): Promise<BootstrapStatus> {
    const persons = await this.identityService.listPersons();
    const roles = await this.identityService.listRoles();
    const administratorRoleExists = roles.some(
      (role) => role.name === 'Administrator',
    );

    return {
      setupRequired: !administratorRoleExists,
      personCount: persons.length,
      administratorRoleExists,
    };
  }

  async setupAdmin(input: {
    displayName: string;
    email: string;
    password: string;
  }) {
    const status = await this.getStatus();

    if (!status.setupRequired) {
      throw new BadRequestException('Bootstrap setup has already been completed');
    }

    if (!input.displayName?.trim()) {
      throw new BadRequestException('Display name is required');
    }

    if (!input.email?.trim()) {
      throw new BadRequestException('Email is required');
    }

    if (!input.password || input.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const person = await this.identityService.createPerson({
      displayName: input.displayName.trim(),
      email: input.email.trim().toLowerCase(),
      status: 'ACTIVE',
    });

    await this.identityService.createCredential({
      personId: person.id,
      type: 'PASSWORD',
      value: input.password,
    });

    const adminRole = await this.createAdministratorRole();
    const permissions = await this.ensurePermissions();

    for (const permission of permissions) {
      await this.identityService.assignPermissionToRole(adminRole.id, permission.id);
    }

    await this.identityService.assignRoleToPerson(person.id, adminRole.id);

    return {
      setupComplete: true,
      person,
      role: adminRole,
      permissionCount: permissions.length,
    };
  }

  private async createAdministratorRole(): Promise<Role> {
    const roles = await this.identityService.listRoles();
    const existing = roles.find((role) => role.name === 'Administrator');

    if (existing) {
      return existing;
    }

    return this.identityService.createRole({
      name: 'Administrator',
      description: 'Full platform administrator',
    });
  }

  private async ensurePermissions(): Promise<Permission[]> {
    const existingPermissions = await this.identityService.listPermissions();
    const existingByKey = new Map(
      existingPermissions.map((permission) => [permission.key, permission]),
    );

    const permissions: Permission[] = [];

    for (const key of Object.values(Permissions)) {
      const existing = existingByKey.get(key);

      if (existing) {
        permissions.push(existing);
        continue;
      }

      const created = await this.identityService.createPermission({
        key,
        description: `Allows ${key}`,
      });

      permissions.push(created);
    }

    return permissions;
  }
}
