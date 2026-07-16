import Link from "next/link";

import type {
  DocumentationNavigationItem,
} from "@/lib/documentation";

type RelatedDocumentsProps = {
  related: DocumentationNavigationItem[];
  unresolved: string[];
};

export function RelatedDocuments({
  related,
  unresolved,
}: RelatedDocumentsProps) {
  if (
    related.length === 0 &&
    unresolved.length === 0
  ) {
    return null;
  }

  return (
    <section className="documentation-related">
      <div className="documentation-related-header">
        <div>
          <p className="eyebrow">
            Knowledge Connections
          </p>

          <h2>
            Related Documents
          </h2>
        </div>

        <span>
          {related.length} resolved
        </span>
      </div>

      {related.length > 0 && (
        <div className="documentation-related-grid">
          {related.map(
            (item) => (
              <Link
                className="documentation-related-card"
                href={item.href}
                key={item.href}
              >
                <span>
                  Related document
                </span>

                <strong>
                  {item.title}
                </strong>

                <code>
                  {item.relativePath}
                </code>
              </Link>
            ),
          )}
        </div>
      )}

      {unresolved.length > 0 && (
        <div className="documentation-related-warning">
          <strong>
            Unresolved references
          </strong>

          <p>
            These related-document values do not currently match
            exactly one documentation page.
          </p>

          <ul>
            {unresolved.map(
              (reference) => (
                <li key={reference}>
                  <code>
                    {reference}
                  </code>
                </li>
              ),
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
