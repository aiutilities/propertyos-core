import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import semver from 'semver';
import { PluginManifest } from '../../manifest/plugin-manifest.interface';
import { PluginSignatureVerifierService } from '../signature/plugin-signature-verifier.service';

const PLATFORM_VERSION = '0.1.0';

@Injectable()
export class PluginPackageValidatorService {
  constructor(
    private readonly signatureVerifier: PluginSignatureVerifierService,
  ) {}

  async validate(pluginRoot: string, manifest?: PluginManifest): Promise<string[]> {
    const errors: string[] = [];

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
      semver.lt(PLATFORM_VERSION, manifest.minimumPlatformVersion)
    ) {
      errors.push(
        `Plugin requires PropertyOS ${manifest.minimumPlatformVersion}, current platform is ${PLATFORM_VERSION}`,
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
