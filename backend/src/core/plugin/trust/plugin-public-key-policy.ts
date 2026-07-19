import {
  createHash,
  createPublicKey,
  KeyObject,
} from 'crypto';

export interface CanonicalPluginPublicKey {
  algorithm: 'RSA-SHA256';
  publicKeyPem: string;
  fingerprintSha256: string;
  modulusLength: number;
}

export function canonicalizePluginPublicKey(
  publicKeyPem: string,
): CanonicalPluginPublicKey {
  if (
    typeof publicKeyPem !== 'string' ||
    !publicKeyPem.trim()
  ) {
    throw new Error(
      'PLUGIN_PUBLISHER_PUBLIC_KEY_INVALID',
    );
  }

  if (
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(
      publicKeyPem,
    )
  ) {
    throw new Error(
      'PLUGIN_PUBLISHER_PRIVATE_KEY_FORBIDDEN',
    );
  }

  let key: KeyObject;

  try {
    key =
      createPublicKey(
        publicKeyPem,
      );
  } catch {
    throw new Error(
      'PLUGIN_PUBLISHER_PUBLIC_KEY_INVALID',
    );
  }

  if (
    key.type !== 'public' ||
    key.asymmetricKeyType !== 'rsa'
  ) {
    throw new Error(
      'PLUGIN_PUBLISHER_PUBLIC_KEY_RSA_REQUIRED',
    );
  }

  const modulusLength =
    key.asymmetricKeyDetails
      ?.modulusLength;

  if (
    typeof modulusLength !== 'number' ||
    modulusLength < 2048
  ) {
    throw new Error(
      'PLUGIN_PUBLISHER_PUBLIC_KEY_TOO_WEAK',
    );
  }

  const der =
    key.export({
      type:
        'spki',
      format:
        'der',
    });

  const canonicalPem =
    key.export({
      type:
        'spki',
      format:
        'pem',
    });

  if (
    typeof canonicalPem !== 'string'
  ) {
    throw new Error(
      'PLUGIN_PUBLISHER_PUBLIC_KEY_INVALID',
    );
  }

  return {
    algorithm:
      'RSA-SHA256',
    publicKeyPem:
      canonicalPem,
    fingerprintSha256:
      createHash('sha256')
        .update(der)
        .digest('hex'),
    modulusLength,
  };
}
