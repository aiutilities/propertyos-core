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

import {
  buildWhatsAppPilotDeliveryAuthorization,
  PHASE_14C_ACCEPTANCE_PROOF_SHA256,
  whatsappPilotMessageSha256,
} from './whatsapp-pilot-delivery-authorization';
import {
  sealWhatsAppPilotDeliveryExecutionRequest,
} from './whatsapp-pilot-delivery-execution-request';
import {
  evaluateWhatsAppPilotDeliveryExposure,
} from './whatsapp-pilot-delivery-exposure-policy';
import {
  WhatsAppPilotDeliveryExecutor,
  WhatsAppPilotDeliveryExecutorPorts,
  WhatsAppPilotDeliveryManualInvocation,
  WhatsAppPilotDeliverySecurityEvent,
  whatsappPilotInvocationEvidenceSha256,
} from './whatsapp-pilot-delivery-executor';
import {
  resolveWhatsAppWebhookConfiguration,
  whatsappWebhookConfigurationEvidenceSha256,
} from './whatsapp-webhook-configuration';
import {
  WhatsAppWebhookNotificationProvider,
} from './whatsapp-webhook-notification.provider';
import {
  WhatsAppPilotIsolatedSubstitutionAdapter,
  WhatsAppPilotIsolatedSubstitutionRequest,
} from './whatsapp-pilot-isolated-substitution-adapter';

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

type ReservationState =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'COMPLETED'
  | 'FAILED';

