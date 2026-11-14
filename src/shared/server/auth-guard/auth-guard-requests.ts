const DEFAULT_ALLOWED_ORIGINS = [
  'https://smart-radar-core-production-8d61.up.railway.app',
  'https://bynkcom.com',
  'https://www.bynkcom.com',
];

function readEnvTrimmed(name: string): string {
  return (process.env[name] || '').trim();
}

function getHeaderValue(req: { headers: Headers | Record<string, unknown> }, name: string): string {
  const headers = req?.headers;
  if (!headers) return '';
  if (typeof (headers as Headers).get === 'function') {
    return ((headers as Headers).get(name) || '').trim();
  }
  const rec = headers as Record<string, unknown>;
  const direct = rec[name] ?? rec[name.toLowerCase()];
  if (Array.isArray(direct)) return String(direct[0] ?? '').trim();
  return typeof direct === 'string' ? direct.trim() : '';
}

export function extractBearerToken(req: { headers: Headers | Record<string, unknown> }): string | null {
  const auth = getHeaderValue(req, 'authorization');
  if (!auth) return null;
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  if (!match) return null;
  const token = match[1]?.trim() || '';
  return token.length > 0 ? token : null;
}

const SAFE_IP_PATTERN = /^[a-zA-Z0-9.:_-]{3,64}$/;
const POSTGRES_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && POSTGRES_UUID_PATTERN.test(value.trim());
}

export function isMissingRpcError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const rec = error as { code?: unknown; message?: unknown; details?: unknown };
  const code = typeof rec.code === 'string' ? rec.code.trim() : '';
  const msg = `${typeof rec.message === 'string' ? rec.message : ''} ${typeof rec.details === 'string' ? rec.details : ''}`;
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    /could not find the function/i.test(msg) ||
    /function .* does not exist/i.test(msg)
  );
}

export function getClientIp(req: { headers: Headers | Record<string, unknown> }): string {
  const railwayIp = getHeaderValue(req, 'x-railway-client-ip');
  if (railwayIp && SAFE_IP_PATTERN.test(railwayIp)) return railwayIp;

  const envoyIp = getHeaderValue(req, 'x-envoy-external-address');
  if (envoyIp && SAFE_IP_PATTERN.test(envoyIp)) return envoyIp;

  const forwarded = getHeaderValue(req, 'x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map((hop) => hop.trim()).filter(Boolean);
    const rightmost = hops[hops.length - 1];
    if (rightmost && SAFE_IP_PATTERN.test(rightmost)) return rightmost;
  }

  const realIp = getHeaderValue(req, 'x-real-ip');
  if (realIp && SAFE_IP_PATTERN.test(realIp)) return realIp;

  return 'unknown';
}

function parseOriginUrl(raw: string): URL | null {
  if (!raw) return null;
  try {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (parsed.username || parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getSafeAppOrigin(req?: { headers: Headers | Record<string, unknown> }): string {
  const configuredPrimary =
    readEnvTrimmed('NEXT_PUBLIC_APP_URL') ||
    readEnvTrimmed('APP_URL') ||
    readEnvTrimmed('NEXT_PUBLIC_SITE_URL') ||
    (readEnvTrimmed('RAILWAY_PUBLIC_DOMAIN') ? `https://${readEnvTrimmed('RAILWAY_PUBLIC_DOMAIN')}` : '');

  const configuredOrigin = parseOriginUrl(configuredPrimary)?.origin || '';
  const extraAllowed = readEnvTrimmed('ALLOWED_APP_ORIGINS')
    .split(',')
    .map((entry) => parseOriginUrl(entry.trim())?.hostname.toLowerCase())
    .filter((h): h is string => Boolean(h));

  const allowHosts = new Set<string>([
    ...DEFAULT_ALLOWED_ORIGINS.map((u) => new URL(u).hostname.toLowerCase()),
    ...extraAllowed,
  ]);
  if (configuredOrigin) {
    allowHosts.add(new URL(configuredOrigin).hostname.toLowerCase());
  }
  if (process.env.NODE_ENV !== 'production') {
    allowHosts.add('localhost');
    allowHosts.add('127.0.0.1');
  }

  if (req) {
    const originHeader = parseOriginUrl(getHeaderValue(req, 'origin'));
    if (originHeader && allowHosts.has(originHeader.hostname.toLowerCase())) {
      return originHeader.origin;
    }

    const fwdHost = getHeaderValue(req, 'x-forwarded-host').split(',')[0]?.trim() || '';
    const hostHeader = fwdHost || getHeaderValue(req, 'host').split(',')[0]?.trim() || '';
    const hostUrl = hostHeader ? parseOriginUrl(hostHeader) : null;
    if (hostUrl && allowHosts.has(hostUrl.hostname.toLowerCase())) {
      const isLocal = hostUrl.hostname === 'localhost' || hostUrl.hostname === '127.0.0.1';
      const proto = isLocal && process.env.NODE_ENV !== 'production' ? 'http' : 'https';
      return `${proto}://${hostUrl.host}`;
    }
  }

  if (configuredOrigin) return configuredOrigin;
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000';
  return DEFAULT_ALLOWED_ORIGINS[0];
}

export function isValidStorageRelativePath(rawPath: string): boolean {
  if (!rawPath || typeof rawPath !== 'string') return false;
  const trimmed = rawPath.trim();
  if (!trimmed || trimmed.length > 512) return false;
  if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('\0')) return false;
  if (trimmed.startsWith('/') || trimmed.includes('?') || trimmed.includes('#')) return false;
  return /^[a-zA-Z0-9._/-]+$/.test(trimmed);
}
