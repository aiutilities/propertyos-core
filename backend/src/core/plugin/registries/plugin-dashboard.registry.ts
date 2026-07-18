import { Injectable } from '@nestjs/common';

import { BasePluginRegistry } from './base-plugin.registry';

export type PluginDashboardMetrics =
  Readonly<Record<string, number>>;

export interface PluginDashboardContributor {
  contribute(): Promise<PluginDashboardMetrics>;
}

@Injectable()
export class PluginDashboardRegistry extends BasePluginRegistry<
  PluginDashboardContributor
> {
  async collect(
    pluginId: string,
  ): Promise<PluginDashboardMetrics> {
    const contributors =
      this.findByPlugin(pluginId);

    const contributions =
      await Promise.all(
        contributors.map(
          (contributor) =>
            contributor.contribute(),
        ),
      );

    const metrics:
      Record<string, number> = {};

    for (
      const contribution
      of contributions
    ) {
      for (
        const [key, value]
        of Object.entries(
          contribution,
        )
      ) {
        if (
          !Number.isFinite(value)
        ) {
          throw new TypeError(
            `Dashboard metric must be finite: ` +
              `${pluginId}.${key}`,
          );
        }

        metrics[key] =
          (metrics[key] ?? 0) +
          value;
      }
    }

    return metrics;
  }
}
