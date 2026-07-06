export class ValidateCredentialDto {
  token!: string;
  credentialType?: string;
  subjectType?: string;
  propertyId?: string;
  spaceId?: string;
  context?: Record<string, unknown>;
}
