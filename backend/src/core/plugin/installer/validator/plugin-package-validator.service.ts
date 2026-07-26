import {
  PlatformRuntimeService,
} from '../../../platform/runtime/platform-runtime.service';
import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import semver from 'semver';
import { PluginManifest } from '../../manifest/plugin-manifest.interface';
import { PluginSignatureVerifierService } from '../signature/plugin-signature-verifier.service';


@Injectable()
export class PluginPackageValidatorService {
  constructor(
    private readonly signatureVerifier: PluginSignatureVerifierService,
    private readonly runtime?:
      PlatformRuntimeService,
  ) {}

  async validate(pluginRoot: string, manifest?: PluginManifest): Promise<string[]> {
    const errors: string[] = [];

    const platformVersion =
      this.runtime?.platformVersion() ??
      PlatformRuntimeService
        .resolvePlatformVersion();

    if (!existsSync(pluginRoot)) {
      errors.push(`Plugin root does not exist: ${pluginRoot}`);
      return errors;
    }

    if (!existsSync(join(pluginRoot, 'plugin.json'))) {
      errors.push('plugin.json is missing');
    }

    if (!manifest) {
      return errors;
    }

    if (!semver.valid(manifest.version)) {
      errors.push(`Invalid plugin version: ${manifest.version}`);
    }

    if (
      manifest.minimumPlatformVersion &&
      !semver.valid(manifest.minimumPlatformVersion)
    ) {
      errors.push(
        `Invalid minimumPlatformVersion: ${manifest.minimumPlatformVersion}`,
      );
    }

    if (
      manifest.minimumPlatformVersion &&
      semver.valid(manifest.minimumPlatformVersion) &&
      semver.lt(platformVersion, manifest.minimumPlatformVersion)
    ) {
      errors.push(
        `Plugin requires PropertyOS ${manifest.minimumPlatformVersion}, current platform is ${platformVersion}`,
      );
    }

    if (manifest.dependencies && !Array.isArray(manifest.dependencies)) {
      errors.push('Plugin dependencies must be an array');
    }

    errors.push(
      ...await this.signatureVerifier.verify(
        pluginRoot,
      ),
    );

    return errors;
  }
}
