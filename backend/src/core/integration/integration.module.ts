import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { MockIntegrationConnector } from './connectors/mock-integration.connector';
import { IntegrationController } from './controllers/integration.controller';
import { IntegrationConnectorRegistry } from './registries/integration-connector.registry';
import { IntegrationRepository } from './repositories/integration.repository';
import { IntegrationService } from './services/integration.service';

@Module({
  imports: [EventBusModule],
  controllers: [IntegrationController],
  providers: [
    IntegrationService,
    IntegrationRepository,
    IntegrationConnectorRegistry,
    MockIntegrationConnector,
  ],
  exports: [IntegrationService, IntegrationConnectorRegistry],
})
export class IntegrationModule {}
