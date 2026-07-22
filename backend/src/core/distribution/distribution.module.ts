import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EventBusModule } from "../eventbus/eventbus.module";
import { DistributionController } from "./controllers/distribution.controller";
import { DistributionRegistry } from "./registries/distribution.registry";
import { DistributionRepository } from "./repositories/distribution.repository";
import { DistributionService } from "./services/distribution.service";

@Module({
  imports: [EventBusModule, AuthModule],
  controllers: [DistributionController],
  providers: [
    DistributionService,
    DistributionRepository,
    DistributionRegistry,
  ],
  exports: [DistributionService, DistributionRegistry],
})
export class DistributionModule {}
