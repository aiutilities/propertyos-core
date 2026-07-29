import {
  Fast2SmsProvider,
  normalizeFast2SmsRecipient,
  ProviderDeliveryRequest,
  resolveFast2SmsConfiguration,
} from '../index';

function request():
  ProviderDeliveryRequest {
  return {
    communicationId:
      'communication-sms-1',

    attemptId:
      'attempt-sms-1',

    channel:
      'SMS',

    request: {
      id:
        'communication-sms-1',

      templateKey:
        'visitor.pass.sms',

      recipient: {
        phone:
          '+91 98765-43210',
      },

      channels: [
        'SMS',
      ],

      source:
        'propertyos',

      metadata: {
        smsVariables: [
          'Anand',
          '482931',
        ],

        privateValue:
          'must-not-leave',
      },
    },

    renderedTemplate: {
      key:
        'visitor.pass.sms',

      version:
        '1.0.0',

      channel:
        'SMS',

      body:
        'Visitor pass',

      providerTemplateId:
        '123456',
    },
  };
}

function provider():
  Fast2SmsProvider {
  return new Fast2SmsProvider({
    apiKey:
      'fast2sms-test-key-00000000000000000000',

    senderId:
      'COGZDL',

    timeoutMilliseconds:
      5000,

    includeSmsDetails:
      true,
  });
}

describe(
  'Fast2SmsProvider',
  () => {
    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it.each([
      [
        '+91 98765-43210',
        '9876543210',
      ],
      [
        '0091 98765 43210',
        '9876543210',
      ],
      [
        '919876543210',
        '9876543210',
      ],
    ])(
      'normalizes %s to %s',
      (
        input,
        expected,
      ) => {
        expect(
          normalizeFast2SmsRecipient(
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
          resolveFast2SmsConfiguration({
            apiKey:
              'short',
            senderId:
              'X',
          }),
        ).toMatchObject({
          status: 'BLOCKED',
        });
      },
    );

    it(
      'sends a DLT SMS',
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
                  return: true,
                  request_id:
                    'fast2sms-request-1',
                  message: [
                    'SMS sent successfully',
                  ],
                }),
                {
                  status: 200,
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
            'fast2sms',
          providerMessageId:
            'fast2sms-request-1',
        });

        const [
          url,
          options,
        ] =
          fetchMock.mock.calls[0];

        expect(url).toBe(
          'https://www.fast2sms.com/dev/bulkV2',
        );

        expect(options).toMatchObject({
          method: 'POST',
          headers: {
            authorization:
              'fast2sms-test-key-00000000000000000000',
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
          sender_id:
            'COGZDL',

          message:
            '123456',

          variables_values:
            'Anand|482931',

          route:
            'dlt',

          numbers:
            '9876543210',

          sms_details:
            '1',

          udf1:
            'communication-sms-1',
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
      'requires a DLT message ID',
      async () => {
        const input =
          request();

        input.renderedTemplate
          .providerTemplateId =
          undefined;

        await expect(
          provider().send(input),
        ).resolves.toMatchObject({
          success: false,
          errorCode:
            'DLT_MESSAGE_ID_REQUIRED',
          retryable: false,
        });
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
                return: false,
                status_code: 429,
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

                        reject(error);
                      },
                      {
                        once: true,
                      },
                    );
                },
              ),
          );

        const pending =
          new Fast2SmsProvider({
            apiKey:
              'fast2sms-test-key-00000000000000000000',

            senderId:
              'COGZDL',

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
