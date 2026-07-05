import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { AgreementService } from '../services/agreement.service';
import { CreateAgreementDto } from '../dto/create-agreement.dto';

@Controller('agreements')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AgreementController {
  constructor(private readonly agreementService: AgreementService) {}

  @Post()
  @RequirePermission('agreement.create')
  async createAgreement(@Body() body: CreateAgreementDto) {
    const agreement = await this.agreementService.createAgreement(body);

    return {
      success: true,
      data: agreement,
    };
  }

  @Get()
  @RequirePermission('agreement.read')
  async listAgreements() {
    const agreements = await this.agreementService.listAgreements();

    return {
      success: true,
      data: agreements,
    };
  }

  @Get(':id')
  @RequirePermission('agreement.read')
  async getAgreement(@Param('id') id: string) {
    const agreement = await this.agreementService.getAgreement(id);

    return {
      success: true,
      data: agreement,
    };
  }

  @Get(':id/versions')
  @RequirePermission('agreement.read')
  async listAgreementVersions(@Param('id') id: string) {
    const versions = await this.agreementService.listAgreementVersions(id);

    return {
      success: true,
      data: versions,
    };
  }
}
