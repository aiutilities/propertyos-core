from __future__ import annotations

from pathlib import Path
import json

from .approved_host_surface_models import (
    ApprovedHostSurface,
)
from .approved_host_surface_models import (
    ApprovedHostSymbol,
)


DEFAULT_APPROVED_HOST_SURFACE_PATH = (
    Path(__file__).resolve().parent
    / "contracts"
    / "approved_host_surface.json"
)


class ApprovedHostSurfaceError(ValueError):
    pass


def load_approved_host_surface(
    path: Path | None = None,
) -> ApprovedHostSurface:
    resolved_path = (
        DEFAULT_APPROVED_HOST_SURFACE_PATH
        if path is None
        else path
    )

    data = json.loads(
        resolved_path.read_text(
            encoding="utf-8"
        )
    )

    if data.get("schemaVersion") != "1.0.0":
        raise ApprovedHostSurfaceError(
            "Unsupported approved host-surface "
            "schema version."
        )

    if data.get("sourceStrategy") != (
        "portable-facade"
    ):
        raise ApprovedHostSurfaceError(
            "Approved host surface must target "
            "portable-facade."
        )

    policy = data.get("policy")

    if not isinstance(policy, dict):
        raise ApprovedHostSurfaceError(
            "Approved host-surface policy is missing."
        )

    if policy.get("defaultDecision") != "deny":
        raise ApprovedHostSurfaceError(
            "Approved host surface must default deny."
        )

    symbols = []
    seen = set()

    for module in data.get("modules", []):
        module_id = module.get("moduleId")

        if not isinstance(module_id, str) or not module_id:
            raise ApprovedHostSurfaceError(
                "Approved module ID is invalid."
            )

        for item in module.get("symbols", []):
            symbol = item.get("symbol")
            kind = item.get("kind")
            source_path = item.get("sourcePath")
            portable = item.get("portable")

            if (
                not isinstance(symbol, str)
                or not symbol
                or kind not in ("runtime", "type")
                or not isinstance(source_path, str)
                or not source_path
                or portable is not True
            ):
                raise ApprovedHostSurfaceError(
                    "Approved host symbol is invalid."
                )

            key = (
                module_id,
                symbol,
                kind,
            )

            if key in seen:
                raise ApprovedHostSurfaceError(
                    "Duplicate approved host symbol: "
                    f"{module_id}:{symbol}:{kind}"
                )

            seen.add(key)

            symbols.append(
                ApprovedHostSymbol(
                    module_id=module_id,
                    symbol=symbol,
                    kind=kind,
                    source_path=source_path,
                    portable=portable,
                )
            )

    if not symbols:
        raise ApprovedHostSurfaceError(
            "Approved host surface is empty."
        )

    return ApprovedHostSurface(
        schema_version=data["schemaVersion"],
        package_name=data["packageName"],
        host_api_version=data["hostApiVersion"],
        source_strategy=data["sourceStrategy"],
        default_decision=policy[
            "defaultDecision"
        ],
        repository_implementation_exports_allowed=(
            policy[
                "repositoryImplementationExportsAllowed"
            ]
        ),
        unlisted_symbols_allowed=policy[
            "unlistedSymbolsAllowed"
        ],
        symbols=tuple(
            sorted(
                symbols,
                key=lambda item: (
                    item.module_id,
                    item.symbol,
                    item.kind,
                    item.source_path,
                ),
            )
        ),
    )
