import { Injectable } from '@nestjs/common';
import { FormDefinition } from '../types/forms.types';

@Injectable()
export class FormRegistry {
  private readonly forms = new Map<string, FormDefinition>();

  register(form: FormDefinition): void {
    this.forms.set(form.id, form);
  }

  list(): FormDefinition[] {
    return [...this.forms.values()];
  }

  get(id: string): FormDefinition | undefined {
    return this.forms.get(id);
  }
}
