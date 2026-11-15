import { ServiceConfig, serviceHeaders } from './password-reset-config';

/**
 * Resolves a phone to an account through find_account_by_phone, which indexes into
 * auth.users directly.
 *
 * The admin users list endpoint was the first approach and is the wrong one: it pages 200 at
 * a time with no phone filter, so it is a linear scan that quietly stops finding people once
 * the fleet grows past however many pages we walk — recovery would break for whoever
 * registered most recently, which is the opposite of what a recovery flow should do.
 */
export async function findAuthUserByPhone(
  config: ServiceConfig,
  digits: string,
): Promise<{ id: string; email: string | null } | null> {
  if (!digits) return null;

  const response = await fetch(`${config.url}/rest/v1/rpc/find_account_by_phone`, {
    method: 'POST',
    headers: serviceHeaders(config.serviceKey),
    body: JSON.stringify({ p_phone_digits: digits }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return null;

  const [row] = (await response.json()) as Array<{ user_id?: string; email?: string | null }>;
  if (!row?.user_id) return null;

  return { id: row.user_id, email: row.email?.trim() || null };
}

export async function findAuthUserByEmail(
  config: ServiceConfig,
  email: string,
): Promise<{ id: string; email: string | null; phone: string | null } | null> {
  if (!email) return null;

  const response = await fetch(`${config.url}/rest/v1/rpc/find_account_by_email`, {
    method: 'POST',
    headers: serviceHeaders(config.serviceKey),
    body: JSON.stringify({ p_email: email }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return null;

  const [row] = (await response.json()) as Array<{ user_id?: string; phone?: string | null; email?: string | null }>;
  if (!row?.user_id) return null;

  return { id: row.user_id, phone: row.phone?.trim() || null, email: row.email?.trim() || null };
}
