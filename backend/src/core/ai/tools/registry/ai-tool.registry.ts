import { Injectable } from "@nestjs/common";

import { AiToolPort } from "../contracts/ai-tool.contract";
import {
  AiToolDuplicateRegistrationError,
  AiToolNotFoundError,
} from "../errors/ai-tool.error";
import { AiToolManifestValidator } from "../manifest/ai-tool-manifest.validator";

@Injectable()
export class AiToolRegistry {
  private readonly tools = new Map<string, AiToolPort>();

  constructor(private readonly manifestValidator: AiToolManifestValidator) {}

  register(tool: AiToolPort): void {
    this.manifestValidator.validate(tool.manifest);

    const toolId = tool.manifest.id;

    if (this.tools.has(toolId)) {
      throw new AiToolDuplicateRegistrationError(toolId);
    }

    this.tools.set(toolId, tool);
  }

  unregister(toolId: string): boolean {
    return this.tools.delete(toolId);
  }

  has(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  get(toolId: string): AiToolPort {
    const tool = this.tools.get(toolId);

    if (!tool) {
      throw new AiToolNotFoundError(toolId);
    }

    return tool;
  }

  list(): readonly AiToolPort[] {
    return [...this.tools.values()].sort((left, right) =>
      left.manifest.id.localeCompare(right.manifest.id),
    );
  }

  clear(): void {
    this.tools.clear();
  }

  get size(): number {
    return this.tools.size;
  }
}
