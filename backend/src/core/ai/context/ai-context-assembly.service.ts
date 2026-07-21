import {
  Injectable,
} from '@nestjs/common';
import {
  AiContextBudgetError,
} from '../errors/ai-context-budget.error';
import {
  AiTokenBudgetService,
} from '../tokenization/ai-token-budget.service';
import type {
  AiConversationMessageInput,
} from '../types/ai-conversation-session.types';
import type {
  AiAssembledContextMessage,
  AiContextAssemblyRequest,
  AiContextAssemblyResult,
} from '../types/ai-context.types';

interface IndexedContextMessage {
  message:
    AiConversationMessageInput;
  originalIndex:
    number | null;
  estimatedTokens:
    number;
  preservedReason:
    AiAssembledContextMessage[
      'preservedReason'
    ];
}

@Injectable()
export class AiContextAssemblyService {
  constructor(
    private readonly tokenBudgetService:
      AiTokenBudgetService =
        new AiTokenBudgetService(),
  ) {}

  assemble(
    request:
      AiContextAssemblyRequest,
  ): AiContextAssemblyResult {
    const budget =
      this.tokenBudgetService
        .calculateBudget({
          modelProfile:
            request.modelProfile,
          reservedCompletionTokens:
            request.reservedCompletionTokens,
          safetyBufferTokens:
            request.safetyBufferTokens,
        });

    const suppliedMessages =
      request.messages.map(
        message =>
          this.cloneInputMessage(
            message,
          ),
      );

    if (
      suppliedMessages.length ===
        0 &&
      !this.hasText(
        request.systemPrompt,
      )
    ) {
      throw new AiContextBudgetError(
        'AI_CONTEXT_EMPTY_MESSAGES',
        'At least one system prompt or conversation message is required',
      );
    }

    suppliedMessages.forEach(
      message =>
        this.validateMessage(
          message,
        ),
    );

    const indexedMessages:
      IndexedContextMessage[] =
      suppliedMessages.map(
        (
          message,
          index,
        ) => ({
          message,
          originalIndex:
            index,
          estimatedTokens:
            this.tokenBudgetService
              .estimateMessageTokens(
                message,
              ),
          preservedReason:
            'BUDGET_FIT',
        }),
      );

    const syntheticSystemMessage =
      this.hasText(
        request.systemPrompt,
      )
        ? this.createSyntheticSystemMessage(
            request.systemPrompt!,
          )
        : undefined;

    const systemMessages =
      [
        ...(syntheticSystemMessage
          ? [
              syntheticSystemMessage,
            ]
          : []),
        ...indexedMessages
          .filter(
            entry =>
              entry.message.role ===
              'SYSTEM',
          )
          .map(
            entry => ({
              ...entry,
              preservedReason:
                'SYSTEM' as const,
            }),
          ),
      ];

    const nonSystemMessages =
      indexedMessages.filter(
        entry =>
          entry.message.role !==
          'SYSTEM',
      );

    const latestMessage =
      nonSystemMessages.length >
      0
        ? {
            ...nonSystemMessages[
              nonSystemMessages.length -
              1
            ],
            preservedReason:
              'LATEST' as const,
          }
        : undefined;

    const mandatoryEntries =
      this.uniqueEntries([
        ...systemMessages,
        ...(latestMessage
          ? [
              latestMessage,
            ]
          : []),
      ]);

    const mandatoryTokens =
      this.totalTokens(
        mandatoryEntries,
      );

    if (
      mandatoryTokens >
      budget.maximumPromptTokens
    ) {
      throw new AiContextBudgetError(
        'AI_CONTEXT_MANDATORY_CONTENT_EXCEEDS_BUDGET',
        'System and latest-message content exceed the available prompt budget',
      );
    }

    const selected =
      new Map<
        string,
        IndexedContextMessage
      >();

    mandatoryEntries.forEach(
      entry =>
        selected.set(
          this.entryKey(
            entry,
          ),
          entry,
        ),
    );

    let consumedTokens =
      mandatoryTokens;

    for (
      let index =
        nonSystemMessages.length -
        1;
      index >= 0;
      index -= 1
    ) {
      const entry =
        nonSystemMessages[
          index
        ];

      const key =
        this.entryKey(
          entry,
        );

      if (
        selected.has(
          key,
        )
      ) {
        continue;
      }

      if (
        consumedTokens +
          entry.estimatedTokens >
        budget.maximumPromptTokens
      ) {
        continue;
      }

      selected.set(
        key,
        entry,
      );

      consumedTokens +=
        entry.estimatedTokens;
    }

    const assembled =
      [
        ...selected.values(),
      ].sort(
        (
          left,
          right,
        ) =>
          this.sortIndex(
            left,
          ) -
          this.sortIndex(
            right,
          ),
      );

    const resultMessages =
      assembled.map(
        entry =>
          this.toResultMessage(
            entry,
          ),
      );

    const retainedOriginalCount =
      resultMessages.filter(
        message =>
          message.originalIndex !==
          null,
      ).length;

    const removedMessageCount =
      suppliedMessages.length -
      retainedOriginalCount;

    return {
      messages:
        resultMessages,
      evidence: {
        provider:
          budget.provider,
        model:
          budget.model,
        contextWindowTokens:
          budget.contextWindowTokens,
        reservedCompletionTokens:
          budget
            .reservedCompletionTokens,
        safetyBufferTokens:
          budget.safetyBufferTokens,
        maximumPromptTokens:
          budget.maximumPromptTokens,
        estimatedPromptTokens:
          consumedTokens,
        estimatedRemainingPromptTokens:
          budget.maximumPromptTokens -
          consumedTokens,
        suppliedMessageCount:
          suppliedMessages.length,
        assembledMessageCount:
          resultMessages.length,
        retainedMessageCount:
          retainedOriginalCount,
        removedMessageCount,
        truncationOccurred:
          removedMessageCount >
          0,
        systemMessageCount:
          resultMessages.filter(
            message =>
              message.role ===
              'SYSTEM',
          ).length,
        latestMessagePreserved:
          latestMessage
            ? resultMessages.some(
                message =>
                  message.originalIndex ===
                  latestMessage.originalIndex,
              )
            : true,
      },
    };
  }

