export function toSaoPauloDate(input: string | Date): Date {
  if (input instanceof Date) {
    return input;
  }

  const value = (input || '').trim();
  // If already has timezone info, trust it
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(value)) {
    return new Date(value);
  }

  // Handle datetime-local strings (e.g. 2025-12-15T10:30)
  if (value.includes('T')) {
    const hasSeconds = /\d{2}:\d{2}:\d{2}$/.test(value);
    const base = hasSeconds ? value : `${value}:00`;
    return new Date(`${base}-03:00`);
  }

  // Date only
  return new Date(`${value}T00:00:00-03:00`);
}
