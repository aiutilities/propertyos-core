import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyActionRecommendation,
} from '../recommendations/property-action-recommendation.types';

import {
  PropertyActionProposal,
  PropertyActionType,
} from '../types/property-action-proposal.types';

import {
  PropertyActionGovernanceService,
} from '../property-actions/property-action-governance.service';

import {
  PropertyActionExecutionService,
} from '../property-actions/property-action-execution.service';

import {
  PropertyAiActionOrchestrationResult,
} from './property-ai-action-orchestration.types';

import {
  AiDecisionAuditService,
} from '../audit/ai-decision-audit.service';

import {
  randomUUID,
} from 'crypto';


@Injectable()
export class PropertyAiActionOrchestrationService {


  constructor(

    private readonly governance:
      PropertyActionGovernanceService,

    private readonly execution:
      PropertyActionExecutionService,

    private readonly audit:
      AiDecisionAuditService,

  ) {}


  execute(
    propertyId:
      string,

    recommendations:
      PropertyActionRecommendation[],

  ):
    PropertyAiActionOrchestrationResult {


    const executions =
      recommendations.map(
        recommendation => {


          const proposal:
            PropertyActionProposal = {

            propertyId:

              recommendation.propertyId,

            action:
              this.resolveAction(
                recommendation.action,
              ),

            reason:

              recommendation.reason,

            confidence:

              recommendation.confidence,

            requiresApproval:

              recommendation.requiresApproval,

          };


          const governed =
            this.governance.evaluate(
              proposal,
            );


          const result =
            this.execution.execute(
              governed,
            );


          this.audit.record({

            id:
              randomUUID(),

            propertyId:

              propertyId,

            command:

              'PROPERTY_ACTION_ORCHESTRATION',

            confidence:

              recommendation.confidence,

            decision:

              governed.decision.mode,

            governanceResult:

              governed.decision.mode,

            action:

              result.action,

            executionStatus:

              result.status,

            createdAt:

              new Date(),

          });


          return {

            propertyId,

            action:
              result.action,

            status:
              result.status,

            confidence:
              recommendation.confidence,

            governanceMode:
              governed.decision.mode,

            message:
              result.message,

          };

        },
      );


    return {

      propertyId,

      executions,

      generatedAt:
        new Date()
          .toISOString(),

    };

  }

  private resolveAction(
    action:
      string,
  ):
    PropertyActionType {

    const allowed:
      PropertyActionType[] =
      [
        'REVIEW_MAINTENANCE',
        'ASSIGN_OPERATIONAL_OWNER',
        'REVIEW_HELPDESK_ESCALATION',
      ];

    if (
      allowed.includes(
        action as PropertyActionType,
      )
    ) {

      return action as PropertyActionType;

    }

    return 'REVIEW_MAINTENANCE';

  }


}
