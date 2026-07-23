import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiAgentNegotiationResult,
  PropertyAiAgentProposal,
} from './property-ai-agent-negotiation.types';


interface RecommendationGroup {

  recommendation:
    string;

  proposals:
    PropertyAiAgentProposal[];

  totalConfidence:
    number;

  averageConfidence:
    number;

}


@Injectable()
export class PropertyAiAgentNegotiationService {


  negotiate(

    propertyId:
      string,

    proposals:
      PropertyAiAgentProposal[],

  ):
    PropertyAiAgentNegotiationResult {


    if (
      proposals.length === 0
    ) {

      throw new Error(
        'No agent proposals available',
      );

    }


    const groups =
      this.groupByRecommendation(
        proposals,
      );


    const rankedGroups =
      [...groups]
        .sort(
          (
            a,
            b,
          ) => {

            if (
              b.proposals.length
              !== a.proposals.length
            ) {

              return (
                b.proposals.length
                -
                a.proposals.length
              );

            }


            if (
              b.averageConfidence
              !== a.averageConfidence
            ) {

              return (
                b.averageConfidence
                -
                a.averageConfidence
              );

            }


            return a.recommendation
              .localeCompare(
                b.recommendation,
              );

          },
        );


    const selectedGroup =
      rankedGroups[0];


    const selectedProposal =
      [...selectedGroup.proposals]
        .sort(
          (
            a,
            b,
          ) => {

            const weightedDifference =
              (
                b.confidence
                *
                (
                  b.expertiseWeight
                  ?? 1
                )
              )
              -
              (
                a.confidence
                *
                (
                  a.expertiseWeight
                  ?? 1
                )
              );


            if (
              weightedDifference !== 0
            ) {

              return weightedDifference;

            }


            return (
              b.confidence
              -
              a.confidence
            );

          },
        )[0];


    const agreementRatio =
      selectedGroup.proposals.length
      /
      proposals.length;


    const agreementScore =
      Number(
        (
          agreementRatio
          *
          selectedGroup.averageConfidence
        )
          .toFixed(
            2,
          ),
      );


    const supportingAgentIds =
      selectedGroup.proposals.map(
        proposal =>
          proposal.agentId,
      );


    const supportingAgents =
      new Set(
        supportingAgentIds,
      );


    const conflictingAgentIds =
      proposals
        .filter(
          proposal =>
            !supportingAgents.has(
              proposal.agentId,
            ),
        )
        .map(
          proposal =>
            proposal.agentId,
        );


    return {

      propertyId,

      proposals,

      selectedProposal,

      agreementScore,

      supportingAgentIds,

      conflictingAgentIds,

    };

  }


  private groupByRecommendation(
    proposals:
      PropertyAiAgentProposal[],
  ):
    RecommendationGroup[] {


    const groups =
      new Map<
        string,
        PropertyAiAgentProposal[]
      >();


    for (
      const proposal
      of proposals
    ) {

      const existing =
        groups.get(
          proposal.recommendation,
        )
        ??
        [];


      existing.push(
        proposal,
      );


      groups.set(
        proposal.recommendation,
        existing,
      );

    }


    return Array.from(
      groups.entries(),
    )
      .map(
        (
          [
            recommendation,
            groupedProposals,
          ],
        ) => {


          const totalConfidence =
            groupedProposals.reduce(
              (
                total,
                proposal,
              ) =>
                total
                +
                (
                  proposal.confidence
                  *
                  (
                    proposal.expertiseWeight
                    ?? 1
                  )
                ),
              0,
            );


          return {

            recommendation,

            proposals:
              groupedProposals,

            totalConfidence,

            averageConfidence:
              totalConfidence
              /
              groupedProposals.length,

          };

        },
      );

  }

}
