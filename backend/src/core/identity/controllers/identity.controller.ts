import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
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
  @RequirePermission('person.read')
  @Get('persons')
  async listPersons(
    @CurrentUser() _user: AuthTokenPayload,
  ): Promise<Person[]> {
    return this.identityService.listPersons();
  }

  @Get('persons/:id')
  async getPerson(@Param('id') id: string): Promise<Person | undefined> {
    return this.identityService.getPerson(id);
  }

  @Post('organizations')
  async createOrganization(
    @Body() body: CreateOrganizationDto,
  ): Promise<Organization> {
    return this.identityService.createOrganization({
      name: body.name,
      type: body.type,
    });
  }

  @Get('organizations')
  async listOrganizations(): Promise<Organization[]> {
    return this.identityService.listOrganizations();
  }

  @Get('organizations/:id')
  async getOrganization(
    @Param('id') id: string,
  ): Promise<Organization | undefined> {
    return this.identityService.getOrganization(id);
  }

  @Post('roles')
  async createRole(@Body() body: CreateRoleDto): Promise<Role> {
    return this.identityService.createRole({
      name: body.name,
      description: body.description,
    });
  }

  @Get('roles')
  async listRoles(): Promise<Role[]> {
    return this.identityService.listRoles();
  }

  @Get('roles/:id')
  async getRole(@Param('id') id: string): Promise<Role | undefined> {
    return this.identityService.getRole(id);
  }

  @Post('roles/:roleId/permissions')
  async assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Body('permissionId') permissionId: string,
  ): Promise<RolePermission> {
    return this.identityService.assignPermissionToRole(roleId, permissionId);
  }

  @Get('roles/:roleId/permissions')
  async listRolePermissions(
    @Param('roleId') roleId: string,
  ): Promise<Permission[]> {
    return this.identityService.listRolePermissions(roleId);
  }

  @Post('permissions')
  async createPermission(@Body() body: CreatePermissionDto): Promise<Permission> {
    return this.identityService.createPermission({
      key: body.key,
      description: body.description,
    });
  }

  @Get('permissions')
  async listPermissions(): Promise<Permission[]> {
    return this.identityService.listPermissions();
  }

  @Get('permissions/:id')
  async getPermission(
    @Param('id') id: string,
  ): Promise<Permission | undefined> {
    return this.identityService.getPermission(id);
  }

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

  @Get('credentials')
  async listCredentials(): Promise<Credential[]> {
    return this.identityService.listCredentials();
  }

  @Post('persons/:personId/roles')
  async assignRoleToPerson(
    @Param('personId') personId: string,
    @Body('roleId') roleId: string,
  ): Promise<PersonRole> {
    return this.identityService.assignRoleToPerson(personId, roleId);
  }

  @Get('persons/:personId/roles')
  async listPersonRoles(
    @Param('personId') personId: string,
  ): Promise<Role[]> {
    return this.identityService.listPersonRoles(personId);
  }
}
