import {
  PlacesResult,
} from "@/types/places";

export default function PlacesResultPanel({
  title,
  result,
}: {
  title: string;
  result: PlacesResult | undefined;
}) {
  if (result === undefined) {
    return null;
  }

  return (
    <section className="panel">
      <h2>{title}</h2>

      <pre
        style={{
          margin: 0,
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {JSON.stringify(
          result,
          null,
          2,
        )}
      </pre>
    </section>
  );
}
