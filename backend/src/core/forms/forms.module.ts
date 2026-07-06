import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { FormsController } from './controllers/forms.controller';
import { FormRegistry } from './registries/form.registry';
import { FormsService } from './services/forms.service';

@Module({
  imports: [EventBusModule],
  controllers: [FormsController],
  providers: [FormsService, FormRegistry],
  exports: [FormsService, FormRegistry],
})
export class FormsModule {}
