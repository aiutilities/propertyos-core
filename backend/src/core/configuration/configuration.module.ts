import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { ConfigurationController } from "./controllers/configuration.controller";
import { PostgresConfigurationRepository } from "./repositories/postgres-configuration.repository";
import { ConfigurationService } from "./services/configuration.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ConfigurationController],
  providers: [ConfigurationService, PostgresConfigurationRepository],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
