export function appendStripeFormValue(
  form:
    URLSearchParams,
  key: string,
  value:
    unknown,
): void {
  if (
    value === undefined ||
    value === null
  ) {
    return;
  }

  if (
    typeof value ===
      'string' ||
    typeof value ===
      'number' ||
    typeof value ===
      'boolean'
  ) {
    form.append(
      key,
      String(value),
    );

    return;
  }

  if (Array.isArray(value)) {
    value.forEach(
      (item, index) => {
        appendStripeFormValue(
          form,
          `${key}[${index}]`,
          item,
        );
      },
    );

    return;
  }

  if (
    typeof value ===
    'object'
  ) {
    Object.entries(
      value as
        Record<string, unknown>,
    ).forEach(
      ([childKey, childValue]) => {
        appendStripeFormValue(
          form,
          `${key}[${childKey}]`,
          childValue,
        );
      },
    );
  }
}

export function createStripeForm(
  input:
    Record<string, unknown>,
): URLSearchParams {
  const form =
    new URLSearchParams();

  Object.entries(input)
    .forEach(
      ([key, value]) => {
        appendStripeFormValue(
          form,
          key,
          value,
        );
      },
    );

  return form;
}
