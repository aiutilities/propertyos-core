import { Injectable } from '@nestjs/common';
import { BasePostgresRepository } from '../../platform';
import { PluginRepository } from './plugin-repository.interface';
import { PluginEntity } from '../entities/plugin.entity';

@Injectable()
export class PostgresPluginRepository
  extends BasePostgresRepository
  implements PluginRepository
{
  async create(plugin: Partial<PluginEntity>): Promise<PluginEntity> {
    return plugin as PluginEntity;
  }

  async findAll(): Promise<PluginEntity[]> {
    return [];
  }

  async findById(id: string): Promise<PluginEntity | null> {
    return null;
  }

  async update(
    id: string,
    plugin: Partial<PluginEntity>,
  ): Promise<PluginEntity> {
    return plugin as PluginEntity;
  }
}
