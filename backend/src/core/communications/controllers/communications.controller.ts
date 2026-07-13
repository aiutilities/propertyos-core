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
  ScheduleCommunicationDto,
} from '../dto/schedule-communication.dto';
import {
  TransitionCommunicationDto,
} from '../dto/transition-communication.dto';
import {
  MarkCommunicationReadDto,
} from '../dto/mark-communication-read.dto';
import {
  AcknowledgeCommunicationDto,
} from '../dto/acknowledge-communication.dto';

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
    COMMUNICATIONS_PERMISSIONS.PUBLISH,
  )
  @Post(':id/schedule')
  async schedule(
    @Param('id')
    id: string,
    @Body()
    dto: ScheduleCommunicationDto,
  ) {
    return this.success(
      await this.service.schedule(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.PUBLISH,
  )
  @Post(':id/publish')
  async publish(
    @Param('id')
    id: string,
    @Body()
    dto: TransitionCommunicationDto,
  ) {
    return this.success(
      await this.service.publish(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.PUBLISH,
  )
  @Post(':id/expire')
  async expire(
    @Param('id')
    id: string,
    @Body()
    dto: TransitionCommunicationDto,
  ) {
    return this.success(
      await this.service.expire(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.ARCHIVE,
  )
  @Post(':id/archive')
  async archive(
    @Param('id')
    id: string,
    @Body()
    dto: TransitionCommunicationDto,
  ) {
    return this.success(
      await this.service.archive(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.ARCHIVE,
  )
  @Post(':id/cancel')
  async cancel(
    @Param('id')
    id: string,
    @Body()
    dto: TransitionCommunicationDto,
  ) {
    return this.success(
      await this.service.cancel(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.READ,
  )
  @Post(':id/read')
  async markRead(
    @Param('id')
    id: string,
    @Body()
    dto: MarkCommunicationReadDto,
  ) {
    return this.success(
      await this.service.markRead(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.READ,
  )
  @Post(':id/acknowledge')
  async acknowledge(
    @Param('id')
    id: string,
    @Body()
    dto: AcknowledgeCommunicationDto,
  ) {
    return this.success(
      await this.service.acknowledge(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.READ_RECEIPTS,
  )
  @Get(':id/reads')
  async reads(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service.listReads(id),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.READ_RECEIPTS,
  )
  @Get(':id/engagement')
  async engagement(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service.getEngagementMetrics(
        id,
      ),
    );
  }

  @RequirePermission(
    COMMUNICATIONS_PERMISSIONS.READ,
  )
  @Get(':id/history')
  async history(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service.getHistory(id),
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
