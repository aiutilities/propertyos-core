import { createHash } from 'crypto';

export type ProductionApprovalGovernanceMode =
  | 'SOLO_FOUNDER_CONTROLLED'
  | 'SEPARATION_OF_DUTIES';

export type ProductionApprovalScope =
  | 'ADVAITHS_NEST_FOUNDER_PILOT'
  | 'COMMERCIAL_PRODUCTION';

export interface ProductionApprovalGovernancePolicy {
  schemaVersion: 1;
  policyId: string;
  policyVersion: number;
  mode: ProductionApprovalGovernanceMode;
  accountableOwnerId: string;
  minimumCoolingOffMinutes: number;
  teamExpansionTransitionRequired: boolean;
  independentHumanReviewBeforeCommercialProduction: boolean;
  active: boolean;
}

export interface ProductionApprovalGovernanceRequest {
  policy: ProductionApprovalGovernancePolicy;
  scope: ProductionApprovalScope;
  operatorId: string;
  approverId: string;
  recoveryOwnerId: string;
  incidentOwnerId: string;
  preparedAt: string;
  confirmedAt: string;
  noIndependentHumanApproverAvailable: boolean;
  soloFounderExceptionAcknowledged: boolean;
  futureSeparationOfDutiesRequired: boolean;
  independentReviewRequiredBeforeCommercialProduction: boolean;
}

export interface ProductionApprovalGovernanceDecision {
  status: 'APPROVED' | 'BLOCKED';
  scope: 'PHASE_15C3_APPROVAL_GOVERNANCE';
  policyId: string;
  policyVersion: number;
  mode: ProductionApprovalGovernanceMode;
  accountableOwnerId: string;
  effectiveOperatorId: string;
  effectiveApproverId: string;
  recoveryOwnerId: string;
  incidentOwnerId: string;
  coolingOffMinutesObserved: number | null;
  commercialProductionAllowed: boolean;
  runnerExposureAuthorized: false;
  migrationInvocationAuthorized: false;
  evidenceSha256: string | null;
  errors: string[];
}

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;

function validIdentifier(value: string): boolean {
  return (
    typeof value === 'string' &&
    IDENTIFIER_PATTERN.test(value)
  );
}

