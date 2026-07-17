"use client";

import {
  useEffect,
  useId,
  useState,
} from "react";

type MermaidDiagramProps = {
  source: string;
};

type DiagramState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      svg: string;
    }
  | {
      status: "error";
      message: string;
    };

export function MermaidDiagram({
  source,
}: MermaidDiagramProps) {
  const reactId =
    useId();

  const diagramId =
    `propertyos-mermaid-${reactId.replace(
      /[^a-zA-Z0-9_-]/g,
      "",
    )}`;

  const [
    state,
    setState,
  ] =
    useState<DiagramState>({
      status:
        "loading",
    });

  useEffect(
    () => {
      let active =
        true;

      async function renderDiagram() {
        try {
          setState({
            status:
              "loading",
          });

          const module =
            await import(
              "mermaid"
            );

          const mermaid =
            module.default;

          mermaid.initialize({
            startOnLoad:
              false,

            securityLevel:
              "strict",

            theme:
              "default",

            flowchart: {
              htmlLabels:
                false,
            },
          });

          const result =
            await mermaid.render(
              diagramId,
              source,
            );

          if (!active) {
            return;
          }

          setState({
            status:
              "ready",

            svg:
              result.svg,
          });
        } catch (error) {
          if (!active) {
            return;
          }

          setState({
            status:
              "error",

            message:
              error instanceof
              Error
                ? error.message
                : "Unable to render Mermaid diagram",
          });
        }
      }

      void renderDiagram();

      return () => {
        active =
          false;
      };
    },
    [
      diagramId,
      source,
    ],
  );

  if (
    state.status ===
    "loading"
  ) {
    return (
      <span
        aria-live="polite"
        className="documentation-mermaid-loading"
      >
        Rendering diagram…
      </span>
    );
  }

  if (
    state.status ===
    "error"
  ) {
    return (
      <span
        className="documentation-mermaid-error"
        role="alert"
      >
        <strong>
          Diagram could not be rendered
        </strong>

        <span>
          {state.message}
        </span>

        <code>
          {source}
        </code>
      </span>
    );
  }

  return (
    <span
      aria-label="Architecture diagram"
      className="documentation-mermaid"
      dangerouslySetInnerHTML={{
        __html:
          state.svg,
      }}
      role="img"
    />
  );
}
