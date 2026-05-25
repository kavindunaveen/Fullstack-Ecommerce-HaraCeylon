/**
 * HARA Ceylon — Shared Backend Utilities
 */

/**
 * Converts a stored relative image path (e.g. /uploads/img.jpg)
 * into a fully-qualified absolute URL using BACKEND_URL from env.
 */
export const toAbsoluteUrl = (url: string | undefined | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = process.env.BACKEND_URL || 'http://localhost:8001';
  return `${base}${url}`;
};
