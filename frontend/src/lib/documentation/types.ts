import type {
  DocumentationMetadata,
} from "./metadata";

export type DocumentationCategory =
  | "architecture"
  | "deployment"
  | "development"
  | "domains"
  | "procurement"
  | "product"
  | "reference"
  | "releases"
  | "general";

export type DocumentationHeading = {
  id: string;
  title: string;
  level: number;
};

export type DocumentationNavigationItem = {
  title: string;
  slug: string[];
  href: string;
  relativePath: string;
};

export type DocumentationNavigationGroup = {
  category: DocumentationCategory;
  label: string;
  items: DocumentationNavigationItem[];
};

export type DocumentationBreadcrumb = {
  label: string;
  href?: string;
};

export type DocumentationDocument = {
  title: string;
  description?: string;
  category: DocumentationCategory;
  metadata: DocumentationMetadata;

  slug: string[];
  href: string;
  relativePath: string;

  source: string;
  headings: DocumentationHeading[];

  breadcrumbs: DocumentationBreadcrumb[];

  related: DocumentationNavigationItem[];
  unresolvedRelated: string[];

  previous?: DocumentationNavigationItem;
  next?: DocumentationNavigationItem;
};

export type DocumentationSearchEntry = {
  title: string;
  description?: string;
  category: DocumentationCategory;
  version?: string;
  status?: DocumentationMetadata["status"];
  owner?: string;
  tags: string[];
  href: string;
  relativePath: string;
  content: string;
};
