export type FormStatus =
  | "DRAFT"
  | "ACTIVE"
  | "ARCHIVED"
  | string;

export type FormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "DATE"
  | "BOOLEAN"
  | "SELECT"
  | "MULTI_SELECT"
  | string;

export interface FormField {
  id?: string;
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: unknown;
  validation?: Record<string, unknown>;
  order?: number;
  metadata?: Record<string, unknown>;
}

export interface FormDefinition {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: FormStatus;
  version?: number;
  fields: FormField[];
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  values: Record<string, unknown>;
  submittedByPersonId?: string;
  submittedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface CreateFormInput {
  code: string;
  name: string;
  description?: string;
  fields: FormField[];
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SubmitFormInput {
  values: Record<string, unknown>;
  submittedByPersonId?: string;
  metadata?: Record<string, unknown>;
}
