import "server-only";

import {
  access,
  readFile,
  readdir,
} from "node:fs/promises";

import path from "node:path";

import {
  DOCUMENTATION_CATEGORY_LABELS,
  DOCUMENTATION_CATEGORY_ORDER,
  DOCUMENTATION_EXCLUDED_FILES,
  DOCUMENTATION_ROOT_ROUTE,
} from "./config";

import {
  extractDescription,
  extractDocumentTitle,
  extractHeadings,
  removeMarkdownFormatting,
} from "./markdown";

import {
  parseDocumentationSource,
} from "./metadata";

import type {
  DocumentationBreadcrumb,
  DocumentationCategory,
  DocumentationDocument,
  DocumentationNavigationGroup,
  DocumentationNavigationItem,
  DocumentationSearchEntry,
} from "./types";

const REPOSITORY_ROOT =
  path.resolve(
    process.cwd(),
    "..",
  );

const DOCUMENTATION_ROOT =
  path.join(
    REPOSITORY_ROOT,
    "docs",
  );

function normalizeSegment(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /\.md$/i,
      "",
    )
    .replace(
      /[_\s]+/g,
      "-",
    );
}

function formatLabel(
  value: string,
): string {
  return value
    .replace(
      /\.md$/i,
      "",
    )
    .replace(
      /[-_]+/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function categoryFromRelativePath(
  relativePath: string,
): DocumentationCategory {
  const parts =
    relativePath.split(
      path.sep,
    );

  if (
    parts.length === 1
  ) {
    return "general";
  }

  const category =
    normalizeSegment(
      parts[0] ?? "",
    );

  if (
    DOCUMENTATION_CATEGORY_ORDER.includes(
      category as
        DocumentationCategory,
    )
  ) {
    return category as
      DocumentationCategory;
  }

  return "general";
}

function relativePathToSlug(
  relativePath: string,
): string[] {
  const withoutExtension =
    relativePath.replace(
      /\.md$/i,
      "",
    );

  return withoutExtension
    .split(
      path.sep,
    )
    .map(
      normalizeSegment,
    )
    .filter(Boolean);
}

function slugToHref(
  slug: string[],
): string {
  if (
    slug.length === 0
  ) {
    return DOCUMENTATION_ROOT_ROUTE;
  }

  return [
    DOCUMENTATION_ROOT_ROUTE,
    ...slug,
  ].join("/");
}

function ensureSafeSlug(
  slug: string[],
): void {
  for (
    const segment
    of slug
  ) {
    if (
      !segment ||
      segment === "." ||
      segment === ".." ||
      segment.includes("/") ||
      segment.includes("\\")
    ) {
      throw new Error(
        "Invalid documentation slug",
      );
    }
  }
}

async function collectMarkdownFiles(
  directory:
    string = DOCUMENTATION_ROOT,
): Promise<string[]> {
  const entries =
    await readdir(
      directory,
      {
        withFileTypes:
          true,
      },
    );

  const files:
    string[] = [];

  for (
    const entry
    of entries
  ) {
    const absolutePath =
      path.join(
        directory,
        entry.name,
      );

    if (
      entry.isDirectory()
    ) {
      files.push(
        ...await collectMarkdownFiles(
          absolutePath,
        ),
      );

      continue;
    }

    if (
      !entry.isFile() ||
      !entry.name
        .toLowerCase()
        .endsWith(
          ".md",
        )
    ) {
      continue;
    }

    if (
      DOCUMENTATION_EXCLUDED_FILES
        .has(
          entry.name,
        )
    ) {
      continue;
    }

    files.push(
      absolutePath,
    );
  }

  return files.sort();
}

async function createNavigationItem(
  absolutePath: string,
): Promise<
  DocumentationNavigationItem
> {
  const relativePath =
    path.relative(
      DOCUMENTATION_ROOT,
      absolutePath,
    );

  const source =
    await readFile(
      absolutePath,
      "utf-8",
    );

  const parsed =
    parseDocumentationSource(
      source,
    );

  const slug =
    relativePathToSlug(
      relativePath,
    );

  const fallbackTitle =
    formatLabel(
      path.basename(
        relativePath,
      ),
    );

  return {
    title:
      parsed.metadata.title ??
      extractDocumentTitle(
        parsed.content,
        fallbackTitle,
      ),

    slug,

    href:
      slugToHref(
        slug,
      ),

    relativePath:
      relativePath
        .split(
          path.sep,
        )
        .join("/"),
  };
}

export async function listDocumentationItems(): Promise<
  DocumentationNavigationItem[]
> {
  const files =
    await collectMarkdownFiles();

  const items =
    await Promise.all(
      files.map(
        createNavigationItem,
      ),
    );

  return items.sort(
    (
      left,
      right,
    ) => {
      const leftCategory =
        categoryFromRelativePath(
          left.relativePath,
        );

      const rightCategory =
        categoryFromRelativePath(
          right.relativePath,
        );

      const categoryDifference =
        DOCUMENTATION_CATEGORY_ORDER
          .indexOf(
            leftCategory,
          ) -
        DOCUMENTATION_CATEGORY_ORDER
          .indexOf(
            rightCategory,
          );

      if (
        categoryDifference !==
        0
      ) {
        return categoryDifference;
      }

      return left.title
        .localeCompare(
          right.title,
        );
    },
  );
}

export async function loadDocumentationNavigation(): Promise<
  DocumentationNavigationGroup[]
> {
  const items =
    await listDocumentationItems();

  const grouped =
    new Map<
      DocumentationCategory,
      DocumentationNavigationItem[]
    >();

  for (
    const item
    of items
  ) {
    const category =
      categoryFromRelativePath(
        item.relativePath,
      );

    const categoryItems =
      grouped.get(
        category,
      ) ?? [];

    categoryItems.push(
      item,
    );

    grouped.set(
      category,
      categoryItems,
    );
  }

  return DOCUMENTATION_CATEGORY_ORDER
    .filter(
      (category) =>
        grouped.has(
          category,
        ),
    )
    .map(
      (category) => ({
        category,

        label:
          DOCUMENTATION_CATEGORY_LABELS[
            category
          ],

        items:
          grouped.get(
            category,
          ) ?? [],
      }),
    );
}

function normalizeRelatedReference(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /\\/g,
      "/",
    )
    .replace(
      /\.md$/i,
      "",
    )
    .replace(
      /[_\s]+/g,
      "-",
    )
    .replace(
      /^\/docs\//,
      "",
    )
    .replace(
      /^docs\//,
      "",
    );
}

function resolveRelatedDocuments(
  references: string[],
  navigation: DocumentationNavigationItem[],
): {
  related: DocumentationNavigationItem[];
  unresolved: string[];
} {
  const resolved =
    new Map<
      string,
      DocumentationNavigationItem
    >();

  const unresolved:
    string[] = [];

  for (
    const reference
    of references
  ) {
    const normalized =
      normalizeRelatedReference(
        reference,
      );

    if (!normalized) {
      continue;
    }

    const matches =
      navigation.filter(
        (item) => {
          const fullSlug =
            item.slug.join("/");

          const lastSlug =
            item.slug[
              item.slug.length -
                1
            ] ?? "";

          const relativePath =
            item.relativePath
              .replace(
                /\.md$/i,
                "",
              )
              .toLowerCase()
              .replace(
                /_/g,
                "-",
              );

          return (
            fullSlug ===
              normalized ||
            lastSlug ===
              normalized ||
            relativePath ===
              normalized
          );
        },
      );

    if (
      matches.length ===
      1
    ) {
      const match =
        matches[0];

      resolved.set(
        match.href,
        match,
      );

      continue;
    }

    unresolved.push(
      reference,
    );
  }

  return {
    related:
      Array.from(
        resolved.values(),
      ),

    unresolved,
  };
}

function buildBreadcrumbs(
  slug: string[],
  title: string,
): DocumentationBreadcrumb[] {
  const breadcrumbs:
    DocumentationBreadcrumb[] =
    [
      {
        label:
          "Documentation",

        href:
          DOCUMENTATION_ROOT_ROUTE,
      },
    ];

  const category =
    slug[0];

  if (
    category &&
    slug.length >
      1
  ) {
    breadcrumbs.push({
      label:
        DOCUMENTATION_CATEGORY_LABELS[
          category as
            DocumentationCategory
        ] ??
        formatLabel(
          category,
        ),
    });
  }

  breadcrumbs.push({
    label:
      title,
  });

  return breadcrumbs;
}

async function resolveDocumentPath(
  slug: string[],
): Promise<string> {
  ensureSafeSlug(
    slug,
  );

  const requestedSlug =
    slug.join("/");

  const files =
    await collectMarkdownFiles();

  for (
    const absolutePath
    of files
  ) {
    const relativePath =
      path.relative(
        DOCUMENTATION_ROOT,
        absolutePath,
      );

    const candidateSlug =
      relativePathToSlug(
        relativePath,
      ).join("/");

    if (
      candidateSlug ===
      requestedSlug
    ) {
      return absolutePath;
    }
  }

  throw new Error(
    `Documentation document not found: ${requestedSlug}`,
  );
}

export async function documentationExists(
  slug: string[],
): Promise<boolean> {
  try {
    const absolutePath =
      await resolveDocumentPath(
        slug,
      );

    await access(
      absolutePath,
    );

    return true;
  } catch {
    return false;
  }
}

export async function loadDocumentationDocument(
  slug: string[],
): Promise<
  DocumentationDocument | null
> {
  try {
    const absolutePath =
      await resolveDocumentPath(
        slug,
      );

    const source =
      await readFile(
        absolutePath,
        "utf-8",
      );

    const parsed =
      parseDocumentationSource(
        source,
      );

    const relativePath =
      path.relative(
        DOCUMENTATION_ROOT,
        absolutePath,
      );

    const title =
      parsed.metadata.title ??
      extractDocumentTitle(
        parsed.content,
        formatLabel(
          path.basename(
            absolutePath,
          ),
        ),
      );

    const navigation =
      await listDocumentationItems();

    const href =
      slugToHref(
        slug,
      );

    const position =
      navigation.findIndex(
        (item) =>
          item.href ===
          href,
      );

    const relationships =
      resolveRelatedDocuments(
        parsed.metadata.related,
        navigation,
      );

    return {
      title,

      description:
        parsed.metadata.description ??
        extractDescription(
          parsed.content,
        ),

      category:
        categoryFromRelativePath(
          relativePath,
        ),

      metadata:
        parsed.metadata,

      slug,

      href,

      relativePath:
        relativePath
          .split(
            path.sep,
          )
          .join("/"),

      source:
        parsed.content,

      headings:
        extractHeadings(
          parsed.content,
        ),

      breadcrumbs:
        buildBreadcrumbs(
          slug,
          title,
        ),

      related:
        relationships.related,

      unresolvedRelated:
        relationships.unresolved,

      previous:
        position > 0
          ? navigation[
              position - 1
            ]
          : undefined,

      next:
        position >= 0 &&
        position <
          navigation.length -
            1
          ? navigation[
              position + 1
            ]
          : undefined,
    };
  } catch {
    return null;
  }
}

export async function buildDocumentationSearchIndex(): Promise<
  DocumentationSearchEntry[]
> {
  const items =
    await listDocumentationItems();

  return Promise.all(
    items.map(
      async (
        item,
      ) => {
        const absolutePath =
          path.join(
            DOCUMENTATION_ROOT,
            item.relativePath,
          );

        const source =
          await readFile(
            absolutePath,
            "utf-8",
          );

        const parsed =
          parseDocumentationSource(
            source,
          );

        return {
          title:
            parsed.metadata.title ??
            item.title,

          description:
            parsed.metadata.description ??
            extractDescription(
              parsed.content,
            ),

          category:
            categoryFromRelativePath(
              item.relativePath,
            ),

          version:
            parsed.metadata.version,

          status:
            parsed.metadata.status,

          owner:
            parsed.metadata.owner,

          tags:
            parsed.metadata.tags,

          href:
            item.href,

          relativePath:
            item.relativePath,

          content:
            removeMarkdownFormatting(
              parsed.content,
            ),
        };
      },
    ),
  );
}

export function getDocumentationRoot(): string {
  return DOCUMENTATION_ROOT;
}
