import { CredentialType } from '../types/credential.types';

export class IssueCredentialDto {
  credentialType!: CredentialType;
  subjectType!: string;
  subjectId!: string;
  issuedToPersonId?: string;
  issuedByPersonId?: string;
  propertyId?: string;
  spaceId?: string;
  displayValue?: string;
  token?: string;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  metadata?: Record<string, unknown>;
}
