import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PropertyService } from '../services/property.service';
import { CreatePropertyDto } from '../dto/create-property.dto';

import { CreateZoneDto } from '../dto/create-zone.dto';

import { CreateSpaceDto } from '../dto/create-space.dto';

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

  @Post('/:propertyId/zones')
  async createZone(
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateZoneDto,
  ) {
    const zone = await this.propertyService.createZone({
      id: randomUUID(),
      propertyId,
      name: dto.name,
      code: dto.code,
      zoneType: dto.zoneType,
      description: dto.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.success(zone);
  }

  @Get('/:propertyId/zones')
  async listZones(
    @Param('propertyId') propertyId: string,
  ) {
    return this.success(
      await this.propertyService.listZonesByProperty(propertyId),
    );
  }

  @Post('/:propertyId/spaces')
  async createSpace(
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateSpaceDto,
  ) {
    const space = await this.propertyService.createSpace({
      id: randomUUID(),
      propertyId,
      zoneId: dto.zoneId,
      name: dto.name,
      code: dto.code,
      spaceType: dto.spaceType,
      floor: dto.floor,
      description: dto.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.success(space);
  }

  @Get('/:propertyId/spaces')
  async listSpaces(
    @Param('propertyId') propertyId: string,
  ) {
    return this.success(
      await this.propertyService.listSpacesByProperty(propertyId),
    );
  }

  private success(data: unknown) {
    return {
      success: true,
      data,
    };
  }
}
