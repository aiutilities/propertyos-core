import {
  CommunicationEnvironmentClass,
} from './communication-provider-selection.types';

export function currentCommunicationEnvironmentClass(
  nodeEnvironment?: string,
): CommunicationEnvironmentClass {
  const normalized =
    nodeEnvironment
      ?.trim()
      .toLowerCase();

  if (
    normalized ===
    'production'
  ) {
    return 'PRODUCTION';
  }

  if (
    normalized ===
    'test'
  ) {
    return 'TEST';
  }

  return 'DEVELOPMENT';
}
