import { Injectable } from "@nestjs/common";
import semver from "semver";

import {
  AiPromptConflictingVersionError,
  AiPromptCoreOwnershipConflictError,
  AiPromptDeprecatedVersionError,
  AiPromptNoActiveVersionError,
  AiPromptNotFoundError,
  AiPromptVersionNotFoundError,
} from "../errors/ai-prompt.error";
import { AiPromptManifestValidator } from "../manifest/ai-prompt-manifest.validator";
import {
  AiPromptListFilters,
  AiPromptManifest,
} from "../types/ai-prompt.types";

@Injectable()
export class AiPromptRegistry {
  private readonly prompts = new Map<string, Map<string, AiPromptManifest>>();

  constructor(private readonly manifestValidator: AiPromptManifestValidator) {}

  register(manifest: AiPromptManifest): void {
    this.manifestValidator.validate(manifest);
    const versions = this.prompts.get(manifest.id);

    if (versions) {
      const existingVersions = [...versions.values()];
      if (
        manifest.scope === "plugin" &&
        existingVersions.some((item) => item.scope === "core")
      ) {
        throw new AiPromptCoreOwnershipConflictError(manifest.id);
      }
      const existing = versions.get(manifest.version);
      if (existing) {
        if (this.canonical(existing) === this.canonical(manifest)) return;
        throw new AiPromptConflictingVersionError(manifest.id, manifest.version);
      }
    }

    const nextVersions = versions ?? new Map<string, AiPromptManifest>();
    nextVersions.set(manifest.version, this.clone(manifest));
    this.prompts.set(manifest.id, nextVersions);
  }

  has(promptId: string, version: string): boolean {
    return this.prompts.get(promptId)?.has(version) ?? false;
  }

  get(promptId: string, version: string): AiPromptManifest {
    const versions = this.prompts.get(promptId);
    if (!versions) throw new AiPromptNotFoundError(promptId);
    const manifest = versions.get(version);
    if (!manifest) throw new AiPromptVersionNotFoundError(promptId, version);
    return this.clone(manifest);
  }

  resolve(promptId: string, version?: string): AiPromptManifest {
    const versions = this.prompts.get(promptId);
    if (!versions) throw new AiPromptNotFoundError(promptId);

    if (version) {
      const manifest = versions.get(version);
      if (!manifest) throw new AiPromptVersionNotFoundError(promptId, version);
      if (manifest.status === "deprecated") {
        throw new AiPromptDeprecatedVersionError(promptId, version);
      }
      return this.clone(manifest);
    }

    const active = [...versions.values()]
      .filter((manifest) => manifest.status === "active")
      .sort((left, right) => semver.rcompare(left.version, right.version));
    if (active.length === 0) throw new AiPromptNoActiveVersionError(promptId);
    return this.clone(active[0]);
  }

  list(filters: AiPromptListFilters = {}): readonly AiPromptManifest[] {
    return [...this.prompts.values()]
      .flatMap((versions) => [...versions.values()])
      .filter((manifest) => !filters.id || manifest.id === filters.id)
      .filter((manifest) => !filters.version || manifest.version === filters.version)
      .filter((manifest) => !filters.scope || manifest.scope === filters.scope)
      .filter((manifest) => !filters.status || manifest.status === filters.status)
      .sort((left, right) => {
        const byId = left.id.localeCompare(right.id);
        return byId !== 0 ? byId : semver.compare(left.version, right.version);
      })
      .map((manifest) => this.clone(manifest));
  }

  deprecate(promptId: string, version: string): AiPromptManifest {
    const current = this.get(promptId, version);
    const deprecated = { ...current, status: "deprecated" as const };
    this.prompts.get(promptId)!.set(version, this.clone(deprecated));
    return this.clone(deprecated);
  }

  clear(): void {
    this.prompts.clear();
  }

  get size(): number {
    return this.list().length;
  }

  private clone(manifest: AiPromptManifest): AiPromptManifest {
    return JSON.parse(JSON.stringify(manifest)) as AiPromptManifest;
  }

  private canonical(manifest: AiPromptManifest): string {
    return JSON.stringify(manifest);
  }
}
