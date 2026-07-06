export function nowUtc(): Date {
  return new Date();
}

export function toIsoString(date: Date): string {
  return date.toISOString();
}
