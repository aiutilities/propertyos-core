from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping, Tuple

from .marketplace_admission_validator import (
    MarketplaceAdmissionDecision,
    MarketplaceAdmissionIssue,
    MarketplaceAdmissionRequest,
    MarketplaceAdmissionValidator,
)
from .marketplace_contract_v1_adapter import (
    MarketplaceContractV1Adapter,
    MarketplaceContractV1Context,
)
from .marketplace_dependency_graph import (
    MarketplaceDependencyGraphIssue,
    MarketplaceDependencyGraphPlan,
    MarketplaceDependencyGraphValidator,
)


@dataclass(frozen=True)
class MarketplacePortfolioAdmissionIssue:
    stage: str
    plugin_id: str
    code: str
    path: str
    message: str

    def sort_key(
        self,
    ) -> tuple[str, str, str, str, str]:
        return (
            self.stage,
            self.plugin_id,
            self.path,
            self.code,
            self.message,
        )


@dataclass(frozen=True)
class MarketplacePortfolioAdmissionRequest:
    legacy_manifests: Mapping[
        str,
        Mapping[str, Any],
    ]
    contract_contexts: Mapping[
        str,
        MarketplaceContractV1Context,
    ]
    active_host_api_version: str
    active_node_version: str
    available_contract_versions: Mapping[
        str,
        str,
    ]
    installed_plugin_versions: Mapping[
        str,
        str,
    ]
    trusted_publishers: Mapping[
        str,
        Tuple[str, ...],
    ]
    archive_paths: Mapping[
        str,
        Path,
    ] | None = None
    allow_downgrade: bool = False


@dataclass(frozen=True)
class MarketplacePortfolioInstallStep:
    sequence: int
    plugin_id: str
    version: str
    dependencies: Tuple[str, ...]


@dataclass(frozen=True)
class MarketplacePortfolioAdmissionPlan:
    accepted: bool
    decision: str
    manifests: Mapping[
        str,
        Mapping[str, Any],
    ]
    install_order: Tuple[str, ...]
    install_steps: Tuple[
        MarketplacePortfolioInstallStep,
        ...,
    ]
    issues: Tuple[
        MarketplacePortfolioAdmissionIssue,
        ...,
    ]


