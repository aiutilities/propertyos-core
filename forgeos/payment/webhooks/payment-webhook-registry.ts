import {
  PaymentWebhookHandler,
} from './payment-webhook-handler';

import {
  PaymentWebhookHandlerNameRequiredError,
} from './payment-webhook-registry.error';

function normalize(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase();
}

export class PaymentWebhookHandlerRegistry {
  private readonly handlers =
    new Map<
      string,
      PaymentWebhookHandler
    >();

  register(
    handler:
      PaymentWebhookHandler,
  ): void {
    const name =
      normalize(
        handler.name,
      );

    if (!name) {
      throw new PaymentWebhookHandlerNameRequiredError();
    }

    this.handlers.set(
      name,
      handler,
    );
  }

  unregister(
    handlerName: string,
  ): boolean {
    return this.handlers.delete(
      normalize(
        handlerName,
      ),
    );
  }

  list():
    PaymentWebhookHandler[] {
    return Array.from(
      this.handlers.values(),
    );
  }

  matching(
    eventType:
      string | undefined,
  ): PaymentWebhookHandler[] {
    const normalizedEventType =
      eventType
        ? normalize(
            eventType,
          )
        : undefined;

    return this.list()
      .filter(
        (handler) =>
          handler.eventTypes
            .some(
              (configuredType) => {
                const normalized =
                  normalize(
                    configuredType,
                  );

                return (
                  normalized === '*' ||
                  (
                    normalizedEventType !==
                      undefined &&
                    normalized ===
                      normalizedEventType
                  )
                );
              },
            ),
      );
  }

  clear(): void {
    this.handlers.clear();
  }
}
