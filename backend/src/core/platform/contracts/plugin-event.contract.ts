import { PlatformEvent } from './platform-event.contract';

export interface PluginEvent<TPayload = unknown> extends PlatformEvent<TPayload> {
  pluginName: string;
  pluginVersion?: string;
}
