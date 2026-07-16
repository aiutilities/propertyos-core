import type {
  DocumentationCategory,
} from "./types";

export const DOCUMENTATION_CATEGORY_ORDER:
  DocumentationCategory[] = [
    "general",
    "product",
    "architecture",
    "domains",
    "development",
    "deployment",
    "reference",
    "releases",
    "procurement",
  ];

export const DOCUMENTATION_CATEGORY_LABELS:
  Record<
    DocumentationCategory,
    string
  > = {
    general:
      "General",

    product:
      "Product",

    architecture:
      "Architecture",

    domains:
      "Domains",

    development:
      "Development",

    deployment:
      "Deployment",

    reference:
      "Reference",

    releases:
      "Releases",

    procurement:
      "Procurement",
  };

export const DOCUMENTATION_EXCLUDED_FILES =
  new Set([
    "README.md",
  ]);

export const DOCUMENTATION_ROOT_ROUTE =
  "/docs";
