import {
  Injectable,
  Type,
} from '@nestjs/common';
import {
  MODULE_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import { LoadedPluginRuntimeModule } from './plugin-runtime-module-loader.service';

export type PluginRuntimeConflictType =
  | 'MODULE_CLASS'
  | 'CONTROLLER_ROUTE';

export interface PluginRuntimeConflict {
  type: PluginRuntimeConflictType;
  pluginId: string;
  candidate: string;
  existing: string;
  detail: string;
}

export interface PluginRuntimeActivationAssessment {
  pluginId: string;
  moduleClassName: string;
  safeToActivate: boolean;
  conflicts: PluginRuntimeConflict[];
}

interface RuntimeModuleReference {
  metatype?: Type<unknown>;
  controllers?: Map<
    unknown,
    {
      metatype?: Type<unknown>;
    }
  >;
}

@Injectable()
export class PluginRuntimeActivationGuardService {
  constructor(
    private readonly modules:
      ModulesContainer,
  ) {}

  assess(
    runtime: LoadedPluginRuntimeModule,
  ): PluginRuntimeActivationAssessment {
    const conflicts: PluginRuntimeConflict[] = [];

    const existingModules =
      this.moduleReferences();

    for (
      const existingModule
      of existingModules
    ) {
      const existingModuleClass =
        existingModule.metatype;

      if (
        existingModuleClass?.name ===
        runtime.moduleClassName
      ) {
        conflicts.push({
          type: 'MODULE_CLASS',
          pluginId: runtime.pluginId,
          candidate:
            runtime.moduleClassName,
          existing:
            existingModuleClass.name,
          detail:
            `Module class is already active in the ` +
            `host application: ` +
            `${runtime.moduleClassName}`,
        });
      }
    }

    const candidateControllers =
      this.candidateControllers(
        runtime.moduleClass,
      );

    const existingControllers =
      this.existingControllers(
        existingModules,
      );

    for (
      const candidateController
      of candidateControllers
    ) {
      const candidateRoute =
        this.controllerRoute(
          candidateController,
        );

      if (!candidateRoute) {
        continue;
      }

      for (
        const existingController
        of existingControllers
      ) {
        const existingRoute =
          this.controllerRoute(
            existingController,
          );

        if (
          existingRoute &&
          existingRoute ===
            candidateRoute
        ) {
          conflicts.push({
            type:
              'CONTROLLER_ROUTE',
            pluginId:
              runtime.pluginId,
            candidate:
              candidateController.name,
            existing:
              existingController.name,
            detail:
              `Controller route is already active: ` +
              `${candidateRoute}`,
          });
        }
      }
    }

    return {
      pluginId: runtime.pluginId,
      moduleClassName:
        runtime.moduleClassName,
      safeToActivate:
        conflicts.length === 0,
      conflicts:
        this.uniqueConflicts(
          conflicts,
        ),
    };
  }

  assertSafe(
    runtime: LoadedPluginRuntimeModule,
  ): PluginRuntimeActivationAssessment {
    const assessment =
      this.assess(runtime);

    if (
      !assessment.safeToActivate
    ) {
      const detail =
        assessment.conflicts
          .map(
            (conflict) =>
              conflict.detail,
          )
          .join('; ');

      throw new Error(
        `Plugin runtime activation blocked for ` +
          `${runtime.pluginId}: ${detail}`,
      );
    }

    return assessment;
  }

  private moduleReferences():
    RuntimeModuleReference[] {
    return Array.from(
      this.modules.values(),
    ) as RuntimeModuleReference[];
  }

  private candidateControllers(
    moduleClass: Type<unknown>,
  ): Type<unknown>[] {
    const controllers =
      Reflect.getMetadata(
        MODULE_METADATA.CONTROLLERS,
        moduleClass,
      );

    return Array.isArray(
      controllers,
    )
      ? controllers.filter(
          (
            controller,
          ): controller is Type<unknown> =>
            typeof controller ===
              'function',
        )
      : [];
  }

  private existingControllers(
    modules:
      RuntimeModuleReference[],
  ): Type<unknown>[] {
    const controllers:
      Type<unknown>[] = [];

    for (
      const moduleReference
      of modules
    ) {
      if (
        !moduleReference.controllers
      ) {
        continue;
      }

      for (
        const wrapper
        of moduleReference
          .controllers.values()
      ) {
        if (
          typeof wrapper.metatype ===
          'function'
        ) {
          controllers.push(
            wrapper.metatype,
          );
        }
      }
    }

    return controllers;
  }

  private controllerRoute(
    controller: Type<unknown>,
  ): string | undefined {
    const metadata =
      Reflect.getMetadata(
        PATH_METADATA,
        controller,
      );

    if (
      typeof metadata === 'string'
    ) {
      return this.normalizeRoute(
        metadata,
      );
    }

    if (
      Array.isArray(metadata) &&
      typeof metadata[0] ===
        'string'
    ) {
      return this.normalizeRoute(
        metadata[0],
      );
    }

    return undefined;
  }

  private normalizeRoute(
    route: string,
  ): string {
    const value =
      route.trim();

    if (
      !value ||
      value === '/'
    ) {
      return '/';
    }

    return (
      '/' +
      value
        .replace(
          /^\/+|\/+$/g,
          '',
        )
    );
  }

  private uniqueConflicts(
    conflicts:
      PluginRuntimeConflict[],
  ): PluginRuntimeConflict[] {
    const seen =
      new Set<string>();

    return conflicts.filter(
      (conflict) => {
        const key = [
          conflict.type,
          conflict.candidate,
          conflict.existing,
          conflict.detail,
        ].join(':');

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      },
    );
  }
}
