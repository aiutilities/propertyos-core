export type CredentialType =
  | 'QR_CODE'
  | 'RFID'
  | 'NFC'
  | 'PIN'
  | 'TEMPORARY_ACCESS';

export type CredentialStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'REVOKED'
  | 'USED';

export interface Credential {
  id: string;
  credentialType: CredentialType;
  subjectType: string;
  subjectId: string;
  issuedToPersonId?: string;
  issuedByPersonId?: string;
  propertyId?: string;
  spaceId?: string;
  tokenHash: string;
  displayValue?: string;
  status: CredentialStatus;
  validFrom?: Date;
  validUntil?: Date;
  maxUses?: number;
  useCount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CredentialValidationResult {
  valid: boolean;
  reason?: string;
  credential?: Credential;
}

export interface CredentialUsage {
  id: string;
  credentialId: string;
  usedAt: Date;
  usedByPersonId?: string;
  propertyId?: string;
  spaceId?: string;
  context: Record<string, unknown>;
}
