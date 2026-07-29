import {
  CommunicationFallbackEngine,
  DispatchCommunicationInput,
  DispatchCommunicationResult,
  validateCommunicationFallbackPolicy,
} from '../index';

function createFixture(
  results:
    Partial<
      Record<
        DispatchCommunicationInput['channel'],
        DispatchCommunicationResult
      >
    >,
) {
  const dispatchCalls:
    DispatchCommunicationInput[] = [];

  const events:
    Array<Record<string, unknown>> = [];

  const dispatcher = {
    async dispatch(
      input:
        DispatchCommunicationInput,
    ): Promise<DispatchCommunicationResult> {
      dispatchCalls.push(input);

      return (
        results[input.channel] ?? {
          communicationId:
            input.communicationId,
          status:
            'FAILED',
          error:
            `No result for ${input.channel}`,
        }
      );
    },
  };

  const eventPublisher = {
    async publish(
      input:
        Record<string, unknown>,
    ): Promise<void> {
      events.push(input);
    },
  };

  const engine =
    new CommunicationFallbackEngine({
      dispatcher:
        dispatcher as never,
      eventPublisher:
        eventPublisher as never,
    });

  return {
    engine,
    dispatchCalls,
    events,
  };
}

describe(
  'CommunicationFallbackEngine',
  () => {
    it(
      'stops after the primary channel succeeds',
      async () => {
        const fixture =
          createFixture({
            WHATSAPP: {
              communicationId:
                'communication-1',
              status:
                'SENT',
              providerName:
                'meta-whatsapp',
            },
          });

        await expect(
          fixture.engine.dispatch({
            communicationId:
              'communication-1',
            primaryChannel:
              'WHATSAPP',
            recipient:
              '+919999999999',
            message:
              'Visitor pass',
            fallbackPolicy: {
              enabled: true,
              channelOrder: [
                'WHATSAPP',
                'SMS',
                'EMAIL',
              ],
              continueOnFailure:
                true,
              stopAfterFirstSuccess:
                true,
            },
          }),
        ).resolves.toMatchObject({
          status: 'SENT',
          successfulChannel:
            'WHATSAPP',
        });

        expect(
          fixture.dispatchCalls,
        ).toHaveLength(1);
      },
    );

    it(
      'falls back from WhatsApp to SMS',
      async () => {
        const fixture =
          createFixture({
            WHATSAPP: {
              communicationId:
                'communication-2',
              status:
                'FAILED',
              providerName:
                'meta-whatsapp',
              error:
                'Provider unavailable',
            },

            SMS: {
              communicationId:
                'communication-2',
              status:
                'SENT',
              providerName:
                'fast2sms',
            },
          });

        const result =
          await fixture.engine.dispatch({
            communicationId:
              'communication-2',
            primaryChannel:
              'WHATSAPP',
            recipient:
              '+919999999999',
            message:
              'Visitor pass',
            fallbackPolicy: {
              enabled: true,
              channelOrder: [
                'WHATSAPP',
                'SMS',
                'EMAIL',
              ],
              continueOnFailure:
                true,
              stopAfterFirstSuccess:
                true,
            },
          });

        expect(result).toMatchObject({
          status: 'SENT',
          successfulChannel:
            'SMS',
        });

        expect(
          fixture.dispatchCalls.map(
            (call) => call.channel,
          ),
        ).toEqual([
          'WHATSAPP',
          'SMS',
        ]);
      },
    );

    it(
      'stops fallback when a retry is scheduled',
      async () => {
        const fixture =
          createFixture({
            WHATSAPP: {
              communicationId:
                'communication-3',
              status:
                'RETRY_SCHEDULED',
              providerName:
                'meta-whatsapp',
              nextAttemptNumber:
                2,
              retryDelayMilliseconds:
                1000,
            },
          });

        await expect(
          fixture.engine.dispatch({
            communicationId:
              'communication-3',
            primaryChannel:
              'WHATSAPP',
            recipient:
              '+919999999999',
            message:
              'Visitor pass',
            fallbackPolicy: {
              enabled: true,
              channelOrder: [
                'WHATSAPP',
                'SMS',
                'EMAIL',
              ],
              continueOnFailure:
                true,
              stopAfterFirstSuccess:
                true,
            },
          }),
        ).resolves.toMatchObject({
          status:
            'RETRY_SCHEDULED',
        });

        expect(
          fixture.dispatchCalls,
        ).toHaveLength(1);
      },
    );

    it(
      'returns terminal failure when all channels fail',
      async () => {
        const fixture =
          createFixture({
            WHATSAPP: {
              communicationId:
                'communication-4',
              status:
                'FAILED',
            },

            SMS: {
              communicationId:
                'communication-4',
              status:
                'FAILED',
            },

            EMAIL: {
              communicationId:
                'communication-4',
              status:
                'FAILED',
            },
          });

        const result =
          await fixture.engine.dispatch({
            communicationId:
              'communication-4',
            primaryChannel:
              'WHATSAPP',
            recipient:
              '+919999999999',
            message:
              'Visitor pass',
            fallbackPolicy: {
              enabled: true,
              channelOrder: [
                'WHATSAPP',
                'SMS',
                'EMAIL',
              ],
              continueOnFailure:
                true,
              stopAfterFirstSuccess:
                true,
            },
          });

        expect(result.status).toBe(
          'FAILED',
        );

        expect(
          result.attempts,
        ).toHaveLength(3);
      },
    );

    it(
      'executes only primary channel when fallback is disabled',
      async () => {
        const fixture =
          createFixture({
            WHATSAPP: {
              communicationId:
                'communication-5',
              status:
                'FAILED',
            },
          });

        await fixture.engine.dispatch({
          communicationId:
            'communication-5',
          primaryChannel:
            'WHATSAPP',
          recipient:
            '+919999999999',
          message:
            'Visitor pass',
          fallbackPolicy: {
            enabled: false,
            channelOrder: [],
            continueOnFailure:
              false,
            stopAfterFirstSuccess:
              true,
          },
        });

        expect(
          fixture.dispatchCalls.map(
            (call) => call.channel,
          ),
        ).toEqual([
          'WHATSAPP',
        ]);
      },
    );

    it(
      'blocks duplicate fallback channels',
      () => {
        expect(
          validateCommunicationFallbackPolicy({
            enabled: true,
            channelOrder: [
              'WHATSAPP',
              'WHATSAPP',
            ],
            continueOnFailure:
              true,
            stopAfterFirstSuccess:
              true,
          }),
        ).toMatchObject({
          status:
            'BLOCKED',
        });
      },
    );
  },
);
