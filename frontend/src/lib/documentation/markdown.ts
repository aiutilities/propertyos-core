import type {
  DocumentationHeading,
} from "./types";

const H1_PATTERN =
  /^#\s+(.+?)\s*$/m;

const HEADING_PATTERN =
  /^(#{2,6})\s+(.+?)\s*$/gm;

const MARKDOWN_FORMATTING_PATTERN =
  /[`*_~]/g;

const UNSAFE_SLUG_CHARACTER_PATTERN =
  /[^a-z0-9\s-]/g;

const REPEATED_SPACE_PATTERN =
  /\s+/g;

export function extractDocumentTitle(
  source: string,
  fallback: string,
): string {
  const match =
    H1_PATTERN.exec(
      source,
    );

  return (
    match?.[1]
      ?.trim() ||
    fallback
  );
}

export function extractDescription(
  source: string,
): string | undefined {
  const lines =
    source.split(
      "\n",
    );

  let passedTitle =
    false;

  const paragraphs:
    string[] = [];

  for (const rawLine of lines) {
    const line =
      rawLine.trim();

    if (!passedTitle) {
      if (
        line.startsWith(
          "# ",
        )
      ) {
        passedTitle =
          true;
      }

      continue;
    }

    if (!line) {
      if (
        paragraphs.length >
        0
      ) {
        break;
      }

      continue;
    }

    if (
      line.startsWith(
        "#",
      ) ||
      line.startsWith(
        "```",
      ) ||
      line.startsWith(
        "|",
      ) ||
      line.startsWith(
        "- ",
      ) ||
      line.startsWith(
        "* ",
      )
    ) {
      continue;
    }

    paragraphs.push(
      line,
    );
  }

  if (
    paragraphs.length ===
    0
  ) {
    return undefined;
  }

  return paragraphs.join(
    " ",
  );
}

export function createHeadingId(
  title: string,
): string {
  return title
    .toLowerCase()
    .replace(
      MARKDOWN_FORMATTING_PATTERN,
      "",
    )
    .replace(
      UNSAFE_SLUG_CHARACTER_PATTERN,
      "",
    )
    .trim()
    .replace(
      REPEATED_SPACE_PATTERN,
      "-",
    );
}

export function extractHeadings(
  source: string,
): DocumentationHeading[] {
  const headings:
    DocumentationHeading[] =
    [];

  for (
    const match
    of source.matchAll(
      HEADING_PATTERN,
    )
  ) {
    const markers =
      match[1];

    const title =
      match[2]?.trim();

    if (
      !markers ||
      !title
    ) {
      continue;
    }

    headings.push({
      id:
        createHeadingId(
          title,
        ),

      title,

      level:
        markers.length,
    });
  }

  return headings;
}

export function removeMarkdownFormatting(
  source: string,
): string {
  return source
    .replace(
      /```[\s\S]*?```/g,
      " ",
    )
    .replace(
      /`([^`]+)`/g,
      "$1",
    )
    .replace(
      /!\[[^\]]*]\([^)]*\)/g,
      " ",
    )
    .replace(
      /\[([^\]]+)]\([^)]*\)/g,
      "$1",
    )
    .replace(
      /^#{1,6}\s+/gm,
      "",
    )
    .replace(
      /^[>*+-]\s+/gm,
      "",
    )
    .replace(
      MARKDOWN_FORMATTING_PATTERN,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}
