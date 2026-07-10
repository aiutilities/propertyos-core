import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { DistributionController } from './controllers/distribution.controller';
import { DistributionRegistry } from './registries/distribution.registry';
import { DistributionRepository } from './repositories/distribution.repository';
import { DistributionService } from './services/distribution.service';

@Module({
  imports: [EventBusModule],
  controllers: [DistributionController],
  providers: [DistributionService, DistributionRepository, DistributionRegistry],
  exports: [DistributionService, DistributionRegistry],
})
export class DistributionModule {}