class MarketplacePortfolioAdmissionPlanner:
    def __init__(
        self,
        contract_adapter: MarketplaceContractV1Adapter,
        admission_validator: MarketplaceAdmissionValidator,
        graph_validator: MarketplaceDependencyGraphValidator,
    ) -> None:
        self._contract_adapter = contract_adapter
        self._admission_validator = (
            admission_validator
        )
        self._graph_validator = graph_validator

    def evaluate(
        self,
        request: MarketplacePortfolioAdmissionRequest,
    ) -> MarketplacePortfolioAdmissionPlan:
        issues: list[
            MarketplacePortfolioAdmissionIssue
        ] = []

        try:
            manifests = (
                self._contract_adapter
                .adapt_portfolio(
                    request.legacy_manifests,
                    request.contract_contexts,
                )
            )
        except Exception as error:
            issues.append(
                MarketplacePortfolioAdmissionIssue(
                    stage="adaptation",
                    plugin_id="",
                    code="ADAPTATION_FAILED",
                    path="$",
                    message=str(error),
                )
            )

            return self._plan(
                manifests={},
                install_order=(),
                install_steps=(),
                issues=issues,
            )

        available_plugin_versions = {
            plugin_id: manifest["version"]
            for plugin_id, manifest
            in manifests.items()
        }

        archive_paths = (
            {}
            if request.archive_paths is None
            else request.archive_paths
        )

        for plugin_id in sorted(
            manifests
        ):
            decision = (
                self._admission_validator
                .evaluate(
                    MarketplaceAdmissionRequest(
                        manifest=manifests[
                            plugin_id
                        ],
                        active_host_api_version=(
                            request
                            .active_host_api_version
                        ),
                        active_node_version=(
                            request
                            .active_node_version
                        ),
                        available_contract_versions=(
                            request
                            .available_contract_versions
                        ),
                        available_plugin_versions=(
                            available_plugin_versions
                        ),
                        installed_plugin_versions=(
                            request
                            .installed_plugin_versions
                        ),
                        trusted_publishers=(
                            request
                            .trusted_publishers
                        ),
                        archive_path=(
                            archive_paths.get(
                                plugin_id
                            )
                        ),
                        allow_downgrade=(
                            request
                            .allow_downgrade
                        ),
                    )
                )
            )

            self._append_admission_issues(
                plugin_id,
                decision,
                issues,
            )

        if issues:
            return self._plan(
                manifests=manifests,
                install_order=(),
                install_steps=(),
                issues=issues,
            )

        graph = (
            self._graph_validator
            .evaluate(
                manifests
            )
        )

        self._append_graph_issues(
            graph,
            issues,
        )

        if issues:
            return self._plan(
                manifests=manifests,
                install_order=(),
                install_steps=(),
                issues=issues,
            )

        steps = tuple(
            MarketplacePortfolioInstallStep(
                sequence=index,
                plugin_id=plugin_id,
                version=manifests[
                    plugin_id
                ][
                    "version"
                ],
                dependencies=tuple(
                    sorted(
                        dependency[
                            "pluginId"
                        ]
                        for dependency
                        in manifests[
                            plugin_id
                        ].get(
                            "dependencies",
                            [],
                        )
                        if not dependency.get(
                            "optional",
                            False,
                        )
                    )
                ),
            )
            for index, plugin_id
            in enumerate(
                graph.install_order,
                start=1,
            )
        )

        return self._plan(
            manifests=manifests,
            install_order=(
                graph.install_order
            ),
            install_steps=steps,
            issues=(),
        )

    def require_accepted(
        self,
        request: MarketplacePortfolioAdmissionRequest,
    ) -> MarketplacePortfolioAdmissionPlan:
        plan = self.evaluate(
            request
        )

        if not plan.accepted:
            raise ValueError(
                "; ".join(
                    (
                        f"{issue.stage}:"
                        f"{issue.plugin_id}:"
                        f"{issue.path}:"
                        f"{issue.code}:"
                        f"{issue.message}"
                    )
                    for issue in plan.issues
                )
            )

        return plan

    @staticmethod
    def _append_admission_issues(
        plugin_id: str,
        decision: MarketplaceAdmissionDecision,
        issues: list[
            MarketplacePortfolioAdmissionIssue
        ],
    ) -> None:
        for issue in decision.issues:
            issues.append(
                MarketplacePortfolioAdmissionIssue(
                    stage="admission",
                    plugin_id=plugin_id,
                    code=issue.code,
                    path=issue.path,
                    message=issue.message,
                )
            )

    @staticmethod
    def _append_graph_issues(
        graph: MarketplaceDependencyGraphPlan,
        issues: list[
            MarketplacePortfolioAdmissionIssue
        ],
    ) -> None:
        for issue in graph.issues:
            issues.append(
                MarketplacePortfolioAdmissionIssue(
                    stage="dependency-graph",
                    plugin_id=(
                        issue.plugin_id
                    ),
                    code=issue.code,
                    path=(
                        "$.dependencies"
                    ),
                    message=issue.message,
                )
            )

    @staticmethod
    def _plan(
        manifests: Mapping[
            str,
            Mapping[str, Any],
        ],
        install_order: Tuple[str, ...],
        install_steps: Tuple[
            MarketplacePortfolioInstallStep,
            ...,
        ],
        issues: list[
            MarketplacePortfolioAdmissionIssue
        ] | Tuple[
            MarketplacePortfolioAdmissionIssue,
            ...,
        ],
    ) -> MarketplacePortfolioAdmissionPlan:
        ordered_issues = tuple(
            sorted(
                issues,
                key=(
                    lambda issue:
                    issue.sort_key()
                ),
            )
        )

        accepted = not ordered_issues

        return MarketplacePortfolioAdmissionPlan(
            accepted=accepted,
            decision=(
                "ACCEPT"
                if accepted
                else "REJECT"
            ),
            manifests={
                plugin_id: manifests[
                    plugin_id
                ]
                for plugin_id in sorted(
                    manifests
                )
            },
            install_order=tuple(
                install_order
            ),
            install_steps=tuple(
                install_steps
            ),
            issues=ordered_issues,
        )


__all__ = [
    "MarketplacePortfolioAdmissionIssue",
    "MarketplacePortfolioAdmissionPlan",
    "MarketplacePortfolioAdmissionPlanner",
    "MarketplacePortfolioAdmissionRequest",
    "MarketplacePortfolioInstallStep",
]
