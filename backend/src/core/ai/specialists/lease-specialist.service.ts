import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyExecutableSpecialistAgent,
  PropertySpecialistAgentExecutionContext,
} from '../agents/runtime/property-specialist-agent-runtime.types';

import {
  PropertyAiAgentProposal,
} from '../collaboration/property-ai-agent-negotiation.types';


export const LEASE_SPECIALIST_AGENT_ID =
  'lease-specialist';

export const LEASE_ANALYSIS_CAPABILITY =
  'LEASE_ANALYSIS';


@Injectable()
export class LeaseSpecialistService
  implements PropertyExecutableSpecialistAgent {


  readonly agentId =
    LEASE_SPECIALIST_AGENT_ID;


  readonly capabilities =
    [
      LEASE_ANALYSIS_CAPABILITY,
    ];


  async execute(
    context:
      PropertySpecialistAgentExecutionContext,
  ):
    Promise<PropertyAiAgentProposal> {


    const objective =
      context.objective.trim();


    const normalizedObjective =
      objective.toLowerCase();


    if (
      normalizedObjective.includes(
        'deposit',
      )
    ) {

      return this.createProposal(
        'RECONCILE_LEASE_DEPOSIT',
        0.93,
        context,
        'The objective indicates a lease-deposit reconciliation requirement.',
      );

    }


    if (
      normalizedObjective.includes(
        'overdue',
      )
      ||
      normalizedObjective.includes(
        'rent',
      )
      ||
      normalizedObjective.includes(
        'payment',
      )
    ) {

      return this.createProposal(
        'REVIEW_LEASE_PAYMENT_RISK',
        0.92,
        context,
        'The objective indicates a rent or lease-payment risk.',
      );

    }


    if (
      normalizedObjective.includes(
        'expiry',
      )
      ||
      normalizedObjective.includes(
        'expiring',
      )
      ||
      normalizedObjective.includes(
        'renewal',
      )
      ||
      normalizedObjective.includes(
        'notice',
      )
    ) {

      return this.createProposal(
        'REVIEW_LEASE_RENEWAL',
        0.91,
        context,
        'The objective indicates a lease-expiry, renewal, or notice-period requirement.',
      );

    }


    return this.createProposal(
      'REVIEW_LEASE_OBLIGATIONS',
      0.85,
      context,
      'The objective requires a general review of the property lease obligations.',
    );

  }


  private createProposal(
    recommendation:
      string,

    confidence:
      number,

    context:
      PropertySpecialistAgentExecutionContext,

    analysis:
      string,
  ):
    PropertyAiAgentProposal {


    return {

      agentId:
        this.agentId,

      recommendation,

      confidence,

      reasoning:
        [
          analysis,
          `Property: ${context.propertyId}.`,
          `Objective: ${context.objective}.`,
        ].join(
          ' ',
        ),

    };

  }

}
