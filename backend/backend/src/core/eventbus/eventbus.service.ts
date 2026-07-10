import { Injectable, Logger } from '@nestjs/common';

export interface PropertyOSEvent<T = unknown> {
  type: string;
  source: string;
  payload: T;
  occurredAt: Date;
}

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  publish<T>(event: PropertyOSEvent<T>): void {
    this.logger.log(
      `Event published: ${event.type} from ${event.source}`,
    );

    // Future:
    // 1. Store event in audit log
    // 2. Notify subscribers
    // 3. Trigger workflows
    // 4. Send notifications
  }
}
