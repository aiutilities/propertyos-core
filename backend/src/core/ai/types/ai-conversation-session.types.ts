export type AiConversationRole =
  | 'SYSTEM'
  | 'USER'
  | 'ASSISTANT'
  | 'TOOL';

export type AiConversationSessionStatus =
  | 'ACTIVE'
  | 'ARCHIVED';

export interface AiConversationMessage {
  messageId: string;
  sequenceNumber: number;
  role: AiConversationRole;
  content: string;
  createdAt: string;
  metadata: Readonly<
    Record<string, string>
  >;
}

export interface AiConversationSession {
  sessionId: string;
  tenantId: string;
  status:
    AiConversationSessionStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  messages:
    readonly AiConversationMessage[];
}

export interface AiConversationSessionCreateRequest {
  tenantId: string;
  initialMessages?:
    readonly AiConversationMessageInput[];
}

export interface AiConversationMessageInput {
  role: AiConversationRole;
  content: string;
  metadata?:
    Readonly<
      Record<string, string>
    >;
}

export interface AiConversationMessageAppendRequest {
  tenantId: string;
  sessionId: string;
  expectedVersion: number;
  message:
    AiConversationMessageInput;
}

export interface AiConversationArchiveRequest {
  tenantId: string;
  sessionId: string;
  expectedVersion: number;
}

export interface AiConversationSessionConfiguration {
  maximumMessagesPerSession:
    number;
  maximumContentLength:
    number;
}

export interface AiConversationContextWindow {
  sessionId: string;
  tenantId: string;
  version: number;
  messages:
    readonly AiConversationMessage[];
}
