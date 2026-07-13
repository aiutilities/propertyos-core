import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { AssignHelpdeskTicketDto } from '../dto/assign-helpdesk-ticket.dto';
import { CreateHelpdeskTicketDto } from '../dto/create-helpdesk-ticket.dto';
import { UpdateHelpdeskTicketDto } from '../dto/update-helpdesk-ticket.dto';
import { ResolveHelpdeskTicketDto } from '../dto/resolve-helpdesk-ticket.dto';
import { TransitionHelpdeskTicketDto } from '../dto/transition-helpdesk-ticket.dto';
import { AddHelpdeskCommentDto } from '../dto/add-helpdesk-comment.dto';
import { AddHelpdeskWorklogDto } from '../dto/add-helpdesk-worklog.dto';
import { SubmitHelpdeskFeedbackDto } from '../dto/submit-helpdesk-feedback.dto';
import {
  HELPDESK_PERMISSIONS,
} from '../helpdesk.constants';
import { HelpdeskService } from '../services/helpdesk.service';
import {
  HelpdeskChannel,
  HelpdeskPriority,
  HelpdeskStatus,
} from '../types/helpdesk.types';

@ApiTags('Helpdesk')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('/helpdesk')
export class HelpdeskController {
  constructor(
    private readonly helpdeskService: HelpdeskService,
  ) {}

  @RequirePermission(HELPDESK_PERMISSIONS.CREATE)
  @Post()
  async create(
    @Body() dto: CreateHelpdeskTicketDto,
  ) {
    return this.success(
      await this.helpdeskService.create(dto),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.READ)
  @Get()
  async list(
    @Query('propertyId') propertyId?: string,
    @Query('spaceId') spaceId?: string,
    @Query('requesterPersonId')
    requesterPersonId?: string,
    @Query('assigneePersonId')
    assigneePersonId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('priority')
    priority?: HelpdeskPriority,
    @Query('status') status?: HelpdeskStatus,
    @Query('channel') channel?: HelpdeskChannel,
    @Query('search') search?: string,
  ) {
    return this.success(
      await this.helpdeskService.list({
        propertyId,
        spaceId,
        requesterPersonId,
        assigneePersonId,
        categoryId,
        priority,
        status,
        channel,
        search,
      }),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.READ)
  @Get('categories')
  async listCategories() {
    return this.success(
      await this.helpdeskService.listCategories(),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.READ)
  @Get('metrics')
  async getMetrics(
    @Query('propertyId') propertyId?: string,
  ) {
    return this.success(
      await this.helpdeskService.getMetrics(
        propertyId,
      ),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.READ)
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.success(
      await this.helpdeskService.get(id),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.MANAGE)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHelpdeskTicketDto,
  ) {
    return this.success(
      await this.helpdeskService.update(id, dto),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.ASSIGN)
  @Post(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignHelpdeskTicketDto,
  ) {
    return this.success(
      await this.helpdeskService.assign(id, dto),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.MANAGE)
  @Post(':id/start-progress')
  async startProgress(
    @Param('id') id: string,
    @Body() dto: TransitionHelpdeskTicketDto,
  ) {
    return this.success(
      await this.helpdeskService.startProgress(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.MANAGE)
  @Post(':id/escalate')
  async escalate(
    @Param('id') id: string,
    @Body() dto: TransitionHelpdeskTicketDto,
  ) {
    return this.success(
      await this.helpdeskService.escalate(id, dto),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.RESOLVE)
  @Post(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @Body() dto: ResolveHelpdeskTicketDto,
  ) {
    return this.success(
      await this.helpdeskService.resolve(id, dto),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.RESOLVE)
  @Post(':id/reopen')
  async reopen(
    @Param('id') id: string,
    @Body() dto: TransitionHelpdeskTicketDto,
  ) {
    return this.success(
      await this.helpdeskService.reopen(id, dto),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.RESOLVE)
  @Post(':id/close')
  async close(
    @Param('id') id: string,
    @Body() dto: TransitionHelpdeskTicketDto,
  ) {
    return this.success(
      await this.helpdeskService.close(id, dto),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.RESOLVE)
  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() dto: TransitionHelpdeskTicketDto,
  ) {
    return this.success(
      await this.helpdeskService.cancel(id, dto),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.COMMENT)
  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() dto: AddHelpdeskCommentDto,
  ) {
    return this.success(
      await this.helpdeskService.addComment(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.MANAGE)
  @Post(':id/worklogs')
  async addWorklog(
    @Param('id') id: string,
    @Body() dto: AddHelpdeskWorklogDto,
  ) {
    return this.success(
      await this.helpdeskService.addWorklog(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.CREATE)
  @Post(':id/feedback')
  async submitFeedback(
    @Param('id') id: string,
    @Body() dto: SubmitHelpdeskFeedbackDto,
  ) {
    return this.success(
      await this.helpdeskService.submitFeedback(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(HELPDESK_PERMISSIONS.READ)
  @Get(':id/history')
  async history(@Param('id') id: string) {
    return this.success(
      await this.helpdeskService.getHistory(id),
    );
  }

  private success(data: unknown) {
    return {
      success: true,
      data,
    };
  }
}
