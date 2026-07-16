import Link from "next/link";

import {
  DocumentationNavigation,
} from "./DocumentationNavigation";

import type {
  DocumentationBreadcrumb,
  DocumentationHeading,
  DocumentationNavigationGroup,
  DocumentationNavigationItem,
} from "@/lib/documentation";

type DocumentationShellProps = {
  navigation:
    DocumentationNavigationGroup[];

  breadcrumbs?:
    DocumentationBreadcrumb[];

  headings?:
    DocumentationHeading[];

  previous?:
    DocumentationNavigationItem;

  next?:
    DocumentationNavigationItem;

  children:
    React.ReactNode;
};

export function DocumentationShell({
  navigation,
  breadcrumbs = [],
  headings = [],
  previous,
  next,
  children,
}: DocumentationShellProps) {
  return (
    <div className="documentation-layout">
      <aside className="documentation-sidebar">
        <div className="documentation-sidebar-header">
          <Link href="/docs">
            <strong>
              PropertyOS Docs
            </strong>
          </Link>

          <span>
            Platform documentation
          </span>
        </div>

        <DocumentationNavigation
    navigation={
    navigation
               }
        />
      </aside>

      <main className="documentation-main">
        {breadcrumbs.length >
          0 && (
          <nav
            aria-label="Breadcrumb"
            className="documentation-breadcrumbs"
          >
            {breadcrumbs.map(
              (
                breadcrumb,
                index,
              ) => (
                <span
                  key={`${breadcrumb.label}-${index}`}
                >
                  {index >
                    0 && (
                    <span
                      aria-hidden="true"
                      className="documentation-breadcrumb-separator"
                    >
                      /
                    </span>
                  )}

                  {breadcrumb.href ? (
                    <Link
                      href={
                        breadcrumb.href
                      }
                    >
                      {
                        breadcrumb.label
                      }
                    </Link>
                  ) : (
                    breadcrumb.label
                  )}
                </span>
              ),
            )}
          </nav>
        )}

        <div className="documentation-page-grid">
          <div className="documentation-document">
            {children}

            {(previous ||
              next) && (
              <nav
                aria-label="Previous and next documentation"
                className="documentation-pagination"
              >
                <div>
                  {previous && (
                    <Link
                      href={
                        previous.href
                      }
                    >
                      <span>
                        Previous
                      </span>

                      <strong>
                        {
                          previous.title
                        }
                      </strong>
                    </Link>
                  )}
                </div>

                <div className="documentation-pagination-next">
                  {next && (
                    <Link
                      href={
                        next.href
                      }
                    >
                      <span>
                        Next
                      </span>

                      <strong>
                        {
                          next.title
                        }
                      </strong>
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </div>

          {headings.length >
            0 && (
            <aside className="documentation-toc">
              <strong>
                On this page
              </strong>

              <ul>
                {headings.map(
                  (
                    heading,
                    index,
                  ) => (
                    <li
                      className={`documentation-toc-level-${heading.level}`}
                      key={`${heading.id}-${index}`}
                    >
                      <a
                        href={`#${heading.id}`}
                      >
                        {
                          heading.title
                        }
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
