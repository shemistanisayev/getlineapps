/** Small builders so every rule reads the same way. */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * URL on `host` or any of its subdomains, then `path` (a regex source, matched right after the
 * first slash). `u('facebook.net', '.*fbevents\\.js')`.
 */
export function u(host: string, path = ''): RegExp {
  return new RegExp(`^https?://([a-z0-9-]+\\.)*${esc(host)}(:\\d+)?/${path}`, 'i');
}

/** Exact cookie name. */
export function c(name: string): RegExp {
  return new RegExp(`^${esc(name)}$`);
}

/** Cookie name prefix. */
export function cp(prefix: string): RegExp {
  return new RegExp(`^${esc(prefix)}`);
}
