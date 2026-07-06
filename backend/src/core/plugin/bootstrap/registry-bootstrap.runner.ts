import { Logger } from '@nestjs/common';
import { RegistryBootstrap } from './registry-bootstrap.interface';

export abstract class RegistryBootstrapRunner<T = unknown>
  implements RegistryBootstrap<T>
{
  protected readonly logger: Logger;

  protected constructor(name: string) {
    this.logger = new Logger(name);
  }

  abstract load(): Promise<T[]> | T[];

  abstract synchronize(items: T[]): Promise<void>;

  async run(): Promise<void> {
    const items = await this.load();

    if (!items.length) {
      this.logger.log('No registry items found');
      return;
    }

    await this.synchronize(items);

    this.logger.log(`Registry bootstrap completed: ${items.length} item(s)`);
  }
}
