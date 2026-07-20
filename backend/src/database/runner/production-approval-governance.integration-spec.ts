import {
  describe,
  expect,
  it,
} from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
  evaluateProductionApprovalGovernance,
  ProductionApprovalGovernancePolicy,
  ProductionApprovalGovernanceRequest,
} from './production-approval-governance';

describe('Phase 15C3 editable production approval governance', () => {
  const configuredPolicy = JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        'config/production-approval-governance.json',
      ),
      'utf8',
    ),
  ) as ProductionApprovalGovernancePolicy;

  function soloRequest(
    overrides: Partial<ProductionApprovalGovernanceRequest> = {},
  ): ProductionApprovalGovernanceRequest {
    return {
      policy: configuredPolicy,
      scope: 'ADVAITHS_NEST_FOUNDER_PILOT',
      operatorId: 'anand-nataraj',
      approverId: 'anand-nataraj',
      recoveryOwnerId: 'anand-nataraj',
      incidentOwnerId: 'anand-nataraj',
      preparedAt: '2026-07-20T10:00:00.000Z',
      confirmedAt: '2026-07-20T10:15:00.000Z',
      noIndependentHumanApproverAvailable: true,
      soloFounderExceptionAcknowledged: true,
      futureSeparationOfDutiesRequired: true,
      independentReviewRequiredBeforeCommercialProduction: true,
      ...overrides,
    };
  }

  it('loads the active versioned solo-founder policy', () => {
    expect(configuredPolicy.schemaVersion).toBe(1);
    expect(configuredPolicy.policyVersion).toBe(1);
    expect(configuredPolicy.mode)
      .toBe('SOLO_FOUNDER_CONTROLLED');
    expect(configuredPolicy.accountableOwnerId)
      .toBe('anand-nataraj');
    expect(configuredPolicy.active).toBe(true);
  });

  it('approves the founder pilot after cooling off', () => {
    const decision =
      evaluateProductionApprovalGovernance(
        soloRequest(),
      );

    expect(decision.status).toBe('APPROVED');
    expect(decision.coolingOffMinutesObserved).toBe(15);
    expect(decision.evidenceSha256)
      .toMatch(/^[a-f0-9]{64}$/);
  });

  it('blocks confirmation before cooling off completes', () => {
    const decision =
      evaluateProductionApprovalGovernance(
        soloRequest({
          confirmedAt: '2026-07-20T10:14:59.000Z',
        }),
      );

    expect(decision.status).toBe('BLOCKED');
    expect(decision.errors).toContain(
      'Approval cooling-off period is incomplete',
    );
  });

  it('blocks solo-founder commercial production', () => {
    const decision =
      evaluateProductionApprovalGovernance(
        soloRequest({
          scope: 'COMMERCIAL_PRODUCTION',
        }),
      );

    expect(decision.status).toBe('BLOCKED');
    expect(decision.commercialProductionAllowed)
      .toBe(false);
  });

  it('requires explicit solo-founder declarations', () => {
    const decision =
      evaluateProductionApprovalGovernance(
        soloRequest({
          noIndependentHumanApproverAvailable: false,
          soloFounderExceptionAcknowledged: false,
        }),
      );

    expect(decision.status).toBe('BLOCKED');
  });

  it('keeps all solo responsibilities with the owner', () => {
    const decision =
      evaluateProductionApprovalGovernance(
        soloRequest({
          approverId: 'unverified-approver',
        }),
      );

    expect(decision.status).toBe('BLOCKED');
  });

  it('supports a future separation-of-duties policy', () => {
    const teamPolicy: ProductionApprovalGovernancePolicy = {
      ...configuredPolicy,
      policyVersion: 2,
      mode: 'SEPARATION_OF_DUTIES',
    };

    const decision =
      evaluateProductionApprovalGovernance(
        soloRequest({
          policy: teamPolicy,
          scope: 'COMMERCIAL_PRODUCTION',
          operatorId: 'deployment-operator',
          approverId: 'deployment-approver',
          recoveryOwnerId: 'recovery-owner',
          incidentOwnerId: 'incident-owner',
          noIndependentHumanApproverAvailable: false,
          soloFounderExceptionAcknowledged: false,
        }),
      );

    expect(decision.status).toBe('APPROVED');
    expect(decision.commercialProductionAllowed)
      .toBe(true);
  });

  it('requires different team operator and approver', () => {
    const teamPolicy: ProductionApprovalGovernancePolicy = {
      ...configuredPolicy,
      policyVersion: 2,
      mode: 'SEPARATION_OF_DUTIES',
    };

    const decision =
      evaluateProductionApprovalGovernance(
        soloRequest({
          policy: teamPolicy,
          operatorId: 'deployment-owner',
          approverId: 'deployment-owner',
          noIndependentHumanApproverAvailable: false,
          soloFounderExceptionAcknowledged: false,
        }),
      );

    expect(decision.status).toBe('BLOCKED');
  });

  it('requires future transition and independent review safeguards', () => {
    const decision =
      evaluateProductionApprovalGovernance(
        soloRequest({
          policy: {
            ...configuredPolicy,
            teamExpansionTransitionRequired: false,
          },
        }),
      );

    expect(decision.status).toBe('BLOCKED');
  });

  it('does not authorize runner exposure or invocation', () => {
    const decision =
      evaluateProductionApprovalGovernance(
        soloRequest(),
      );

    expect(decision.runnerExposureAuthorized)
      .toBe(false);
    expect(decision.migrationInvocationAuthorized)
      .toBe(false);
  });
});
