import { Injectable, OnModuleInit } from '@nestjs/common';

import { IdentityService } from '../../identity/services/identity.service';
import { Permission } from '../../identity/types/identity.types';
import { RegistryBootstrapRunner } from './registry-bootstrap.runner';
import { PluginPermissionRegistry } from '../registries/plugin-permission.registry';
import { PluginService } from '../services/plugin.service';

type PluginPermissionDefinition =
  | string
  | {
      code?: string;
      key?: string;
      permissionKey?: string;
      name?: string;
      description?: string;
    };

@Injectable()
export class PermissionBootstrapService
  extends RegistryBootstrapRunner<PluginPermissionDefinition>
  implements OnModuleInit
{
  constructor(
    private readonly pluginService: PluginService,
    private readonly pluginPermissionRegistry: PluginPermissionRegistry,
    private readonly identityService: IdentityService,
  ) {
    super(PermissionBootstrapService.name);
  }

  async onModuleInit(): Promise<void> {
    await this.pluginService.list();
    await this.run();
  }

  load(): PluginPermissionDefinition[] {
    return this.pluginPermissionRegistry.list() as PluginPermissionDefinition[];
  }

  async synchronize(permissions: PluginPermissionDefinition[]): Promise<void> {
    const syncedPermissions: Permission[] = [];

    for (const permission of permissions) {
      syncedPermissions.push(await this.syncPermission(permission));
    }

    await this.assignPermissionsToAdministratorRoles(syncedPermissions);
  }

  private async syncPermission(
    permission: PluginPermissionDefinition,
  ): Promise<Permission> {
    const normalized = this.normalizePermission(permission);
    const existingPermissions = await this.identityService.listPermissions();

    const existing = existingPermissions.find(
      (item) => item.key === normalized.key,
    );

    if (existing) {
      this.logger.log(`Permission already exists: ${normalized.key}`);
      return existing;
    }

    const created = await this.identityService.createPermission({
      key: normalized.key,
      description: normalized.description,
    });

    this.logger.log(`Permission registered from plugin registry: ${created.key}`);

    return created;
  }

  private async assignPermissionsToAdministratorRoles(
    permissions: Permission[],
  ): Promise<void> {
    const roles = await this.identityService.listRoles();

    const administratorRoles = roles.filter((role) =>
      ['Administrator', 'Admin', 'Owner'].includes(role.name),
    );

    if (!administratorRoles.length) {
      this.logger.warn(
        'No Administrator/Admin/Owner role found. Skipping default plugin permission assignment.',
      );
      return;
    }

    for (const role of administratorRoles) {
      const existingRolePermissions =
        await this.identityService.listRolePermissions(role.id);

      for (const permission of permissions) {
        const alreadyAssigned = existingRolePermissions.some(
          (item) => item.key === permission.key,
        );

        if (alreadyAssigned) {
          continue;
        }

        await this.identityService.assignPermissionToRole(
          role.id,
          permission.id,
        );

        this.logger.log(
          `Permission assigned to ${role.name}: ${permission.key}`,
        );
      }
    }
  }

  private normalizePermission(permission: PluginPermissionDefinition): {
    key: string;
    description?: string;
  } {
    if (typeof permission === 'string') {
      return {
        key: permission,
        description: this.toTitle(permission),
      };
    }

    const key = permission.code ?? permission.key ?? permission.permissionKey;

    if (!key) {
      throw new Error('Invalid plugin permission definition');
    }

    return {
      key,
      description: permission.description ?? permission.name ?? this.toTitle(key),
    };
  }

  private toTitle(value: string): string {
    return value
      .toLowerCase()
      .split(/[._:-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
