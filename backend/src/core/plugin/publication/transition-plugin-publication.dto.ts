import {
  PluginPublicationStatus,
} from './plugin-publication-governance.types';

export class TransitionPluginPublicationDto {
  targetStatus!: Extract<
    PluginPublicationStatus,
    | 'APPROVED'
    | 'REJECTED'
    | 'QUARANTINED'
    | 'REVOKED'
  >;
  reason!: string;
  metadata?: Record<string, unknown>;
}
