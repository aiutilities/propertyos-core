import {
  Injectable,
} from '@nestjs/common';
import {
  AiProviderSelectionError,
} from '../errors/ai-provider-selection.error';
import {
  AiProviderSelectionCandidate,
  AiProviderSelectionEvaluation,
  AiProviderSelectionExclusionCode,
  AiProviderSelectionRequest,
  AiProviderSelectionResult,
  AiProviderSelectionScore,
} from '../types/ai-provider-selection.types';

@Injectable()
export class AiProviderSelectionService {
  select(
    request:
      AiProviderSelectionRequest,
  ): AiProviderSelectionResult {
    this.validateRequest(
      request,
    );

    const evaluations =
      request.candidates.map(
        candidate =>
          this.evaluateCandidate(
            request,
            candidate,
          ),
      );

    const eligible =
      evaluations
        .filter(
          evaluation =>
            evaluation.eligible,
        )
        .sort(
          (
            left,
            right,
          ) =>
            this.compareEvaluations(
              left,
              right,
            ),
        );

    const selected =
      eligible[0];

    if (
      !selected
    ) {
      throw new AiProviderSelectionError(
        evaluations,
      );
    }

    return {
      selectedProviderName:
        selected.providerName,
      selectedModel:
        selected.model,
      selectedScore:
        selected.score.totalScore,
      evaluations:
        evaluations.map(
          evaluation => ({
            ...evaluation,
            exclusionCodes: [
              ...evaluation.exclusionCodes,
            ],
            score: {
              ...evaluation.score,
            },
          }),
        ),
      selectedAt:
        new Date()
          .toISOString(),
    };
  }

  evaluate(
    request:
      AiProviderSelectionRequest,
  ): AiProviderSelectionEvaluation[] {
    this.validateRequest(
      request,
    );

    return request.candidates.map(
      candidate =>
        this.evaluateCandidate(
          request,
          candidate,
        ),
    );
  }

  private evaluateCandidate(
    request:
      AiProviderSelectionRequest,
    candidate:
      AiProviderSelectionCandidate,
  ): AiProviderSelectionEvaluation {
    const exclusionCodes:
      AiProviderSelectionExclusionCode[] = [];

    if (
      candidate.enabled !== true
    ) {
      exclusionCodes.push(
        'PROVIDER_DISABLED',
      );
    }

    if (
      candidate.availability ===
      'UNAVAILABLE'
    ) {
      exclusionCodes.push(
        'PROVIDER_UNAVAILABLE',
      );
    }

    const missingCapability =
      request.requiredCapabilities.some(
        capability =>
          !candidate.capabilities.includes(
            capability,
          ),
      );

    if (
      missingCapability
    ) {
      exclusionCodes.push(
        'REQUIRED_CAPABILITY_MISSING',
      );
    }

    if (
      request.maximumLatencyMs !==
        undefined &&
      candidate.estimatedLatencyMs >
        request.maximumLatencyMs
    ) {
      exclusionCodes.push(
        'LATENCY_LIMIT_EXCEEDED',
      );
    }

    if (
      request.maximumCostPerMillionTokensUsd !==
        undefined &&
      candidate
        .estimatedCostPerMillionTokensUsd >
        request
          .maximumCostPerMillionTokensUsd
    ) {
      exclusionCodes.push(
        'COST_LIMIT_EXCEEDED',
      );
    }

    return {
      providerName:
        candidate.providerName,
      model:
        candidate.model,
      eligible:
        exclusionCodes.length === 0,
      exclusionCodes,
      score:
        this.calculateScore(
          request,
          candidate,
        ),
    };
  }

