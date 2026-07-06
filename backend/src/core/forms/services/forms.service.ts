import { Injectable } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { CreateFormDto } from '../dto/create-form.dto';
import { FormRegistry } from '../registries/form.registry';

@Injectable()
export class FormsService {
  private readonly source = 'core.forms';

  constructor(
    private readonly registry: FormRegistry,
    private readonly eventBus: EventBusService,
  ) {}

  async create(dto: CreateFormDto) {
    this.registry.register(dto.form);

    await this.eventBus.publish(
      'form.created',
      this.source,
      { id: dto.form.id, name: dto.form.name },
    );

    return dto.form;
  }

  list() {
    return this.registry.list();
  }

  async submit(formId: string, values: Record<string, unknown>) {
    await this.eventBus.publish(
      'form.submitted',
      this.source,
      { formId, values },
    );

    return {
      success: true,
      submittedAt: new Date(),
    };
  }
}
