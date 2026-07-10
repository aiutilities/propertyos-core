import { Injectable } from '@nestjs/common';
import { BasePluginRegistry } from './base-plugin.registry';

@Injectable()
export class PluginSearchRegistry extends BasePluginRegistry {}
