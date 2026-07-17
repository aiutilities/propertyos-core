import Link from "next/link";

import ReactMarkdown, {
  type Components,
} from "react-markdown";

import remarkGfm from "remark-gfm";

import {
  MermaidDiagram,
} from "./MermaidDiagram";

import {
  createHeadingId,
} from "@/lib/documentation";

type MarkdownRendererProps = {
  source: string;
};

function normalizeDocumentationLink(
  href?: string,
): string | undefined {
  if (!href) {
    return undefined;
  }

  if (
    href.startsWith(
      "http://",
    ) ||
    href.startsWith(
      "https://",
    ) ||
    href.startsWith(
      "mailto:",
    ) ||
    href.startsWith(
      "#",
    ) ||
    href.startsWith(
      "/",
    )
  ) {
    return href;
  }

  const [
    pathPart,
    anchor,
  ] = href.split(
    "#",
    2,
  );

  if (
    !pathPart ||
    !pathPart
      .toLowerCase()
      .endsWith(
        ".md",
      )
  ) {
    return href;
  }

  const normalizedPath =
    pathPart
      .replace(
        /\.md$/i,
        "",
      )
      .split("/")
      .filter(
        (segment) =>
          segment &&
          segment !== ".",
      )
      .map(
        (segment) =>
          segment
            .trim()
            .toLowerCase()
            .replace(
              /[_\s]+/g,
              "-",
            ),
      )
      .join("/");

  const documentationHref =
    `/docs/${normalizedPath}`;

  return anchor
    ? `${documentationHref}#${anchor}`
    : documentationHref;
}

function createHeadingComponent(
  level:
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6,
) {
  return function DocumentationHeading({
    children,
  }: {
    children?:
      React.ReactNode;
  }) {
    const title =
      Array.isArray(
        children,
      )
        ? children.join("")
        : String(
            children ?? "",
          );

    const id =
      createHeadingId(
        title,
      );

    const Tag =
      `h${level}` as keyof
        React.JSX.IntrinsicElements;

    return (
      <Tag id={id}>
        <a
          aria-label={`Link to ${title}`}
          className="documentation-heading-link"
          href={`#${id}`}
        >
          {children}
        </a>
      </Tag>
    );
  };
}

const components:
  Components = {
    h1() {
      return null;
         },

    h2:
      createHeadingComponent(
        2,
      ),

    h3:
      createHeadingComponent(
        3,
      ),

    h4:
      createHeadingComponent(
        4,
      ),

    h5:
      createHeadingComponent(
        5,
      ),

    h6:
      createHeadingComponent(
        6,
      ),

    a({
      href,
      children,
      ...props
    }) {
      const normalizedHref =
        normalizeDocumentationLink(
          href,
        );

      const isExternal =
        normalizedHref
          ?.startsWith(
            "http://",
          ) ||
        normalizedHref
          ?.startsWith(
            "https://",
          );

      if (
        isExternal &&
        normalizedHref
      ) {
        return (
          <a
            {...props}
            href={
              normalizedHref
            }
            rel="noreferrer"
            target="_blank"
          >
            {children}
          </a>
        );
      }

      if (
        normalizedHref
          ?.startsWith(
            "/",
          )
      ) {
        return (
          <Link
            href={
              normalizedHref
            }
          >
            {children}
          </Link>
        );
      }

      return (
        <a
          {...props}
          href={
            normalizedHref
          }
        >
          {children}
        </a>
      );
    },

    table({
      children,
    }) {
      return (
        <div className="documentation-table-wrapper">
          <table>
            {children}
          </table>
        </div>
      );
    },

    pre({
      children,
    }) {
      return (
        <pre className="documentation-code-block">
          {children}
        </pre>
      );
    },

    code({
      className,
      children,
      ...props
    }) {
      const language =
        className
          ?.replace(
            "language-",
            "",
          )
          .trim()
          .toLowerCase();

      if (
        language ===
        "mermaid"
      ) {
        return (
          <span className="documentation-mermaid-container">
            <MermaidDiagram
              source={
                String(
                  children,
                ).replace(
                  /\n$/,
                  "",
                )
              }
            />
          </span>
        );
      }

      const isBlock =
        Boolean(
          className,
        );

      return (
        <code
          {...props}
          className={
            isBlock
              ? className
              : "documentation-inline-code"
          }
        >
          {children}
        </code>
      );
    },

    blockquote({
      children,
    }) {
      return (
        <blockquote className="documentation-blockquote">
          {children}
        </blockquote>
      );
    },
  };

export function MarkdownRenderer({
  source,
}: MarkdownRendererProps) {
  return (
    <article className="documentation-content">
      <ReactMarkdown
        components={
          components
        }
        remarkPlugins={[
          remarkGfm,
        ]}
        skipHtml
      >
        {source}
      </ReactMarkdown>
    </article>
  );
}
