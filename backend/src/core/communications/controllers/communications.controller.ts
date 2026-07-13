import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  RequirePermission,
} from '../../auth/decorators/require-permission.decorator';
import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';
import {
  PermissionGuard,
} from '../../auth/guards/permission.guard';

import {
  COMMUNICATIONS_PERMISSIONS,
} from '../communications.constants';

import {
  CreateCommunicationDto,
} from '../dto/create-communication.dto';
import {
  UpdateCommunicationDto,
} from '../dto/update-communication.dto';

import {
  CommunicationsService,
} from '../services/communications.service';

import {
  CommunicationPriority,
  CommunicationStatus,
  CommunicationType,
} from '../types/communications.types';

@ApiTags('Communications')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('/communications')
export class CommunicationsController {
  constructor(
    private readonly service:
      CommunicationsService,
  ) {}

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.CREATE,
  )
  @Post()
  async create(
    @Body()
    dto: CreateCommunicationDto,
  ) {
    return this.success(
      await this.service.create(dto),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('propertyId')
    propertyId?: string,
    @Query('categoryId')
    categoryId?: string,
    @Query('type')
    type?: CommunicationType,
    @Query('priority')
    priority?: CommunicationPriority,
    @Query('status')
    status?: CommunicationStatus,
    @Query('createdByPersonId')
    createdByPersonId?: string,
    @Query('isPinned')
    isPinned?: string,
    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service.list({
        propertyId,
        categoryId,
        type,
        priority,
        status,
        createdByPersonId,
        isPinned:
          isPinned === undefined
            ? undefined
            : isPinned === 'true',
        search,
      }),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.READ,
  )
  @Get('categories')
  async categories() {
    return this.success(
      await this.service.listCategories(),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.READ,
  )
  @Get('metrics')
  async metrics(
    @Query('propertyId')
    propertyId?: string,
  ) {
    return this.success(
      await this.service.getMetrics(
        propertyId,
      ),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.READ,
  )
  @Get(':id')
  async get(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service.get(id),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.MANAGE,
  )
  @Patch(':id')
  async update(
    @Param('id')
    id: string,
    @Body()
    dto: UpdateCommunicationDto,
  ) {
    return this.success(
      await this.service.update(
        id,
        dto,
      ),
    );
  }

  private success(
    data: unknown,
  ) {
    return {
      success: true,
      data,
    };
  }
}
