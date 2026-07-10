import { Credential, CredentialStatus, CredentialUsage } from '../types/credential.types';

export const CREDENTIAL_REPOSITORY = Symbol('CREDENTIAL_REPOSITORY');

export interface CredentialRepositoryPort {
  createCredential(
    input: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Credential>;

  findById(id: string): Promise<Credential | undefined>;

  findByTokenHash(tokenHash: string): Promise<Credential | undefined>;

  listCredentials(filters?: {
    subjectType?: string;
    subjectId?: string;
    propertyId?: string;
    status?: CredentialStatus;
  }): Promise<Credential[]>;

  updateStatus(id: string, status: CredentialStatus): Promise<Credential | undefined>;

  incrementUseCount(id: string): Promise<Credential | undefined>;

  recordUsage(
    input: Omit<CredentialUsage, 'id' | 'usedAt'>,
  ): Promise<CredentialUsage>;

  listUsage(credentialId: string): Promise<CredentialUsage[]>;
}
