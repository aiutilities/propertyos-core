import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { PostgresConfigurationRepository } from '../repositories/postgres-configuration.repository';
import { ConfigurationScope, ConfigurationSetting } from '../types/configuration.types';

@Injectable()
export class ConfigurationService {
  constructor(
    private readonly repository: PostgresConfigurationRepository,
  ) {}

  async upsert(dto: CreateSettingDto): Promise<ConfigurationSetting> {
    const existing = await this.repository.findByScopeAndKey(
      dto.scopeType,
      dto.scopeId,
      dto.key,
    );

    const now = new Date();

    return this.repository.upsert({
      id: existing?.id ?? randomUUID(),
      scopeType: dto.scopeType,
      scopeId: dto.scopeId,
      key: dto.key,
      value: dto.value,
      valueType: dto.valueType ?? 'JSON',
      description: dto.description,
      isSecret: dto.isSecret ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async list(
    scopeType?: ConfigurationScope,
    scopeId?: string,
  ): Promise<ConfigurationSetting[]> {
    return this.repository.list(scopeType, scopeId);
  }

  async getByScopeAndKey(
    scopeType: ConfigurationScope,
    scopeId: string | undefined,
    key: string,
  ): Promise<ConfigurationSetting> {
    const setting = await this.repository.findByScopeAndKey(
      scopeType,
      scopeId,
      key,
    );

    if (!setting) {
      throw new NotFoundException(`Configuration setting not found: ${key}`);
    }

    return setting;
  }

  async update(id: string, dto: UpdateSettingDto): Promise<ConfigurationSetting> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Configuration setting not found: ${id}`);
    }

    return this.repository.upsert({
      ...existing,
      value: dto.value ?? existing.value,
      valueType: dto.valueType ?? existing.valueType,
      description: dto.description ?? existing.description,
      isSecret: dto.isSecret ?? existing.isSecret,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Configuration setting not found: ${id}`);
    }

    await this.repository.delete(id);
  }
}
