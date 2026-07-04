import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { CreatePersonDto } from '../dto/create-person.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { IdentityService } from '../services/identity.service';
import { Organization, Permission, Person, Role } from '../types/identity.types';

@Controller()
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('persons')
  createPerson(@Body() body: CreatePersonDto): Person {
    return this.identityService.createPerson({
      displayName: body.displayName,
      email: body.email,
      phone: body.phone,
      status: body.status ?? 'ACTIVE',
    });
  }

  @Get('persons')
  listPersons(): Person[] {
    return this.identityService.listPersons();
  }

  @Get('persons/:id')
  getPerson(@Param('id') id: string): Person | undefined {
    return this.identityService.getPerson(id);
  }

  @Post('organizations')
  createOrganization(@Body() body: CreateOrganizationDto): Organization {
    return this.identityService.createOrganization({
      name: body.name,
      type: body.type,
    });
  }

  @Get('organizations')
  listOrganizations(): Organization[] {
    return this.identityService.listOrganizations();
  }

  @Get('organizations/:id')
  getOrganization(@Param('id') id: string): Organization | undefined {
    return this.identityService.getOrganization(id);
  }

  @Post('roles')
  createRole(@Body() body: CreateRoleDto): Role {
    return this.identityService.createRole({
      name: body.name,
      description: body.description,
    });
  }

  @Get('roles')
  listRoles(): Role[] {
    return this.identityService.listRoles();
  }

  @Get('roles/:id')
  getRole(@Param('id') id: string): Role | undefined {
    return this.identityService.getRole(id);
  }

  @Post('permissions')
  createPermission(@Body() body: CreatePermissionDto): Permission {
    return this.identityService.createPermission({
      key: body.key,
      description: body.description,
    });
  }

  @Get('permissions')
  listPermissions(): Permission[] {
    return this.identityService.listPermissions();
  }

  @Get('permissions/:id')
  getPermission(@Param('id') id: string): Permission | undefined {
    return this.identityService.getPermission(id);
  }
}
