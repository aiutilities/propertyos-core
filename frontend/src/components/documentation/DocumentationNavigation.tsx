"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import type {
  DocumentationNavigationGroup,
} from "@/lib/documentation";

type DocumentationNavigationProps = {
  navigation:
    DocumentationNavigationGroup[];
};

function isActiveDocumentationRoute(
  pathname: string,
  href: string,
): boolean {
  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

export function DocumentationNavigation({
  navigation,
}: DocumentationNavigationProps) {
  const pathname =
    usePathname() ?? "";

  return (
    <nav
      aria-label="Documentation navigation"
      className="documentation-navigation"
    >
      {navigation.map(
        (group) => (
          <section
            key={
              group.category
            }
          >
            <h2>
              {group.label}
            </h2>

            <ul>
              {group.items.map(
                (item) => {
                  const active =
                    isActiveDocumentationRoute(
                      pathname,
                      item.href,
                    );

                  return (
                    <li
                      key={
                        item.href
                      }
                    >
                      <Link
                        aria-current={
                          active
                            ? "page"
                            : undefined
                        }
                        className={
                          active
                            ? "documentation-navigation-active"
                            : undefined
                        }
                        href={
                          item.href
                        }
                      >
                        {
                          item.title
                        }
                      </Link>
                    </li>
                  );
                },
              )}
            </ul>
          </section>
        ),
      )}
    </nav>
  );
}
