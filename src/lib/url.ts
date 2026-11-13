/**
 * Prefix an internal path with the site's base path.
 * Locally the base is "/", on GitHub Pages it is "/flutonomy/".
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('#')) return path;
  return BASE + (path.startsWith('/') ? path : `/${path}`);
}
