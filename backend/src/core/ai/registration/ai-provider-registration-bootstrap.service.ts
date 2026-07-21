import {
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import {
  AiProviderRegistrationReport,
  AiProviderRegistrationService,
} from './ai-provider-registration.service';

@Injectable()
export class AiProviderRegistrationBootstrapService
  implements OnApplicationBootstrap {
  private registrationReport?:
    AiProviderRegistrationReport;

  constructor(
    private readonly registration:
      AiProviderRegistrationService,
  ) {}

  onApplicationBootstrap(): void {
    this.registrationReport =
      this.registration
        .registerDiscoveredProviders();
  }

  getRegistrationReport():
    AiProviderRegistrationReport |
    undefined {
    if (!this.registrationReport) {
      return undefined;
    }

    return {
      discoveredProviderNames: [
        ...this.registrationReport
          .discoveredProviderNames,
      ],
      registeredProviderNames: [
        ...this.registrationReport
          .registeredProviderNames,
      ],
      alreadyRegisteredProviderNames: [
        ...this.registrationReport
          .alreadyRegisteredProviderNames,
      ],
      entries:
        this.registrationReport
          .entries.map(
            (entry) => ({
              ...entry,
            }),
          ),
    };
  }
}