  private createSyntheticSystemMessage(
    systemPrompt:
      string,
  ): IndexedContextMessage {
    const message:
      AiConversationMessageInput = {
        role:
          'SYSTEM',
        content:
          systemPrompt.trim(),
        metadata: {},
      };

    return {
      message,
      originalIndex:
        null,
      estimatedTokens:
        this.tokenBudgetService
          .estimateMessageTokens(
            message,
          ),
      preservedReason:
        'SYSTEM',
    };
  }

  private validateMessage(
    message:
      AiConversationMessageInput,
  ): void {
    if (
      !this.hasText(
        message.role,
      )
    ) {
      throw new Error(
        'Message role is required',
      );
    }

    if (
      !this.hasText(
        message.content,
      )
    ) {
      throw new Error(
        'Message content is required',
      );
    }

    Object.entries(
      message.metadata ?? {},
    ).forEach(
      (
        [
          key,
          value,
        ],
      ) => {
        if (
          !this.hasText(
            key,
          ) ||
          !this.hasText(
            value,
          )
        ) {
          throw new Error(
            'Message metadata keys and values must be non-empty strings',
          );
        }
      },
    );
  }

  private uniqueEntries(
    entries:
      readonly IndexedContextMessage[],
  ): IndexedContextMessage[] {
    const unique =
      new Map<
        string,
        IndexedContextMessage
      >();

    entries.forEach(
      entry =>
        unique.set(
          this.entryKey(
            entry,
          ),
          entry,
        ),
    );

    return [
      ...unique.values(),
    ];
  }

  private entryKey(
    entry:
      IndexedContextMessage,
  ): string {
    return entry.originalIndex ===
      null
      ? 'synthetic-system'
      : `message-${entry.originalIndex}`;
  }

  private sortIndex(
    entry:
      IndexedContextMessage,
  ): number {
    return entry.originalIndex ===
      null
      ? -1
      : entry.originalIndex;
  }

  private totalTokens(
    entries:
      readonly IndexedContextMessage[],
  ): number {
    return entries.reduce(
      (
        total,
        entry,
      ) =>
        total +
        entry.estimatedTokens,
      0,
    );
  }

  private toResultMessage(
    entry:
      IndexedContextMessage,
  ): AiAssembledContextMessage {
    return {
      role:
        entry.message.role,
      content:
        entry.message.content,
      metadata: {
        ...entry.message.metadata,
      },
      estimatedTokens:
        entry.estimatedTokens,
      originalIndex:
        entry.originalIndex,
      preservedReason:
        entry.preservedReason,
    };
  }

  private cloneInputMessage(
    message:
      AiConversationMessageInput,
  ): AiConversationMessageInput {
    return {
      role:
        message.role,
      content:
        message.content,
      metadata: {
        ...message.metadata,
      },
    };
  }

  private hasText(
    value:
      unknown,
  ): value is string {
    return (
      typeof value ===
        'string' &&
      value.trim().length >
        0
    );
  }
}
