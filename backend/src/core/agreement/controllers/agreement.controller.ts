import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { PaginationQueryDto } from '../../platform';
import { AgreementService } from '../services/agreement.service';
import { CreateAgreementDto } from '../dto/create-agreement.dto';

@ApiTags('Agreements')
@ApiBearerAuth('JWT')
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
  async listAgreements(@Query() query: PaginationQueryDto) {
    const agreements = await this.agreementService.listAgreementsPaginated(query);

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
