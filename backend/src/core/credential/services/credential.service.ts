import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { IssueCredentialDto } from '../dto/issue-credential.dto';
import { ValidateCredentialDto } from '../dto/validate-credential.dto';
import { RevokeCredentialDto } from '../dto/revoke-credential.dto';
import {
  CREDENTIAL_REPOSITORY,
  CredentialRepositoryPort,
} from '../repositories/credential-repository.interface';
import { Credential, CredentialStatus, CredentialValidationResult } from '../types/credential.types';

@Injectable()
export class CredentialService {
  private readonly eventSource = 'core.credential';

  constructor(
    @Inject(CREDENTIAL_REPOSITORY)
    private readonly credentialRepository: CredentialRepositoryPort,
    private readonly eventBus: EventBusService,
  ) {}

  async issueCredential(dto: IssueCredentialDto): Promise<Credential> {
    const token = dto.token ?? this.generateToken();
    const credential = await this.credentialRepository.createCredential({
      credentialType: dto.credentialType,
      subjectType: dto.subjectType,
      subjectId: dto.subjectId,
      issuedToPersonId: dto.issuedToPersonId,
      issuedByPersonId: dto.issuedByPersonId,
      propertyId: dto.propertyId,
      spaceId: dto.spaceId,
      tokenHash: this.hashToken(token),
      displayValue: dto.displayValue ?? token,
      status: 'ACTIVE',
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      maxUses: dto.maxUses,
      useCount: 0,
      metadata: dto.metadata ?? {},
    });

    await this.eventBus.publish('credential.issued', this.eventSource, {
      credentialId: credential.id,
      credentialType: credential.credentialType,
      subjectType: credential.subjectType,
      subjectId: credential.subjectId,
      propertyId: credential.propertyId,
    });

    return credential;
  }

  async validateCredential(dto: ValidateCredentialDto): Promise<CredentialValidationResult> {
    const credential = await this.credentialRepository.findByTokenHash(
      this.hashToken(dto.token),
    );

    if (!credential) {
      await this.publishValidationFailure('CREDENTIAL_NOT_FOUND', dto);
      return { valid: false, reason: 'CREDENTIAL_NOT_FOUND' };
    }

    if (dto.credentialType && credential.credentialType !== dto.credentialType) {
      await this.publishValidationFailure('CREDENTIAL_TYPE_MISMATCH', dto, credential);
      return { valid: false, reason: 'CREDENTIAL_TYPE_MISMATCH', credential };
    }

    if (dto.subjectType && credential.subjectType !== dto.subjectType) {
      await this.publishValidationFailure('SUBJECT_TYPE_MISMATCH', dto, credential);
      return { valid: false, reason: 'SUBJECT_TYPE_MISMATCH', credential };
    }

    if (dto.propertyId && credential.propertyId && credential.propertyId !== dto.propertyId) {
      await this.publishValidationFailure('PROPERTY_MISMATCH', dto, credential);
      return { valid: false, reason: 'PROPERTY_MISMATCH', credential };
    }

    const now = new Date();

    if (credential.status !== 'ACTIVE') {
      await this.publishValidationFailure('CREDENTIAL_NOT_ACTIVE', dto, credential);
      return { valid: false, reason: 'CREDENTIAL_NOT_ACTIVE', credential };
    }

    if (credential.validFrom && credential.validFrom > now) {
      await this.publishValidationFailure('CREDENTIAL_NOT_YET_VALID', dto, credential);
      return { valid: false, reason: 'CREDENTIAL_NOT_YET_VALID', credential };
    }

    if (credential.validUntil && credential.validUntil < now) {
      await this.credentialRepository.updateStatus(credential.id, 'EXPIRED');
      await this.publishValidationFailure('CREDENTIAL_EXPIRED', dto, credential);
      return { valid: false, reason: 'CREDENTIAL_EXPIRED', credential };
    }

    if (
      typeof credential.maxUses === 'number' &&
      credential.useCount >= credential.maxUses
    ) {
      await this.credentialRepository.updateStatus(credential.id, 'USED');
      await this.publishValidationFailure('CREDENTIAL_USAGE_LIMIT_REACHED', dto, credential);
      return {
        valid: false,
        reason: 'CREDENTIAL_USAGE_LIMIT_REACHED',
        credential,
      };
    }

    await this.credentialRepository.recordUsage({
      credentialId: credential.id,
      propertyId: dto.propertyId ?? credential.propertyId,
      spaceId: dto.spaceId ?? credential.spaceId,
      context: dto.context ?? {},
    });

    const updatedCredential = await this.credentialRepository.incrementUseCount(
      credential.id,
    );

    await this.eventBus.publish('credential.validated', this.eventSource, {
      credentialId: credential.id,
      credentialType: credential.credentialType,
      subjectType: credential.subjectType,
      subjectId: credential.subjectId,
      propertyId: dto.propertyId ?? credential.propertyId,
    });

    return {
      valid: true,
      credential: updatedCredential ?? credential,
    };
  }

  async revokeCredential(
    id: string,
    dto: RevokeCredentialDto,
  ): Promise<Credential | undefined> {
    const credential = await this.credentialRepository.updateStatus(id, 'REVOKED');

    if (credential) {
      await this.eventBus.publish('credential.revoked', this.eventSource, {
        credentialId: credential.id,
        reason: dto.reason,
        revokedByPersonId: dto.revokedByPersonId,
      });
    }

    return credential;
  }

  listCredentials(filters?: {
    subjectType?: string;
    subjectId?: string;
    propertyId?: string;
    status?: CredentialStatus;
  }): Promise<Credential[]> {
    return this.credentialRepository.listCredentials(filters);
  }

  getCredential(id: string): Promise<Credential | undefined> {
    return this.credentialRepository.findById(id);
  }

  listUsage(id: string) {
    return this.credentialRepository.listUsage(id);
  }

  private generateToken(): string {
    return randomBytes(24).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async publishValidationFailure(
    reason: string,
    dto: ValidateCredentialDto,
    credential?: Credential,
  ): Promise<void> {
    await this.eventBus.publish('credential.validation_failed', this.eventSource, {
      reason,
      credentialId: credential?.id,
      credentialType: credential?.credentialType ?? dto.credentialType,
      subjectType: credential?.subjectType ?? dto.subjectType,
      propertyId: dto.propertyId,
    });
  }
}
