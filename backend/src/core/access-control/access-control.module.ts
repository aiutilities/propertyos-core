import { Module } from "@nestjs/common";

import { PostgresModule } from "../../database/postgres/postgres.module";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { CredentialModule } from "../credential/credential.module";
import { EventBusModule } from "../eventbus/eventbus.module";
import { PluginModule } from "../plugin/plugin.module";
import { SearchModule } from "../search";

import { AccessControlSearchProviderService } from "./access-control-search-provider.service";
import { AccessControlBootstrapService } from "./bootstrap/access-control-bootstrap.service";
import { AccessControlController } from "./controllers/access-control.controller";
import { ACCESS_CONTROL_REPOSITORY } from "./repositories/access-control.repository";
import { PostgresAccessControlRepository } from "./repositories/postgres-access-control.repository";
import { AccessControlService } from "./services/access-control.service";

@Module({
  imports: [
    AuditModule,
    AuthModule,
    CredentialModule,
    EventBusModule,
    PluginModule,
    PostgresModule,
    SearchModule,
  ],
  controllers: [AccessControlController],
  providers: [
    AccessControlBootstrapService,
    AccessControlService,
    AccessControlSearchProviderService,
    {
      provide: ACCESS_CONTROL_REPOSITORY,
      useClass: PostgresAccessControlRepository,
    },
  ],
  exports: [AccessControlService],
})
export class AccessControlModule {}
