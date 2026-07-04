import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { CreatePersonDto } from '../dto/create-person.dto';
import { IdentityService } from '../services/identity.service';
import { Organization, Person } from '../types/identity.types';

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
}
