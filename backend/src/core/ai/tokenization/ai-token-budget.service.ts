import {
  Injectable,
} from '@nestjs/common';
import {
  AiContextBudgetError,
} from '../errors/ai-context-budget.error';
import type {
  AiConversationMessageInput,
} from '../types/ai-conversation-session.types';
import type {
  AiContextTokenBudget,
  AiTokenBudgetRequest,
} from '../types/ai-context.types';

const DEFAULT_SAFETY_BUFFER_TOKENS =
  256;

const MESSAGE_OVERHEAD_TOKENS =
  4;

@Injectable()
export class AiTokenBudgetService {
  estimateTextTokens(
    text:
      string,
  ): number {
    if (
      typeof text !==
      'string'
    ) {
      throw new Error(
        'Text must be a string',
      );
    }

    if (
      text.length ===
      0
    ) {
      return 0;
    }

    const normalized =
      text
        .replace(
          /\s+/g,
          ' ',
        )
        .trim();

    if (
      normalized.length ===
      0
    ) {
      return 0;
    }

    return Math.max(
      1,
      Math.ceil(
        normalized.length /
        4,
      ),
    );
  }

  estimateMessageTokens(
    message:
      AiConversationMessageInput,
  ): number {
    const roleTokens =
      this.estimateTextTokens(
        message.role,
      );

    const contentTokens =
      this.estimateTextTokens(
        message.content,
      );

    const metadataTokens =
      Object.entries(
        message.metadata ?? {},
      )
        .reduce(
          (
            total,
            [
              key,
              value,
            ],
          ) =>
            total +
            this.estimateTextTokens(
              key,
            ) +
            this.estimateTextTokens(
              value,
            ),
          0,
        );

    return (
      MESSAGE_OVERHEAD_TOKENS +
      roleTokens +
      contentTokens +
      metadataTokens
    );
  }

  calculateBudget(
    request:
      AiTokenBudgetRequest,
  ): AiContextTokenBudget {
    const provider =
      this.requireText(
        request.modelProfile
          .provider,
        'Provider is required',
      );

    const model =
      this.requireText(
        request.modelProfile
          .model,
        'Model is required',
      );

    const contextWindowTokens =
      request.modelProfile
        .contextWindowTokens;

    if (
      !Number.isInteger(
        contextWindowTokens,
      ) ||
      contextWindowTokens <
        128 ||
      contextWindowTokens >
        10_000_000
    ) {
      throw new AiContextBudgetError(
        'AI_CONTEXT_INVALID_MODEL_PROFILE',
        'Context-window tokens must be an integer between 128 and 10000000',
      );
    }

    const reservedCompletionTokens =
      request
        .reservedCompletionTokens;

    if (
      !Number.isInteger(
        reservedCompletionTokens,
      ) ||
      reservedCompletionTokens <
        1
    ) {
      throw new AiContextBudgetError(
        'AI_CONTEXT_INVALID_BUDGET',
        'Reserved completion tokens must be a positive integer',
      );
    }

    const safetyBufferTokens =
      request.safetyBufferTokens ??
      DEFAULT_SAFETY_BUFFER_TOKENS;

    if (
      !Number.isInteger(
        safetyBufferTokens,
      ) ||
      safetyBufferTokens <
        0
    ) {
      throw new AiContextBudgetError(
        'AI_CONTEXT_INVALID_BUDGET',
        'Safety-buffer tokens must be a non-negative integer',
      );
    }

    const maximumPromptTokens =
      contextWindowTokens -
      reservedCompletionTokens -
      safetyBufferTokens;

    if (
      maximumPromptTokens <
      1
    ) {
      throw new AiContextBudgetError(
        'AI_CONTEXT_INVALID_BUDGET',
        'Reserved completion and safety-buffer tokens exhaust the model context window',
      );
    }

    return {
      provider,
      model,
      contextWindowTokens,
      reservedCompletionTokens,
      safetyBufferTokens,
      maximumPromptTokens,
    };
  }

  private requireText(
    value:
      string,
    message:
      string,
  ): string {
    if (
      typeof value !==
        'string' ||
      value.trim().length ===
        0
    ) {
      throw new AiContextBudgetError(
        'AI_CONTEXT_INVALID_MODEL_PROFILE',
        message,
      );
    }

    return value.trim();
  }
}
