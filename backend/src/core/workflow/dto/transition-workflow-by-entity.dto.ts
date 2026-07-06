export class TransitionWorkflowByEntityDto {
  entityType!: string;
  entityId!: string;
  actionCode!: string;
  actorId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}
