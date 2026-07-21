import {
  Injectable,
} from '@nestjs/common';
import {
  DiscoveryService,
} from '@nestjs/core';
import {
  AiProviderPort,
} from '../contracts/ai-provider.contract';
import {
  AiProviderManifest,
} from '../manifest/ai-provider-manifest';
import {
  validateAiProviderManifest,
} from '../manifest/ai-provider-manifest.validator';

export type AiProviderDiscoveryStatus =
  | 'DISCOVERED'
  | 'REJECTED';

export interface AiProviderDiscoveryCandidate {
  providerName: string;
  providerId?: string;
  status: AiProviderDiscoveryStatus;
  provider?: AiProviderPort;
  manifest?: AiProviderManifest;
  reasons: string[];
}

export interface AiProviderDiscoveryReport {
  discoveredProviderNames: string[];
  rejectedProviderNames: string[];
  candidates:
    AiProviderDiscoveryCandidate[];
}

interface ProviderWrapperLike {
  instance?: unknown;
}

@Injectable()
export class AiProviderDiscoveryService {
  constructor(
    private readonly discovery:
      DiscoveryService,
  ) {}

  discover(): AiProviderDiscoveryReport {
    const candidates =
      this.discovery
        .getProviders()
        .map(
          (wrapper) =>
            this.inspect(
              (
                wrapper as
                  ProviderWrapperLike
              ).instance,
            ),
        )
        .filter(
          (
            candidate,
          ): candidate is
            AiProviderDiscoveryCandidate =>
            candidate !== undefined,
        );

    return this.buildReport(
      this.rejectDuplicates(
        candidates,
      ),
    );
  }

  private inspect(
    instance: unknown,
  ):
    | AiProviderDiscoveryCandidate
    | undefined {
    if (
      !this.isPotentialProvider(
        instance,
      )
    ) {
      return undefined;
    }

    const providerName =
      this.resolveProviderName(
        instance,
      );

    const validation =
      validateAiProviderManifest(
        instance.manifest,
      );

    const reasons = [
      ...validation.errors,
    ];

    if (
      validation.valid &&
      validation.compatible &&
      validation.manifest
    ) {
      reasons.push(
        ...this.validateContractAlignment(
          instance,
          validation.manifest,
        ),
      );
    }

    if (
      !validation.valid ||
      !validation.compatible ||
      !validation.manifest ||
      reasons.length > 0
    ) {
      return {
        providerName,
        providerId:
          validation.manifest
            ?.provider.id,
        status: 'REJECTED',
        reasons,
      };
    }

    return {
      providerName,
      providerId:
        validation.manifest
          .provider.id,
      status: 'DISCOVERED',
      provider: instance,
      manifest:
        validation.manifest,
      reasons: [],
    };
  }

  private isPotentialProvider(
    value: unknown,
  ): value is AiProviderPort {
    if (
      !value ||
      typeof value !== 'object'
    ) {
      return false;
    }

    const candidate =
      value as Partial<
        AiProviderPort
      >;

    return (
      typeof candidate.name ===
        'string' &&
      typeof candidate.displayName ===
        'string' &&
      Array.isArray(
        candidate.capabilities,
      ) &&
      typeof candidate.getProvider ===
        'function' &&
      typeof candidate.generate ===
        'function' &&
      candidate.manifest !==
        undefined
    );
  }

  private resolveProviderName(
    provider: AiProviderPort,
  ): string {
    return (
      provider.name?.trim() ||
      provider.manifest
        ?.provider
        ?.name
        ?.trim() ||
      '<unknown>'
    );
  }

  private validateContractAlignment(
    provider: AiProviderPort,
    manifest: AiProviderManifest,
  ): string[] {
    const errors: string[] = [];

    if (
      manifest.provider.name !==
      provider.name
    ) {
      errors.push(
        `AI provider name does not match manifest: ` +
        `${provider.name} != ` +
        `${manifest.provider.name}`,
      );
    }

    if (
      manifest.provider.displayName !==
      provider.displayName
    ) {
      errors.push(
        `AI provider displayName does not match manifest: ` +
        `${provider.displayName} != ` +
        `${manifest.provider.displayName}`,
      );
    }

    const providerCapabilities = [
      ...provider.capabilities,
    ].sort();

    const manifestCapabilities = [
      ...manifest.capabilities,
    ].sort();

    if (
      providerCapabilities.length !==
        manifestCapabilities.length ||
      providerCapabilities.some(
        (capability, index) =>
          capability !==
          manifestCapabilities[
            index
          ],
      )
    ) {
      errors.push(
        'AI provider capabilities do not match manifest',
      );
    }

    const descriptor =
      provider.getProvider();

    if (
      descriptor.name !==
      provider.name
    ) {
      errors.push(
        `AI provider descriptor name does not match contract: ` +
        `${descriptor.name} != ` +
        `${provider.name}`,
      );
    }

    if (
      descriptor.displayName !==
      provider.displayName
    ) {
      errors.push(
        'AI provider descriptor displayName does not match contract',
      );
    }

    if (
      descriptor.defaultModel &&
      !manifest.models.some(
        (model) =>
          model.id ===
          descriptor.defaultModel,
      )
    ) {
      errors.push(
        `AI provider default model is not declared in manifest: ` +
        `${descriptor.defaultModel}`,
      );
    }

    return errors;
  }

  private rejectDuplicates(
    candidates:
      AiProviderDiscoveryCandidate[],
  ):
    AiProviderDiscoveryCandidate[] {
    const discoveredByName =
      new Map<
        string,
        AiProviderDiscoveryCandidate[]
      >();

    for (
      const candidate of candidates
    ) {
      if (
        candidate.status !==
        'DISCOVERED'
      ) {
        continue;
      }

      const existing =
        discoveredByName.get(
          candidate.providerName,
        ) ?? [];

      existing.push(
        candidate,
      );

      discoveredByName.set(
        candidate.providerName,
        existing,
      );
    }

    const duplicateNames =
      new Set(
        Array.from(
          discoveredByName.entries(),
        )
          .filter(
            ([, values]) =>
              values.length > 1,
          )
          .map(
            ([name]) => name,
          ),
      );

    return candidates.map(
      (candidate) => {
        if (
          candidate.status !==
            'DISCOVERED' ||
          !duplicateNames.has(
            candidate.providerName,
          )
        ) {
          return candidate;
        }

        return {
          providerName:
            candidate.providerName,
          providerId:
            candidate.providerId,
          status: 'REJECTED',
          reasons: [
            `Duplicate AI provider name discovered: ` +
              `${candidate.providerName}`,
          ],
        };
      },
    );
  }

  private buildReport(
    candidates:
      AiProviderDiscoveryCandidate[],
  ): AiProviderDiscoveryReport {
    const ordered = [
      ...candidates,
    ].sort(
      (left, right) =>
        left.providerName.localeCompare(
          right.providerName,
        ) ||
        left.status.localeCompare(
          right.status,
        ) ||
        (
          left.providerId ??
          ''
        ).localeCompare(
          right.providerId ??
          '',
        ),
    );

    return {
      discoveredProviderNames:
        ordered
          .filter(
            (candidate) =>
              candidate.status ===
              'DISCOVERED',
          )
          .map(
            (candidate) =>
              candidate.providerName,
          ),
      rejectedProviderNames:
        Array.from(
          new Set(
            ordered
              .filter(
                (candidate) =>
                  candidate.status ===
                  'REJECTED',
              )
              .map(
                (candidate) =>
                  candidate.providerName,
              ),
          ),
        ),
      candidates: ordered,
    };
  }
}
