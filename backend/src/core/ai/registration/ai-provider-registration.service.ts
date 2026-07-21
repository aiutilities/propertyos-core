import {
  Injectable,
} from '@nestjs/common';
import {
  AiProviderDiscoveryCandidate,
  AiProviderDiscoveryReport,
  AiProviderDiscoveryService,
} from '../discovery/ai-provider-discovery.service';
import {
  AiProviderRegistry,
} from '../registry/ai-provider.registry';

export type AiProviderRegistrationStatus =
  | 'REGISTERED'
  | 'ALREADY_REGISTERED';

export interface AiProviderRegistrationEntry {
  providerName: string;
  providerId: string;
  status: AiProviderRegistrationStatus;
}

export interface AiProviderRegistrationReport {
  discoveredProviderNames: string[];
  registeredProviderNames: string[];
  alreadyRegisteredProviderNames: string[];
  entries: AiProviderRegistrationEntry[];
}

export class AiProviderRegistrationError
  extends Error {
  readonly reasons: string[];

  constructor(
    message: string,
    reasons: readonly string[],
  ) {
    super(message);
    this.name =
      'AiProviderRegistrationError';
    this.reasons = [
      ...reasons,
    ];
  }
}

interface RegistrationPlanEntry {
  providerName: string;
  providerId: string;
  candidate:
    AiProviderDiscoveryCandidate;
  action:
    | 'REGISTER'
    | 'ALREADY_REGISTERED';
}

@Injectable()
export class AiProviderRegistrationService {
  constructor(
    private readonly discovery:
      AiProviderDiscoveryService,
    private readonly registry:
      AiProviderRegistry,
  ) {}

  registerDiscoveredProviders():
    AiProviderRegistrationReport {
    const discoveryReport =
      this.discovery.discover();

    const plan =
      this.preparePlan(
        discoveryReport,
      );

    const entries =
      this.applyPlan(plan);

    return this.buildReport(
      discoveryReport,
      entries,
    );
  }

  private preparePlan(
    report:
      AiProviderDiscoveryReport,
  ): RegistrationPlanEntry[] {
    const rejected =
      report.candidates.filter(
        (candidate) =>
          candidate.status ===
          'REJECTED',
      );

    if (rejected.length > 0) {
      throw new AiProviderRegistrationError(
        'AI provider registration blocked by rejected discovery candidates',
        rejected.flatMap(
          (candidate) =>
            candidate.reasons.map(
              (reason) =>
                `${candidate.providerName}: ${reason}`,
            ),
        ),
      );
    }

    const discovered =
      report.candidates
        .filter(
          (candidate) =>
            candidate.status ===
            'DISCOVERED',
        )
        .sort(
          (left, right) =>
            left.providerName
              .localeCompare(
                right.providerName,
              ) ||
            (
              left.providerId ??
              ''
            ).localeCompare(
              right.providerId ??
              '',
            ),
        );

    const names =
      new Set<string>();

    const ids =
      new Set<string>();

    const plan:
      RegistrationPlanEntry[] = [];

    for (
      const candidate of discovered
    ) {
      const provider =
        candidate.provider;

      const providerId =
        candidate.providerId;

      if (!provider) {
        throw new AiProviderRegistrationError(
          'AI provider registration candidate is missing its provider instance',
          [
            `${candidate.providerName}: provider instance missing`,
          ],
        );
      }

      if (!providerId) {
        throw new AiProviderRegistrationError(
          'AI provider registration candidate is missing its provider identifier',
          [
            `${candidate.providerName}: provider identifier missing`,
          ],
        );
      }

      if (
        names.has(
          candidate.providerName,
        )
      ) {
        throw new AiProviderRegistrationError(
          'AI provider registration contains duplicate provider names',
          [
            `Duplicate provider name: ${candidate.providerName}`,
          ],
        );
      }

      if (
        ids.has(providerId)
      ) {
        throw new AiProviderRegistrationError(
          'AI provider registration contains duplicate provider identifiers',
          [
            `Duplicate provider id: ${providerId}`,
          ],
        );
      }

      names.add(
        candidate.providerName,
      );

      ids.add(providerId);

      const existing =
        this.registry.get(
          candidate.providerName,
        );

      if (
        existing &&
        existing !== provider
      ) {
        throw new AiProviderRegistrationError(
          'AI provider registration conflicts with an existing registry entry',
          [
            `Provider name already registered with a different instance: ${candidate.providerName}`,
          ],
        );
      }

      plan.push({
        providerName:
          candidate.providerName,
        providerId,
        candidate,
        action:
          existing === provider
            ? 'ALREADY_REGISTERED'
            : 'REGISTER',
      });
    }

    return plan;
  }

  private applyPlan(
    plan:
      readonly RegistrationPlanEntry[],
  ): AiProviderRegistrationEntry[] {
    return plan.map(
      (entry) => {
        if (
          entry.action ===
          'REGISTER'
        ) {
          this.registry.register(
            entry.candidate
              .provider!,
          );
        }

        return {
          providerName:
            entry.providerName,
          providerId:
            entry.providerId,
          status:
            entry.action ===
            'REGISTER'
              ? 'REGISTERED'
              : 'ALREADY_REGISTERED',
        };
      },
    );
  }

  private buildReport(
    discoveryReport:
      AiProviderDiscoveryReport,
    entries:
      AiProviderRegistrationEntry[],
  ): AiProviderRegistrationReport {
    return {
      discoveredProviderNames: [
        ...discoveryReport
          .discoveredProviderNames,
      ].sort(
        (left, right) =>
          left.localeCompare(right),
      ),
      registeredProviderNames:
        entries
          .filter(
            (entry) =>
              entry.status ===
              'REGISTERED',
          )
          .map(
            (entry) =>
              entry.providerName,
          ),
      alreadyRegisteredProviderNames:
        entries
          .filter(
            (entry) =>
              entry.status ===
              'ALREADY_REGISTERED',
          )
          .map(
            (entry) =>
              entry.providerName,
          ),
      entries,
    };
  }
}
