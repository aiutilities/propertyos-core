import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { BootstrapController } from './controllers/bootstrap.controller';
import { BootstrapService } from './services/bootstrap.service';

@Module({
  imports: [IdentityModule],
  controllers: [BootstrapController],
  providers: [BootstrapService],
})
export class BootstrapModule {}
