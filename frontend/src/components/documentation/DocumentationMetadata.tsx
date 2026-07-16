import type {
  DocumentationMetadata as DocumentationMetadataType,
} from "@/lib/documentation";

type DocumentationMetadataProps = {
  metadata: DocumentationMetadataType;
};

function formatStatus(
  value: string,
): string {
  return value
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

export function DocumentationMetadata({
  metadata,
}: DocumentationMetadataProps) {
  const hasMetadata =
    Boolean(
      metadata.version ||
      metadata.status ||
      metadata.owner ||
      metadata.tags.length,
    );

  if (!hasMetadata) {
    return null;
  }

  return (
    <div className="documentation-metadata">
      {metadata.version && (
        <div className="documentation-metadata-item">
          <span>Version</span>
          <strong>
            {metadata.version}
          </strong>
        </div>
      )}

      {metadata.status && (
        <div className="documentation-metadata-item">
          <span>Status</span>

          <strong
            className={`documentation-status documentation-status-${metadata.status}`}
          >
            {formatStatus(
              metadata.status,
            )}
          </strong>
        </div>
      )}

      {metadata.owner && (
        <div className="documentation-metadata-item">
          <span>Owner</span>
          <strong>
            {metadata.owner}
          </strong>
        </div>
      )}

      {metadata.tags.length > 0 && (
        <div className="documentation-metadata-tags">
          <span>Tags</span>

          <div>
            {metadata.tags.map(
              (tag) => (
                <span
                  className="documentation-tag"
                  key={tag}
                >
                  {tag}
                </span>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
