import {
  Injectable,
} from '@nestjs/common';

import {
  AiRecoveryOutcome,
} from '../types/ai-recovery-outcome.types';


@Injectable()
export class AiRecoveryOutcomeRepository {

  private readonly outcomes:
    AiRecoveryOutcome[] = [];


  save(
    outcome: AiRecoveryOutcome,
  ): void {

    this.outcomes.push(
      outcome,
    );
  }


  findAll(): AiRecoveryOutcome[] {

    return [
      ...this.outcomes,
    ];
  }


  findByCorrelationId(
    correlationId: string,
  ): AiRecoveryOutcome[] {

    return this.outcomes.filter(
      (outcome) =>
        outcome.correlationId === correlationId,
    );
  }
}
