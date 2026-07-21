import semver from 'semver';
import {
  AI_PROVIDER_CONTRACT_VERSION,
  AI_PROVIDER_MANIFEST_VERSION,
  AiProviderManifest,
  AiProviderManifestModel,
  AiProviderManifestValidationOptions,
  AiProviderManifestValidationResult,
  PROPERTYOS_PLATFORM_VERSION,
} from './ai-provider-manifest';
import { AiExecutionMode } from '../types/ai-orchestration.types';
import { AiCapability } from '../types/ai.types';

const AI_CAPABILITIES: readonly AiCapability[] = [
  'CHAT',
  'TEXT_GENERATION',
  'CLASSIFICATION',
  'SUMMARIZATION',
  'EXTRACTION',
  'EMBEDDINGS',
  'VISION',
  'TOOL_CALLING',
];

const AI_EXECUTION_MODES: readonly AiExecutionMode[] = [
  'SIMULATED',
  'ISOLATED',
  'LIVE',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value),
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function validateModel(
  value: unknown,
  index: number,
  errors: string[],
): value is AiProviderManifestModel {
  if (!isRecord(value)) {
    errors.push(`models[${index}] must be an object`);
    return false;
  }

  const stringFields = [
    'id',
    'displayName',
  ] as const;

  for (const field of stringFields) {
    if (!isNonEmptyString(value[field])) {
      errors.push(`models[${index}].${field} must be a non-empty string`);
    }
  }

  const integerFields = [
    'contextWindow',
    'maxInputTokens',
    'maxOutputTokens',
  ] as const;

  for (const field of integerFields) {
    if (!isPositiveInteger(value[field])) {
      errors.push(`models[${index}].${field} must be a positive integer`);
    }
  }

  const booleanFields = [
    'supportsStreaming',
    'supportsVision',
    'supportsToolCalling',
  ] as const;

  for (const field of booleanFields) {
    if (typeof value[field] !== 'boolean') {
      errors.push(`models[${index}].${field} must be a boolean`);
    }
  }

  if (
    isPositiveInteger(value.contextWindow) &&
    isPositiveInteger(value.maxInputTokens) &&
    value.maxInputTokens > value.contextWindow
  ) {
    errors.push(
      `models[${index}].maxInputTokens cannot exceed contextWindow`,
    );
  }

  return true;
}

