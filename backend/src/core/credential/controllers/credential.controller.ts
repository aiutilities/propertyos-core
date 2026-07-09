import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../auth/constants/permissions';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { IssueCredentialDto } from '../dto/issue-credential.dto';
import { RevokeCredentialDto } from '../dto/revoke-credential.dto';
import { ValidateCredentialDto } from '../dto/validate-credential.dto';
import { CredentialService } from '../services/credential.service';
import { CredentialStatus } from '../types/credential.types';

@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('Access Credentials')
@ApiBearerAuth('JWT')
@Controller('access-credentials')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @RequirePermission(Permissions.ACCESS_CREDENTIAL_MANAGE)
  @Post()
  issueCredential(@Body() dto: IssueCredentialDto) {
    return this.credentialService.issueCredential(dto);
  }

  @RequirePermission(Permissions.ACCESS_CREDENTIAL_MANAGE)
  @Post('validate')
  validateCredential(@Body() dto: ValidateCredentialDto) {
    return this.credentialService.validateCredential(dto);
  }

  @RequirePermission(Permissions.ACCESS_CREDENTIAL_READ)
  @Get()
  listCredentials(
    @Query('subjectType') subjectType?: string,
    @Query('subjectId') subjectId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: CredentialStatus,
  ) {
    return this.credentialService.listCredentials({
      subjectType,
      subjectId,
      propertyId,
      status,
    });
  }

  @RequirePermission(Permissions.ACCESS_CREDENTIAL_READ)
  @Get(':id')
  getCredential(@Param('id') id: string) {
    return this.credentialService.getCredential(id);
  }

  @RequirePermission(Permissions.ACCESS_CREDENTIAL_READ)
  @Get(':id/usage')
  listUsage(@Param('id') id: string) {
    return this.credentialService.listUsage(id);
  }

  @RequirePermission(Permissions.ACCESS_CREDENTIAL_MANAGE)
  @Patch(':id/revoke')
  revokeCredential(@Param('id') id: string, @Body() dto: RevokeCredentialDto) {
    return this.credentialService.revokeCredential(id, dto);
  }
}
