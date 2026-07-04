import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { CreatePersonDto } from '../dto/create-person.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { IdentityService } from '../services/identity.service';
import {
  Organization,
  Permission,
  Person,
  Role,
} from '../types/identity.types';
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

  @Get('persons')
  async listPersons(): Promise<Person[]> {
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
}
