import { PluginEntity } from '../entities/plugin.entity';

export interface PluginRepository {
  create(plugin: Partial<PluginEntity>): Promise<PluginEntity>;
  findAll(): Promise<PluginEntity[]>;
  findById(id: string): Promise<PluginEntity | null>;
  findByName(name: string): Promise<PluginEntity | null>;
  update(id: string, plugin: Partial<PluginEntity>): Promise<PluginEntity>;
  delete(id: string): Promise<void>;
  remove(id: string): Promise<void>;
}
