from __future__ import annotations

from tools.knowledge_engine.test_source_policy import is_test_source

import re
from pathlib import PurePosixPath
from typing import Iterable, Tuple

from .blueprint_models import (
    BlueprintContract,
    BlueprintFile,
    BlueprintPortfolio,
    BlueprintRequest,
    PluginBlueprint,
)
from .migration_models import MigrationRequest
from .migration_planner import (
    RepositoryMigrationPlanner,
)
from .repository_api import Repository
from .repository_models import Module


class BlueprintGenerationError(ValueError):
    pass


def _slug(value: str) -> str:
    value = value.lower().replace(":", "-")

    value = re.sub(
        r"[^a-z0-9-]+",
        "-",
        value,
    )

    return value.strip("-")


def _unique_sorted(
    values: Iterable[str],
) -> Tuple[str, ...]:
    return tuple(sorted(set(values)))


class PluginBlueprintGenerator:
    SCHEMA_VERSION = "1.0.0"

    def __init__(
        self,
        repository: Repository,
    ) -> None:
        self.repository = repository
        self.migration_planner = (
            RepositoryMigrationPlanner(
                repository
            )
        )

    def generate(
        self,
        request: BlueprintRequest,
    ) -> BlueprintPortfolio:
        mode = request.mode.strip().lower()

        if request.limit is not None:
            if request.limit <= 0:
                raise BlueprintGenerationError(
                    "Blueprint limit must be "
                    "greater than zero."
                )

        if mode == "module":
            if not request.module_id:
                raise BlueprintGenerationError(
                    "Module blueprint generation "
                    "requires a module ID."
                )

            migration_request = (
                MigrationRequest(
                    mode="module",
                    module_id=request.module_id,
                )
            )

        elif mode == "candidates":
            migration_request = (
                MigrationRequest(
                    mode="candidates",
                    limit=request.limit,
                )
            )

        else:
            raise BlueprintGenerationError(
                "Unsupported blueprint mode: "
                f"{request.mode}"
            )

        migration_portfolio = (
            self.migration_planner.generate(
                migration_request
            )
        )

        blueprints = tuple(
            self._build_blueprint(
                self.repository.module(
                    plan.module_id
                ),
                migration_tier=(
                    plan.migration_tier
                ),
                migration_score=(
                    plan.migration_score
                ),
            )
            for plan
            in migration_portfolio.plans
        )

        warnings = tuple(
            sorted(
                {
                    warning
                    for blueprint in blueprints
                    for warning
                    in blueprint.warnings
                }
            )
        )

        return BlueprintPortfolio(
            schema_version=(
                self.SCHEMA_VERSION
            ),
            request=request,
            blueprints=blueprints,
            generation_order=tuple(
                blueprint.module_id
                for blueprint in blueprints
            ),
            summary={
                "blueprintCount": len(
                    blueprints
                ),
                "fileCount": sum(
                    len(blueprint.files)
                    for blueprint in blueprints
                ),
                "contractCount": sum(
                    len(blueprint.contracts)
                    for blueprint in blueprints
                ),
                "dependentUpdateCount": sum(
                    len(
                        blueprint
                        .dependent_updates
                    )
                    for blueprint in blueprints
                ),
                "warningCount": len(
                    warnings
                ),
            },
            warnings=warnings,
        )

    def _build_blueprint(
        self,
        module: Module,
        migration_tier: str,
        migration_score: float,
    ) -> PluginBlueprint:
        plugin_id = _slug(module.id)

        package_name = (
            f"@propertyos/plugin-{plugin_id}"
        )

        target_root = (
            f"plugins/{plugin_id}"
        )

        source_paths = self._source_paths(
            module
        )

        files = tuple(
            self._file_blueprint(
                module=module,
                source_path=source_path,
                target_root=target_root,
            )
            for source_path
            in source_paths
        )

        contracts = (
            self._contracts(module)
        )

        dependent_updates = tuple(
            sorted(
                {
                    self.repository.module(
                        dependent_id
                    ).source.path
                    for dependent_id
                    in module.impact
                    .direct_dependents
                }
            )
        )

        warnings = []

        if module.route_count > 30:
            warnings.append(
                f"{module.id} exposes "
                f"{module.route_count} routes; "
                "perform route-parity validation "
                "in batches."
            )

        if module.impact.direct_dependents:
            warnings.append(
                f"{module.id} has "
                f"{len(module.impact.direct_dependents)} "
                "direct dependent module(s)."
            )

        business_dependencies = tuple(
            dependency.id
            for dependency
            in self.repository.dependencies(
                module.id
            )
            if dependency.architectural_role
            == "business"
        )

        if business_dependencies:
            warnings.append(
                f"{module.id} directly depends on "
                "business module(s): "
                + ", ".join(
                    business_dependencies
                )
            )

        manifest = {
            "id": plugin_id,
            "name": module.name,
            "version": "0.1.0",
            "package": package_name,
            "entrypoint": (
                "src/index.ts"
            ),
            "moduleClass": (
                module.class_name
            ),
            "type": "business",
            "dependencies": list(
                module.impact
                .direct_dependencies
            ),
            "permissions": sorted(
                {
                    permission
                    for route in module.routes
                    for permission
                    in route.permissions
                }
            ),
            "routes": module.route_count,
            "controllers": (
                module.controller_count
            ),
        }

        return PluginBlueprint(
            module_id=module.id,
            plugin_id=plugin_id,
            package_name=package_name,
            source_root=(
                module.physical_location
            ),
            target_root=target_root,
            migration_tier=(
                migration_tier
            ),
            migration_score=(
                migration_score
            ),
            manifest=manifest,
            files=files,
            contracts=contracts,
            dependent_updates=(
                dependent_updates
            ),
            validation_commands=(
                "python3 -m unittest discover "
                "-s tests/knowledge_engine "
                "-p 'test_*.py' -v",
                "cd backend && "
                "npm run knowledge:repository:verify",
                "cd backend && "
                "npm run knowledge:query -- "
                f"module {module.id}",
                "cd backend && npm run typecheck",
                "cd backend && npm run build",
            ),
            warnings=tuple(
                sorted(warnings)
            ),
        )

    @staticmethod
    def _source_paths(
        module: Module,
    ) -> Tuple[str, ...]:
        values = [
            module.source.path,
        ]

        values.extend(
            component.source.path
            for component
            in module.components
        )

        values.extend(
            controller.source.path
            for controller
            in module.controllers
        )

        values.extend(
            route.source.path
            for route
            in module.routes
        )

        return _unique_sorted(
            value
            for value in values
            if value
        )

    def _file_blueprint(
        self,
        module: Module,
        source_path: str,
        target_root: str,
    ) -> BlueprintFile:
        source = PurePosixPath(
            source_path
        )

        filename = source.name
        path_text = source_path.lower()

        if filename.endswith(
            ".module.ts"
        ):
            file_kind = "module"
        elif "controller" in path_text:
            file_kind = "controller"
        elif "service" in path_text:
            file_kind = "service"
        elif "repository" in path_text:
            file_kind = "repository"
        elif "/dto/" in path_text:
            file_kind = "dto"
        elif "constant" in path_text:
            file_kind = "constant"
        elif "test" in path_text or (
            is_test_source(filename)
        ):
            file_kind = "test"
        else:
            file_kind = "source"

        relative = self._relative_module_path(
            module=module,
            source_path=source_path,
        )

        target_path = str(
            PurePosixPath(
                target_root,
                "src",
                relative,
            )
        )

        notes = [
            "Preserve exported class and "
            "function names.",
            "Rewrite internal imports to use "
            "plugin-relative paths.",
        ]

        if file_kind == "controller":
            notes.append(
                "Preserve HTTP methods, paths, "
                "permissions, and authentication."
            )

        if file_kind == "repository":
            notes.append(
                "Inject persistence through the "
                "stable database contract."
            )

        if file_kind == "module":
            notes.append(
                "Replace core registration with "
                "plugin lifecycle registration."
            )

        class_name = ""

        for component in (
            module.components
        ):
            if (
                component.source.path
                == source_path
            ):
                class_name = (
                    component.class_name
                )
                break

        if not class_name:
            for controller in (
                module.controllers
            ):
                if (
                    controller.source.path
                    == source_path
                ):
                    class_name = (
                        controller
                        .class_name
                    )
                    break

        if (
            not class_name
            and module.source.path
            == source_path
        ):
            class_name = module.class_name

        return BlueprintFile(
            source_path=source_path,
            target_path=target_path,
            file_kind=file_kind,
            action="move-and-rewrite-imports",
            class_name=class_name,
            notes=tuple(notes),
        )

    @staticmethod
    def _relative_module_path(
        module: Module,
        source_path: str,
    ) -> PurePosixPath:
        source = PurePosixPath(
            source_path
        )

        module_source = PurePosixPath(
            module.source.path
        )

        module_directory = (
            module_source.parent
        )

        try:
            return source.relative_to(
                module_directory
            )
        except ValueError:
            return PurePosixPath(
                source.name
            )

    def _contracts(
        self,
        module: Module,
    ) -> Tuple[BlueprintContract, ...]:
        contracts = []

        for dependency in (
            self.repository.dependencies(
                module.id
            )
        ):
            if (
                dependency.architectural_role
                in {
                    "platform",
                    "database",
                }
            ):
                contract_type = (
                    "platform-contract"
                )
            else:
                contract_type = (
                    "plugin-contract"
                )

            contracts.append(
                BlueprintContract(
                    contract_type=(
                        contract_type
                    ),
                    name=(
                        f"{dependency.class_name}"
                        "Contract"
                    ),
                    source_module=(
                        dependency.id
                    ),
                    target_package=(
                        "@propertyos/core-contracts"
                        if contract_type
                        == "platform-contract"
                        else (
                            "@propertyos/"
                            f"plugin-{_slug(dependency.id)}"
                        )
                    ),
                    reason=(
                        f"Decouple {module.id} from "
                        f"direct implementation "
                        f"imports in "
                        f"{dependency.id}."
                    ),
                )
            )

        return tuple(
            sorted(
                contracts,
                key=lambda contract: (
                    contract.contract_type,
                    contract.source_module,
                ),
            )
        )
