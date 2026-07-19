export class TransitionPluginPublisherDto {
  targetStatus!:
    | 'ACTIVE'
    | 'SUSPENDED'
    | 'REVOKED';
  reason!: string;
  metadata?: Record<string, unknown>;
}
