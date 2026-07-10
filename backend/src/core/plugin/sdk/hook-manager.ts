import { Injectable } from '@nestjs/common';

export type HookHandler = (payload?: unknown) => Promise<void> | void;

@Injectable()
export class HookManager {
  private readonly hooks = new Map<string, HookHandler[]>();

  register(name: string, handler: HookHandler): void {
    const list = this.hooks.get(name) ?? [];
    list.push(handler);
    this.hooks.set(name, list);
  }

  async execute(name: string, payload?: unknown): Promise<void> {
    for (const handler of this.hooks.get(name) ?? []) {
      await handler(payload);
    }
  }
}
