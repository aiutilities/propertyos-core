export class SubmitFormDto {
  values!: Record<string, unknown>;
  submittedByPersonId?: string;
  subjectType?: string;
  subjectId?: string;
  propertyId?: string;
  spaceId?: string;
  context?: Record<string, unknown>;
}
