import {
  normalizeInternationalPhoneRecipient,
  ProviderDeliveryRequest,
  WebhookCommunicationProvider,
} from '../index';

function deliveryRequest(
  recipient =
    '+919876543210',
): ProviderDeliveryRequest {
  return {
    communicationId:
      'communication-1',
    attemptId:
      'attempt-1',
    channel:
      'WHATSAPP',
    request: {
      id:
        'communication-1',
      templateKey:
        'visitor.arrived',
      recipient: {
        phone:
          recipient,
      },
      channels: [
        'WHATSAPP',
      ],
      source:
        'propertyos',
      metadata: {
        privateValue:
          'must-not-leave',
      },
    },
    renderedTemplate: {
      key:
        'visitor.arrived',
      version:
        '1.0.0',
      channel:
        'WHATSAPP',
      subject:
        'Visitor arrival',
      body:
        'Your visitor has arrived.',
    },
  };
}

describe(
  'WebhookCommunicationProvider',
  () => {
    const token =
      'forgeos-webhook-token-0000000000000000';

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it.each([
      [
        '+91 98765-43210',
        '+919876543210',
      ],
      [
        '0091 (98765) 43210',
        '+919876543210',
      ],
    ])(
      'normalizes %s to %s',
      (
        input,
        expected,
      ) => {
        expect(
          normalizeInternationalPhoneRecipient(
            input,
          ),
        ).toEqual({
          status: 'READY',
          recipient:
            expected,
        });
      },
    );

    it(
      'delivers a sanitized authenticated payload',
      async () => {
        const fetchMock =
          jest
            .spyOn(
              globalThis,
              'fetch',
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  success: true,
                  messageId:
                    'message-1',
                }),
                {
                  status: 200,
                },
              ),
            );

        const provider =
          new WebhookCommunicationProvider(
            {
              providerName:
                'whatsapp-webhook',
              channel:
                'WHATSAPP',
              endpoint:
                'https://automation.example.com/whatsapp',
              bearerToken:
                token,
              timeoutMilliseconds:
                5000,
              eventName:
                'propertyos.notification.whatsapp',
              minimumTokenLength:
                32,
              requireHttps:
                true,
            },
            normalizeInternationalPhoneRecipient,
          );

        await expect(
          provider.send(
            deliveryRequest(
              '+91 98765-43210',
            ),
          ),
        ).resolves.toMatchObject({
          success: true,
          providerName:
            'whatsapp-webhook',
          providerMessageId:
            'message-1',
          metadata: {
            httpStatus: 200,
            endpointHost:
              'automation.example.com',
          },
        });

        const body =
          JSON.parse(
            String(
              fetchMock
                .mock
                .calls[0][1]
                ?.body,
            ),
          );

        expect(body).toEqual({
          event:
            'propertyos.notification.whatsapp',
          version:
            '1.0',
          communication: {
            id:
              'communication-1',
            recipient:
              '+919876543210',
            message:
              'Your visitor has arrived.',
            subject:
              'Visitor arrival',
          },
        });

        expect(
          JSON.stringify(
            body,
          ),
        ).not.toContain(
          'must-not-leave',
        );
      },
    );

    it(
      'blocks invalid configuration before network access',
      async () => {
        const fetchMock =
          jest.spyOn(
            globalThis,
            'fetch',
          );

        const provider =
          new WebhookCommunicationProvider(
            {
              providerName:
                'whatsapp-webhook',
              channel:
                'WHATSAPP',
              endpoint:
                'http://automation.example.com/whatsapp',
              bearerToken:
                'short',
              eventName:
                'communication.whatsapp',
              minimumTokenLength:
                32,
              requireHttps:
                true,
            },
          );

        await expect(
          provider.send(
            deliveryRequest(),
          ),
        ).resolves.toMatchObject({
          success: false,
          errorMessage:
            expect.stringContaining(
              'WEBHOOK_CONFIGURATION_BLOCKED',
            ),
        });

        expect(
          fetchMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'sanitizes non-success responses',
      async () => {
        jest
          .spyOn(
            globalThis,
            'fetch',
          )
          .mockResolvedValue(
            new Response(
              'remote-secret',
              {
                status: 503,
              },
            ),
          );

        const provider =
          new WebhookCommunicationProvider({
            providerName:
              'whatsapp-webhook',
            channel:
              'WHATSAPP',
            endpoint:
              'https://automation.example.com/whatsapp',
            bearerToken:
              token,
            eventName:
              'communication.whatsapp',
            minimumTokenLength:
              32,
            requireHttps:
              true,
          });

        const result =
          await provider.send(
            deliveryRequest(),
          );

        expect(
          result,
        ).toMatchObject({
          success: false,
          errorMessage:
            'Webhook returned HTTP 503',
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          'remote-secret',
        );
      },
    );

    it(
      'aborts on timeout',
      async () => {
        jest.useFakeTimers();

        jest
          .spyOn(
            globalThis,
            'fetch',
          )
          .mockImplementation(
            async (
              _url,
              request,
            ) =>
              new Promise<Response>(
                (
                  _resolve,
                  reject,
                ) => {
                  request
                    ?.signal
                    ?.addEventListener(
                      'abort',
                      () => {
                        const error =
                          new Error(
                            'secret',
                          );

                        error.name =
                          'AbortError';

                        reject(
                          error,
                        );
                      },
                      {
                        once: true,
                      },
                    );
                },
              ),
          );

        const provider =
          new WebhookCommunicationProvider({
            providerName:
              'whatsapp-webhook',
            channel:
              'WHATSAPP',
            endpoint:
              'https://automation.example.com/whatsapp',
            bearerToken:
              token,
            timeoutMilliseconds:
              100,
            eventName:
              'communication.whatsapp',
            minimumTokenLength:
              32,
            requireHttps:
              true,
          });

        const pending =
          provider.send(
            deliveryRequest(),
          );

        await jest
          .advanceTimersByTimeAsync(
            100,
          );

        await expect(
          pending,
        ).resolves.toMatchObject({
          success: false,
          errorMessage:
            'Webhook request timed out',
        });
      },
    );
  },
);
