import { Injectable } from '@nestjs/common';

@Injectable()
export class ExtensionRegistry {
  private readonly extensions = new Map<string, unknown[]>();

  register(extensionPoint: string, extension: unknown): void {
    const list = this.extensions.get(extensionPoint) ?? [];
    list.push(extension);
    this.extensions.set(extensionPoint, list);
  }

  resolve(extensionPoint: string): unknown[] {
    return this.extensions.get(extensionPoint) ?? [];
  }
}
