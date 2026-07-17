from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from tools.knowledge_engine.controller_models import (
    ControllerKnowledge,
    ControllerKnowledgeManifest,
    ControllerSourceReference,
    RouteKnowledge,
)


HTTP_DECORATORS = {
    "Get": "GET",
    "Post": "POST",
    "Put": "PUT",
    "Patch": "PATCH",
    "Delete": "DELETE",
    "Options": "OPTIONS",
    "Head": "HEAD",
    "All": "ALL",
}

DISCOVERY_ROOTS = (
    Path("backend/src/core"),
    Path("backend/src/plugins"),
    Path("backend/src/config"),
    Path("backend/src/database"),
)


@dataclass(frozen=True)
class ParsedDecorator:
    name: str
    arguments: str
    start: int
    end: int


@dataclass(frozen=True)
class ParsedMethod:
    name: str
    start: int


class ControllerScanner:
    def __init__(self, repository_root: Path) -> None:
        self.repository_root = repository_root.resolve()

    def scan(self) -> ControllerKnowledgeManifest:
        controllers = [
            controller
            for path in self._controller_files()
            if (
                controller :=
                self._scan_controller(path)
            ) is not None
        ]

        controllers.sort(
            key=lambda item: (
                item.module_id,
                item.class_name,
                item.source.path,
            )
        )

        route_count = sum(
            len(controller.routes)
            for controller in controllers
        )

        return ControllerKnowledgeManifest(
            schema_version="1.0.0",
            controller_count=len(controllers),
            route_count=route_count,
            controllers=tuple(controllers),
        )

    def _controller_files(self) -> list[Path]:
        files: set[Path] = set()

        for relative_root in DISCOVERY_ROOTS:
            root = self.repository_root / relative_root

            if not root.exists():
                continue

            for path in root.rglob("*.controller.ts"):
                relative_path = path.relative_to(
                    self.repository_root
                )

                if self._is_ignored(relative_path):
                    continue

                files.add(path.resolve())

        return sorted(
            files,
            key=lambda path: path.relative_to(
                self.repository_root
            ).as_posix(),
        )

    @staticmethod
    def _is_ignored(relative_path: Path) -> bool:
        parts = relative_path.parts

        return (
            len(parts) >= 2
            and parts[0] == "backend"
            and parts[1] == "backend"
        )

    def _scan_controller(
        self,
        path: Path,
    ) -> ControllerKnowledge | None:
        text = path.read_text(encoding="utf-8")

        class_match = re.search(
            r"\bexport\s+class\s+"
            r"([A-Za-z_][A-Za-z0-9_]*)",
            text,
        )

        if class_match is None:
            return None

        class_name = class_match.group(1)
        class_start = class_match.start()

        decorators = self._parse_decorators(text)

        controller_decorator = self._nearest_decorator(
            decorators=decorators,
            name="Controller",
            before=class_start,
        )

        if controller_decorator is None:
            return None

        relative_path = path.relative_to(
            self.repository_root
        ).as_posix()

        module_id = self._module_id(
            Path(relative_path)
        )

        controller_id = self._controller_id(
            module_id=module_id,
            class_name=class_name,
        )

        base_path = self._extract_string_argument(
            controller_decorator.arguments
        )

        class_decorators = tuple(
            decorator
            for decorator in decorators
            if (
                decorator.end <= class_start
                and decorator.start
                >= controller_decorator.start - 2000
            )
        )

        guards = self._class_guards(
            class_decorators
        )

        bearer_auth = any(
            decorator.name == "ApiBearerAuth"
            for decorator in class_decorators
        )

        methods = self._parse_methods(
            text=text,
            start=class_match.end(),
        )

        routes = self._routes(
            text=text,
            decorators=decorators,
            methods=methods,
            class_start=class_start,
            controller_id=controller_id,
            module_id=module_id,
            base_path=base_path,
            source_path=relative_path,
            controller_class_name=class_name,
            bearer_auth=bearer_auth,
        )

        return ControllerKnowledge(
            id=controller_id,
            module_id=module_id,
            class_name=class_name,
            base_path=self._normalise_path(
                base_path
            ),
            guards=guards,
            bearer_auth=bearer_auth,
            routes=routes,
            source=ControllerSourceReference(
                path=relative_path,
                line=self._line_number(
                    text,
                    controller_decorator.start,
                ),
            ),
        )

    def _routes(
        self,
        text: str,
        decorators: list[ParsedDecorator],
        methods: list[ParsedMethod],
        class_start: int,
        controller_id: str,
        module_id: str,
        base_path: str,
        source_path: str,
        controller_class_name: str,
        bearer_auth: bool,
    ) -> tuple[RouteKnowledge, ...]:
        routes: list[RouteKnowledge] = []

        for method_index, method in enumerate(methods):
            lower_bound = (
                class_start
                if method_index == 0
                else methods[method_index - 1].start
            )

            method_decorators = [
                decorator
                for decorator in decorators
                if (
                    lower_bound
                    < decorator.start
                    < method.start
                )
            ]

            route_decorators = [
                decorator
                for decorator in method_decorators
                if decorator.name in HTTP_DECORATORS
            ]

            if not route_decorators:
                continue

            permissions = self._permissions(
                method_decorators
            )

            for route_decorator in route_decorators:
                route_path = self._extract_string_argument(
                    route_decorator.arguments
                )

                full_path = self._join_paths(
                    base_path,
                    route_path,
                )

                http_method = HTTP_DECORATORS[
                    route_decorator.name
                ]

                route_id = (
                    f"{controller_id}:"
                    f"{http_method.lower()}:"
                    f"{method.name}:"
                    f"{full_path}"
                )

                routes.append(
                    RouteKnowledge(
                        id=route_id,
                        controller_id=controller_id,
                        controller_class_name=controller_class_name,
                        module_id=module_id,
                        http_method=http_method,
                        path=self._normalise_relative_path(
                            route_path
                        ),
                        full_path=full_path,
                        handler=method.name,
                        handler_line=self._line_number(
                            text,
                            method.start,
                        ),
                        permissions=permissions,
                        bearer_auth=bearer_auth,
                        source=ControllerSourceReference(
                            path=source_path,
                            line=self._line_number(
                                text,
                                route_decorator.start,
                            ),
                        ),
                    )
                )

        routes.sort(
            key=lambda item: (
                item.full_path,
                item.http_method,
                item.handler,
                item.source.line,
            )
        )

        return tuple(routes)

    @staticmethod
    def _parse_methods(
        text: str,
        start: int,
    ) -> list[ParsedMethod]:
        pattern = re.compile(
            r"(?m)^[ \t]*"
            r"(?:(?:public|private|protected)\s+)?"
            r"(?:async\s+)?"
            r"([A-Za-z_][A-Za-z0-9_]*)"
            r"\s*\("
        )

        methods: list[ParsedMethod] = []

        for match in pattern.finditer(
            text,
            start,
        ):
            name = match.group(1)

            if name == "constructor":
                continue

            methods.append(
                ParsedMethod(
                    name=name,
                    start=match.start(),
                )
            )

        return methods

    @staticmethod
    def _parse_decorators(
        text: str,
    ) -> list[ParsedDecorator]:
        decorators: list[ParsedDecorator] = []
        index = 0
        length = len(text)

        while index < length:
            if text[index] != "@":
                index += 1
                continue

            name_match = re.match(
                r"@([A-Za-z_][A-Za-z0-9_]*)",
                text[index:],
            )

            if name_match is None:
                index += 1
                continue

            name = name_match.group(1)
            decorator_start = index
            cursor = index + name_match.end()

            while (
                cursor < length
                and text[cursor].isspace()
            ):
                cursor += 1

            arguments = ""

            if (
                cursor < length
                and text[cursor] == "("
            ):
                closing = (
                    ControllerScanner
                    ._matching_parenthesis(
                        text,
                        cursor,
                    )
                )

                if closing is None:
                    index += 1
                    continue

                arguments = text[
                    cursor + 1:closing
                ]

                decorator_end = closing + 1
            else:
                decorator_end = cursor

            decorators.append(
                ParsedDecorator(
                    name=name,
                    arguments=arguments,
                    start=decorator_start,
                    end=decorator_end,
                )
            )

            index = decorator_end

        return decorators

    @staticmethod
    def _matching_parenthesis(
        text: str,
        opening: int,
    ) -> int | None:
        depth = 0
        quote: str | None = None
        escaped = False

        for index in range(opening, len(text)):
            character = text[index]

            if escaped:
                escaped = False
                continue

            if character == "\\":
                escaped = True
                continue

            if quote is not None:
                if character == quote:
                    quote = None
                continue

            if character in {"'", '"', "`"}:
                quote = character
                continue

            if character == "(":
                depth += 1
            elif character == ")":
                depth -= 1

                if depth == 0:
                    return index

        return None

    @staticmethod
    def _nearest_decorator(
        decorators: list[ParsedDecorator],
        name: str,
        before: int,
    ) -> ParsedDecorator | None:
        matching = [
            decorator
            for decorator in decorators
            if (
                decorator.name == name
                and decorator.end <= before
            )
        ]

        if not matching:
            return None

        return max(
            matching,
            key=lambda decorator: decorator.end,
        )

    @staticmethod
    def _extract_string_argument(
        arguments: str,
    ) -> str:
        stripped = arguments.strip()

        if not stripped:
            return ""

        match = re.search(
            r"""['"`]([^'"`]*)['"`]""",
            stripped,
        )

        if match is None:
            return ""

        return match.group(1)

    @staticmethod
    def _class_guards(
        decorators: tuple[ParsedDecorator, ...],
    ) -> tuple[str, ...]:
        guards: set[str] = set()

        for decorator in decorators:
            if decorator.name != "UseGuards":
                continue

            for guard in decorator.arguments.split(","):
                value = guard.strip()

                if re.fullmatch(
                    r"[A-Za-z_][A-Za-z0-9_]*",
                    value,
                ):
                    guards.add(value)

        return tuple(sorted(guards))

    @staticmethod
    def _permissions(
        decorators: list[ParsedDecorator],
    ) -> tuple[str, ...]:
        permissions: set[str] = set()

        for decorator in decorators:
            if decorator.name not in {
                "RequirePermission",
                "RequirePermissions",
                "Permissions",
            }:
                continue

            for raw_value in decorator.arguments.split(","):
                value = re.sub(
                    r"\s+",
                    "",
                    raw_value,
                )

                if value:
                    permissions.add(value)

        return tuple(sorted(permissions))

    @staticmethod
    def _module_id(
        relative_path: Path,
    ) -> str:
        parts = relative_path.parts

        if (
            len(parts) >= 4
            and parts[:3]
            == ("backend", "src", "core")
        ):
            return parts[3]

        if (
            len(parts) >= 4
            and parts[:3]
            == ("backend", "src", "plugins")
        ):
            return f"plugin:{parts[3]}"

        if (
            len(parts) >= 4
            and parts[:3]
            == ("backend", "src", "config")
        ):
            return "config"

        if (
            len(parts) >= 4
            and parts[:3]
            == ("backend", "src", "database")
        ):
            return "database"

        return "unknown"

    @staticmethod
    def _controller_id(
        module_id: str,
        class_name: str,
    ) -> str:
        class_id = re.sub(
            r"Controller$",
            "",
            class_name,
        )

        class_id = re.sub(
            r"(?<!^)(?=[A-Z])",
            "-",
            class_id,
        ).lower()

        return f"{module_id}:{class_id}"

    @staticmethod
    def _normalise_relative_path(
        path: str,
    ) -> str:
        return path.strip().strip("/")

    @staticmethod
    def _normalise_path(
        path: str,
    ) -> str:
        segments = [
            segment
            for segment in path.strip().split("/")
            if segment
        ]

        if not segments:
            return "/"

        return "/" + "/".join(segments)

    @classmethod
    def _join_paths(
        cls,
        base_path: str,
        route_path: str,
    ) -> str:
        segments = []

        for value in (
            base_path,
            route_path,
        ):
            segments.extend(
                segment
                for segment in value.strip().split("/")
                if segment
            )

        if not segments:
            return "/"

        return "/" + "/".join(segments)

    @staticmethod
    def _line_number(
        text: str,
        offset: int,
    ) -> int:
        return text.count("\n", 0, offset) + 1
