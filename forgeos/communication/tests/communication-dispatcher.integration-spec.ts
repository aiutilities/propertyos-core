import {
  CommunicationDispatcher,
  CommunicationDispatcherDependencies,
  CommunicationProviderRegistry,
  ProviderDeliveryRequest,
  PublishCommunicationEventInput,
  StoredCommunicationDelivery,
  UpdateDeliveryStateInput,
} from '../index';

function createDependencies(): {
  dependencies: CommunicationDispatcherDependencies;
  providers: CommunicationProviderRegistry;
  deliveryUpdates: UpdateDeliveryStateInput[];
  events: PublishCommunicationEventInput[];
  errors: Array<{
    message: string;
    metadata?: Record<string, unknown>;
  }>;
} {
  const providers =
    new CommunicationProviderRegistry();

  const deliveryUpdates:
    UpdateDeliveryStateInput[] = [];

  const events:
    PublishCommunicationEventInput[] = [];

  const errors: Array<{
    message: string;
    metadata?: Record<string, unknown>;
  }> = [];

  const dependencies:
    CommunicationDispatcherDependencies = {
      providers,

      deliveryStateStore: {
        async updateDeliveryState(
          input: UpdateDeliveryStateInput,
        ): Promise<StoredCommunicationDelivery> {
          deliveryUpdates.push(input);

          return {
            id: input.communicationId,
            status: input.status,
            metadata: input.metadata,
          };
        },
      },

      eventPublisher: {
        async publish(
          input: PublishCommunicationEventInput,
        ): Promise<void> {
          events.push(input);
        },
      },

      logger: {
        error(
          message: string,
          metadata?: Record<string, unknown>,
        ): void {
          errors.push({
            message,
            metadata,
          });
        },
      },
    };

  return {
    dependencies,
    providers,
    deliveryUpdates,
    events,
    errors,
  };
}

describe('CommunicationDispatcher', () => {
  it('marks a successful provider result as sent', async () => {
    const subject =
      createDependencies();

    subject.providers.register({
      name: 'meta-whatsapp',
      channel: 'WHATSAPP',

      validateConfiguration(): void {
        return;
      },

      async send(
        _request: ProviderDeliveryRequest,
      ) {
        return {
          success: true,
          providerName:
            'meta-whatsapp',
          providerMessageId:
            'wamid-1',
          acceptedAt:
            '2026-07-29T06:30:00.000Z',
        };
      },
    });

    const dispatcher =
      new CommunicationDispatcher(
        subject.dependencies,
      );

    await expect(
      dispatcher.dispatch({
        communicationId:
          'communication-1',
        channel: 'WHATSAPP',
        recipient: '+919999999999',
        message: 'Visitor arrived',
      }),
    ).resolves.toMatchObject({
      status: 'SENT',
      providerName:
        'meta-whatsapp',
      providerMessageId:
        'wamid-1',
    });

    expect(
      subject.deliveryUpdates,
    ).toHaveLength(1);

    expect(
      subject.deliveryUpdates[0],
    ).toMatchObject({
      communicationId:
        'communication-1',
      status: 'SENT',
    });

    expect(
      subject.events[0],
    ).toMatchObject({
      type: 'communication.sent',
    });
  });

  it('fails when no provider is registered', async () => {
    const subject =
      createDependencies();

    const dispatcher =
      new CommunicationDispatcher(
        subject.dependencies,
      );

    await expect(
      dispatcher.dispatch({
        communicationId:
          'communication-2',
        channel: 'EMAIL',
        recipient:
          'visitor@example.com',
        message: 'Visitor pass',
      }),
    ).resolves.toMatchObject({
      status: 'FAILED',
      error:
        'No communication provider registered for EMAIL',
    });

    expect(
      subject.deliveryUpdates[0],
    ).toMatchObject({
      status: 'FAILED',
    });

    expect(
      subject.events[0],
    ).toMatchObject({
      type: 'communication.failed',
    });
  });

  it('handles explicit provider failure', async () => {
    const subject =
      createDependencies();

    subject.providers.register({
      name: 'mailersend',
      channel: 'EMAIL',

      validateConfiguration(): void {
        return;
      },

      async send() {
        return {
          success: false,
          providerName: 'mailersend',
          errorMessage:
            'Provider rejected request',
          retryable: false,
        };
      },
    });

    const dispatcher =
      new CommunicationDispatcher(
        subject.dependencies,
      );

    await expect(
      dispatcher.dispatch({
        communicationId:
          'communication-3',
        channel: 'EMAIL',
        recipient:
          'visitor@example.com',
        message: 'Visitor pass',
      }),
    ).resolves.toMatchObject({
      status: 'FAILED',
      providerName: 'mailersend',
      error:
        'Provider rejected request',
    });

    expect(
      subject.deliveryUpdates[0],
    ).toMatchObject({
      status: 'FAILED',
    });
  });

  it('handles thrown provider errors', async () => {
    const subject =
      createDependencies();

    subject.providers.register({
      name: 'meta-whatsapp',
      channel: 'WHATSAPP',

      validateConfiguration(): void {
        return;
      },

      async send() {
        throw new Error(
          'Provider unavailable',
        );
      },
    });

    const dispatcher =
      new CommunicationDispatcher(
        subject.dependencies,
      );

    await expect(
      dispatcher.dispatch({
        communicationId:
          'communication-4',
        channel: 'WHATSAPP',
        recipient: '+919999999999',
        message: 'Visitor arrived',
      }),
    ).resolves.toMatchObject({
      status: 'FAILED',
      providerName:
        'meta-whatsapp',
      error: 'Provider unavailable',
    });

    expect(
      subject.errors,
    ).toHaveLength(1);
  });
});

