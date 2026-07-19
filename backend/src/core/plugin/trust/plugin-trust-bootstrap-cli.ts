import {
  readFileSync,
} from 'fs';
import {
  resolve,
} from 'path';
import {
  buildTrustBootstrapPlan,
} from './plugin-trust-bootstrap-plan';

function requiredEnvironment(
  name: string,
): string {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value.trim();
}

function main(): void {
  const publicKeyPath = resolve(
    requiredEnvironment(
      'PROPERTYOS_BOOTSTRAP_PUBLIC_KEY_PATH',
    ),
  );

  const publicKeyPem = readFileSync(
    publicKeyPath,
    'utf8',
  );

  const plan = buildTrustBootstrapPlan({
    environmentId:
      requiredEnvironment(
        'PROPERTYOS_BOOTSTRAP_ENVIRONMENT',
      ),
    keyId:
      requiredEnvironment(
        'PROPERTYOS_BOOTSTRAP_KEY_ID',
      ),
    publicKeyPem,
    actorId:
      requiredEnvironment(
        'PROPERTYOS_BOOTSTRAP_ACTOR_ID',
      ),
    validFrom:
      requiredEnvironment(
        'PROPERTYOS_BOOTSTRAP_VALID_FROM',
      ),
    validUntil:
      process.env.PROPERTYOS_BOOTSTRAP_VALID_UNTIL
        ?.trim() || undefined,
    evidenceTimestamp:
      requiredEnvironment(
        'PROPERTYOS_BOOTSTRAP_EVIDENCE_TIMESTAMP',
      ),
  });

  const output = {
    ...plan,
    publicKeySourcePath: publicKeyPath,
    databaseConnected: false,
    databaseMutated: false,
  };

  process.stdout.write(
    `${JSON.stringify(output, null, 2)}\n`,
  );

  if (plan.status !== 'READY') {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : error,
  );
  process.exitCode = 1;
}
