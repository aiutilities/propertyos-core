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

import { RequirePermission } from '../../core/auth/decorators/require-permission.decorator';
import { Permissions } from '../../core/auth/constants/permissions';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../core/auth/guards/permission.guard';
import { VisitorService } from './visitor.service';

import { CreateVisitorInviteDto } from './dto/create-visitor-invite.dto';
import { ApproveVisitorDto } from './dto/approve-visitor.dto';
import { RejectVisitorDto } from './dto/reject-visitor.dto';
import { ValidateQrDto } from './dto/validate-qr.dto';
import { CheckInVisitorDto } from './dto/check-in-visitor.dto';
import { CheckOutVisitorDto } from './dto/check-out-visitor.dto';
import { UpdateVisitorSettingsDto } from './dto/update-visitor-settings.dto';

@Controller('/plugins/visitor')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  @RequirePermission(Permissions.VISITOR_CREATE)
  @Post('/invite')
  async inviteVisitor(@Body() dto: CreateVisitorInviteDto) {
    return this.success(await this.visitorService.inviteVisitor(dto));
  }

  @RequirePermission(Permissions.VISITOR_CREATE)
  @Post('/:visitId/approve')
  async approveVisitor(
    @Param('visitId') visitId: string,
    @Body() dto: ApproveVisitorDto,
  ) {
    return this.success(await this.visitorService.approveVisitor(visitId, dto));
  }

  @RequirePermission(Permissions.VISITOR_CREATE)
  @Post('/:visitId/reject')
  async rejectVisitor(
    @Param('visitId') visitId: string,
    @Body() dto: RejectVisitorDto,
  ) {
    return this.success(await this.visitorService.rejectVisitor(visitId, dto));
  }

  @RequirePermission(Permissions.VISITOR_CREATE)
  @Post('/:visitId/generate-qr')
  async generateQrPass(@Param('visitId') visitId: string) {
    return this.success(await this.visitorService.generateQrPass(visitId));
  }

  @RequirePermission(Permissions.VISITOR_CREATE)
  @Post('/:visitId/arrive')
  async markArrived(@Param('visitId') visitId: string) {
    return this.success(await this.visitorService.markArrived(visitId));
  }

  @RequirePermission(Permissions.VISITOR_CREATE)
  @Post('/:visitId/check-in')
  async checkInVisitor(
    @Param('visitId') visitId: string,
    @Body() dto: CheckInVisitorDto,
  ) {
    return this.success(await this.visitorService.checkInVisitor(visitId, dto));
  }

  @RequirePermission(Permissions.VISITOR_CREATE)
  @Post('/:visitId/check-out')
  async checkOutVisitor(
    @Param('visitId') visitId: string,
    @Body() dto: CheckOutVisitorDto,
  ) {
    return this.success(await this.visitorService.checkOutVisitor(visitId, dto));
  }

  @RequirePermission(Permissions.VISITOR_CREATE)
  @Post('/:visitId/cancel')
  async cancelVisitor(
    @Param('visitId') visitId: string,
    @Body('reason') reason: string,
  ) {
    return this.success(await this.visitorService.cancelVisitor(visitId, reason));
  }

  @RequirePermission(Permissions.VISITOR_CREATE)
  @Post('/validate-qr')
  async validateQr(@Body() dto: ValidateQrDto) {
    return this.success(await this.visitorService.validateQr(dto));
  }

  @RequirePermission(Permissions.VISITOR_READ)
  @Get('/')
  async listVisitors(@Query() query: Record<string, unknown>) {
    return this.success(await this.visitorService.listVisits(query));
  }

  @RequirePermission(Permissions.VISITOR_READ)
  @Get('/settings')
  async getSettings(@Query('propertyId') propertyId?: string) {
    return this.success(await this.visitorService.getSettings(propertyId));
  }

  @RequirePermission(Permissions.VISITOR_CREATE)
  @Patch('/settings')
  async updateSettings(
    @Query('propertyId') propertyId: string | undefined,
    @Body() dto: UpdateVisitorSettingsDto,
  ) {
    return this.success(
      await this.visitorService.updateSettings(propertyId, dto),
    );
  }

  @RequirePermission(Permissions.VISITOR_READ)
  @Get('/:visitId')
  async getVisit(@Param('visitId') visitId: string) {
    return this.success(await this.visitorService.getVisit(visitId));
  }

  @RequirePermission(Permissions.VISITOR_READ)
  @Get('/:visitId/history')
  async getHistory(@Param('visitId') visitId: string) {
    return this.success(await this.visitorService.getHistory(visitId));
  }

  private success(data: unknown) {
    return {
      success: true,
      data,
    };
  }
}
