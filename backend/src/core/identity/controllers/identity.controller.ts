import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreatePersonDto } from '../dto/create-person.dto';
import { IdentityService } from '../services/identity.service';
import { Person } from '../types/identity.types';

@Controller('persons')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post()
  createPerson(@Body() body: CreatePersonDto): Person {
    return this.identityService.createPerson({
      displayName: body.displayName,
      email: body.email,
      phone: body.phone,
      status: body.status ?? 'ACTIVE',
    });
  }

  @Get()
  listPersons(): Person[] {
    return this.identityService.listPersons();
  }

  @Get(':id')
  getPerson(@Param('id') id: string): Person | undefined {
    return this.identityService.getPerson(id);
  }
}
