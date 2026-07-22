import { Injectable } from '@nestjs/common';

import {
  AiRecoveryExecutionRequest,
  AiRecoveryExecutionResult,
} from '../types/ai-recovery-execution.types';

@Injectable()
export class AiRecoveryExecutionService {

  execute(
    request: AiRecoveryExecutionRequest,
  ): AiRecoveryExecutionResult {

    if (
      request.action === 'STOP'
    ) {
      return {
        status:
          'STOPPED',
        action:
          request.action,
        correlationId:
          request.correlationId,
        attemptNumber:
          request.attemptNumber,
        message:
          'Recovery execution stopped safely',
      };
    }

    if (
      request.attemptNumber <= 0
    ) {
      return {
        status:
          'FAILED',
        action:
          request.action,
        correlationId:
          request.correlationId,
        attemptNumber:
          request.attemptNumber,
        message:
          'Invalid recovery attempt number',
      };
    }

    return {
      status:
        'STARTED',
      action:
        request.action,
      correlationId:
        request.correlationId,
      attemptNumber:
        request.attemptNumber,
      message:
        'Recovery execution accepted',
    };
  }
}
