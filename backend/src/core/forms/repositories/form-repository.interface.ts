import { FormDefinition, FormStatus, FormSubmission } from '../types/forms.types';

export const FORM_REPOSITORY = Symbol('FORM_REPOSITORY');

export interface FormRepositoryPort {
  createForm(form: FormDefinition): Promise<FormDefinition>;
  listForms(filters?: { status?: FormStatus; code?: string }): Promise<FormDefinition[]>;
  findFormById(id: string): Promise<FormDefinition | undefined>;
  findFormByCode(code: string): Promise<FormDefinition | undefined>;
  updateFormStatus(id: string, status: FormStatus): Promise<FormDefinition | undefined>;
  createSubmission(
    input: Omit<FormSubmission, 'id' | 'submittedAt'>,
  ): Promise<FormSubmission>;
  listSubmissions(formId: string): Promise<FormSubmission[]>;
}
