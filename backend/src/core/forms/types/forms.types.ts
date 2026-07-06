export type FormFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'EMAIL'
  | 'PHONE'
  | 'DATE'
  | 'BOOLEAN'
  | 'SELECT';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormDefinition {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
}

export interface FormSubmission {
  formId: string;
  values: Record<string, unknown>;
  submittedAt: Date;
}
