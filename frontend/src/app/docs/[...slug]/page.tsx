import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  DocumentationShell,
} from "@/components/documentation/DocumentationShell";

import {
  MarkdownRenderer,
} from "@/components/documentation/MarkdownRenderer";

import {
  listDocumentationItems,
  loadDocumentationDocument,
  loadDocumentationNavigation,
} from "@/lib/documentation";

type DocumentationDocumentPageProps = {
  params:
    Promise<{
      slug: string[];
    }>;
};

export async function generateStaticParams() {
  const items =
    await listDocumentationItems();

  return items.map(
    (item) => ({
      slug:
        item.slug,
    }),
  );
}

export async function generateMetadata({
  params,
}: DocumentationDocumentPageProps): Promise<Metadata> {
  const {
    slug,
  } =
    await params;

  const document =
    await loadDocumentationDocument(
      slug,
    );

  if (!document) {
    return {
      title:
        "Documentation Not Found | PropertyOS",
    };
  }

  return {
    title:
      `${document.title} | PropertyOS Documentation`,

    description:
      document.description,
  };
}

export default async function DocumentationDocumentPage({
  params,
}: DocumentationDocumentPageProps) {
  const {
    slug,
  } =
    await params;

  const [
    document,
    navigation,
  ] =
    await Promise.all([
      loadDocumentationDocument(
        slug,
      ),

      loadDocumentationNavigation(),
    ]);

  if (!document) {
    notFound();
  }

  return (
    <DocumentationShell
      breadcrumbs={
        document.breadcrumbs
      }
      headings={
        document.headings
      }
      navigation={
        navigation
      }
      next={
        document.next
      }
      previous={
        document.previous
      }
    >
      <header className="documentation-document-header">
        <p className="eyebrow">
          {
            document.category
          }
        </p>

        <h1>
          {document.title}
        </h1>

        {document.description && (
          <p className="muted page-description">
            {
              document.description
            }
          </p>
        )}

        <p className="documentation-source-path">
          Source:{" "}
          <code>
            docs/
            {
              document.relativePath
            }
          </code>
        </p>
      </header>

      <MarkdownRenderer
        source={
          document.source
        }
      />
    </DocumentationShell>
  );
}