  private calculateScore(
    request:
      AiProviderSelectionRequest,
    candidate:
      AiProviderSelectionCandidate,
  ): AiProviderSelectionScore {
    const capabilityScore =
      request.requiredCapabilities.length === 0
        ? 20
        : Math.round(
            (
              request.requiredCapabilities
                .filter(
                  capability =>
                    candidate.capabilities.includes(
                      capability,
                    ),
                )
                .length /
              request.requiredCapabilities
                .length
            ) *
              20,
          );

    const availabilityScore =
      candidate.availability ===
      'AVAILABLE'
        ? 20
        : candidate.availability ===
            'DEGRADED'
          ? 8
          : 0;

    const latencyScore =
      this.scoreLowerIsBetter(
        candidate.estimatedLatencyMs,
        request.maximumLatencyMs ??
          this.maximumValue(
            request.candidates.map(
              item =>
                item.estimatedLatencyMs,
            ),
          ),
        20,
      );

    const costScore =
      this.scoreLowerIsBetter(
        candidate
          .estimatedCostPerMillionTokensUsd,
        request
          .maximumCostPerMillionTokensUsd ??
          this.maximumValue(
            request.candidates.map(
              item =>
                item
                  .estimatedCostPerMillionTokensUsd,
            ),
          ),
        20,
      );

    const preferenceIndex =
      request.preferredProviders
        ?.indexOf(
          candidate.providerName,
        ) ?? -1;

    const preferenceScore =
      preferenceIndex < 0
        ? 0
        : Math.max(
            0,
            20 -
              preferenceIndex *
                4,
          );

    const priorityScore =
      Math.max(
        0,
        Math.min(
          10,
          Math.round(
            candidate.priority /
              10,
          ),
        ),
      );

    const totalScore =
      capabilityScore +
      availabilityScore +
      latencyScore +
      costScore +
      preferenceScore +
      priorityScore;

    return {
      capabilityScore,
      availabilityScore,
      latencyScore,
      costScore,
      preferenceScore,
      priorityScore,
      totalScore,
    };
  }

  private scoreLowerIsBetter(
    value:
      number,
    ceiling:
      number,
    maximumScore:
      number,
  ): number {
    if (
      ceiling <= 0
    ) {
      return value === 0
        ? maximumScore
        : 0;
    }

    const ratio =
      Math.max(
        0,
        Math.min(
          1,
          1 -
            value /
              ceiling,
        ),
      );

    return Math.round(
      ratio *
        maximumScore,
    );
  }

  private maximumValue(
    values:
      readonly number[],
  ): number {
    return Math.max(
      1,
      ...values,
    );
  }

  private compareEvaluations(
    left:
      AiProviderSelectionEvaluation,
    right:
      AiProviderSelectionEvaluation,
  ): number {
    if (
      right.score.totalScore !==
      left.score.totalScore
    ) {
      return (
        right.score.totalScore -
        left.score.totalScore
      );
    }

    const providerComparison =
      left.providerName.localeCompare(
        right.providerName,
      );

    if (
      providerComparison !== 0
    ) {
      return providerComparison;
    }

    return left.model.localeCompare(
      right.model,
    );
  }

  private validateRequest(
    request:
      AiProviderSelectionRequest,
  ): void {
    if (
      request.candidates.length === 0
    ) {
      throw new Error(
        'At least one AI provider candidate is required',
      );
    }

    if (
      request.maximumLatencyMs !==
        undefined &&
      (
        !Number.isFinite(
          request.maximumLatencyMs,
        ) ||
        request.maximumLatencyMs < 0
      )
    ) {
      throw new Error(
        'Maximum latency must be a non-negative finite number',
      );
    }

    if (
      request.maximumCostPerMillionTokensUsd !==
        undefined &&
      (
        !Number.isFinite(
          request
            .maximumCostPerMillionTokensUsd,
        ) ||
        request
          .maximumCostPerMillionTokensUsd <
          0
      )
    ) {
      throw new Error(
        'Maximum cost must be a non-negative finite number',
      );
    }

    for (
      const candidate of
        request.candidates
    ) {
      if (
        candidate.providerName
          .trim()
          .length === 0
      ) {
        throw new Error(
          'Candidate provider name is required',
        );
      }

      if (
        candidate.model
          .trim()
          .length === 0
      ) {
        throw new Error(
          'Candidate model is required',
        );
      }

      if (
        !Number.isFinite(
          candidate.estimatedLatencyMs,
        ) ||
        candidate.estimatedLatencyMs <
          0
      ) {
        throw new Error(
          'Candidate latency must be a non-negative finite number',
        );
      }

      if (
        !Number.isFinite(
          candidate
            .estimatedCostPerMillionTokensUsd,
        ) ||
        candidate
          .estimatedCostPerMillionTokensUsd <
          0
      ) {
        throw new Error(
          'Candidate cost must be a non-negative finite number',
        );
      }
    }
  }
}
