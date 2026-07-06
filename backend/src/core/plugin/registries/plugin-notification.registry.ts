import { Injectable } from '@nestjs/common';
import { BasePluginRegistry } from './base-plugin.registry';

@Injectable()
export class PluginNotificationRegistry extends BasePluginRegistry {}