export function validateAiProviderManifest(
  input: unknown,
  options: AiProviderManifestValidationOptions = {},
): AiProviderManifestValidationResult {
  const errors: string[] = [];
  const compatibilityErrors: string[] = [];

  const platformVersion =
    options.platformVersion ??
    PROPERTYOS_PLATFORM_VERSION;

  const aiContractVersion =
    options.aiContractVersion ??
    AI_PROVIDER_CONTRACT_VERSION;

  if (!isRecord(input)) {
    return {
      valid: false,
      compatible: false,
      errors: ['AI provider manifest must be an object'],
    };
  }

  if (!isNonEmptyString(input.manifestVersion)) {
    errors.push('manifestVersion must be a non-empty string');
  } else if (!semver.valid(input.manifestVersion)) {
    errors.push(
      `Invalid manifestVersion: ${input.manifestVersion}`,
    );
  } else if (input.manifestVersion !== AI_PROVIDER_MANIFEST_VERSION) {
    compatibilityErrors.push(
      `Unsupported manifestVersion: ${input.manifestVersion}; supported version is ${AI_PROVIDER_MANIFEST_VERSION}`,
    );
  }

  if (!isRecord(input.provider)) {
    errors.push('provider must be an object');
  } else {
    for (
      const field of [
        'id',
        'name',
        'displayName',
        'vendor',
      ] as const
    ) {
      if (!isNonEmptyString(input.provider[field])) {
        errors.push(`provider.${field} must be a non-empty string`);
      }
    }

    if (!isNonEmptyString(input.provider.version)) {
      errors.push('provider.version must be a non-empty string');
    } else if (!semver.valid(input.provider.version)) {
      errors.push(
        `Invalid provider.version: ${input.provider.version}`,
      );
    }

    if (
      input.provider.description !== undefined &&
      !isNonEmptyString(input.provider.description)
    ) {
      errors.push(
        'provider.description must be a non-empty string when provided',
      );
    }
  }

  if (!isRecord(input.compatibility)) {
    errors.push('compatibility must be an object');
  } else {
    const propertyOsVersion =
      input.compatibility.propertyOsVersion;

    if (!isNonEmptyString(propertyOsVersion)) {
      errors.push(
        'compatibility.propertyOsVersion must be a non-empty semantic-version range',
      );
    } else if (!semver.validRange(propertyOsVersion)) {
      errors.push(
        `Invalid compatibility.propertyOsVersion range: ${propertyOsVersion}`,
      );
    } else if (
      !semver.valid(platformVersion) ||
      !semver.satisfies(platformVersion, propertyOsVersion)
    ) {
      compatibilityErrors.push(
        `Provider requires PropertyOS ${propertyOsVersion}; current platform is ${platformVersion}`,
      );
    }

    const requiredAiContractVersion =
      input.compatibility.aiContractVersion;

    if (!isNonEmptyString(requiredAiContractVersion)) {
      errors.push(
        'compatibility.aiContractVersion must be a non-empty semantic-version range',
      );
    } else if (!semver.validRange(requiredAiContractVersion)) {
      errors.push(
        `Invalid compatibility.aiContractVersion range: ${requiredAiContractVersion}`,
      );
    } else if (
      !semver.valid(aiContractVersion) ||
      !semver.satisfies(
        aiContractVersion,
        requiredAiContractVersion,
      )
    ) {
      compatibilityErrors.push(
        `Provider requires AI contract ${requiredAiContractVersion}; current contract is ${aiContractVersion}`,
      );
    }
  }

  if (!isRecord(input.execution)) {
    errors.push('execution must be an object');
  } else if (!Array.isArray(input.execution.supportedModes)) {
    errors.push('execution.supportedModes must be an array');
  } else {
    const modes = input.execution.supportedModes;

    if (modes.length === 0) {
      errors.push(
        'execution.supportedModes must contain at least one mode',
      );
    }

    for (const mode of modes) {
      if (
        typeof mode !== 'string' ||
        !AI_EXECUTION_MODES.includes(
          mode as AiExecutionMode,
        )
      ) {
        errors.push(`Unsupported execution mode: ${String(mode)}`);
      }
    }

    const validModes = modes.filter(
      (mode): mode is string => typeof mode === 'string',
    );

    if (hasDuplicates(validModes)) {
      errors.push(
        'execution.supportedModes must not contain duplicates',
      );
    }
  }

  if (!Array.isArray(input.capabilities)) {
    errors.push('capabilities must be an array');
  } else {
    if (input.capabilities.length === 0) {
      errors.push(
        'capabilities must contain at least one capability',
      );
    }

    for (const capability of input.capabilities) {
      if (
        typeof capability !== 'string' ||
        !AI_CAPABILITIES.includes(
          capability as AiCapability,
        )
      ) {
        errors.push(
          `Unsupported AI capability: ${String(capability)}`,
        );
      }
    }

    const validCapabilities =
      input.capabilities.filter(
        (capability): capability is string =>
          typeof capability === 'string',
      );

    if (hasDuplicates(validCapabilities)) {
      errors.push(
        'capabilities must not contain duplicates',
      );
    }
  }

  if (!Array.isArray(input.models)) {
    errors.push('models must be an array');
  } else {
    if (input.models.length === 0) {
      errors.push('models must contain at least one model');
    }

    input.models.forEach(
      (model, index) => {
        validateModel(model, index, errors);
      },
    );

    const modelIds = input.models
      .filter(isRecord)
      .map((model) => model.id)
      .filter(
        (id): id is string =>
          typeof id === 'string',
      );

    if (hasDuplicates(modelIds)) {
      errors.push(
        'models must not contain duplicate model IDs',
      );
    }
  }

  if (!isRecord(input.limits)) {
    errors.push('limits must be an object');
  } else {
    if (!isPositiveInteger(input.limits.maxInputTokens)) {
      errors.push(
        'limits.maxInputTokens must be a positive integer',
      );
    }

    if (!isPositiveInteger(input.limits.maxOutputTokens)) {
      errors.push(
        'limits.maxOutputTokens must be a positive integer',
      );
    }

    if (
      input.limits.maxTotalTokens !== undefined &&
      !isPositiveInteger(input.limits.maxTotalTokens)
    ) {
      errors.push(
        'limits.maxTotalTokens must be a positive integer when provided',
      );
    }

    if (
      isPositiveInteger(input.limits.maxInputTokens) &&
      isPositiveInteger(input.limits.maxOutputTokens) &&
      isPositiveInteger(input.limits.maxTotalTokens) &&
      (
        input.limits.maxInputTokens +
        input.limits.maxOutputTokens >
        input.limits.maxTotalTokens
      )
    ) {
      errors.push(
        'limits.maxTotalTokens cannot be lower than maxInputTokens plus maxOutputTokens',
      );
    }
  }

  if (
    input.metadata !== undefined &&
    !isRecord(input.metadata)
  ) {
    errors.push('metadata must be an object when provided');
  }

  return {
    valid: errors.length === 0,
    compatible:
      errors.length === 0 &&
      compatibilityErrors.length === 0,
    errors: [
      ...errors,
      ...compatibilityErrors,
    ],
    manifest:
      errors.length === 0
        ? input as unknown as AiProviderManifest
        : undefined,
  };
}

export function assertValidAiProviderManifest(
  input: unknown,
  options: AiProviderManifestValidationOptions = {},
): AiProviderManifest {
  const result = validateAiProviderManifest(
    input,
    options,
  );

  if (!result.valid || !result.compatible || !result.manifest) {
    throw new Error(
      `Invalid AI provider manifest: ${result.errors.join('; ')}`,
    );
  }

  return result.manifest;
}
