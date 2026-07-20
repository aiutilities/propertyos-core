import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { NotificationMessage } from '../types/notification.types';
import {
  normalizeWhatsAppRecipient,
  WhatsAppWebhookNotificationProvider,
} from './whatsapp-webhook-notification.provider';

describe(
  'Phase 14B2 WhatsApp webhook provider',
  () => {
    const originalEnvironment = {
      nodeEnvironment:
        process.env.NODE_ENV,
      webhookUrl:
        process.env.WHATSAPP_WEBHOOK_URL,
      webhookToken:
        process.env.WHATSAPP_WEBHOOK_TOKEN,
      timeoutMs:
        process.env
          .WHATSAPP_WEBHOOK_TIMEOUT_MS,
    };

    const token =
      'phase-14b-provider-test-token-000000000000';

    function restore(
      name: string,
      value: string | undefined,
    ): void {
      if (value === undefined) {
        delete process.env[name];
        return;
      }

      process.env[name] = value;
    }

    function notification(
      recipient = '+919876543210',
    ): NotificationMessage {
      return {
        id: 'notification-14b2',
        channel: 'WHATSAPP',
        recipient,
        subject: 'Visitor arrival',
        message:
          'Your visitor has arrived.',
        status: 'PENDING',
        metadata: {
          privateInternalValue:
            'must-not-leave-propertyos',
        },
        createdAt: new Date(
          '2026-07-20T06:00:00.000Z',
        ),
      };
    }

    beforeEach(() => {
      process.env.NODE_ENV =
        'production';
      process.env.WHATSAPP_WEBHOOK_URL =
        'https://automation.example.com/propertyos/whatsapp';
      process.env.WHATSAPP_WEBHOOK_TOKEN =
        token;
      process.env
        .WHATSAPP_WEBHOOK_TIMEOUT_MS =
        '5000';
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();

      restore(
        'NODE_ENV',
        originalEnvironment.nodeEnvironment,
      );
      restore(
        'WHATSAPP_WEBHOOK_URL',
        originalEnvironment.webhookUrl,
      );
      restore(
        'WHATSAPP_WEBHOOK_TOKEN',
        originalEnvironment.webhookToken,
      );
      restore(
        'WHATSAPP_WEBHOOK_TIMEOUT_MS',
        originalEnvironment.timeoutMs,
      );
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
      (input, expected) => {
        expect(
          normalizeWhatsAppRecipient(
            input,
          ),
        ).toEqual({
          status: 'READY',
          recipient: expected,
        });
      },
    );

    it.each([
      '9876543210',
      '+0123456789',
      '+123',
      'not-a-phone',
    ])(
      'rejects non-E.164 recipient %s',
      (recipient) => {
        expect(
          normalizeWhatsAppRecipient(
            recipient,
          ),
        ).toEqual({
          status: 'BLOCKED',
          error:
            'WhatsApp recipient must use international E.164 format',
        });
      },
    );

    it(
      'delivers a minimal authenticated payload',
      async () => {
        const fetchMock = jest
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(
            new Response(
              JSON.stringify({
                success: true,
                messageId:
                  'wpp-message-123',
              }),
              {
                status: 200,
                headers: {
                  'content-type':
                    'application/json',
                },
              },
            ),
          );

        const provider =
          new WhatsAppWebhookNotificationProvider();

        const result = await provider.send(
          notification(
            '+91 98765-43210',
          ),
        );

        expect(result).toEqual({
          success: true,
          providerName:
            'whatsapp-webhook',
          providerMessageId:
            'wpp-message-123',
          metadata: {
            httpStatus: 200,
            endpointHost:
              'automation.example.com',
          },
        });

        expect(fetchMock).toHaveBeenCalledTimes(
          1,
        );

        const [url, request] =
          fetchMock.mock.calls[0];

        expect(url).toBe(
          'https://automation.example.com/propertyos/whatsapp',
        );

        expect(request).toMatchObject({
          method: 'POST',
          redirect: 'error',
          headers: {
            accept: 'application/json',
            authorization:
              `Bearer ${token}`,
            'content-type':
              'application/json',
          },
        });

        const body = JSON.parse(
          String(request?.body),
        ) as Record<string, unknown>;

        expect(body).toEqual({
          event:
            'propertyos.notification.whatsapp',
          version: '1.0',
          notification: {
            id: 'notification-14b2',
            recipient:
              '+919876543210',
            message:
              'Your visitor has arrived.',
            subject: 'Visitor arrival',
          },
        });

        expect(
          JSON.stringify(body),
        ).not.toContain(
          'must-not-leave-propertyos',
        );
      },
    );

    it(
      'fails before network access when configuration is invalid',
      async () => {
        process.env.WHATSAPP_WEBHOOK_TOKEN =
          'short';

        const fetchMock = jest.spyOn(
          globalThis,
          'fetch',
        );

        const provider =
          new WhatsAppWebhookNotificationProvider();

        const result = await provider.send(
          notification(),
        );

        expect(result.success).toBe(
          false,
        );
        expect(result.error).toContain(
          'WHATSAPP_WEBHOOK_CONFIGURATION_BLOCKED',
        );
        expect(
          JSON.stringify(result),
        ).not.toContain('short');
        expect(
          fetchMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'fails before network access for a local-format recipient',
      async () => {
        const fetchMock = jest.spyOn(
          globalThis,
          'fetch',
        );

        const provider =
          new WhatsAppWebhookNotificationProvider();

        const result = await provider.send(
          notification('9876543210'),
        );

        expect(result).toMatchObject({
          success: false,
          providerName:
            'whatsapp-webhook',
          error:
            'WhatsApp recipient must use international E.164 format',
        });
        expect(
          fetchMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'sanitizes non-success HTTP responses',
      async () => {
        jest
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(
            new Response(
              'remote-secret-diagnostic',
              {
                status: 503,
              },
            ),
          );

        const provider =
          new WhatsAppWebhookNotificationProvider();

        const result = await provider.send(
          notification(),
        );

        expect(result).toEqual({
          success: false,
          providerName:
            'whatsapp-webhook',
          error:
            'WhatsApp webhook returned HTTP 503',
          metadata: {
            httpStatus: 503,
            endpointHost:
              'automation.example.com',
          },
        });

        expect(
          JSON.stringify(result),
        ).not.toContain(
          'remote-secret-diagnostic',
        );
      },
    );

    it(
      'rejects invalid JSON acknowledgements',
      async () => {
        jest
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(
            new Response(
              'not-json',
              {
                status: 200,
              },
            ),
          );

        const provider =
          new WhatsAppWebhookNotificationProvider();

        await expect(
          provider.send(notification()),
        ).resolves.toMatchObject({
          success: false,
          error:
            'WhatsApp webhook returned invalid JSON',
        });
      },
    );

    it.each([
      {},
      {
        success: false,
        error:
          'remote-sensitive-detail',
      },
      {
        success: true,
      },
      {
        success: true,
        messageId: '',
      },
      {
        success: true,
        messageId: 'x'.repeat(201),
      },
    ])(
      'rejects invalid acknowledgement %#',
      async (acknowledgement) => {
        jest
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(
            new Response(
              JSON.stringify(
                acknowledgement,
              ),
              {
                status: 200,
              },
            ),
          );

        const provider =
          new WhatsAppWebhookNotificationProvider();

        const result = await provider.send(
          notification(),
        );

        expect(result).toMatchObject({
          success: false,
          error:
            'WhatsApp webhook returned an invalid delivery acknowledgement',
        });

        expect(
          JSON.stringify(result),
        ).not.toContain(
          'remote-sensitive-detail',
        );
      },
    );

    it(
      'aborts the real request when the configured timeout expires',
      async () => {
        jest.useFakeTimers();

        const fetchMock = jest
          .spyOn(globalThis, 'fetch')
          .mockImplementation(
            async (_url, request) =>
              new Promise<Response>(
                (_resolve, reject) => {
                  request?.signal
                    ?.addEventListener(
                      'abort',
                      () => {
                        const abortError =
                          new Error(
                            'secret-timeout-detail',
                          );
                        abortError.name =
                          'AbortError';
                        reject(abortError);
                      },
                      {
                        once: true,
                      },
                    );
                },
              ),
          );

        const provider =
          new WhatsAppWebhookNotificationProvider();

        const pending = provider.send(
          notification(),
        );

        expect(fetchMock).toHaveBeenCalledTimes(
          1,
        );

        const request =
          fetchMock.mock.calls[0][1];

        expect(
          request?.signal?.aborted,
        ).toBe(false);

        await jest.advanceTimersByTimeAsync(
          4999,
        );

        expect(
          request?.signal?.aborted,
        ).toBe(false);

        await jest.advanceTimersByTimeAsync(
          1,
        );

        const result = await pending;

        expect(
          request?.signal?.aborted,
        ).toBe(true);

        expect(result).toEqual({
          success: false,
          providerName:
            'whatsapp-webhook',
          error:
            'WhatsApp webhook request timed out',
          metadata: {
            endpointHost:
              'automation.example.com',
          },
        });

        expect(
          JSON.stringify(result),
        ).not.toContain(
          'secret-timeout-detail',
        );
      },
    );

    it(
      'sanitizes unexpected network failures',
      async () => {
        jest
          .spyOn(globalThis, 'fetch')
          .mockRejectedValue(
            new Error(
              'secret-network-detail',
            ),
          );

        const provider =
          new WhatsAppWebhookNotificationProvider();

        const result = await provider.send(
          notification(),
        );

        expect(result).toEqual({
          success: false,
          providerName:
            'whatsapp-webhook',
          error:
            'WhatsApp webhook request failed',
          metadata: {
            endpointHost:
              'automation.example.com',
          },
        });

        expect(
          JSON.stringify(result),
        ).not.toContain(
          'secret-network-detail',
        );
      },
    );
  },
);
