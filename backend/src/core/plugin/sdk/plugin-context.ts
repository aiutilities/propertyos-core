import { EventBusService } from '../../eventbus/services/eventbus.service';

export interface PluginContext {
  eventBus: EventBusService;
  platformVersion: string;
}
