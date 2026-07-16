export type DocumentationStatus =
  | "draft"
  | "review"
  | "approved"
  | "deprecated";

export type DocumentationMetadata = {
  title?: string;
  description?: string;
  version?: string;
  status?: DocumentationStatus;
  owner?: string;
  tags: string[];
  related: string[];
};

export type ParsedDocumentationSource = {
  metadata: DocumentationMetadata;
  content: string;
};

const EMPTY_METADATA: DocumentationMetadata = {
  tags: [],
  related: [],
};

function parseList(value: string): string[] {
  const normalized = value.trim();

  if (
    normalized.startsWith("[") &&
    normalized.endsWith("]")
  ) {
    return normalized
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return normalized
    ? [normalized]
    : [];
}

function normalizeStatus(
  value: string,
): DocumentationStatus | undefined {
  const normalized =
    value.trim().toLowerCase();

  if (
    normalized === "draft" ||
    normalized === "review" ||
    normalized === "approved" ||
    normalized === "deprecated"
  ) {
    return normalized;
  }

  return undefined;
}

export function parseDocumentationSource(
  source: string,
): ParsedDocumentationSource {
  const lines = source.split("\n");

  if (lines[0]?.trim() !== "---") {
    return {
      metadata: {
        ...EMPTY_METADATA,
      },
      content: source,
    };
  }

  const closingIndex =
    lines
      .slice(1)
      .findIndex(
        (line) =>
          line.trim() === "---",
      );

  if (closingIndex < 0) {
    return {
      metadata: {
        ...EMPTY_METADATA,
      },
      content: source,
    };
  }

  const metadataLines =
    lines.slice(
      1,
      closingIndex + 1,
    );

  const metadata: DocumentationMetadata = {
    tags: [],
    related: [],
  };

  let activeList:
    | "tags"
    | "related"
    | undefined;

  for (const rawLine of metadataLines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    if (
      activeList &&
      line.startsWith("- ")
    ) {
      metadata[activeList].push(
        line.slice(2).trim(),
      );
      continue;
    }

    const separator =
      line.indexOf(":");

    if (separator < 0) {
      activeList = undefined;
      continue;
    }

    const key =
      line
        .slice(0, separator)
        .trim()
        .toLowerCase();

    const value =
      line
        .slice(separator + 1)
        .trim()
        .replace(
          /^["']|["']$/g,
          "",
        );

    activeList = undefined;

    switch (key) {
      case "title":
        metadata.title = value || undefined;
        break;

      case "description":
        metadata.description =
          value || undefined;
        break;

      case "version":
        metadata.version =
          value || undefined;
        break;

      case "owner":
        metadata.owner =
          value || undefined;
        break;

      case "status":
        metadata.status =
          normalizeStatus(value);
        break;

      case "tags":
        metadata.tags =
          parseList(value);
        activeList =
          value ? undefined : "tags";
        break;

      case "related":
        metadata.related =
          parseList(value);
        activeList =
          value ? undefined : "related";
        break;
    }
  }

  return {
    metadata,
    content:
      lines
        .slice(
          closingIndex + 2,
        )
        .join("\n")
        .replace(
          /^\n+/,
          "",
        ),
  };
}
