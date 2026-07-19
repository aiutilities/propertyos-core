export type PluginPublicationStatus =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'QUARANTINED'
  | 'REVOKED';

export type PluginPublicationEventType =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'QUARANTINED'
  | 'QUARANTINE_RELEASED'
  | 'REVOKED';

export interface SubmitPluginPublication {
  pluginId: string;
  pluginName: string;
  version: string;
  publisherId: string;
  keyId: string;
  artifactStorageObjectId: string;
  artifactSha256: string;
  integritySha256: string;
  actorId: string;
  metadata?: Record<string, unknown>;
}

export interface TransitionPluginPublication {
  publicationId: string;
  targetStatus:
    | 'APPROVED'
    | 'REJECTED'
    | 'QUARANTINED'
    | 'REVOKED';
  actorId: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface PluginPublication {
  id: string;
  pluginId: string;
  pluginName: string;
  version: string;
  publisherId: string;
  keyId: string;
  artifactStorageObjectId: string;
  artifactSha256: string;
  integritySha256: string;
  status: PluginPublicationStatus;
  submittedBy: string;
  submittedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  decisionReason?: string;
  quarantinedBy?: string;
  quarantinedAt?: Date;
  quarantineReason?: string;
  revokedBy?: string;
  revokedAt?: Date;
  revocationReason?: string;
  metadata: Record<string, unknown>;
  updatedAt: Date;
}

export interface PluginPublicationSecurityEvent {
  id: string;
  publicationId: string;
  eventType: PluginPublicationEventType;
  fromStatus?: PluginPublicationStatus;
  toStatus: PluginPublicationStatus;
  actorId: string;
  reason?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
