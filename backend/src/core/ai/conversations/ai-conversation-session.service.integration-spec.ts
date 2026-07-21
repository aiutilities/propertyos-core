import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  AiConversationSessionError,
} from '../errors/ai-conversation-session.error';
import {
  AiConversationSessionService,
} from './ai-conversation-session.service';

describe(
  'AI conversation session service',
  () => {
    it(
      'creates an active tenant-scoped session',
      () => {
        const service =
          new AiConversationSessionService();

        const session =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        expect(
          session,
        ).toEqual(
          expect.objectContaining({
            tenantId:
              'tenant-a',
            status:
              'ACTIVE',
            version:
              1,
            messages: [],
          }),
        );

        expect(
          session.sessionId,
        ).toMatch(
          /^aisess_[a-f0-9]{24}$/,
        );
      },
    );

    it(
      'creates deterministic session identifiers for the same creation sequence',
      () => {
        const first =
          new AiConversationSessionService();

        const second =
          new AiConversationSessionService();

        expect(
          first.createSession({
            tenantId:
              'tenant-a',
          }).sessionId,
        ).toBe(
          second.createSession({
            tenantId:
              'tenant-a',
          }).sessionId,
        );
      },
    );

    it(
      'creates ordered initial messages',
      () => {
        const service =
          new AiConversationSessionService();

        const session =
          service.createSession({
            tenantId:
              'tenant-a',
            initialMessages: [
              {
                role:
                  'SYSTEM',
                content:
                  'System instruction',
              },
              {
                role:
                  'USER',
                content:
                  'Hello',
              },
            ],
          });

        expect(
          session.messages.map(
            message =>
              message.sequenceNumber,
          ),
        ).toEqual([
          1,
          2,
        ]);
      },
    );

    it(
      'appends messages and increments the version',
      () => {
        const service =
          new AiConversationSessionService();

        const created =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        const updated =
          service.appendMessage({
            tenantId:
              'tenant-a',
            sessionId:
              created.sessionId,
            expectedVersion:
              1,
            message: {
              role:
                'USER',
              content:
                'Question',
            },
          });

        expect(
          updated.version,
        ).toBe(
          2,
        );

        expect(
          updated.messages,
        ).toHaveLength(
          1,
        );

        expect(
          updated.messages[0],
        ).toEqual(
          expect.objectContaining({
            sequenceNumber:
              1,
            role:
              'USER',
            content:
              'Question',
          }),
        );
      },
    );

    it(
      'generates deterministic message identifiers',
      () => {
        const first =
          new AiConversationSessionService();

        const second =
          new AiConversationSessionService();

        const firstSession =
          first.createSession({
            tenantId:
              'tenant-a',
          });

        const secondSession =
          second.createSession({
            tenantId:
              'tenant-a',
          });

        const firstMessage =
          first.appendMessage({
            tenantId:
              'tenant-a',
            sessionId:
              firstSession.sessionId,
            expectedVersion:
              1,
            message: {
              role:
                'USER',
              content:
                'Hello',
            },
          }).messages[0];

        const secondMessage =
          second.appendMessage({
            tenantId:
              'tenant-a',
            sessionId:
              secondSession.sessionId,
            expectedVersion:
              1,
            message: {
              role:
                'USER',
              content:
                'Hello',
            },
          }).messages[0];

        expect(
          firstMessage.messageId,
        ).toBe(
          secondMessage.messageId,
        );
      },
    );

    it(
      'rejects stale expected versions',
      () => {
        const service =
          new AiConversationSessionService();

        const session =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        expect(
          () =>
            service.appendMessage({
              tenantId:
                'tenant-a',
              sessionId:
                session.sessionId,
              expectedVersion:
                2,
              message: {
                role:
                  'USER',
                content:
                  'Question',
              },
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONVERSATION_SESSION_VERSION_CONFLICT',
          }),
        );
      },
    );

    it(
      'prevents cross-tenant access',
      () => {
        const service =
          new AiConversationSessionService();

        const session =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        expect(
          () =>
            service.getSession(
              'tenant-b',
              session.sessionId,
            ),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONVERSATION_TENANT_MISMATCH',
          }),
        );
      },
    );

    it(
      'returns not-found for unknown sessions',
      () => {
        const service =
          new AiConversationSessionService();

        expect(
          () =>
            service.getSession(
              'tenant-a',
              'aisess_unknown',
            ),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONVERSATION_SESSION_NOT_FOUND',
          }),
        );
      },
    );

    it(
      'archives an active session',
      () => {
        const service =
          new AiConversationSessionService();

        const session =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        const archived =
          service.archiveSession({
            tenantId:
              'tenant-a',
            sessionId:
              session.sessionId,
            expectedVersion:
              1,
          });

        expect(
          archived.status,
        ).toBe(
          'ARCHIVED',
        );

        expect(
          archived.version,
        ).toBe(
          2,
        );

        expect(
          archived.archivedAt,
        ).toEqual(
          expect.any(String),
        );
      },
    );

    it(
      'makes archival idempotent at the current version',
      () => {
        const service =
          new AiConversationSessionService();

        const session =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        const first =
          service.archiveSession({
            tenantId:
              'tenant-a',
            sessionId:
              session.sessionId,
            expectedVersion:
              1,
          });

        const second =
          service.archiveSession({
            tenantId:
              'tenant-a',
            sessionId:
              session.sessionId,
            expectedVersion:
              first.version,
          });

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'rejects messages after archival',
      () => {
        const service =
          new AiConversationSessionService();

        const session =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        const archived =
          service.archiveSession({
            tenantId:
              'tenant-a',
            sessionId:
              session.sessionId,
            expectedVersion:
              1,
          });

        expect(
          () =>
            service.appendMessage({
              tenantId:
                'tenant-a',
              sessionId:
                session.sessionId,
              expectedVersion:
                archived.version,
              message: {
                role:
                  'USER',
                content:
                  'Late message',
              },
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONVERSATION_SESSION_ARCHIVED',
          }),
        );
      },
    );

    it(
      'returns only the requested context tail',
      () => {
        const service =
          new AiConversationSessionService();

        let session =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        for (
          const content of [
            'one',
            'two',
            'three',
          ]
        ) {
          session =
            service.appendMessage({
              tenantId:
                'tenant-a',
              sessionId:
                session.sessionId,
              expectedVersion:
                session.version,
              message: {
                role:
                  'USER',
                content,
              },
            });
        }

        const context =
          service.getContextWindow(
            'tenant-a',
            session.sessionId,
            2,
          );

        expect(
          context.messages.map(
            message =>
              message.content,
          ),
        ).toEqual([
          'two',
          'three',
        ]);
      },
    );

    it(
      'lists sessions only for the requested tenant',
      () => {
        const service =
          new AiConversationSessionService();

        service.createSession({
          tenantId:
            'tenant-a',
        });

        service.createSession({
          tenantId:
            'tenant-a',
        });

        service.createSession({
          tenantId:
            'tenant-b',
        });

        expect(
          service.listSessions(
            'tenant-a',
          ),
        ).toHaveLength(
          2,
        );
      },
    );

    it(
      'enforces the maximum message limit',
      () => {
        const service =
          new AiConversationSessionService({
            maximumMessagesPerSession:
              1,
          });

        let session =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        session =
          service.appendMessage({
            tenantId:
              'tenant-a',
            sessionId:
              session.sessionId,
            expectedVersion:
              session.version,
            message: {
              role:
                'USER',
              content:
                'one',
            },
          });

        expect(
          () =>
            service.appendMessage({
              tenantId:
                'tenant-a',
              sessionId:
                session.sessionId,
              expectedVersion:
                session.version,
              message: {
                role:
                  'USER',
                content:
                  'two',
              },
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONVERSATION_SESSION_LIMIT_EXCEEDED',
          }),
        );
      },
    );

    it(
      'enforces the maximum content length',
      () => {
        const service =
          new AiConversationSessionService({
            maximumContentLength:
              5,
          });

        const session =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        expect(
          () =>
            service.appendMessage({
              tenantId:
                'tenant-a',
              sessionId:
                session.sessionId,
              expectedVersion:
                1,
              message: {
                role:
                  'USER',
                content:
                  '123456',
              },
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONVERSATION_MESSAGE_TOO_LARGE',
          }),
        );
      },
    );

    it(
      'preserves message metadata',
      () => {
        const service =
          new AiConversationSessionService();

        const session =
          service.createSession({
            tenantId:
              'tenant-a',
            initialMessages: [
              {
                role:
                  'TOOL',
                content:
                  'Tool result',
                metadata: {
                  toolName:
                    'search',
                },
              },
            ],
          });

        expect(
          session.messages[0].metadata,
        ).toEqual({
          toolName:
            'search',
        });
      },
    );

    it(
      'returns immutable session copies',
      () => {
        const service =
          new AiConversationSessionService();

        const created =
          service.createSession({
            tenantId:
              'tenant-a',
            initialMessages: [
              {
                role:
                  'USER',
                content:
                  'Original',
                metadata: {
                  source:
                    'test',
                },
              },
            ],
          });

        (
          created.messages as unknown as
            Array<{
              content:
                string;
              metadata:
                Record<
                  string,
                  string
                >;
            }>
        )[0].content =
          'Modified';

        (
          created.messages[0]
            .metadata as
            Record<
              string,
              string
            >
        ).source =
          'changed';

        const stored =
          service.getSession(
            'tenant-a',
            created.sessionId,
          );

        expect(
          stored.messages[0].content,
        ).toBe(
          'Original',
        );

        expect(
          stored.messages[0].metadata,
        ).toEqual({
          source:
            'test',
        });
      },
    );

    it(
      'rejects invalid context-window size',
      () => {
        const service =
          new AiConversationSessionService();

        const session =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        expect(
          () =>
            service.getContextWindow(
              'tenant-a',
              session.sessionId,
              0,
            ),
        ).toThrow(
          'Maximum context messages must be a positive integer',
        );
      },
    );

    it(
      'rejects an empty tenant ID',
      () => {
        const service =
          new AiConversationSessionService();

        expect(
          () =>
            service.createSession({
              tenantId:
                ' ',
            }),
        ).toThrow(
          'Tenant ID is required',
        );
      },
    );

    it(
      'rejects empty message content',
      () => {
        const service =
          new AiConversationSessionService();

        const session =
          service.createSession({
            tenantId:
              'tenant-a',
          });

        expect(
          () =>
            service.appendMessage({
              tenantId:
                'tenant-a',
              sessionId:
                session.sessionId,
              expectedVersion:
                1,
              message: {
                role:
                  'USER',
                content:
                  ' ',
              },
            }),
        ).toThrow(
          'Conversation message content is required',
        );
      },
    );

    it.each([
      0,
      1.5,
      10_001,
    ])(
      'rejects invalid maximum-message configuration %s',
      value => {
        expect(
          () =>
            new AiConversationSessionService({
              maximumMessagesPerSession:
                value,
            }),
        ).toThrow(
          'Maximum messages per session must be an integer between 1 and 10000',
        );
      },
    );

    it.each([
      0,
      1.5,
      1_000_001,
    ])(
      'rejects invalid content-length configuration %s',
      value => {
        expect(
          () =>
            new AiConversationSessionService({
              maximumContentLength:
                value,
            }),
        ).toThrow(
          'Maximum content length must be an integer between 1 and 1000000',
        );
      },
    );

    it(
      'uses structured conversation errors',
      () => {
        const error =
          new AiConversationSessionError(
            'AI_CONVERSATION_SESSION_NOT_FOUND',
            'Missing session',
          );

        expect(
          error.code,
        ).toBe(
          'AI_CONVERSATION_SESSION_NOT_FOUND',
        );

        expect(
          error.name,
        ).toBe(
          'AiConversationSessionError',
        );
      },
    );
  },
);
