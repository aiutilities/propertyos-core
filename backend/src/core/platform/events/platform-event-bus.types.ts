import { PlatformEvent } from '../contracts/platform-event.contract';

export type PlatformEventHandler<TPayload = unknown> = (
  event: PlatformEvent<TPayload>,
) => Promise<void> | void;

export interface PlatformEventBus {
  publish<TPayload = unknown>(event: PlatformEvent<TPayload>): Promise<void>;
  subscribe<TPayload = unknown>(
    eventName: string,
    handler: PlatformEventHandler<TPayload>,
  ): void;
}
