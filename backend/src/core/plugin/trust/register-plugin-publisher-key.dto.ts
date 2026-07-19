export class RegisterPluginPublisherKeyDto {
  keyId!: string;
  publicKeyPem!: string;
  validFrom?: string;
  validUntil?: string;
  metadata?: Record<string, unknown>;
}
