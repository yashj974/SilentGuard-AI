/**
 * Safely formats a booking or status audit timestamp without throwing or rendering "Invalid Date".
 * Handles valid ISO timestamps, SQLite timestamps, null, undefined, empty strings, and malformed inputs.
 * Respects the booking's target timezone when provided and supported by Intl.DateTimeFormat.
 */
export function formatBookingDateTime(
  timestamp?: string | null,
  targetTimezone?: string | null,
  fallbackText: string = 'Date unavailable'
): string {
  if (!timestamp || typeof timestamp !== 'string') {
    return fallbackText;
  }

  const trimmed = timestamp.trim();
  if (!trimmed) {
    return fallbackText;
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return fallbackText;
  }

  if (targetTimezone && typeof targetTimezone === 'string' && targetTimezone.trim()) {
    try {
      const formatter = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: targetTimezone.trim(),
        timeZoneName: 'short',
      });
      return formatter.format(parsed);
    } catch {
      // If targetTimezone is invalid or non-standard (e.g. abbreviation like "PST" or invalid string),
      // gracefully fall back to locale format below.
    }
  }

  try {
    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fallbackText;
  }
}

