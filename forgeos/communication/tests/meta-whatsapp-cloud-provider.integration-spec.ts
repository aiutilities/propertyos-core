import {
  MetaWhatsAppCloudProvider,
  normalizeMetaWhatsAppRecipient,
  ProviderDeliveryRequest,
  resolveMetaWhatsAppCloudConfiguration,
} from '../index';

function request(
  recipient =
    '+91 98765-43210',
): ProviderDeliveryRequest {
  return {
    communicationId:
      'communication-meta-1',
    attemptId:
      'attempt-meta-1',
    channel:
      'WHATSAPP',
    request: {
      id:
        'communication-meta-1',
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
      body:
        'Your visitor has arrived.',
    },
  };
}

function provider():
  MetaWhatsAppCloudProvider {
  return new MetaWhatsAppCloudProvider({
    graphApiVersion:
      'v99.0',
    phoneNumberId:
      '123456789012345',
    accessToken:
      'meta-test-token-00000000000000000000',
    timeoutMilliseconds:
      5000,
  });
}

describe(
  'MetaWhatsAppCloudProvider',
  () => {
    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it.each([
      [
        '+91 98765-43210',
        '919876543210',
      ],
      [
        '0091 (98765) 43210',
        '919876543210',
      ],
    ])(
      'normalizes %s to %s',
      (
        input,
        expected,
      ) => {
        expect(
          normalizeMetaWhatsAppRecipient(
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
      'blocks invalid configuration',
      () => {
        expect(
          resolveMetaWhatsAppCloudConfiguration({
            graphApiVersion:
              'latest',
            phoneNumberId:
              'abc',
            accessToken:
              'short',
          }),
        ).toMatchObject({
          status: 'BLOCKED',
        });
      },
    );

    it(
      'sends a text message',
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
                  messaging_product:
                    'whatsapp',
                  messages: [
                    {
                      id:
                        'wamid.test-1',
                    },
                  ],
                }),
                {
                  status: 200,
                },
              ),
            );

        const result =
          await provider().send(
            request(),
          );

        expect(
          result,
        ).toMatchObject({
          success: true,
          providerName:
            'meta-whatsapp-cloud',
          providerMessageId:
            'wamid.test-1',
        });

        const [
          url,
          options,
        ] =
          fetchMock.mock.calls[0];

        expect(url).toBe(
          'https://graph.facebook.com/v99.0/123456789012345/messages',
        );

        expect(options).toMatchObject({
          method: 'POST',
          redirect: 'error',
          headers: {
            authorization:
              'Bearer meta-test-token-00000000000000000000',
            'content-type':
              'application/json',
          },
        });

        const body =
          JSON.parse(
            String(
              options?.body,
            ),
          );

        expect(body).toEqual({
          messaging_product:
            'whatsapp',
          recipient_type:
            'individual',
          to:
            '919876543210',
          type:
            'text',
          text: {
            preview_url:
              false,
            body:
              'Your visitor has arrived.',
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
      'classifies rate limiting as retryable',
      async () => {
        jest
          .spyOn(
            globalThis,
            'fetch',
          )
          .mockResolvedValue(
            new Response(
              JSON.stringify({
                error: {
                  code: 4,
                },
              }),
              {
                status: 429,
              },
            ),
          );

        await expect(
          provider().send(
            request(),
          ),
        ).resolves.toMatchObject({
          success: false,
          errorCode:
            'RATE_LIMITED',
          retryable: true,
        });
      },
    );

    it(
      'classifies authentication failures as terminal',
      async () => {
        jest
          .spyOn(
            globalThis,
            'fetch',
          )
          .mockResolvedValue(
            new Response(
              JSON.stringify({
                error: {
                  code: 190,
                },
              }),
              {
                status: 401,
              },
            ),
          );

        await expect(
          provider().send(
            request(),
          ),
        ).resolves.toMatchObject({
          success: false,
          errorCode:
            'AUTHENTICATION_FAILED',
          retryable: false,
        });
      },
    );

    it(
      'times out safely',
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
              options,
            ) =>
              new Promise<Response>(
                (
                  _resolve,
                  reject,
                ) => {
                  options
                    ?.signal
                    ?.addEventListener(
                      'abort',
                      () => {
                        const error =
                          new Error(
                            'secret-timeout',
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

        const pending =
          new MetaWhatsAppCloudProvider({
            graphApiVersion:
              'v99.0',
            phoneNumberId:
              '123456789012345',
            accessToken:
              'meta-test-token-00000000000000000000',
            timeoutMilliseconds:
              100,
          }).send(
            request(),
          );

        await jest
          .advanceTimersByTimeAsync(
            100,
          );

        await expect(
          pending,
        ).resolves.toMatchObject({
          success: false,
          errorCode:
            'PROVIDER_TIMEOUT',
          retryable: true,
        });
      },
    );
  },
);
