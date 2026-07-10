import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigurationService } from '../../configuration';
import { StorageService } from '../../storage';
import { UploadObjectDto } from '../dto/upload-object.dto';
import { UploadPolicy, UploadResult } from '../types/upload.types';

@Injectable()
export class UploadService {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly storageService: StorageService,
  ) {}

  async upload(dto: UploadObjectDto): Promise<UploadResult> {
    this.validateBase64(dto.content);

    const buffer = Buffer.from(dto.content, 'base64');
    const policy = await this.getUploadPolicy();

    if (buffer.length > policy.maxSizeBytes) {
      throw new BadRequestException(
        `Upload exceeds max size of ${policy.maxSizeBytes} bytes`,
      );
    }

    if (
      dto.mimeType &&
      policy.allowedMimeTypes.length > 0 &&
      !policy.allowedMimeTypes.includes(dto.mimeType)
    ) {
      throw new BadRequestException(`MIME type not allowed: ${dto.mimeType}`);
    }

    const object = await this.storageService.store({
      objectKey: dto.objectKey,
      content: dto.content,
      originalName: dto.originalName,
      mimeType: dto.mimeType,
      entityType: dto.entityType,
      entityId: dto.entityId,
      metadata: {
        ...(dto.metadata ?? {}),
        uploadedVia: 'upload-engine',
      },
    });

    return {
      storageObjectId: object.id,
      objectKey: object.objectKey,
      originalName: object.originalName,
      mimeType: object.mimeType,
      sizeBytes: object.sizeBytes,
      entityType: object.entityType,
      entityId: object.entityId,
      metadata: object.metadata,
    };
  }

  private validateBase64(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new BadRequestException('Upload content is required');
    }

    try {
      Buffer.from(content, 'base64');
    } catch {
      throw new BadRequestException('Upload content must be base64 encoded');
    }
  }

  private async getUploadPolicy(): Promise<UploadPolicy> {
    const defaultPolicy: UploadPolicy = {
      maxSizeBytes: 10 * 1024 * 1024,
      allowedMimeTypes: [],
    };

    try {
      const setting = await this.configurationService.getByScopeAndKey(
        'PLATFORM',
        undefined,
        'upload.policy',
      );

      return {
        ...defaultPolicy,
        ...(setting.value as Partial<UploadPolicy>),
      };
    } catch {
      return defaultPolicy;
    }
  }
}
