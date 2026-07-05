import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { Permissions } from '../../auth/constants/permissions';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { AuthTokenPayload } from '../../auth/services/auth.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { CreatePersonDto } from '../dto/create-person.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { IdentityService } from '../services/identity.service';
import {
  Credential,
  Organization,
  Permission,
  Person,
  Role,
} from '../types/identity.types';
import { PersonRole } from '../types/person-role.types';
import { RolePermission } from '../types/role-permission.types';

@Controller()
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.PERSON_CREATE)
  @Post('persons')
  async createPerson(@Body() body: CreatePersonDto): Promise<Person> {
    return this.identityService.createPerson({
      displayName: body.displayName,
      email: body.email,
      phone: body.phone,
      status: body.status ?? 'ACTIVE',
    });
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.PERSON_READ)
  @Get('persons')
  async listPersons(
    @CurrentUser() _user: AuthTokenPayload,
  ): Promise<Person[]> {
    return this.identityService.listPersons();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.PERSON_READ)
  @Get('persons/:id')
  async getPerson(@Param('id') id: string): Promise<Person | undefined> {
    return this.identityService.getPerson(id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.ORGANIZATION_CREATE)
  @Post('organizations')
  async createOrganization(
    @Body() body: CreateOrganizationDto,
  ): Promise<Organization> {
    return this.identityService.createOrganization({
      name: body.name,
      type: body.type,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.ORGANIZATION_READ)
  @Get('organizations')
  async listOrganizations(): Promise<Organization[]> {
    return this.identityService.listOrganizations();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.ORGANIZATION_READ)
  @Get('organizations/:id')
  async getOrganization(
    @Param('id') id: string,
  ): Promise<Organization | undefined> {
    return this.identityService.getOrganization(id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.ROLE_CREATE)
  @Post('roles')
  async createRole(@Body() body: CreateRoleDto): Promise<Role> {
    return this.identityService.createRole({
      name: body.name,
      description: body.description,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.ROLE_READ)
  @Get('roles')
  async listRoles(): Promise<Role[]> {
    return this.identityService.listRoles();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.ROLE_READ)
  @Get('roles/:id')
  async getRole(@Param('id') id: string): Promise<Role | undefined> {
    return this.identityService.getRole(id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.PERMISSION_CREATE)
  @Post('roles/:roleId/permissions')
  async assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Body('permissionId') permissionId: string,
  ): Promise<RolePermission> {
    return this.identityService.assignPermissionToRole(roleId, permissionId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.PERMISSION_READ)
  @Get('roles/:roleId/permissions')
  async listRolePermissions(
    @Param('roleId') roleId: string,
  ): Promise<Permission[]> {
    return this.identityService.listRolePermissions(roleId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.PERMISSION_CREATE)
  @Post('permissions')
  async createPermission(@Body() body: CreatePermissionDto): Promise<Permission> {
    return this.identityService.createPermission({
      key: body.key,
      description: body.description,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.PERMISSION_READ)
  @Get('permissions')
  async listPermissions(): Promise<Permission[]> {
    return this.identityService.listPermissions();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.PERMISSION_READ)
  @Get('permissions/:id')
  async getPermission(
    @Param('id') id: string,
  ): Promise<Permission | undefined> {
    return this.identityService.getPermission(id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.PERSON_CREATE)
  @Post('credentials')
  async createCredential(
    @Body('personId') personId: string,
    @Body('type') type: any,
    @Body('value') value: string,
  ): Promise<Credential> {
    return this.identityService.createCredential({
      personId,
      type,
      value,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.PERSON_READ)
  @Get('credentials')
  async listCredentials(): Promise<Credential[]> {
    return this.identityService.listCredentials();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.ROLE_CREATE)
  @Post('persons/:personId/roles')
  async assignRoleToPerson(
    @Param('personId') personId: string,
    @Body('roleId') roleId: string,
  ): Promise<PersonRole> {
    return this.identityService.assignRoleToPerson(personId, roleId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(Permissions.ROLE_READ)
  @Get('persons/:personId/roles')
  async listPersonRoles(
    @Param('personId') personId: string,
  ): Promise<Role[]> {
    return this.identityService.listPersonRoles(personId);
  }
}
