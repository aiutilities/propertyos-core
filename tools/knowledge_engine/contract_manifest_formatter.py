from __future__ import annotations

import json

from typing import Any

from .contract_manifest_models import (
    ContractExport,
)
from .contract_manifest_models import (
    ContractManifestIssue,
)
from .contract_manifest_models import (
    ContractManifestPortfolio,
)
from .contract_manifest_models import (
    ContractManifestRequest,
)
from .contract_manifest_models import (
    ContractModule,
)
from .contract_manifest_models import (
    ContractPackage,
)
from .contract_manifest_models import (
    PluginContractManifest,
)


def _request_to_dict(
    request: ContractManifestRequest,
) -> dict[str, Any]:
    return {
        "mode": request.mode,
        "moduleId": request.module_id,
        "limit": request.limit,
        "packageName": request.package_name,
        "packageVersion": (
            request.package_version
        ),
    }


def _export_to_dict(
    export: ContractExport,
) -> dict[str, Any]:
    return {
        "symbol": export.symbol,
        "sourcePath": export.source_path,
        "exportKind": export.export_kind,
        "targetModule": (
            export.target_module
        ),
        "packageName": export.package_name,
    }


def _module_to_dict(
    module: ContractModule,
) -> dict[str, Any]:
    return {
        "moduleId": module.module_id,
        "symbolCount": module.symbol_count,
        "exports": [
            _export_to_dict(export)
            for export in module.exports
        ],
    }


def _package_to_dict(
    package: ContractPackage,
) -> dict[str, Any]:
    return {
        "packageName": package.package_name,
        "version": package.version,
        "moduleCount": package.module_count,
        "symbolCount": package.symbol_count,
        "modules": [
            _module_to_dict(module)
            for module in package.modules
        ],
    }


def _issue_to_dict(
    issue: ContractManifestIssue,
) -> dict[str, Any]:
    return {
        "code": issue.code,
        "message": issue.message,
        "moduleId": issue.module_id,
        "symbol": issue.symbol,
        "sourcePath": issue.source_path,
    }


def _manifest_to_dict(
    manifest: PluginContractManifest,
) -> dict[str, Any]:
    return {
        "moduleId": manifest.module_id,
        "pluginId": manifest.plugin_id,
        "workspacePath": (
            manifest.workspace_path
        ),
        "packageCount": (
            manifest.package_count
        ),
        "moduleCount": (
            manifest.module_count
        ),
        "symbolCount": (
            manifest.symbol_count
        ),
        "unresolvedSymbolCount": (
            manifest.unresolved_symbol_count
        ),
        "duplicateSymbolCount": (
            manifest.duplicate_symbol_count
        ),
        "packages": [
            _package_to_dict(package)
            for package in manifest.packages
        ],
        "issues": [
            _issue_to_dict(issue)
            for issue in manifest.issues
        ],
        "valid": manifest.valid,
    }


def contract_manifest_to_dict(
    portfolio: ContractManifestPortfolio,
) -> dict[str, Any]:
    return {
        "schemaVersion": (
            portfolio.schema_version
        ),
        "request": _request_to_dict(
            portfolio.request
        ),
        "manifests": [
            _manifest_to_dict(manifest)
            for manifest in portfolio.manifests
        ],
        "summary": dict(
            portfolio.summary
        ),
    }


def format_contract_manifest_json(
    portfolio: ContractManifestPortfolio,
) -> str:
    return json.dumps(
        contract_manifest_to_dict(
            portfolio
        ),
        indent=2,
        sort_keys=True,
    ) + "\n"


def format_contract_manifest_markdown(
    portfolio: ContractManifestPortfolio,
) -> str:
    lines = [
        "# PropertyOS Contract Manifest",
        "",
        "## Summary",
        "",
    ]

    for key, value in (
        portfolio.summary.items()
    ):
        lines.append(
            f"- {key}: `{value}`"
        )

    for manifest in portfolio.manifests:
        lines.extend(
            [
                "",
                (
                    f"## Plugin: "
                    f"{manifest.plugin_id}"
                ),
                "",
                "| Field | Value |",
                "|---|---|",
                (
                    f"| Module | "
                    f"`{manifest.module_id}` |"
                ),
                (
                    f"| Workspace | "
                    f"`{manifest.workspace_path}` |"
                ),
                (
                    f"| Packages | "
                    f"`{manifest.package_count}` |"
                ),
                (
                    f"| Contract modules | "
                    f"`{manifest.module_count}` |"
                ),
                (
                    f"| Symbols | "
                    f"`{manifest.symbol_count}` |"
                ),
                (
                    f"| Issues | "
                    f"`{len(manifest.issues)}` |"
                ),
                (
                    f"| Valid | "
                    f"`{str(manifest.valid).lower()}` |"
                ),
            ]
        )

        for package in manifest.packages:
            lines.extend(
                [
                    "",
                    (
                        f"### Package: "
                        f"{package.package_name}"
                    ),
                    "",
                    (
                        f"- Version: "
                        f"`{package.version}`"
                    ),
                    (
                        f"- Modules: "
                        f"`{package.module_count}`"
                    ),
                    (
                        f"- Symbols: "
                        f"`{package.symbol_count}`"
                    ),
                ]
            )

            for module in package.modules:
                lines.extend(
                    [
                        "",
                        (
                            f"#### Module: "
                            f"{module.module_id}"
                        ),
                        "",
                        (
                            "| Symbol | Kind | "
                            "Canonical source |"
                        ),
                        "|---|---|---|",
                    ]
                )

                if not module.exports:
                    lines.append(
                        "| _No symbols_ | - | - |"
                    )

                for export in module.exports:
                    lines.append(
                        "| "
                        f"`{export.symbol}` | "
                        f"`{export.export_kind}` | "
                        f"`{export.source_path}` |"
                    )

        if manifest.issues:
            lines.extend(
                [
                    "",
                    "### Issues",
                    "",
                    (
                        "| Code | Module | Symbol | "
                        "Source | Message |"
                    ),
                    "|---|---|---|---|---|",
                ]
            )

            for issue in manifest.issues:
                lines.append(
                    "| "
                    f"`{issue.code}` | "
                    f"`{issue.module_id}` | "
                    f"`{issue.symbol}` | "
                    f"`{issue.source_path}` | "
                    f"{issue.message} |"
                )

    return "\n".join(lines) + "\n"
