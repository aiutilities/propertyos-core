import {
  Injectable,
} from '@nestjs/common';

import {
  IdentityService,
} from '../../../identity/services/identity.service';
import {
  AuthTokenPayload,
} from '../../../auth/services/auth.service';
import {
  AiToolExecutionContext,
} from '../types/ai-tool.types';

export interface AiToolRuntimeContextInput {
  readonly user: AuthTokenPayload;
  readonly correlationId: string;
  readonly propertyId?: string;
  readonly conversationId?: string;
  readonly metadata?: Readonly<
    Record<string, string | number | boolean | null>
  >;
}

@Injectable()
export class AiToolRuntimeContextService {
  constructor(
    private readonly identity:
      IdentityService,
  ) {}

  async create(
    input: AiToolRuntimeContextInput,
  ): Promise<AiToolExecutionContext> {
    const actorId =
      input?.user?.sub?.trim();

    if (!actorId) {
      throw new Error(
        'Authenticated actor is required for AI tool execution',
      );
    }

    const correlationId =
      input.correlationId?.trim();

    if (!correlationId) {
      throw new Error(
        'Correlation ID is required for AI tool execution',
      );
    }

    const roles =
      await this.identity
        .listPersonRoles(actorId);

    const permissionSets =
      await Promise.all(
        roles.map(
          role =>
            this.identity
              .listRolePermissions(
                role.id,
              ),
        ),
      );

    const permissions =
      Object.freeze(
        [
          ...new Set(
            permissionSets
              .flat()
              .map(
                permission =>
                  permission.key.trim(),
              )
              .filter(Boolean),
          ),
        ].sort(),
      );

    return Object.freeze({
      actorId,
      correlationId,
      permissions,
      ...(input.propertyId?.trim()
        ? {
            propertyId:
              input.propertyId.trim(),
          }
        : {}),
      ...(input.conversationId?.trim()
        ? {
            conversationId:
              input.conversationId.trim(),
          }
        : {}),
      ...(input.metadata
        ? {
            metadata:
              Object.freeze({
                ...input.metadata,
              }),
          }
        : {}),
    });
  }
}
