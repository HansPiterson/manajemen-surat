
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

const API_ORIGIN = (() => {
  try {
    return new URL(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').origin;
  } catch {
    return '';
  }
})();

/**
 * Resolve a stored proof-photo URL against the API server the website is using.
 * The backend saves absolute URLs (PUBLIC_URL or localhost), so a photo uploaded
 * through another host would otherwise point to the wrong server.
 */
export function resolveFotoUrl(url) {
  if (!url) return null;
  const idx = url.indexOf('/uploads/');
  if (idx === -1 || !API_ORIGIN) return url;
  return `${API_ORIGIN}${url.slice(idx)}`;
}
