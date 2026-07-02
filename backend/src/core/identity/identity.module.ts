import { Module } from '@nestjs/common';
import { IdentityRepository } from './repositories/identity.repository';
import { IdentityService } from './services/identity.service';

@Module({
  providers: [IdentityRepository, IdentityService],
  exports: [IdentityService],
})
export class IdentityModule {}
