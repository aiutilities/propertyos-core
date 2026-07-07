import { Injectable } from '@nestjs/common';
import { createVerify } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class PluginSignatureVerifierService {
  verify(pluginRoot: string): string[] {
    const publicKeyPath = join(pluginRoot, 'signature.public.pem');
    const signaturePath = join(pluginRoot, 'plugin.signature');

    if (!existsSync(publicKeyPath) && !existsSync(signaturePath)) {
      return [];
    }

    const errors: string[] = [];

    if (!existsSync(publicKeyPath)) {
      errors.push('signature.public.pem is missing');
    }

    if (!existsSync(signaturePath)) {
      errors.push('plugin.signature is missing');
    }

    const manifestPath = join(pluginRoot, 'plugin.json');

    if (!existsSync(manifestPath)) {
      errors.push('plugin.json is missing for signature verification');
    }

    if (errors.length > 0) {
      return errors;
    }

    const verifier = createVerify('RSA-SHA256');
    verifier.update(readFileSync(manifestPath));
    verifier.end();

    const valid = verifier.verify(
      readFileSync(publicKeyPath),
      readFileSync(signaturePath),
    );

    return valid ? [] : ['Plugin digital signature verification failed'];
  }
}
