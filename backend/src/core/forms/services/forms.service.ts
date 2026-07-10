import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { CreateFormDto } from '../dto/create-form.dto';
import { SubmitFormDto } from '../dto/submit-form.dto';
import {
  FORM_REPOSITORY,
  FormRepositoryPort,
} from '../repositories/form-repository.interface';
import {
  FormDefinition,
  FormField,
  FormStatus,
  FormValidationResult,
} from '../types/forms.types';

@Injectable()
export class FormsService {
  private readonly source = 'core.forms';

  constructor(
    @Inject(FORM_REPOSITORY)
    private readonly formRepository: FormRepositoryPort,
    private readonly eventBus: EventBusService,
  ) {}

  async create(dto: CreateFormDto): Promise<FormDefinition> {
    const validation = this.validateDefinition(dto.form);

    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid form definition',
        errors: validation.errors,
      });
    }

    const form = await this.formRepository.createForm({
      ...dto.form,
      status: dto.form.status ?? 'ACTIVE',
      version: dto.form.version ?? 1,
      metadata: dto.form.metadata ?? {},
    });

    await this.eventBus.publish('form.created', this.source, {
      id: form.id,
      code: form.code,
      name: form.name,
      status: form.status,
      version: form.version,
    });

    return form;
  }

  list(filters?: { status?: FormStatus; code?: string }): Promise<FormDefinition[]> {
    return this.formRepository.listForms(filters);
  }

  async get(id: string): Promise<FormDefinition> {
    const form = await this.formRepository.findFormById(id);

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }

  async getByCode(code: string): Promise<FormDefinition> {
    const form = await this.formRepository.findFormByCode(code);

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }

  async updateStatus(id: string, status: FormStatus): Promise<FormDefinition> {
    const form = await this.formRepository.updateFormStatus(id, status);

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    await this.eventBus.publish('form.status_changed', this.source, {
      id: form.id,
      status: form.status,
    });

    return form;
  }

  async submit(formId: string, dto: SubmitFormDto) {
    const form = await this.get(formId);

    if (form.status && form.status !== 'ACTIVE') {
      throw new BadRequestException('Form is not active');
    }

    const validation = this.validateSubmission(form, dto.values ?? {});

    if (!validation.valid) {
      await this.eventBus.publish('form.submission_rejected', this.source, {
        formId,
        errors: validation.errors,
      });

      throw new BadRequestException({
        message: 'Invalid form submission',
        errors: validation.errors,
      });
    }

    const submission = await this.formRepository.createSubmission({
      formId,
      values: dto.values ?? {},
      submittedByPersonId: dto.submittedByPersonId,
      subjectType: dto.subjectType,
      subjectId: dto.subjectId,
      propertyId: dto.propertyId,
      spaceId: dto.spaceId,
      context: dto.context ?? {},
    });

    await this.eventBus.publish('form.submitted', this.source, {
      formId,
      submissionId: submission.id,
      subjectType: submission.subjectType,
      subjectId: submission.subjectId,
      propertyId: submission.propertyId,
    });

    return submission;
  }

  listSubmissions(formId: string) {
    return this.formRepository.listSubmissions(formId);
  }

  private validateDefinition(form: FormDefinition): FormValidationResult {
    const errors: string[] = [];

    if (!form) {
      return { valid: false, errors: ['FORM_REQUIRED'] };
    }

    if (!form.id || !form.id.trim()) {
      errors.push('FORM_ID_REQUIRED');
    }

    if (!form.name || !form.name.trim()) {
      errors.push('FORM_NAME_REQUIRED');
    }

    if (!Array.isArray(form.fields) || form.fields.length === 0) {
      errors.push('FORM_FIELDS_REQUIRED');
    }

    const fieldNames = new Set<string>();

    for (const field of form.fields ?? []) {
      this.validateFieldDefinition(field, errors);

      if (field.name) {
        if (fieldNames.has(field.name)) {
          errors.push(`DUPLICATE_FIELD:${field.name}`);
        }

        fieldNames.add(field.name);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private validateFieldDefinition(field: FormField, errors: string[]): void {
    if (!field.id || !field.id.trim()) {
      errors.push('FIELD_ID_REQUIRED');
    }

    if (!field.name || !field.name.trim()) {
      errors.push('FIELD_NAME_REQUIRED');
    }

    if (!field.label || !field.label.trim()) {
      errors.push(`FIELD_LABEL_REQUIRED:${field.name ?? 'unknown'}`);
    }

    if (!field.type) {
      errors.push(`FIELD_TYPE_REQUIRED:${field.name ?? 'unknown'}`);
    }

    if (field.type === 'SELECT' && (!Array.isArray(field.options) || field.options.length === 0)) {
      errors.push(`SELECT_OPTIONS_REQUIRED:${field.name}`);
    }
  }

  private validateSubmission(
    form: FormDefinition,
    values: Record<string, unknown>,
  ): FormValidationResult {
    const errors: string[] = [];

    for (const field of form.fields) {
      const value = values[field.name];

      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`REQUIRED:${field.name}`);
        continue;
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (field.type === 'NUMBER' && typeof value !== 'number') {
        errors.push(`INVALID_NUMBER:${field.name}`);
      }

      if (field.type === 'BOOLEAN' && typeof value !== 'boolean') {
        errors.push(`INVALID_BOOLEAN:${field.name}`);
      }

      if (field.type === 'EMAIL' && (typeof value !== 'string' || !value.includes('@'))) {
        errors.push(`INVALID_EMAIL:${field.name}`);
      }

      if (field.type === 'SELECT' && field.options && !field.options.includes(String(value))) {
        errors.push(`INVALID_OPTION:${field.name}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
