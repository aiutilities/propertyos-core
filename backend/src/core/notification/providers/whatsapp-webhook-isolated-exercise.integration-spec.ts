import {
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  createServer,
  IncomingMessage,
  Server,
  ServerResponse,
} from 'node:http';

import { NotificationMessage } from '../types/notification.types';
import { WhatsAppWebhookNotificationProvider } from './whatsapp-webhook-notification.provider';

interface IsolatedServer {
  server: Server;
  url: string;
  close(): Promise<void>;
}

interface CapturedRequest {
  method?: string;
  url?: string;
  authorization?: string;
  contentType?: string;
  body: unknown;
}

describe(
  'Phase 14C1 isolated WhatsApp webhook exercise',
  () => {
    const originalEnvironment = {
      nodeEnvironment:
        process.env.NODE_ENV,
      provider:
        process.env.WHATSAPP_PROVIDER,
      webhookUrl:
        process.env.WHATSAPP_WEBHOOK_URL,
      webhookToken:
        process.env.WHATSAPP_WEBHOOK_TOKEN,
      timeoutMs:
        process.env
          .WHATSAPP_WEBHOOK_TIMEOUT_MS,
    };

    const token =
      'phase-14c-isolated-token-00000000000000';

    const activeServers:
      IsolatedServer[] = [];

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

    async function readJsonBody(
      request: IncomingMessage,
    ): Promise<unknown> {
      const chunks: Buffer[] = [];

      for await (const chunk of request) {
        chunks.push(
          Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk),
        );
      }

      return JSON.parse(
        Buffer.concat(chunks).toString(
          'utf8',
        ),
      ) as unknown;
    }

    async function startServer(
      handler: (
        request: IncomingMessage,
        response: ServerResponse,
      ) => Promise<void>,
    ): Promise<IsolatedServer> {
      const server = createServer(
        (request, response) => {
          void handler(
            request,
            response,
          ).catch(() => {
            if (!response.headersSent) {
              response.writeHead(500, {
                'content-type':
                  'application/json',
              });
            }

            response.end(
              JSON.stringify({
                success: false,
              }),
            );
          });
        },
      );

      await new Promise<void>(
        (resolve, reject) => {
          server.once('error', reject);
          server.listen(
            0,
            '127.0.0.1',
            () => {
              server.off(
                'error',
                reject,
              );
              resolve();
            },
          );
        },
      );

      const address = server.address();

      if (
        !address ||
        typeof address === 'string'
      ) {
        server.close();
        throw new Error(
          'ISOLATED_WEBHOOK_ADDRESS_UNAVAILABLE',
        );
      }

      const isolated: IsolatedServer = {
        server,
        url:
          `http://127.0.0.1:${address.port}/propertyos/whatsapp`,
        close: async () => {
          await new Promise<void>(
            (resolve, reject) => {
              server.close((error) => {
                if (error) {
                  reject(error);
                  return;
                }

                resolve();
              });
            },
          );
        },
      };

      activeServers.push(isolated);
      return isolated;
    }

    function notification():
      NotificationMessage {
      return {
        id:
          'phase-14c-notification-001',
        channel: 'WHATSAPP',
        recipient:
          '+91 98765-43210',
        subject: 'Visitor arrival',
        message:
          'Your visitor has arrived at Advaith’s Nest.',
        status: 'PENDING',
        metadata: {
          internalOnly:
            'must-not-cross-boundary',
        },
        createdAt: new Date(
          '2026-07-20T07:00:00.000Z',
        ),
      };
    }

    function configure(
      url: string,
    ): void {
      process.env.NODE_ENV =
        'development';
      process.env.WHATSAPP_PROVIDER =
        'webhook';
      process.env.WHATSAPP_WEBHOOK_URL =
        url;
      process.env.WHATSAPP_WEBHOOK_TOKEN =
        token;
      process.env
        .WHATSAPP_WEBHOOK_TIMEOUT_MS =
        '2000';
    }

    afterEach(async () => {
      while (activeServers.length > 0) {
        const isolated =
          activeServers.pop();

        if (isolated) {
          await isolated.close();
        }
      }

      restore(
        'NODE_ENV',
        originalEnvironment.nodeEnvironment,
      );
      restore(
        'WHATSAPP_PROVIDER',
        originalEnvironment.provider,
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

    it(
      'delivers through a real isolated HTTP boundary',
      async () => {
        let captured:
          CapturedRequest | undefined;

        const isolated =
          await startServer(
            async (
              request,
              response,
            ) => {
              captured = {
                method: request.method,
                url: request.url,
                authorization:
                  request.headers
                    .authorization,
                contentType:
                  request.headers[
                    'content-type'
                  ],
                body:
                  await readJsonBody(
                    request,
                  ),
              };

              response.writeHead(200, {
                'content-type':
                  'application/json',
              });
              response.end(
                JSON.stringify({
                  success: true,
                  messageId:
                    'isolated-wpp-message-001',
                }),
              );
            },
          );

        configure(isolated.url);

        const provider =
          new WhatsAppWebhookNotificationProvider();

        const configuration =
          provider.validateConfiguration();

        expect(configuration.status).toBe(
          'READY',
        );

        const result = await provider.send(
          notification(),
        );

        expect(result).toEqual({
          success: true,
          providerName:
            'whatsapp-webhook',
          providerMessageId:
            'isolated-wpp-message-001',
          metadata: {
            httpStatus: 200,
            endpointHost:
              new URL(isolated.url).host,
          },
        });

        expect(captured).toEqual({
          method: 'POST',
          url:
            '/propertyos/whatsapp',
          authorization:
            `Bearer ${token}`,
          contentType:
            'application/json',
          body: {
            event:
              'propertyos.notification.whatsapp',
            version: '1.0',
            notification: {
              id:
                'phase-14c-notification-001',
              recipient:
                '+919876543210',
              message:
                'Your visitor has arrived at Advaith’s Nest.',
              subject:
                'Visitor arrival',
            },
          },
        });

        expect(
          JSON.stringify(captured),
        ).not.toContain(
          'must-not-cross-boundary',
        );
      },
    );

    it(
      'sanitizes a real isolated remote rejection',
      async () => {
        const isolated =
          await startServer(
            async (
              request,
              response,
            ) => {
              await readJsonBody(request);

              response.writeHead(401, {
                'content-type':
                  'application/json',
              });
              response.end(
                JSON.stringify({
                  success: false,
                  error:
                    'isolated-secret-diagnostic',
                }),
              );
            },
          );

        configure(isolated.url);

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
            'WhatsApp webhook returned HTTP 401',
          metadata: {
            httpStatus: 401,
            endpointHost:
              new URL(isolated.url).host,
          },
        });

        expect(
          JSON.stringify(result),
        ).not.toContain(
          'isolated-secret-diagnostic',
        );
      },
    );

    it(
      'rejects an invalid real acknowledgement',
      async () => {
        const isolated =
          await startServer(
            async (
              request,
              response,
            ) => {
              await readJsonBody(request);

              response.writeHead(200, {
                'content-type':
                  'application/json',
              });
              response.end(
                JSON.stringify({
                  success: true,
                }),
              );
            },
          );

        configure(isolated.url);

        const provider =
          new WhatsAppWebhookNotificationProvider();

        await expect(
          provider.send(notification()),
        ).resolves.toMatchObject({
          success: false,
          providerName:
            'whatsapp-webhook',
          error:
            'WhatsApp webhook returned an invalid delivery acknowledgement',
        });
      },
    );
  },
);
