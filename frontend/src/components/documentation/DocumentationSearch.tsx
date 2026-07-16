"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  DocumentationSearchEntry,
} from "@/lib/documentation";

type Props = {
  entries: DocumentationSearchEntry[];
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function excerpt(
  text: string,
  query: string,
) {
  const lower = text.toLowerCase();
  const pos = lower.indexOf(query);

  const start =
    pos >= 0
      ? Math.max(0, pos - 80)
      : 0;

  const end = Math.min(
    text.length,
    start + 220,
  );

  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end) +
    (end < text.length ? "…" : "")
  );
}

export function DocumentationSearch({
  entries,
}: Props) {
  const [query, setQuery] =
    useState("");

  const q = normalize(query);

  const results = useMemo(() => {
    if (q.length < 2) {
      return [];
    }

    return entries
      .map((entry) => {
        const searchable = (
          entry.title +
          " " +
          (entry.description ?? "") +
          " " +
          entry.content
        ).toLowerCase();

        if (!searchable.includes(q)) {
          return null;
        }

        let score = 1;

        if (
          entry.title
            .toLowerCase()
            .includes(q)
        ) {
          score += 10;
        }

        if (
          entry.description
            ?.toLowerCase()
            .includes(q)
        ) {
          score += 5;
        }

        return {
          score,
          entry,
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          b!.score - a!.score,
      )
      .slice(0, 10);
  }, [entries, q]);

  return (
    <section className="documentation-search">

      <input
        type="search"
        placeholder="Search documentation..."
        value={query}
        onChange={(e) =>
          setQuery(e.target.value)
        }
      />

      {q.length >= 2 && (

        <div className="documentation-search-results">

          <p>
            {results.length} result
            {results.length === 1
              ? ""
              : "s"}
          </p>

          <ul>

            {results.map((r) => (

              <li key={r!.entry.href}>

                <Link href={r!.entry.href}>

                  <strong>
                    {r!.entry.title}
                  </strong>

                  <small>
                    {r!.entry.category}
                  </small>

                  <p>
                    {excerpt(
                      r!.entry.content,
                      q,
                    )}
                  </p>

                </Link>

              </li>

            ))}

          </ul>

        </div>

      )}

    </section>
  );
}
