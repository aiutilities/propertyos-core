import {
  MailerSendProvider,
  ProviderDeliveryRequest,
  resolveMailerSendConfiguration,
  validateMailerSendEmail,
} from '../index';

function request():
  ProviderDeliveryRequest {
  return {
    communicationId:
      'communication-email-1',
    attemptId:
      'attempt-email-1',
    channel:
      'EMAIL',

    request: {
      id:
        'communication-email-1',
      templateKey:
        'visitor.pass',
      recipient: {
        email:
          'Visitor@Example.com',
        name:
          'Visitor',
      },
      channels: [
        'EMAIL',
      ],
      source:
        'propertyos',
      metadata: {
        html:
          '<strong>Your visitor pass is ready.</strong>',
        privateValue:
          'must-not-leave',
      },
    },

    renderedTemplate: {
      key:
        'visitor.pass',
      version:
        '1.0.0',
      channel:
        'EMAIL',
      subject:
        'Your visitor pass',
      body:
        'Your visitor pass is ready.',
    },
  };
}

function provider():
  MailerSendProvider {
  return new MailerSendProvider({
    apiToken:
      'mailersend-test-token-0000000000000000',
    fromEmail:
      'notifications@example.com',
    fromName:
      'PropertyOS',
    replyToEmail:
      'support@example.com',
    replyToName:
      'PropertyOS Support',
    timeoutMilliseconds:
      5000,
    trackClicks:
      false,
    trackOpens:
      true,
  });
}

describe(
  'MailerSendProvider',
  () => {
    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it(
      'normalizes a valid email',
      () => {
        expect(
          validateMailerSendEmail(
            ' Visitor@Example.com ',
          ),
        ).toEqual({
          status: 'READY',
          email:
            'visitor@example.com',
        });
      },
    );

    it(
      'blocks invalid configuration',
      () => {
        expect(
          resolveMailerSendConfiguration({
            apiToken:
              'short',
            fromEmail:
              'invalid',
          }),
        ).toMatchObject({
          status: 'BLOCKED',
        });
      },
    );

    it(
      'sends an email and reads x-message-id',
      async () => {
        const fetchMock =
          jest
            .spyOn(
              globalThis,
              'fetch',
            )
            .mockResolvedValue(
              new Response(
                null,
                {
                  status: 202,
                  headers: {
                    'x-message-id':
                      'mailersend-message-1',
                  },
                },
              ),
            );

        await expect(
          provider().send(
            request(),
          ),
        ).resolves.toMatchObject({
          success: true,
          providerName:
            'mailersend',
          providerMessageId:
            'mailersend-message-1',
        });

        const [
          url,
          options,
        ] =
          fetchMock.mock.calls[0];

        expect(url).toBe(
          'https://api.mailersend.com/v1/email',
        );

        expect(options).toMatchObject({
          method: 'POST',
          redirect: 'error',
          headers: {
            authorization:
              'Bearer mailersend-test-token-0000000000000000',
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
          from: {
            email:
              'notifications@example.com',
            name:
              'PropertyOS',
          },

          to: [
            {
              email:
                'visitor@example.com',
              name:
                'Visitor',
            },
          ],

          subject:
            'Your visitor pass',

          text:
            'Your visitor pass is ready.',

          html:
            '<strong>Your visitor pass is ready.</strong>',

          reply_to: {
            email:
              'support@example.com',
            name:
              'PropertyOS Support',
          },

          settings: {
            track_clicks:
              false,
            track_opens:
              true,
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
                message:
                  'Too many requests',
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
      'classifies validation failure as terminal',
      async () => {
        jest
          .spyOn(
            globalThis,
            'fetch',
          )
          .mockResolvedValue(
            new Response(
              JSON.stringify({
                message:
                  'Validation failed',
              }),
              {
                status: 422,
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
            'VALIDATION_FAILED',
          retryable: false,
        });
      },
    );

    it(
      'detects all-suppressed acknowledgement',
      async () => {
        jest
          .spyOn(
            globalThis,
            'fetch',
          )
          .mockResolvedValue(
            new Response(
              JSON.stringify({
                message:
                  'There are some warnings for your request.',
                warnings: [
                  {
                    type:
                      'ALL_SUPPRESSED',
                    message:
                      'All recipients were suppressed',
                  },
                ],
              }),
              {
                status: 202,
                headers: {
                  'content-type':
                    'application/json',
                },
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
            'ALL_RECIPIENTS_SUPPRESSED',
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
          new MailerSendProvider({
            apiToken:
              'mailersend-test-token-0000000000000000',
            fromEmail:
              'notifications@example.com',
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
