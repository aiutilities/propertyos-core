import { Module } from '@nestjs/common';
import { IdentityController } from './controllers/identity.controller';
import { IdentityRepository } from './repositories/identity.repository';
import { IdentityService } from './services/identity.service';

@Module({
  controllers: [IdentityController],
  providers: [IdentityRepository, IdentityService],
  exports: [IdentityService],
})
export class IdentityModule {}
