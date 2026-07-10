import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { PostgresModule } from '../../database/postgres/postgres.module';
import { IdentityModule } from '../identity/identity.module';
import { CredentialController } from './controllers/credential.controller';
import { CREDENTIAL_REPOSITORY } from './repositories/credential-repository.interface';
import { PostgresCredentialRepository } from './repositories/postgres-credential.repository';
import { CredentialService } from './services/credential.service';

@Module({
  imports: [EventBusModule, PostgresModule, IdentityModule],
  controllers: [CredentialController],
  providers: [
    CredentialService,
    {
      provide: CREDENTIAL_REPOSITORY,
      useClass: PostgresCredentialRepository,
    },
  ],
  exports: [CredentialService],
})
export class CredentialModule {}
