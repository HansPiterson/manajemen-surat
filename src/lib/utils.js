
/**
 * Format a date string/object to Indonesian locale
 * e.g. "23 Juni 2026, 11:56 AM"
 */
export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
