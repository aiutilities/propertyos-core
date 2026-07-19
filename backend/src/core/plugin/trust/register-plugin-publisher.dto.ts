export class RegisterPluginPublisherDto {
  publisherId!: string;
  displayName!: string;
  metadata?: Record<string, unknown>;
}
