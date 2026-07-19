export type PluginPublisherTargetStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED';

export interface TransitionPluginPublisher {
  publisherId: string;
  targetStatus: PluginPublisherTargetStatus;
  actorId: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface PluginPublisherTransitionResult {
  publisherId: string;
  fromStatus:
    PluginPublisherTargetStatus;
  status:
    PluginPublisherTargetStatus;
  quarantinedPublicationIds: string[];
  quarantinedPublicationCount: number;
  revokedKeyIds: string[];
  revokedKeyCount: number;
}

export interface RegisterPluginPublisher {
  publisherId: string;
  displayName: string;
  actorId: string;
  metadata?: Record<string, unknown>;
}

export interface RegisteredPluginPublisher {
  publisherId: string;
  displayName: string;
  status: 'ACTIVE';
}

export interface RegisterPluginPublisherKey {
  publisherId: string;
  keyId: string;
  publicKeyPem: string;
  actorId: string;
  validFrom?: Date;
  validUntil?: Date;
  metadata?: Record<string, unknown>;
}

export interface RegisteredPluginPublisherKey {
  publisherId: string;
  keyId: string;
  algorithm: 'RSA-SHA256';
  publicKeyPem: string;
  fingerprintSha256: string;
  modulusLength: number;
  status: 'ACTIVE';
  validFrom: Date;
  validUntil?: Date;
}

export interface RevokePluginPublisherKey {
  publisherId: string;
  keyId: string;
  actorId: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface PluginPublisherKeyRevocationResult {
  publisherId: string;
  keyId: string;
  status: 'REVOKED';
  quarantinedPublicationIds: string[];
  quarantinedPublicationCount: number;
}
