export type FormFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'EMAIL'
  | 'PHONE'
  | 'DATE'
  | 'BOOLEAN'
  | 'SELECT';

export type FormStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  metadata?: Record<string, unknown>;
}

export interface FormDefinition {
  id: string;
  code?: string;
  name: string;
  description?: string;
  version?: number;
  status?: FormStatus;
  fields: FormField[];
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FormSubmission {
  id: string;
  formId: string;
  values: Record<string, unknown>;
  submittedByPersonId?: string;
  subjectType?: string;
  subjectId?: string;
  propertyId?: string;
  spaceId?: string;
  context: Record<string, unknown>;
  submittedAt: Date;
}

export interface FormValidationResult {
  valid: boolean;
  errors: string[];
}
