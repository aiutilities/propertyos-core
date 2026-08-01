from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping, Sequence, Tuple

from packaging.version import (
    InvalidVersion,
    Version,
)


@dataclass(frozen=True)
class MarketplaceDependencyGraphIssue:
    code: str
    plugin_id: str
    dependency_id: str
    message: str

    def sort_key(
        self,
    ) -> tuple[str, str, str, str]:
        return (
            self.plugin_id,
            self.dependency_id,
            self.code,
            self.message,
        )


@dataclass(frozen=True)
class MarketplaceDependencyGraphPlan:
    valid: bool
    install_order: Tuple[str, ...]
    issues: Tuple[
        MarketplaceDependencyGraphIssue,
        ...,
    ]
    edges: Tuple[
        tuple[str, str],
        ...,
    ]


class MarketplaceDependencyGraphValidator:
    def evaluate(
        self,
        manifests: Mapping[
            str,
            Mapping[str, Any],
        ],
    ) -> MarketplaceDependencyGraphPlan:
        issues: list[
            MarketplaceDependencyGraphIssue
        ] = []

        normalized = self._normalize(
            manifests,
            issues,
        )

        if issues:
            return self._plan(
                install_order=(),
                issues=issues,
                edges=(),
            )

        edges: set[
            tuple[str, str]
        ] = set()

        adjacency = {
            plugin_id: set()
            for plugin_id in normalized
        }

        indegree = {
            plugin_id: 0
            for plugin_id in normalized
        }

        for plugin_id in sorted(
            normalized
        ):
            manifest = normalized[
                plugin_id
            ]

            for dependency in manifest.get(
                "dependencies",
                [],
            ):
                dependency_id = dependency[
                    "pluginId"
                ]
                required_version = dependency[
                    "version"
                ]
                optional = dependency.get(
                    "optional",
                    False,
                )

                if dependency_id == plugin_id:
                    issues.append(
                        MarketplaceDependencyGraphIssue(
                            code="SELF_DEPENDENCY",
                            plugin_id=plugin_id,
                            dependency_id=dependency_id,
                            message=(
                                "Plugin cannot depend "
                                "on itself."
                            ),
                        )
                    )
                    continue

                dependency_manifest = (
                    normalized.get(
                        dependency_id
                    )
                )

                if dependency_manifest is None:
                    if not optional:
                        issues.append(
                            MarketplaceDependencyGraphIssue(
                                code="DEPENDENCY_MISSING",
                                plugin_id=plugin_id,
                                dependency_id=dependency_id,
                                message=(
                                    "Required dependency "
                                    "is absent from the "
                                    "portfolio."
                                ),
                            )
                        )
                    continue

                available_version = (
                    dependency_manifest[
                        "version"
                    ]
                )

                try:
                    required = Version(
                        required_version
                    )
                    available = Version(
                        available_version
                    )
                except InvalidVersion as error:
                    issues.append(
                        MarketplaceDependencyGraphIssue(
                            code=(
                                "INVALID_DEPENDENCY_VERSION"
                            ),
                            plugin_id=plugin_id,
                            dependency_id=dependency_id,
                            message=str(error),
                        )
                    )
                    continue

                if required != available:
                    issues.append(
                        MarketplaceDependencyGraphIssue(
                            code=(
                                "DEPENDENCY_VERSION_MISMATCH"
                            ),
                            plugin_id=plugin_id,
                            dependency_id=dependency_id,
                            message=(
                                f"Requires {required}; "
                                f"portfolio provides "
                                f"{available}."
                            ),
                        )
                    )
                    continue

                edge = (
                    dependency_id,
                    plugin_id,
                )

                if edge not in edges:
                    edges.add(edge)
                    adjacency[
                        dependency_id
                    ].add(plugin_id)
                    indegree[
                        plugin_id
                    ] += 1

        if issues:
            return self._plan(
                install_order=(),
                issues=issues,
                edges=tuple(
                    sorted(edges)
                ),
            )

        ready = sorted(
            plugin_id
            for plugin_id, degree
            in indegree.items()
            if degree == 0
        )

        order = []

        while ready:
            plugin_id = ready.pop(0)
            order.append(plugin_id)

            for dependent in sorted(
                adjacency[plugin_id]
            ):
                indegree[dependent] -= 1

                if indegree[dependent] == 0:
                    ready.append(
                        dependent
                    )
                    ready.sort()

        if len(order) != len(
            normalized
        ):
            cycle_members = sorted(
                plugin_id
                for plugin_id, degree
                in indegree.items()
                if degree > 0
            )

            for plugin_id in cycle_members:
                issues.append(
                    MarketplaceDependencyGraphIssue(
                        code="DEPENDENCY_CYCLE",
                        plugin_id=plugin_id,
                        dependency_id="",
                        message=(
                            "Plugin participates in "
                            "a dependency cycle."
                        ),
                    )
                )

            return self._plan(
                install_order=(),
                issues=issues,
                edges=tuple(
                    sorted(edges)
                ),
            )

        return self._plan(
            install_order=tuple(order),
            issues=(),
            edges=tuple(
                sorted(edges)
            ),
        )

    def require_valid(
        self,
        manifests: Mapping[
            str,
            Mapping[str, Any],
        ],
    ) -> MarketplaceDependencyGraphPlan:
        plan = self.evaluate(
            manifests
        )

        if not plan.valid:
            raise ValueError(
                "; ".join(
                    (
                        f"{issue.plugin_id}:"
                        f"{issue.dependency_id}:"
                        f"{issue.code}:"
                        f"{issue.message}"
                    )
                    for issue in plan.issues
                )
            )

        return plan

    def _normalize(
        self,
        manifests: Mapping[
            str,
            Mapping[str, Any],
        ],
        issues: list[
            MarketplaceDependencyGraphIssue
        ],
    ) -> dict[
        str,
        Mapping[str, Any],
    ]:
        normalized = {}

        for key in sorted(manifests):
            manifest = manifests[key]

            if not isinstance(
                manifest,
                Mapping,
            ):
                issues.append(
                    MarketplaceDependencyGraphIssue(
                        code="INVALID_MANIFEST",
                        plugin_id=key,
                        dependency_id="",
                        message=(
                            "Portfolio manifest must "
                            "be an object."
                        ),
                    )
                )
                continue

            plugin_id = manifest.get(
                "id"
            )

            if plugin_id != key:
                issues.append(
                    MarketplaceDependencyGraphIssue(
                        code=(
                            "PORTFOLIO_KEY_MISMATCH"
                        ),
                        plugin_id=key,
                        dependency_id="",
                        message=(
                            "Portfolio key does not "
                            "match manifest plugin ID."
                        ),
                    )
                )
                continue

            if plugin_id in normalized:
                issues.append(
                    MarketplaceDependencyGraphIssue(
                        code="DUPLICATE_PLUGIN",
                        plugin_id=plugin_id,
                        dependency_id="",
                        message=(
                            "Duplicate plugin ID "
                            "in portfolio."
                        ),
                    )
                )
                continue

            dependencies = manifest.get(
                "dependencies",
                [],
            )

            if not isinstance(
                dependencies,
                list,
            ):
                issues.append(
                    MarketplaceDependencyGraphIssue(
                        code=(
                            "INVALID_DEPENDENCIES"
                        ),
                        plugin_id=plugin_id,
                        dependency_id="",
                        message=(
                            "Dependencies must be "
                            "an array."
                        ),
                    )
                )
                continue

            normalized[
                plugin_id
            ] = manifest

        return normalized

    @staticmethod
    def _plan(
        install_order: Sequence[str],
        issues: Sequence[
            MarketplaceDependencyGraphIssue
        ],
        edges: Sequence[
            tuple[str, str]
        ],
    ) -> MarketplaceDependencyGraphPlan:
        ordered_issues = tuple(
            sorted(
                issues,
                key=(
                    lambda issue:
                    issue.sort_key()
                ),
            )
        )

        return MarketplaceDependencyGraphPlan(
            valid=not ordered_issues,
            install_order=tuple(
                install_order
            ),
            issues=ordered_issues,
            edges=tuple(
                sorted(edges)
            ),
        )


__all__ = [
    "MarketplaceDependencyGraphIssue",
    "MarketplaceDependencyGraphPlan",
    "MarketplaceDependencyGraphValidator",
]
