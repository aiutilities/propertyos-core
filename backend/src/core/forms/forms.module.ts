import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { FormsController } from './controllers/forms.controller';
import {
  FORM_REPOSITORY,
} from './repositories/form-repository.interface';
import { PostgresFormRepository } from './repositories/postgres-form.repository';
import { FormRegistry } from './registries/form.registry';
import { FormsService } from './services/forms.service';

@Module({
  imports: [DatabaseModule, EventBusModule],
  controllers: [FormsController],
  providers: [
    FormsService,
    FormRegistry,
    {
      provide: FORM_REPOSITORY,
      useClass: PostgresFormRepository,
    },
  ],
  exports: [FormsService, FormRegistry, FORM_REPOSITORY],
})
export class FormsModule {}
