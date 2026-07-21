import {
  Injectable,
} from '@nestjs/common';
import {
  createHash,
} from 'crypto';
import {
  AiConversationSessionError,
} from '../errors/ai-conversation-session.error';
import {
  AiConversationArchiveRequest,
  AiConversationContextWindow,
  AiConversationMessage,
  AiConversationMessageAppendRequest,
  AiConversationMessageInput,
  AiConversationSession,
  AiConversationSessionConfiguration,
  AiConversationSessionCreateRequest,
} from '../types/ai-conversation-session.types';

const DEFAULT_CONFIGURATION:
  AiConversationSessionConfiguration = {
    maximumMessagesPerSession:
      100,
    maximumContentLength:
      32_000,
  };

@Injectable()
export class AiConversationSessionService {
  private readonly sessions =
    new Map<
      string,
      AiConversationSession
    >();

  private creationSequence =
    0;

  private readonly configuration:
    AiConversationSessionConfiguration;

  constructor(
    configuration:
      Partial<
        AiConversationSessionConfiguration
      > = {},
  ) {
    this.configuration =
      this.validateConfiguration({
        ...DEFAULT_CONFIGURATION,
        ...configuration,
      });
  }

  createSession(
    request:
      AiConversationSessionCreateRequest,
  ): AiConversationSession {
    const tenantId =
      this.requireText(
        request.tenantId,
        'Tenant ID is required',
      );

    const initialMessages =
      request.initialMessages ?? [];

    if (
      initialMessages.length >
      this.configuration
        .maximumMessagesPerSession
    ) {
      throw new AiConversationSessionError(
        'AI_CONVERSATION_SESSION_LIMIT_EXCEEDED',
        'Initial message count exceeds the session limit',
      );
    }

    initialMessages.forEach(
      message =>
        this.validateMessage(
          message,
        ),
    );

    this.creationSequence +=
      1;

    const sessionId =
      this.createSessionId(
        tenantId,
        this.creationSequence,
      );

    const timestamp =
      new Date()
        .toISOString();

    const messages =
      initialMessages.map(
        (
          message,
          index,
        ) =>
          this.createMessage(
            sessionId,
            index + 1,
            message,
            timestamp,
          ),
      );

    const session:
      AiConversationSession = {
        sessionId,
        tenantId,
        status:
          'ACTIVE',
        version:
          1,
        createdAt:
          timestamp,
        updatedAt:
          timestamp,
        messages,
      };

    this.sessions.set(
      sessionId,
      session,
    );

    return this.cloneSession(
      session,
    );
  }

  getSession(
    tenantId:
      string,
    sessionId:
      string,
  ): AiConversationSession {
    const session =
      this.requireSession(
        tenantId,
        sessionId,
      );

    return this.cloneSession(
      session,
    );
  }

  appendMessage(
    request:
      AiConversationMessageAppendRequest,
  ): AiConversationSession {
    const session =
      this.requireSession(
        request.tenantId,
        request.sessionId,
      );

    this.requireExpectedVersion(
      session,
      request.expectedVersion,
    );

    if (
      session.status ===
      'ARCHIVED'
    ) {
      throw new AiConversationSessionError(
        'AI_CONVERSATION_SESSION_ARCHIVED',
        'Archived conversation sessions cannot accept new messages',
      );
    }

    this.validateMessage(
      request.message,
    );

    if (
      session.messages.length >=
      this.configuration
        .maximumMessagesPerSession
    ) {
      throw new AiConversationSessionError(
        'AI_CONVERSATION_SESSION_LIMIT_EXCEEDED',
        'Conversation session message limit has been reached',
      );
    }

    const timestamp =
      new Date()
        .toISOString();

    const nextSequence =
      session.messages.length +
      1;

    const nextMessage =
      this.createMessage(
        session.sessionId,
        nextSequence,
        request.message,
        timestamp,
      );

    const updated:
      AiConversationSession = {
        ...session,
        version:
          session.version +
          1,
        updatedAt:
          timestamp,
        messages: [
          ...session.messages,
          nextMessage,
        ],
      };

    this.sessions.set(
      session.sessionId,
      updated,
    );

    return this.cloneSession(
      updated,
    );
  }

  archiveSession(
    request:
      AiConversationArchiveRequest,
  ): AiConversationSession {
    const session =
      this.requireSession(
        request.tenantId,
        request.sessionId,
      );

    this.requireExpectedVersion(
      session,
      request.expectedVersion,
    );

    if (
      session.status ===
      'ARCHIVED'
    ) {
      return this.cloneSession(
        session,
      );
    }

    const timestamp =
      new Date()
        .toISOString();

    const archived:
      AiConversationSession = {
        ...session,
        status:
          'ARCHIVED',
        version:
          session.version +
          1,
        updatedAt:
          timestamp,
        archivedAt:
          timestamp,
      };

    this.sessions.set(
      session.sessionId,
      archived,
    );

    return this.cloneSession(
      archived,
    );
  }

  getContextWindow(
    tenantId:
      string,
    sessionId:
      string,
    maximumMessages:
      number,
  ): AiConversationContextWindow {
    if (
      !Number.isInteger(
        maximumMessages,
      ) ||
      maximumMessages < 1
    ) {
      throw new Error(
        'Maximum context messages must be a positive integer',
      );
    }

    const session =
      this.requireSession(
        tenantId,
        sessionId,
      );

    return {
      sessionId:
        session.sessionId,
      tenantId:
        session.tenantId,
      version:
        session.version,
      messages:
        session.messages
          .slice(
            -maximumMessages,
          )
          .map(
            message =>
              this.cloneMessage(
                message,
              ),
          ),
    };
  }

