import { PluginContext } from '../../backend/src/core/plugin/types/plugin-runtime.types';

export default class VisitorPluginBootstrap {
  register(context: PluginContext): void {
    console.log(`Registering plugin: ${context.manifest.name}`);
  }
}