describe(
  'CommunicationDispatcher retries',
  () => {
    it(
      'schedules retry for a retryable provider failure',
      async () => {
        const subject =
          createDependencies();

        const scheduled: unknown[] = [];

        subject.providers.register({
          name:
            'mailersend',
          channel:
            'EMAIL',

          validateConfiguration(): void {
            return;
          },

          async send() {
            return {
              success: false,
              providerName:
                'mailersend',
              errorCode:
                'RATE_LIMITED',
              errorMessage:
                'Rate limited',
              retryable: true,
            };
          },
        });

        const dispatcher =
          new CommunicationDispatcher({
            ...subject.dependencies,

            retryScheduler: {
              async scheduleRetry(
                input,
              ): Promise<void> {
                scheduled.push(
                  input,
                );
              },
            },
          });

        await expect(
          dispatcher.dispatch({
            communicationId:
              'communication-retry-1',
            channel:
              'EMAIL',
            recipient:
              'visitor@example.com',
            message:
              'Visitor pass',
            attemptNumber: 1,
            retryPolicy: {
              maximumAttempts: 3,
              initialDelayMilliseconds:
                1000,
              backoffMultiplier: 2,
              retryableErrorCodes: [
                'RATE_LIMITED',
              ],
            },
          }),
        ).resolves.toMatchObject({
          status:
            'RETRY_SCHEDULED',
          nextAttemptNumber: 2,
          retryDelayMilliseconds:
            1000,
        });

        expect(
          scheduled,
        ).toHaveLength(1);

        expect(
          subject.deliveryUpdates,
        ).toHaveLength(0);

        expect(
          subject.events[0],
        ).toMatchObject({
          type:
            'communication.retry.scheduled',
        });
      },
    );

    it(
      'fails terminally when retry attempts are exhausted',
      async () => {
        const subject =
          createDependencies();

        subject.providers.register({
          name:
            'mailersend',
          channel:
            'EMAIL',

          validateConfiguration(): void {
            return;
          },

          async send() {
            return {
              success: false,
              providerName:
                'mailersend',
              errorCode:
                'RATE_LIMITED',
              errorMessage:
                'Rate limited',
              retryable: true,
            };
          },
        });

        const dispatcher =
          new CommunicationDispatcher(
            subject.dependencies,
          );

        await expect(
          dispatcher.dispatch({
            communicationId:
              'communication-retry-2',
            channel:
              'EMAIL',
            recipient:
              'visitor@example.com',
            message:
              'Visitor pass',
            attemptNumber: 3,
            retryPolicy: {
              maximumAttempts: 3,
              initialDelayMilliseconds:
                1000,
              backoffMultiplier: 2,
            },
          }),
        ).resolves.toMatchObject({
          status: 'FAILED',
          error:
            'Rate limited',
        });

        expect(
          subject.deliveryUpdates[0],
        ).toMatchObject({
          status: 'FAILED',
        });
      },
    );

    it(
      'does not retry non-retryable provider failures',
      async () => {
        const subject =
          createDependencies();

        subject.providers.register({
          name:
            'mailersend',
          channel:
            'EMAIL',

          validateConfiguration(): void {
            return;
          },

          async send() {
            return {
              success: false,
              providerName:
                'mailersend',
              errorCode:
                'INVALID_RECIPIENT',
              errorMessage:
                'Invalid recipient',
              retryable: false,
            };
          },
        });

        const dispatcher =
          new CommunicationDispatcher(
            subject.dependencies,
          );

        await expect(
          dispatcher.dispatch({
            communicationId:
              'communication-retry-3',
            channel:
              'EMAIL',
            recipient:
              'invalid',
            message:
              'Visitor pass',
            retryPolicy: {
              maximumAttempts: 3,
              initialDelayMilliseconds:
                1000,
              backoffMultiplier: 2,
            },
          }),
        ).resolves.toMatchObject({
          status: 'FAILED',
          error:
            'Invalid recipient',
        });
      },
    );
  },
);