describe(
  'Phase 14D5B isolated WhatsApp pilot executor exercise',
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
      'phase-14d5-isolated-token-00000000000000';

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
          'ISOLATED_EXECUTOR_ADDRESS_UNAVAILABLE',
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

    function configureIsolatedProvider(
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

    function governedExecution(
      isolatedUrl: string,
      options?: {
        completionFails?: boolean;
      },
    ) {
      const message =
        'PropertyOS isolated WhatsApp pilot exercise. No action is required.';

      const productionConfiguration = {
        environmentClass:
          'PRODUCTION' as const,
        webhookUrl:
          'https://automation.example.com/propertyos/whatsapp',
        webhookToken:
          'phase-14d5-production-token-000000000000',
        timeoutMs: '5000',
      };

      const configurationEvidence =
        whatsappWebhookConfigurationEvidenceSha256(
          resolveWhatsAppWebhookConfiguration(
            productionConfiguration,
          ),
        );

      if (!configurationEvidence) {
        throw new Error(
          'ISOLATED_CONFIGURATION_EVIDENCE_UNAVAILABLE',
        );
      }

      const authorizationRequest = {
        schemaVersion: 1 as const,
        candidateGitCommit:
          'c26ae07e752d2447519bb21ebb6c13eaaaaea03a',
        phase14cAcceptanceProofSha256:
          PHASE_14C_ACCEPTANCE_PROOF_SHA256,
        environmentClass:
          'PILOT' as const,
        environmentId:
          'advaiths-nest-isolated-pilot',
        endpointUrl:
          productionConfiguration.webhookUrl,
        recipient:
          '+919876543210',
        message,
        messageSha256:
          whatsappPilotMessageSha256(
            message,
          ),
        consentEvidenceId:
          'consent-14d5-isolated-001',
        consentEvidenceSha256:
          'a'.repeat(64),
        consentRecordedAt:
          '2026-07-20T06:00:00.000Z',
        operatorId:
          'operator.anand',
        approverId:
          'approver.pilot',
        approvalId:
          'approval-14d5-isolated-001',
        approvalEvidenceSha256:
          'b'.repeat(64),
        approvedAt:
          '2026-07-20T06:05:00.000Z',
        validFrom:
          '2026-07-20T06:10:00.000Z',
        expiresAt:
          '2026-07-20T07:10:00.000Z',
        deliveryLimit: 1 as const,
        explicitPilotDeliveryApproval:
          true,
      };

      const authorizationPlan =
        buildWhatsAppPilotDeliveryAuthorization(
          authorizationRequest,
        );

      if (
        !authorizationPlan
          .authorizationEvidenceSha256
      ) {
        throw new Error(
          'ISOLATED_AUTHORIZATION_NOT_READY',
        );
      }

      const executionRequest = {
        schemaVersion: 1 as const,
        executionRequestId:
          'execution-14d5-isolated-001',
        requestedAt:
          '2026-07-20T06:06:00.000Z',
        requestedBy:
          authorizationRequest.operatorId,
        executionApproverId:
          authorizationRequest.approverId,
        executionApprovalId:
          'execution-approval-14d5-isolated-001',
        executionApprovedAt:
          '2026-07-20T06:07:00.000Z',
        executionApprovalEvidenceSha256:
          'c'.repeat(64),
        executionApprovalConfirmed:
          true,
        authorizationEvidenceSha256:
          authorizationPlan
            .authorizationEvidenceSha256,
        providerConfigurationEvidenceSha256:
          configurationEvidence,
        endpointIdentityReconfirmed:
          true,
        recipientConsentReconfirmed:
          true,
        messageContentReconfirmed:
          true,
        deliveryLimitReconfirmed:
          true,
        authorizationRequest,
        authorizationPlan,
      };

      const executionSeal =
        sealWhatsAppPilotDeliveryExecutionRequest(
          executionRequest,
        );

      if (
        !executionSeal.executionRequestSha256
      ) {
        throw new Error(
          'ISOLATED_EXECUTION_SEAL_NOT_READY',
        );
      }

      const exposureRequest = {
        schemaVersion: 1 as const,
        reviewId:
          'exposure-review-14d5-isolated-001',
        reviewedAt:
          '2026-07-20T06:11:00.000Z',
        reviewedBy:
          authorizationRequest.approverId,
        executionOperatorId:
          authorizationRequest.operatorId,
        endpointReachabilityEvidenceSha256:
          'e'.repeat(64),
        endpointReachabilityConfirmed:
          true,
        explicitExecutorExposureApproval:
          true,
        webhookConfiguration:
          productionConfiguration,
        executionRequest,
        executionSeal,
      };

      const exposureDecision =
        evaluateWhatsAppPilotDeliveryExposure(
          exposureRequest,
        );

      if (
        !exposureDecision
          .exposureEvidenceSha256
      ) {
        throw new Error(
          'ISOLATED_EXPOSURE_NOT_READY',
        );
      }

      const manualInvocation:
        WhatsAppPilotDeliveryManualInvocation =
        {
          invocationApprovalId:
            'invocation-approval-14d5-isolated-001',
          approvedBy:
            exposureRequest.reviewedBy,
          operatorId:
            exposureRequest
              .executionOperatorId,
          authorizedAt:
            '2026-07-20T06:12:00.000Z',
          approvalEvidenceSha256: '',
          explicitInvocationApproval:
            true,
        };

      manualInvocation
        .approvalEvidenceSha256 =
        whatsappPilotInvocationEvidenceSha256(
          exposureDecision,
          {
            invocationApprovalId:
              manualInvocation
                .invocationApprovalId,
            approvedBy:
              manualInvocation.approvedBy,
            operatorId:
              manualInvocation.operatorId,
            authorizedAt:
              manualInvocation.authorizedAt,
            explicitInvocationApproval:
              true,
          },
        );

      const provider =
        new WhatsAppWebhookNotificationProvider();

      const substitutionRequest:
        WhatsAppPilotIsolatedSubstitutionRequest =
        {
          schemaVersion: 1,
          candidateGitCommit:
            authorizationRequest
              .candidateGitCommit,
          phase14cAcceptanceProofSha256:
            PHASE_14C_ACCEPTANCE_PROOF_SHA256,
          executionRequestSha256:
            executionSeal
              .executionRequestSha256,
          exposureEvidenceSha256:
            exposureDecision
              .exposureEvidenceSha256,
          substitutionReviewId:
            'substitution-review-14d5-isolated-001',
          reviewedAt:
            '2026-07-20T06:12:30.000Z',
          reviewedBy:
            authorizationRequest.approverId,
          executionOperatorId:
            authorizationRequest.operatorId,
          authorizedEndpointUrl:
            productionConfiguration.webhookUrl,
          authorizedEndpointUrlSha256:
            authorizationPlan
              .endpointUrlSha256!,
          authorizedConfigurationEvidenceSha256:
            configurationEvidence,
          isolatedEndpointUrl:
            isolatedUrl,
          isolatedEndpointReachabilityEvidenceSha256:
            'f'.repeat(64),
          explicitIsolatedSubstitutionApproval:
            true,
          externalNetworkAllowed:
            false,
        };

      const adapter =
        new WhatsAppPilotIsolatedSubstitutionAdapter(
          provider,
          substitutionRequest,
        );

      const substitutionDecision =
        adapter.validate();

      if (
        !substitutionDecision
          .substitutionAllowed
      ) {
        throw new Error(
          `ISOLATED_SUBSTITUTION_NOT_READY: ${substitutionDecision.errors.join('; ')}`,
        );
      }

      let reservationState:
        ReservationState =
        'AVAILABLE';

      const securityEvents:
        WhatsAppPilotDeliverySecurityEvent[] =
        [];

      const ambiguousDeliveries: Array<{
        providerMessageIdSha256:
          string;
        reconciliationReason:
          string;
      }> = [];

      let completion:
        {
          providerMessageId:
            string;
          deliveryEvidenceSha256:
            string;
        } | undefined;

      let failureCode:
        string | undefined;

      const ports:
        WhatsAppPilotDeliveryExecutorPorts =
        {
          reserveDelivery:
            async () => {
              if (
                reservationState ===
                'COMPLETED'
              ) {
                return 'ALREADY_COMPLETED';
              }

              if (
                reservationState ===
                'RESERVED'
              ) {
                return 'CONFLICT';
              }

              reservationState =
                'RESERVED';
              return 'RESERVED';
            },

          deliver:
            async (notification) =>
              adapter.send(notification),

          completeDelivery:
            async (input) => {
              if (
                options?.completionFails
              ) {
                throw new Error(
                  'isolated-completion-persistence-failure',
                );
              }

              completion = {
                providerMessageId:
                  input.providerMessageId,
                deliveryEvidenceSha256:
                  input
                    .deliveryEvidenceSha256,
              };
              reservationState =
                'COMPLETED';
            },

          failDelivery:
            async (input) => {
              failureCode =
                input.failureCode;
              reservationState =
                'FAILED';
            },

          recordAmbiguousDelivery:
            async (input) => {
              ambiguousDeliveries.push({
                providerMessageIdSha256:
                  input
                    .providerMessageIdSha256,
                reconciliationReason:
                  input
                    .reconciliationReason,
              });
            },

          recordSecurityEvent:
            async (event) => {
              securityEvents.push(event);
            },
        };

      return {
        authorizationRequest,
        executionRequest,
        executionSeal,
        exposureRequest,
        exposureDecision,
        manualInvocation,
        substitutionDecision,
        securityEvents,
        ambiguousDeliveries,
        getReservationState:
          () => reservationState,
        getCompletion:
          () => completion,
        getFailureCode:
          () => failureCode,
        executor:
          new WhatsAppPilotDeliveryExecutor(
            ports,
          ),
      };
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
      'executes exactly once through the real isolated HTTP boundary',
      async () => {
        const captured:
          CapturedRequest[] = [];

        const isolated =
          await startServer(
            async (
              request,
              response,
            ) => {
              captured.push({
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
              });

              response.writeHead(200, {
                'content-type':
                  'application/json',
              });
              response.end(
                JSON.stringify({
                  success: true,
                  messageId:
                    'isolated-executor-message-001',
                }),
              );
            },
          );

        configureIsolatedProvider(
          isolated.url,
        );

        const exercise =
          governedExecution(
            isolated.url,
          );

        const result =
          await exercise.executor.execute({
            exposureRequest:
              exercise.exposureRequest,
            exposureDecision:
              exercise.exposureDecision,
            manualInvocation:
              exercise.manualInvocation,
            executedAt:
              '2026-07-20T06:13:00.000Z',
          });

        expect(result).toMatchObject({
          status: 'DELIVERED',
          providerName:
            'whatsapp-webhook',
          deliveryCount: 1,
          automaticDelivery: false,
          messageSent: true,
          databaseMutated: false,
        });

        expect(captured).toHaveLength(1);
        expect(captured[0]).toMatchObject({
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
                'execution-14d5-isolated-001',
              recipient:
                '+919876543210',
              message:
                'PropertyOS isolated WhatsApp pilot exercise. No action is required.',
            },
          },
        });

        const serializedBody =
          JSON.stringify(
            captured[0].body,
          );

        expect(serializedBody).not.toContain(
          'authorizationEvidenceSha256',
        );
        expect(serializedBody).not.toContain(
          'invocationEvidenceSha256',
        );
        expect(serializedBody).not.toContain(
          'consentEvidenceSha256',
        );

        expect(
          exercise.getReservationState(),
        ).toBe('COMPLETED');

        expect(
          exercise.getCompletion(),
        ).toMatchObject({
          providerMessageId:
            'isolated-executor-message-001',
        });

        expect(
          exercise.securityEvents.map(
            (event) =>
              event.eventType,
          ),
        ).toEqual([
          'PILOT_DELIVERY_STARTED',
          'PILOT_DELIVERY_COMPLETED',
        ]);

        await expect(
          exercise.executor.execute({
            exposureRequest:
              exercise.exposureRequest,
            exposureDecision:
              exercise.exposureDecision,
            manualInvocation:
              exercise.manualInvocation,
            executedAt:
              '2026-07-20T06:14:00.000Z',
          }),
        ).rejects.toThrow(
          'WHATSAPP_PILOT_DELIVERY_ALREADY_COMPLETED',
        );

        expect(captured).toHaveLength(1);
        expect(
          exercise.getFailureCode(),
        ).toBeUndefined();
      },
    );

    it(
      'prevents redelivery when provider confirmation cannot be persisted',
      async () => {
        const captured:
          CapturedRequest[] = [];

        const isolated =
          await startServer(
            async (
              request,
              response,
            ) => {
              captured.push({
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
              });

              response.writeHead(200, {
                'content-type':
                  'application/json',
              });
              response.end(
                JSON.stringify({
                  success: true,
                  messageId:
                    'isolated-ambiguous-message-001',
                }),
              );
            },
          );

        configureIsolatedProvider(
          isolated.url,
        );

        const exercise =
          governedExecution(
            isolated.url,
            {
              completionFails: true,
            },
          );

        await expect(
          exercise.executor.execute({
            exposureRequest:
              exercise.exposureRequest,
            exposureDecision:
              exercise.exposureDecision,
            manualInvocation:
              exercise.manualInvocation,
            executedAt:
              '2026-07-20T06:13:00.000Z',
          }),
        ).rejects.toThrow(
          'WHATSAPP_PILOT_DELIVERY_COMPLETION_UNCONFIRMED',
        );

        expect(captured).toHaveLength(1);
        expect(
          exercise.getReservationState(),
        ).toBe('RESERVED');
        expect(
          exercise.getFailureCode(),
        ).toBeUndefined();

        expect(
          exercise.ambiguousDeliveries,
        ).toEqual([
          {
            providerMessageIdSha256:
              expect.stringMatching(
                /^[a-f0-9]{64}$/,
              ),
            reconciliationReason:
              'PROVIDER_CONFIRMED_PERSISTENCE_FAILED',
          },
        ]);

        expect(
          exercise.securityEvents.map(
            (event) =>
              event.eventType,
          ),
        ).toEqual([
          'PILOT_DELIVERY_STARTED',
          'PILOT_DELIVERY_RECONCILIATION_REQUIRED',
        ]);

        await expect(
          exercise.executor.execute({
            exposureRequest:
              exercise.exposureRequest,
            exposureDecision:
              exercise.exposureDecision,
            manualInvocation:
              exercise.manualInvocation,
            executedAt:
              '2026-07-20T06:14:00.000Z',
          }),
        ).rejects.toThrow(
          'WHATSAPP_PILOT_DELIVERY_RESERVATION_CONFLICT',
        );

        expect(captured).toHaveLength(1);
      },
    );
  },
);
