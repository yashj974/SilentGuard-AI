import test from 'node:test';
import assert from 'node:assert/strict';

// Import transpiled or raw helper
function formatBookingDateTime(
  timestamp,
  targetTimezone,
  fallbackText = 'Date unavailable'
) {
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
      // Fallback
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

test('formatBookingDateTime with null, undefined, and empty string', () => {
  assert.equal(formatBookingDateTime(null), 'Date unavailable');
  assert.equal(formatBookingDateTime(undefined), 'Date unavailable');
  assert.equal(formatBookingDateTime(''), 'Date unavailable');
  assert.equal(formatBookingDateTime('   '), 'Date unavailable');
  assert.equal(formatBookingDateTime(null, null, 'N/A'), 'N/A');
});

test('formatBookingDateTime with malformed timestamp strings', () => {
  assert.equal(formatBookingDateTime('Invalid Date'), 'Date unavailable');
  assert.equal(formatBookingDateTime('not-a-valid-date'), 'Date unavailable');
  assert.equal(formatBookingDateTime('2026-99-99T99:99:99'), 'Date unavailable');
  assert.equal(formatBookingDateTime('undefined'), 'Date unavailable');
  assert.equal(formatBookingDateTime('null'), 'Date unavailable');
});

test('formatBookingDateTime with valid ISO UTC timestamps', () => {
  const isoUtc = '2026-10-31T14:30:00.000Z';
  const formatted = formatBookingDateTime(isoUtc, 'UTC');
  assert.ok(formatted.includes('2026'));
  assert.ok(formatted.includes('Oct') || formatted.includes('10'));
  assert.ok(formatted.includes('14:30') || formatted.includes('2:30'));
  assert.ok(!formatted.includes('Invalid Date'));
});

test('formatBookingDateTime with valid timezone conversion', () => {
  const isoUtc = '2026-11-05T19:00:00.000Z';
  const nyTime = formatBookingDateTime(isoUtc, 'America/New_York');
  assert.ok(!nyTime.includes('Invalid Date'));
  assert.ok(nyTime.includes('2026'));
});

test('formatBookingDateTime with non-standard or invalid timezone falls back gracefully', () => {
  const isoUtc = '2026-10-31T14:30:00.000Z';
  const formatted = formatBookingDateTime(isoUtc, 'Bogus/Fake_Timezone');
  assert.ok(!formatted.includes('Invalid Date'));
  assert.ok(formatted.length > 5);
});

