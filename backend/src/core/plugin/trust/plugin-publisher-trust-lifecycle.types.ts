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
