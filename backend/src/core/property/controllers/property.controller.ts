import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PropertyService } from '../services/property.service';
import { CreatePropertyDto } from '../dto/create-property.dto';

@Controller('/properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  async createProperty(@Body() dto: CreatePropertyDto) {
    const property = await this.propertyService.createProperty({
      id: randomUUID(),
      name: dto.name,
      code: dto.code,
      propertyType: dto.propertyType,
      description: dto.description,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      postalCode: dto.postalCode,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.success(property);
  }

  @Get()
  async listProperties() {
    return this.success(await this.propertyService.listProperties());
  }

  @Get('/:id')
  async getProperty(@Param('id') id: string) {
    return this.success(
      await this.propertyService.findPropertyById(id),
    );
  }

  private success(data: unknown) {
    return {
      success: true,
      data,
    };
  }
}
