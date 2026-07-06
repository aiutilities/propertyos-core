import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IssueCredentialDto } from '../dto/issue-credential.dto';
import { RevokeCredentialDto } from '../dto/revoke-credential.dto';
import { ValidateCredentialDto } from '../dto/validate-credential.dto';
import { CredentialService } from '../services/credential.service';
import { CredentialStatus } from '../types/credential.types';

@Controller('credentials')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Post()
  issueCredential(@Body() dto: IssueCredentialDto) {
    return this.credentialService.issueCredential(dto);
  }

  @Post('validate')
  validateCredential(@Body() dto: ValidateCredentialDto) {
    return this.credentialService.validateCredential(dto);
  }

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

  @Get(':id')
  getCredential(@Param('id') id: string) {
    return this.credentialService.getCredential(id);
  }

  @Get(':id/usage')
  listUsage(@Param('id') id: string) {
    return this.credentialService.listUsage(id);
  }

  @Patch(':id/revoke')
  revokeCredential(@Param('id') id: string, @Body() dto: RevokeCredentialDto) {
    return this.credentialService.revokeCredential(id, dto);
  }
}
