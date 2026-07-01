import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { VisitorService } from './visitor.service';

import { CreateVisitorInviteDto } from './dto/create-visitor-invite.dto';
import { ApproveVisitorDto } from './dto/approve-visitor.dto';
import { RejectVisitorDto } from './dto/reject-visitor.dto';
import { ValidateQrDto } from './dto/validate-qr.dto';
import { CheckInVisitorDto } from './dto/check-in-visitor.dto';
import { CheckOutVisitorDto } from './dto/check-out-visitor.dto';
import { UpdateVisitorSettingsDto } from './dto/update-visitor-settings.dto';

@Controller('/plugins/visitor')
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  @Post('/invite')
  async inviteVisitor(@Body() dto: CreateVisitorInviteDto) {
    return this.success(await this.visitorService.inviteVisitor(dto));
  }

  @Post('/:visitId/approve')
  async approveVisitor(
    @Param('visitId') visitId: string,
    @Body() dto: ApproveVisitorDto,
  ) {
    return this.success(await this.visitorService.approveVisitor(visitId, dto));
  }

  @Post('/:visitId/reject')
  async rejectVisitor(
    @Param('visitId') visitId: string,
    @Body() dto: RejectVisitorDto,
  ) {
    return this.success(await this.visitorService.rejectVisitor(visitId, dto));
  }

  @Post('/:visitId/generate-qr')
  async generateQrPass(@Param('visitId') visitId: string) {
    return this.success(await this.visitorService.generateQrPass(visitId));
  }

  @Post('/:visitId/arrive')
  async markArrived(@Param('visitId') visitId: string) {
    return this.success(await this.visitorService.markArrived(visitId));
  }

  @Post('/:visitId/check-in')
  async checkInVisitor(
    @Param('visitId') visitId: string,
    @Body() dto: CheckInVisitorDto,
  ) {
    return this.success(await this.visitorService.checkInVisitor(visitId, dto));
  }

  @Post('/:visitId/check-out')
  async checkOutVisitor(
    @Param('visitId') visitId: string,
    @Body() dto: CheckOutVisitorDto,
  ) {
    return this.success(await this.visitorService.checkOutVisitor(visitId, dto));
  }

  @Post('/:visitId/cancel')
  async cancelVisitor(
    @Param('visitId') visitId: string,
    @Body('reason') reason: string,
  ) {
    return this.success(await this.visitorService.cancelVisitor(visitId, reason));
  }

  @Post('/validate-qr')
  async validateQr(@Body() dto: ValidateQrDto) {
    return this.success(await this.visitorService.validateQr(dto));
  }

  @Get('/')
  async listVisitors(@Query() query: Record<string, unknown>) {
    return this.success(await this.visitorService.listVisits(query));
  }

  @Get('/settings')
  async getSettings(@Query('propertyId') propertyId?: string) {
    return this.success(await this.visitorService.getSettings(propertyId));
  }

  @Patch('/settings')
  async updateSettings(
    @Query('propertyId') propertyId: string | undefined,
    @Body() dto: UpdateVisitorSettingsDto,
  ) {
    return this.success(
      await this.visitorService.updateSettings(propertyId, dto),
    );
  }

  @Get('/:visitId')
  async getVisit(@Param('visitId') visitId: string) {
    return this.success(await this.visitorService.getVisit(visitId));
  }

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
