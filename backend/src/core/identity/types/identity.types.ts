export type PersonStatus = 'ACTIVE' | 'INACTIVE';

export type CredentialType =
  | 'EMAIL'
  | 'PHONE'
  | 'USERNAME'
  | 'ACCESS_CARD'
  | 'QR_CODE';

export interface Person {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  status: PersonStatus;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Permission {
  id: string;
  key: string;
  description?: string;
  createdAt: Date;
}

export interface Credential {
  id: string;
  personId: string;
  type: CredentialType;
  value: string;
  createdAt: Date;
}