  listSessions(
    tenantId:
      string,
  ): AiConversationSession[] {
    const normalizedTenantId =
      this.requireText(
        tenantId,
        'Tenant ID is required',
      );

    return [
      ...this.sessions.values(),
    ]
      .filter(
        session =>
          session.tenantId ===
          normalizedTenantId,
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.createdAt.localeCompare(
            right.createdAt,
          ) ||
          left.sessionId.localeCompare(
            right.sessionId,
          ),
      )
      .map(
        session =>
          this.cloneSession(
            session,
          ),
      );
  }

  private requireSession(
    tenantId:
      string,
    sessionId:
      string,
  ): AiConversationSession {
    const normalizedTenantId =
      this.requireText(
        tenantId,
        'Tenant ID is required',
      );

    const normalizedSessionId =
      this.requireText(
        sessionId,
        'Session ID is required',
      );

    const session =
      this.sessions.get(
        normalizedSessionId,
      );

    if (
      !session
    ) {
      throw new AiConversationSessionError(
        'AI_CONVERSATION_SESSION_NOT_FOUND',
        'Conversation session was not found',
      );
    }

    if (
      session.tenantId !==
      normalizedTenantId
    ) {
      throw new AiConversationSessionError(
        'AI_CONVERSATION_TENANT_MISMATCH',
        'Conversation session does not belong to the requested tenant',
      );
    }

    return session;
  }

  private requireExpectedVersion(
    session:
      AiConversationSession,
    expectedVersion:
      number,
  ): void {
    if (
      !Number.isInteger(
        expectedVersion,
      ) ||
      expectedVersion < 1
    ) {
      throw new Error(
        'Expected version must be a positive integer',
      );
    }

    if (
      session.version !==
      expectedVersion
    ) {
      throw new AiConversationSessionError(
        'AI_CONVERSATION_SESSION_VERSION_CONFLICT',
        'Conversation session version does not match the expected version',
      );
    }
  }

  private validateMessage(
    message:
      AiConversationMessageInput,
  ): void {
    this.requireText(
      message.role,
      'Conversation role is required',
    );

    const content =
      this.requireText(
        message.content,
        'Conversation message content is required',
      );

    if (
      content.length >
      this.configuration
        .maximumContentLength
    ) {
      throw new AiConversationSessionError(
        'AI_CONVERSATION_MESSAGE_TOO_LARGE',
        'Conversation message exceeds the configured content limit',
      );
    }

    for (
      const [
        key,
        value,
      ] of Object.entries(
        message.metadata ?? {},
      )
    ) {
      this.requireText(
        key,
        'Conversation metadata key is required',
      );

      this.requireText(
        value,
        'Conversation metadata value is required',
      );
    }
  }

  private createMessage(
    sessionId:
      string,
    sequenceNumber:
      number,
    input:
      AiConversationMessageInput,
    createdAt:
      string,
  ): AiConversationMessage {
    const messageId =
      createHash(
        'sha256',
      )
        .update(
          [
            sessionId,
            sequenceNumber,
            input.role,
            input.content,
          ].join(
            ':',
          ),
        )
        .digest(
          'hex',
        )
        .slice(
          0,
          24,
        );

    return {
      messageId:
        `aimsg_${messageId}`,
      sequenceNumber,
      role:
        input.role,
      content:
        input.content,
      createdAt,
      metadata: {
        ...input.metadata,
      },
    };
  }

  private createSessionId(
    tenantId:
      string,
    creationSequence:
      number,
  ): string {
    const digest =
      createHash(
        'sha256',
      )
        .update(
          [
            tenantId,
            creationSequence,
          ].join(
            ':',
          ),
        )
        .digest(
          'hex',
        )
        .slice(
          0,
          24,
        );

    return `aisess_${digest}`;
  }

  private validateConfiguration(
    configuration:
      AiConversationSessionConfiguration,
  ): AiConversationSessionConfiguration {
    if (
      !Number.isInteger(
        configuration
          .maximumMessagesPerSession,
      ) ||
      configuration
        .maximumMessagesPerSession <
        1 ||
      configuration
        .maximumMessagesPerSession >
        10_000
    ) {
      throw new Error(
        'Maximum messages per session must be an integer between 1 and 10000',
      );
    }

    if (
      !Number.isInteger(
        configuration
          .maximumContentLength,
      ) ||
      configuration
        .maximumContentLength <
        1 ||
      configuration
        .maximumContentLength >
        1_000_000
    ) {
      throw new Error(
        'Maximum content length must be an integer between 1 and 1000000',
      );
    }

    return {
      ...configuration,
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
      throw new Error(
        message,
      );
    }

    return value.trim();
  }

  private cloneSession(
    session:
      AiConversationSession,
  ): AiConversationSession {
    return {
      ...session,
      messages:
        session.messages.map(
          message =>
            this.cloneMessage(
              message,
            ),
        ),
    };
  }

  private cloneMessage(
    message:
      AiConversationMessage,
  ): AiConversationMessage {
    return {
      ...message,
      metadata: {
        ...message.metadata,
      },
    };
  }
}