function validTimestamp(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

export function evaluateProductionApprovalGovernance(
  request: ProductionApprovalGovernanceRequest,
): ProductionApprovalGovernanceDecision {
  const errors: string[] = [];
  const policy = request.policy;

  if (policy.schemaVersion !== 1) {
    errors.push(
      'Unsupported approval governance schema version',
    );
  }

  if (
    !validIdentifier(policy.policyId) ||
    !validIdentifier(policy.accountableOwnerId)
  ) {
    errors.push(
      'Approval governance policy identifier is invalid',
    );
  }

  if (
    !Number.isInteger(policy.policyVersion) ||
    policy.policyVersion < 1
  ) {
    errors.push(
      'Approval governance policy version is invalid',
    );
  }

  if (!policy.active) {
    errors.push(
      'Approval governance policy is inactive',
    );
  }

  if (
    !Number.isInteger(policy.minimumCoolingOffMinutes) ||
    policy.minimumCoolingOffMinutes < 0 ||
    policy.minimumCoolingOffMinutes > 1440
  ) {
    errors.push(
      'Approval cooling-off period is invalid',
    );
  }

  for (const identifier of [
    request.operatorId,
    request.approverId,
    request.recoveryOwnerId,
    request.incidentOwnerId,
  ]) {
    if (!validIdentifier(identifier)) {
      errors.push(
        'Approval governance actor identifier is invalid',
      );
      break;
    }
  }

  let coolingOffMinutesObserved: number | null = null;

  if (
    !validTimestamp(request.preparedAt) ||
    !validTimestamp(request.confirmedAt)
  ) {
    errors.push(
      'Approval governance timestamps are invalid',
    );
  } else {
    const preparedAt = Date.parse(request.preparedAt);
    const confirmedAt = Date.parse(request.confirmedAt);

    coolingOffMinutesObserved =
      (confirmedAt - preparedAt) / 60000;

    if (confirmedAt < preparedAt) {
      errors.push(
        'Approval confirmation predates preparation',
      );
    }

    if (
      coolingOffMinutesObserved <
      policy.minimumCoolingOffMinutes
    ) {
      errors.push(
        'Approval cooling-off period is incomplete',
      );
    }
  }

  if (
    !policy.teamExpansionTransitionRequired ||
    !policy.independentHumanReviewBeforeCommercialProduction
  ) {
    errors.push(
      'Future team governance safeguards are required',
    );
  }

  if (
    !request.futureSeparationOfDutiesRequired ||
    !request.independentReviewRequiredBeforeCommercialProduction
  ) {
    errors.push(
      'Required future governance declarations are absent',
    );
  }

  if (policy.mode === 'SOLO_FOUNDER_CONTROLLED') {
    if (
      request.scope !==
      'ADVAITHS_NEST_FOUNDER_PILOT'
    ) {
      errors.push(
        'Solo-founder governance is restricted to the founder pilot',
      );
    }

    if (
      request.operatorId !==
        policy.accountableOwnerId ||
      request.approverId !==
        policy.accountableOwnerId ||
      request.recoveryOwnerId !==
        policy.accountableOwnerId ||
      request.incidentOwnerId !==
        policy.accountableOwnerId
    ) {
      errors.push(
        'Solo-founder responsibilities must remain with the accountable owner',
      );
    }

    if (
      !request.noIndependentHumanApproverAvailable ||
      !request.soloFounderExceptionAcknowledged
    ) {
      errors.push(
        'Solo-founder exception declarations are incomplete',
      );
    }
  } else if (
    policy.mode === 'SEPARATION_OF_DUTIES'
  ) {
    if (request.operatorId === request.approverId) {
      errors.push(
        'Operator and approver must be different',
      );
    }

    if (
      request.noIndependentHumanApproverAvailable ||
      request.soloFounderExceptionAcknowledged
    ) {
      errors.push(
        'Solo-founder declarations are invalid in separation-of-duties mode',
      );
    }
  } else {
    errors.push(
      'Approval governance mode is unsupported',
    );
  }

  const status =
    errors.length === 0 ? 'APPROVED' : 'BLOCKED';

  const commercialProductionAllowed =
    status === 'APPROVED' &&
    policy.mode === 'SEPARATION_OF_DUTIES' &&
    request.scope === 'COMMERCIAL_PRODUCTION';

  const evidenceSha256 =
    status === 'APPROVED'
      ? createHash('sha256')
          .update(
            JSON.stringify({
              accountableOwnerId:
                policy.accountableOwnerId,
              approverId:
                request.approverId,
              confirmedAt:
                request.confirmedAt,
              coolingOffMinutesObserved,
              incidentOwnerId:
                request.incidentOwnerId,
              mode:
                policy.mode,
              operatorId:
                request.operatorId,
              policyId:
                policy.policyId,
              policyVersion:
                policy.policyVersion,
              preparedAt:
                request.preparedAt,
              recoveryOwnerId:
                request.recoveryOwnerId,
              scope:
                request.scope,
            }),
            'utf8',
          )
          .digest('hex')
      : null;

  return {
    status,
    scope:
      'PHASE_15C3_APPROVAL_GOVERNANCE',
    policyId:
      policy.policyId,
    policyVersion:
      policy.policyVersion,
    mode:
      policy.mode,
    accountableOwnerId:
      policy.accountableOwnerId,
    effectiveOperatorId:
      request.operatorId,
    effectiveApproverId:
      request.approverId,
    recoveryOwnerId:
      request.recoveryOwnerId,
    incidentOwnerId:
      request.incidentOwnerId,
    coolingOffMinutesObserved,
    commercialProductionAllowed,
    runnerExposureAuthorized: false,
    migrationInvocationAuthorized: false,
    evidenceSha256,
    errors,
  };
}
