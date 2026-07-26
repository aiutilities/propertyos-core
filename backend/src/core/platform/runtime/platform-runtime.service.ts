import {
  Injectable,
} from '@nestjs/common';
import {
  arch,
  platform,
  release,
} from 'os';

export interface PlatformRuntimeContext {
  platformVersion: string;
  apiVersion: string;
  buildVersion: string;
  environment: string;
  nodeVersion: string;
  operatingSystem: string;
  operatingSystemRelease: string;
  architecture: string;
  gitSha: string | null;
}

@Injectable()
export class PlatformRuntimeService {
  static readonly DEFAULT_PLATFORM_VERSION =
    '0.1.0';

  static readonly DEFAULT_API_VERSION =
    '0.1.0';

  static readonly DEFAULT_BUILD_VERSION =
    '1.0.0';

  static resolvePlatformVersion(
    environment:
      NodeJS.ProcessEnv =
      process.env,
  ): string {
    return (
      environment
        .PROPERTYOS_PLATFORM_VERSION ??
      environment
        .PLATFORM_VERSION ??
      PlatformRuntimeService
        .DEFAULT_PLATFORM_VERSION
    );
  }

  static resolveApiVersion(
    environment:
      NodeJS.ProcessEnv =
      process.env,
  ): string {
    return (
      environment.API_VERSION ??
      PlatformRuntimeService
        .DEFAULT_API_VERSION
    );
  }

  static resolveBuildVersion(
    environment:
      NodeJS.ProcessEnv =
      process.env,
  ): string {
    return (
      environment.BUILD_VERSION ??
      environment.npm_package_version ??
      PlatformRuntimeService
        .DEFAULT_BUILD_VERSION
    );
  }

  platformVersion(): string {
    return PlatformRuntimeService
      .resolvePlatformVersion();
  }

  apiVersion(): string {
    return PlatformRuntimeService
      .resolveApiVersion();
  }

  buildVersion(): string {
    return PlatformRuntimeService
      .resolveBuildVersion();
  }

  context(): PlatformRuntimeContext {
    return {
      platformVersion:
        this.platformVersion(),
      apiVersion:
        this.apiVersion(),
      buildVersion:
        this.buildVersion(),
      environment:
        process.env.NODE_ENV ??
        'development',
      nodeVersion:
        process.version,
      operatingSystem:
        platform(),
      operatingSystemRelease:
        release(),
      architecture:
        arch(),
      gitSha:
        process.env.GIT_SHA ??
        process.env.COMMIT_SHA ??
        null,
    };
  }
}
