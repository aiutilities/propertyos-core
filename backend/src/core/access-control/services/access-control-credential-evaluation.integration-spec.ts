import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  AccessDecision,
  AccessDenialReason,
  AccessDirection,
  AccessEvent,
  AccessEventType,
  AccessGrant,
  AccessGrantStatus,
  AccessPoint,
  AccessPointStatus,
  AccessPointType,
  AccessSubjectType,
} from '../types/access-control.types';
import {
  AccessControlService,
} from './access-control.service';

describe(
  'Access-control credential evaluation integration',
  () => {
    const occurredAt =
      '2026-07-20T08:00:00.000Z';

    const accessPoint: AccessPoint = {
      id: 'access-point-1',
      propertyId: 'property-1',
      code: 'MAIN-GATE',
      normalizedCode: 'MAINGATE',
      name: 'Main Gate',
      accessPointType:
        AccessPointType.GATE,
      direction:
        AccessDirection.BIDIRECTIONAL,
      status:
        AccessPointStatus.ACTIVE,
      requiresAntiPassback: false,
      createdAt: new Date(
        '2026-07-20T00:00:00.000Z',
      ),
      updatedAt: new Date(
        '2026-07-20T00:00:00.000Z',
      ),
    };

    const grant: AccessGrant = {
      id: 'access-grant-1',
      accessPointId: accessPoint.id,
      subjectType:
        AccessSubjectType.VISITOR,
      subjectId: 'visitor-1',
      direction:
        AccessDirection.BIDIRECTIONAL,
      status:
        AccessGrantStatus.ACTIVE,
      issuedByPersonId: 'operator-1',
      createdAt: new Date(
        '2026-07-20T00:00:00.000Z',
      ),
      updatedAt: new Date(
        '2026-07-20T00:00:00.000Z',
      ),
    };

    const validatedCredential = {
      id: 'access-credential-1',
      credentialType: 'QR_CODE',
      subjectType: 'visitor',
      subjectId: 'visitor-1',
      propertyId: accessPoint.propertyId,
      tokenHash: 'sha256-token',
      status: 'ACTIVE',
      useCount: 1,
      metadata: {},
      createdAt: new Date(
        '2026-07-20T00:00:00.000Z',
      ),
      updatedAt: new Date(
        '2026-07-20T00:00:00.000Z',
      ),
    };

    let repository: any;

    let credentialService: {
      validateCredential: any;
    };

    let eventBus: {
      publish: any;
    };

    let auditService: {
      record: any;
    };

    let service: AccessControlService;

    beforeEach(() => {
      repository = {
        createAccessPoint: jest.fn(),
        findAccessPointById: jest.fn(),
        findAccessPointByCode:
          jest.fn(
            async () => accessPoint,
          ),
        listAccessPoints: jest.fn(),
        updateAccessPoint: jest.fn(),
        updateAccessPointStatus:
          jest.fn(),
        createGrant: jest.fn(),
        findGrantById: jest.fn(),
        findApplicableGrants:
          jest.fn(
            async () => [grant],
          ),
        listGrants: jest.fn(),
        updateGrantStatus: jest.fn(),
        createEvent:
          jest.fn().mockImplementation(
            async (
              event: AccessEvent,
            ) => event,
          ),
        listEvents: jest.fn(),
        findLatestGrantedEvent:
          jest.fn(
            async () => null,
          ),
        getMetrics: jest.fn(),
      };

      credentialService = {
        validateCredential:
          jest.fn(
            async () => ({
              valid: true,
              credential:
                validatedCredential,
            }),
          ),
      };

      eventBus = {
        publish:
          jest.fn(
            async () => undefined,
          ),
      };

      auditService = {
        record:
          jest.fn(
            async () => undefined,
          ),
      };

      service = new AccessControlService(
        repository,
        credentialService as never,
        eventBus as never,
        auditService as never,
      );
    });

    it(
      'persists the validated access credential on granted entry',
      async () => {
        const result =
          await service.evaluateAccess({
            propertyId:
              accessPoint.propertyId,
            accessPointCode:
              accessPoint.code,
            credentialType:
              'QR_CODE',
            credentialValue:
              'raw-qr-token',
            eventType:
              AccessEventType.ENTRY,
            recordedByPersonId:
              'security-operator-1',
            occurredAt,
          });

        expect(result.decision).toBe(
          AccessDecision.GRANTED,
        );

        expect(result.credentialId).toBe(
          validatedCredential.id,
        );

        expect(
          repository.createEvent,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            accessPointId:
              accessPoint.id,
            subjectType:
              AccessSubjectType.VISITOR,
            subjectId:
              validatedCredential.subjectId,
            credentialId:
              validatedCredential.id,
            grantId: grant.id,
            eventType:
              AccessEventType.ENTRY,
            decision:
              AccessDecision.GRANTED,
          }),
        );

        expect(
          eventBus.publish,
        ).toHaveBeenCalledTimes(2);

        expect(
          auditService.record,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'records an invalid credential denial without a foreign credential ID',
      async () => {
        credentialService
          .validateCredential
          .mockResolvedValue({
            valid: false,
            reason:
              'CREDENTIAL_NOT_FOUND',
          });

        const result =
          await service.evaluateAccess({
            propertyId:
              accessPoint.propertyId,
            accessPointCode:
              accessPoint.code,
            credentialType:
              'QR_CODE',
            credentialValue:
              'unknown-token',
            eventType:
              AccessEventType.ENTRY,
            occurredAt,
          });

        expect(result).toEqual(
          expect.objectContaining({
            decision:
              AccessDecision.DENIED,
            denialReason:
              AccessDenialReason
                .CREDENTIAL_INVALID,
            credentialId: undefined,
          }),
        );

        expect(
          repository.createEvent,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            credentialId: undefined,
            decision:
              AccessDecision.DENIED,
            denialReason:
              AccessDenialReason
                .CREDENTIAL_INVALID,
          }),
        );
      },
    );

    it(
      'preserves the validated credential ID when no grant exists',
      async () => {
        repository
          .findApplicableGrants
          .mockResolvedValue([]);

        const result =
          await service.evaluateAccess({
            propertyId:
              accessPoint.propertyId,
            accessPointCode:
              accessPoint.code,
            credentialType:
              'QR_CODE',
            credentialValue:
              'raw-qr-token',
            eventType:
              AccessEventType.ENTRY,
            occurredAt,
          });

        expect(result).toEqual(
          expect.objectContaining({
            decision:
              AccessDecision.DENIED,
            denialReason:
              AccessDenialReason
                .GRANT_NOT_FOUND,
            credentialId:
              validatedCredential.id,
          }),
        );

        expect(
          repository.createEvent,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            credentialId:
              validatedCredential.id,
            denialReason:
              AccessDenialReason
                .GRANT_NOT_FOUND,
          }),
        );
      },
    );

    it(
      'preserves the validated credential ID on anti-passback denial',
      async () => {
        const antiPassbackPoint = {
          ...accessPoint,
          requiresAntiPassback: true,
        };

        repository
          .findAccessPointByCode
          .mockResolvedValue(
            antiPassbackPoint,
          );

        repository
          .findLatestGrantedEvent
          .mockResolvedValue({
            id: 'prior-event-1',
            accessPointId:
              accessPoint.id,
            subjectType:
              AccessSubjectType.VISITOR,
            subjectId:
              validatedCredential.subjectId,
            credentialId:
              validatedCredential.id,
            eventType:
              AccessEventType.ENTRY,
            decision:
              AccessDecision.GRANTED,
            grantId: grant.id,
            occurredAt: new Date(
              '2026-07-20T07:00:00.000Z',
            ),
            createdAt: new Date(
              '2026-07-20T07:00:00.000Z',
            ),
          });

        const result =
          await service.evaluateAccess({
            propertyId:
              accessPoint.propertyId,
            accessPointCode:
              accessPoint.code,
            credentialType:
              'QR_CODE',
            credentialValue:
              'raw-qr-token',
            eventType:
              AccessEventType.ENTRY,
            occurredAt,
          });

        expect(result).toEqual(
          expect.objectContaining({
            decision:
              AccessDecision.DENIED,
            denialReason:
              AccessDenialReason
                .ANTI_PASSBACK,
            credentialId:
              validatedCredential.id,
          }),
        );

        expect(
          repository.createEvent,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            credentialId:
              validatedCredential.id,
            grantId: grant.id,
            denialReason:
              AccessDenialReason
                .ANTI_PASSBACK,
          }),
        );
      },
    );
  },
);
