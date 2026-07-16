import Link from "next/link";

import {
  DocumentationSearch,
} from "@/components/documentation/DocumentationSearch";

import {
  DocumentationShell,
} from "@/components/documentation/DocumentationShell";

import {
  buildDocumentationSearchIndex,
  loadDocumentationNavigation,
} from "@/lib/documentation";

export const dynamic =
  "force-static";

export default async function DocumentationPage() {
  const [
    navigation,
    searchEntries,
  ] =
    await Promise.all([
      loadDocumentationNavigation(),
      buildDocumentationSearchIndex(),
    ]);

  const documentCount =
    navigation.reduce(
      (
        total,
        group,
      ) =>
        total +
        group.items.length,
      0,
    );

  return (
    <DocumentationShell
      navigation={
        navigation
      }
    >
      <div className="page-header">
        <div>
          <p className="eyebrow">
            PropertyOS Platform
          </p>

          <h1>
            Documentation
          </h1>

          <p className="muted page-description">
            Architecture, product,
            domain, development, and
            operational documentation
            maintained alongside the
            PropertyOS source code.
          </p>
        </div>
      </div>

      <DocumentationSearch
        entries={
          searchEntries
        }
      />

      <section className="documentation-hero-card">
        <div>
          <strong>
            {documentCount}
          </strong>

          <span>
            indexed documents
          </span>
        </div>

        <div>
          <strong>
            {
              navigation.length
            }
          </strong>

          <span>
            documentation areas
          </span>
        </div>

        <div>
          <strong>
            OpenAPI
          </strong>

          <span>
            executable API reference
          </span>
        </div>
      </section>

      <div className="documentation-category-grid">
        {navigation.map(
          (group) => (
            <section
              className="documentation-category-card"
              key={
                group.category
              }
            >
              <h2>
                {group.label}
              </h2>

              <p className="muted">
                {
                  group.items
                    .length
                }{" "}
                document
                {group.items
                  .length === 1
                  ? ""
                  : "s"}
              </p>

              <ul>
                {group.items
                  .slice(
                    0,
                    6,
                  )
                  .map(
                    (item) => (
                      <li
                        key={
                          item.href
                        }
                      >
                        <Link
                          href={
                            item.href
                          }
                        >
                          {
                            item.title
                          }
                        </Link>
                      </li>
                    ),
                  )}
              </ul>
            </section>
          ),
        )}
      </div>

      <section className="documentation-api-card">
        <div>
          <p className="eyebrow">
            API Reference
          </p>

          <h2>
            Swagger / OpenAPI
          </h2>

          <p className="muted">
            Endpoint-level API
            documentation is generated
            directly from the running
            NestJS backend.
          </p>
        </div>

        <a
          className="button-link"
          href="http://localhost:3001/api/docs"
          rel="noreferrer"
          target="_blank"
        >
          Open API Docs
        </a>
      </section>
    </DocumentationShell>
  );
}
