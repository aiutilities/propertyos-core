"use client";

import {
  CommunicationAudienceType,
  CommunicationTargetInput,
} from "@/types/communication";

export default function RecipientSelector({
  targets,
  onChange,
}: {
  targets: CommunicationTargetInput[];
  onChange:
    (
      targets: CommunicationTargetInput[],
    ) => void;
}) {
  function updateTarget(
    index: number,
    target: CommunicationTargetInput,
  ) {
    const next =
      [...targets];

    next[index] =
      target;

    onChange(next);
  }

  function removeTarget(
    index: number,
  ) {
    onChange(
      targets.filter(
        (_, targetIndex) =>
          targetIndex !== index,
      ),
    );
  }

  function addTarget() {
    onChange([
      ...targets,
      {
        audienceType:
          "ALL_PROPERTY",
      },
    ]);
  }

  return (
    <section className="stack-md">
      <div className="page-header">
        <div>
          <h3>Audience</h3>
          <p>
            Select one or more recipient groups.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={addTarget}
          type="button"
        >
          Add Audience
        </button>
      </div>

      {targets.map(
        (target, index) => (
          <div
            className="form-grid"
            key={`${target.audienceType}-${index}`}
          >
            <label>
              Audience type
              <select
                value={
                  target.audienceType
                }
                onChange={(event) =>
                  updateTarget(
                    index,
                    {
                      audienceType:
                        event.target
                          .value as CommunicationAudienceType,
                    },
                  )
                }
              >
                {[
                  "ALL_PROPERTY",
                  "ZONE",
                  "SPACE",
                  "PERSON",
                  "ROLE",
                  "OWNERS",
                  "TENANTS",
                  "RESIDENTS",
                  "STAFF",
                  "SECURITY",
                ].map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value.replaceAll(
                        "_",
                        " ",
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            {target.audienceType ===
            "ZONE" ? (
              <label>
                Zone ID
                <input
                  required
                  value={
                    target.zoneId ?? ""
                  }
                  onChange={(event) =>
                    updateTarget(
                      index,
                      {
                        ...target,
                        zoneId:
                          event.target.value,
                      },
                    )
                  }
                />
              </label>
            ) : null}

            {target.audienceType ===
            "SPACE" ? (
              <label>
                Space ID
                <input
                  required
                  value={
                    target.spaceId ?? ""
                  }
                  onChange={(event) =>
                    updateTarget(
                      index,
                      {
                        ...target,
                        spaceId:
                          event.target.value,
                      },
                    )
                  }
                />
              </label>
            ) : null}

            {target.audienceType ===
            "PERSON" ? (
              <label>
                Person ID
                <input
                  required
                  value={
                    target.personId ?? ""
                  }
                  onChange={(event) =>
                    updateTarget(
                      index,
                      {
                        ...target,
                        personId:
                          event.target.value,
                      },
                    )
                  }
                />
              </label>
            ) : null}

            {target.audienceType ===
            "ROLE" ? (
              <label>
                Role ID
                <input
                  required
                  value={
                    target.roleId ?? ""
                  }
                  onChange={(event) =>
                    updateTarget(
                      index,
                      {
                        ...target,
                        roleId:
                          event.target.value,
                      },
                    )
                  }
                />
              </label>
            ) : null}

            <div className="form-actions">
              <button
                className="secondary-button"
                disabled={
                  targets.length === 1
                }
                onClick={() =>
                  removeTarget(index)
                }
                type="button"
              >
                Remove
              </button>
            </div>
          </div>
        ),
      )}
    </section>
  );
}
