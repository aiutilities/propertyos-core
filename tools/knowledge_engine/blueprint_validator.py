from __future__ import annotations

from pathlib import Path, PurePosixPath
from typing import Iterable, Tuple

from .blueprint_generator import (
    PluginBlueprintGenerator,
)
from .blueprint_models import (
    BlueprintRequest,
    PluginBlueprint,
)
from .blueprint_validation_models import (
    BlueprintFileOperation,
    BlueprintValidationIssue,
    BlueprintValidationPortfolio,
    BlueprintValidationRequest,
    BlueprintValidationResult,
)
from .repository_api import Repository


class BlueprintValidationError(
    ValueError
):
    pass


def _sorted_issues(
    issues: Iterable[
        BlueprintValidationIssue
    ],
) -> Tuple[
    BlueprintValidationIssue,
    ...,
]:
    return tuple(
        sorted(
            issues,
            key=lambda issue: (
                issue.severity,
                issue.code,
                issue.module_id,
                issue.source_path,
                issue.target_path,
                issue.message,
            ),
        )
    )


class PluginBlueprintValidator:
    SCHEMA_VERSION = "1.0.0"

    def __init__(
        self,
        repository: Repository,
        repository_root: Path,
    ) -> None:
        self.repository = repository
        self.repository_root = (
            repository_root.resolve()
        )

        self.generator = (
            PluginBlueprintGenerator(
                repository
            )
        )

    def validate(
        self,
        request: BlueprintValidationRequest,
    ) -> BlueprintValidationPortfolio:
        if (
            request.limit is not None
            and request.limit <= 0
        ):
            raise BlueprintValidationError(
                "Validation limit must be "
                "greater than zero."
            )

        blueprint_request = BlueprintRequest(
            mode=request.mode,
            module_id=request.module_id,
            limit=request.limit,
        )

        portfolio = self.generator.generate(
            blueprint_request
        )

        results = tuple(
            self._validate_blueprint(
                blueprint
            )
            for blueprint
            in portfolio.blueprints
        )

        error_count = sum(
            1
            for result in results
            for issue in result.issues
            if issue.severity == "error"
        )

        warning_count = sum(
            1
            for result in results
            for issue in result.issues
            if issue.severity == "warning"
        )

        operation_count = sum(
            len(result.operations)
            for result in results
        )

        executable_operation_count = sum(
            1
            for result in results
            for operation
            in result.operations
            if operation.executable
        )

        valid = (
            error_count == 0
            and all(
                result.valid
                for result in results
            )
        )

        return BlueprintValidationPortfolio(
            schema_version=(
                self.SCHEMA_VERSION
            ),
            request=request,
            valid=valid,
            results=results,
            summary={
                "blueprintCount": len(
                    results
                ),
                "validBlueprintCount": sum(
                    1
                    for result in results
                    if result.valid
                ),
                "invalidBlueprintCount": sum(
                    1
                    for result in results
                    if not result.valid
                ),
                "errorCount": error_count,
                "warningCount": warning_count,
                "operationCount": (
                    operation_count
                ),
                "executableOperationCount": (
                    executable_operation_count
                ),
            },
        )

    def _validate_blueprint(
        self,
        blueprint: PluginBlueprint,
    ) -> BlueprintValidationResult:
        issues = []

        issues.extend(
            self._validate_manifest(
                blueprint
            )
        )

        issues.extend(
            self._validate_files(
                blueprint
            )
        )

        issues.extend(
            self._validate_contracts(
                blueprint
            )
        )

        issues.extend(
            self._validate_dependents(
                blueprint
            )
        )

        operations = tuple(
            BlueprintFileOperation(
                sequence=index,
                module_id=(
                    blueprint.module_id
                ),
                action=file.action,
                source_path=(
                    file.source_path
                ),
                target_path=(
                    file.target_path
                ),
                file_kind=(
                    file.file_kind
                ),
                executable=(
                    self._source_exists(
                        file.source_path
                    )
                    and not self._target_exists(
                        file.target_path
                    )
                ),
            )
            for index, file
            in enumerate(
                blueprint.files,
                start=1,
            )
        )

        sorted_issues = _sorted_issues(
            issues
        )

        valid = not any(
            issue.severity == "error"
            for issue in sorted_issues
        )

        return BlueprintValidationResult(
            module_id=blueprint.module_id,
            valid=valid,
            source_file_count=len(
                blueprint.files
            ),
            target_file_count=len(
                {
                    file.target_path
                    for file
                    in blueprint.files
                }
            ),
            contract_count=len(
                blueprint.contracts
            ),
            dependent_update_count=len(
                blueprint
                .dependent_updates
            ),
            issues=sorted_issues,
            operations=operations,
        )

    def _validate_manifest(
        self,
        blueprint: PluginBlueprint,
    ) -> list[
        BlueprintValidationIssue
    ]:
        issues = []

        required_fields = (
            "id",
            "name",
            "version",
            "package",
            "entrypoint",
            "moduleClass",
            "type",
            "dependencies",
            "permissions",
            "routes",
            "controllers",
        )

        for field in required_fields:
            if field not in blueprint.manifest:
                issues.append(
                    BlueprintValidationIssue(
                        severity="error",
                        code=(
                            "MANIFEST_FIELD_MISSING"
                        ),
                        module_id=(
                            blueprint.module_id
                        ),
                        message=(
                            "Plugin manifest is "
                            f"missing field: {field}"
                        ),
                    )
                )

        if (
            blueprint.manifest.get("id")
            != blueprint.plugin_id
        ):
            issues.append(
                BlueprintValidationIssue(
                    severity="error",
                    code=(
                        "MANIFEST_ID_MISMATCH"
                    ),
                    module_id=(
                        blueprint.module_id
                    ),
                    message=(
                        "Manifest ID does not match "
                        "the generated plugin ID."
                    ),
                )
            )

        if (
            blueprint.manifest.get(
                "moduleClass"
            )
            != self.repository.module(
                blueprint.module_id
            ).class_name
        ):
            issues.append(
                BlueprintValidationIssue(
                    severity="error",
                    code=(
                        "MODULE_CLASS_MISMATCH"
                    ),
                    module_id=(
                        blueprint.module_id
                    ),
                    message=(
                        "Manifest module class does "
                        "not match repository "
                        "intelligence."
                    ),
                )
            )

        return issues

    def _validate_files(
        self,
        blueprint: PluginBlueprint,
    ) -> list[
        BlueprintValidationIssue
    ]:
        issues = []

        source_paths = [
            file.source_path
            for file in blueprint.files
        ]

        target_paths = [
            file.target_path
            for file in blueprint.files
        ]

        if len(source_paths) != len(
            set(source_paths)
        ):
            issues.append(
                BlueprintValidationIssue(
                    severity="error",
                    code=(
                        "DUPLICATE_SOURCE_PATH"
                    ),
                    module_id=(
                        blueprint.module_id
                    ),
                    message=(
                        "Blueprint contains duplicate "
                        "source paths."
                    ),
                )
            )

        if len(target_paths) != len(
            set(target_paths)
        ):
            issues.append(
                BlueprintValidationIssue(
                    severity="error",
                    code=(
                        "DUPLICATE_TARGET_PATH"
                    ),
                    module_id=(
                        blueprint.module_id
                    ),
                    message=(
                        "Blueprint contains duplicate "
                        "target paths."
                    ),
                )
            )

        module_file_count = 0
        controller_file_count = 0

        for file in blueprint.files:
            source_path = PurePosixPath(
                file.source_path
            )

            target_path = PurePosixPath(
                file.target_path
            )

            expected_prefix = (
                PurePosixPath(
                    blueprint.target_root,
                    "src",
                )
            )

            if not self._source_exists(
                file.source_path
            ):
                issues.append(
                    BlueprintValidationIssue(
                        severity="error",
                        code=(
                            "SOURCE_FILE_MISSING"
                        ),
                        module_id=(
                            blueprint.module_id
                        ),
                        message=(
                            "Source file does not "
                            "exist."
                        ),
                        source_path=(
                            file.source_path
                        ),
                        target_path=(
                            file.target_path
                        ),
                    )
                )

            if self._target_exists(
                file.target_path
            ):
                issues.append(
                    BlueprintValidationIssue(
                        severity="error",
                        code=(
                            "TARGET_PATH_EXISTS"
                        ),
                        module_id=(
                            blueprint.module_id
                        ),
                        message=(
                            "Target path already "
                            "exists."
                        ),
                        source_path=(
                            file.source_path
                        ),
                        target_path=(
                            file.target_path
                        ),
                    )
                )

            try:
                target_path.relative_to(
                    expected_prefix
                )
            except ValueError:
                issues.append(
                    BlueprintValidationIssue(
                        severity="error",
                        code=(
                            "TARGET_OUTSIDE_PLUGIN_ROOT"
                        ),
                        module_id=(
                            blueprint.module_id
                        ),
                        message=(
                            "Target file is outside "
                            "the plugin source root."
                        ),
                        source_path=(
                            file.source_path
                        ),
                        target_path=(
                            file.target_path
                        ),
                    )
                )

            if source_path.suffix != ".ts":
                issues.append(
                    BlueprintValidationIssue(
                        severity="warning",
                        code=(
                            "NON_TYPESCRIPT_SOURCE"
                        ),
                        module_id=(
                            blueprint.module_id
                        ),
                        message=(
                            "Blueprint source file is "
                            "not TypeScript."
                        ),
                        source_path=(
                            file.source_path
                        ),
                        target_path=(
                            file.target_path
                        ),
                    )
                )

            if file.file_kind == "module":
                module_file_count += 1

            if file.file_kind == "controller":
                controller_file_count += 1

        if module_file_count != 1:
            issues.append(
                BlueprintValidationIssue(
                    severity="error",
                    code=(
                        "MODULE_FILE_COUNT_INVALID"
                    ),
                    module_id=(
                        blueprint.module_id
                    ),
                    message=(
                        "Blueprint must contain "
                        "exactly one module file; "
                        f"found {module_file_count}."
                    ),
                )
            )

        expected_controllers = (
            self.repository.module(
                blueprint.module_id
            ).controller_count
        )

        if (
            controller_file_count
            != expected_controllers
        ):
            issues.append(
                BlueprintValidationIssue(
                    severity="error",
                    code=(
                        "CONTROLLER_COVERAGE_MISMATCH"
                    ),
                    module_id=(
                        blueprint.module_id
                    ),
                    message=(
                        "Controller file coverage "
                        "does not match repository "
                        "intelligence: expected "
                        f"{expected_controllers}, "
                        f"found "
                        f"{controller_file_count}."
                    ),
                )
            )

        return issues

    def _validate_contracts(
        self,
        blueprint: PluginBlueprint,
    ) -> list[
        BlueprintValidationIssue
    ]:
        issues = []

        identities = [
            (
                contract.contract_type,
                contract.source_module,
                contract.name,
                contract.target_package,
            )
            for contract
            in blueprint.contracts
        ]

        if len(identities) != len(
            set(identities)
        ):
            issues.append(
                BlueprintValidationIssue(
                    severity="error",
                    code=(
                        "DUPLICATE_CONTRACT"
                    ),
                    module_id=(
                        blueprint.module_id
                    ),
                    message=(
                        "Blueprint contains duplicate "
                        "contracts."
                    ),
                )
            )

        direct_dependencies = set(
            self.repository.module(
                blueprint.module_id
            ).impact.direct_dependencies
        )

        contract_dependencies = {
            contract.source_module
            for contract
            in blueprint.contracts
        }

        missing = sorted(
            direct_dependencies
            - contract_dependencies
        )

        for module_id in missing:
            issues.append(
                BlueprintValidationIssue(
                    severity="error",
                    code=(
                        "DEPENDENCY_CONTRACT_MISSING"
                    ),
                    module_id=(
                        blueprint.module_id
                    ),
                    message=(
                        "No extraction contract was "
                        "generated for direct "
                        f"dependency: {module_id}"
                    ),
                )
            )

        return issues

    def _validate_dependents(
        self,
        blueprint: PluginBlueprint,
    ) -> list[
        BlueprintValidationIssue
    ]:
        issues = []

        expected_paths = {
            self.repository.module(
                dependent_id
            ).source.path
            for dependent_id
            in self.repository.module(
                blueprint.module_id
            ).impact.direct_dependents
        }

        actual_paths = set(
            blueprint.dependent_updates
        )

        missing = sorted(
            expected_paths - actual_paths
        )

        for path in missing:
            issues.append(
                BlueprintValidationIssue(
                    severity="error",
                    code=(
                        "DEPENDENT_UPDATE_MISSING"
                    ),
                    module_id=(
                        blueprint.module_id
                    ),
                    message=(
                        "Dependent module source "
                        "file is missing from the "
                        "review list."
                    ),
                    source_path=path,
                )
            )

        return issues

    def _source_exists(
        self,
        source_path: str,
    ) -> bool:
        return (
            self.repository_root
            / source_path
        ).is_file()

    def _target_exists(
        self,
        target_path: str,
    ) -> bool:
        return (
            self.repository_root
            / target_path
        ).exists()
