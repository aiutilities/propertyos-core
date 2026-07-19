export type PluginSigningAlgorithm =
  'RSA-SHA256';

export interface TrustedPluginPublisherKey {
  publisherId: string;
  publisherName: string;
  keyId: string;
  algorithm: PluginSigningAlgorithm;
  publicKeyPem: string;
  fingerprintSha256: string;
  validFrom: Date;
  validUntil?: Date;
}
