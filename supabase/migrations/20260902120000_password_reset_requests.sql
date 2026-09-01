-- Password recovery for a phone-only login.
--
-- Sign-up is `auth.signUp({ phone, password })` with no email, so Supabase's own
-- resetPasswordForEmail has nothing to send to and a captain who forgets their password
-- loses the account. The UI has had a "نسيت كلمة المرور" dialog for a while, but it only
-- ever showed a WhatsApp link and a phone number — there was no mechanism behind it, and no
-- way for support to actually perform a reset even after verifying someone.
--
-- Two recovery routes, both free:
--
--   1. The captain added a recovery email  -> Supabase sends them a link. No human involved.
--   2. No email                            -> a request lands here, an admin verifies who
--                                             they are, and issues a one-time token.
--
-- This table is route 2. It is deliberately a REQUEST QUEUE, not a token store that anyone
-- can write to: the reset token is only ever written by the server after an admin approves,
-- and it is stored hashed.


CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What the person typed. NOT trusted to identify anyone by itself — it is the claim the
  -- admin then verifies against the profile, out of band.
  claimed_phone text NOT NULL,

  -- Filled in by the server once it resolves the phone to a real account. Null means the
  -- phone matched nothing; the request is still stored so a flood of misses is visible.
  profile_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'EXPIRED')),

  -- SHA-256 of the one-time token. The plaintext is shown to the admin once, to pass to the
  -- captain, and is never stored: a leaked database must not hand over working reset links.
  token_hash text,
  token_expires_at timestamptz,

  -- Who approved it, and why. A flow where an admin can set anyone's password is only
  -- acceptable if every use of it is on the record.
  approved_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  approved_at timestamptz,
  verification_note text,

  completed_at timestamptz,
  requested_ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.password_reset_requests IS
  'Admin-verified password recovery for phone-only accounts. Tokens are stored hashed and are single-use.';

CREATE INDEX IF NOT EXISTS password_reset_requests_status_idx
  ON public.password_reset_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS password_reset_requests_phone_idx
  ON public.password_reset_requests (claimed_phone, created_at DESC);

-- A token is looked up by its hash on every completion attempt.
CREATE INDEX IF NOT EXISTS password_reset_requests_token_idx
  ON public.password_reset_requests (token_hash)
  WHERE token_hash IS NOT NULL;


-- ---------------------------------------------------------------------------
-- RLS. This table is written ONLY by the server (service_role bypasses RLS).
--
-- Several tables in this project have RLS disabled, which is how anyone holding the anon key
-- can write to them. That must not be repeated here: this table decides who gets to take
-- over an account. No anon or authenticated policy is created at all, so with RLS enabled
-- and no policy, every client-side read and write is denied by default.
-- ---------------------------------------------------------------------------

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.password_reset_requests FROM anon, authenticated;


-- ---------------------------------------------------------------------------
-- Audit trail, so a takeover can always be reconstructed after the fact.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.password_reset_audit (
  id bigserial PRIMARY KEY,
  request_id uuid REFERENCES public.password_reset_requests (id) ON DELETE SET NULL,
  profile_id uuid,
  actor_id uuid,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.password_reset_audit IS
  'Append-only record of every recovery step. An admin can set a password; this is what makes that traceable.';

CREATE INDEX IF NOT EXISTS password_reset_audit_profile_idx
  ON public.password_reset_audit (profile_id, created_at DESC);

ALTER TABLE public.password_reset_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.password_reset_audit FROM anon, authenticated;


-- ---------------------------------------------------------------------------
-- Resolving a phone to an account.
--
-- The obvious way is the admin users list endpoint, but it only pages — 200 users at a time
-- with no phone filter — so it is a linear scan that silently stops finding people once the
-- fleet outgrows however many pages the caller is willing to walk. Recovery must not start
-- failing for whoever registered last.
--
-- auth.users is not reachable over PostgREST, so this is the only way to index into it.
-- SECURITY DEFINER, and executable by nobody: the server calls it with the service role.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.find_account_by_phone(p_phone_digits text)
RETURNS TABLE (user_id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
  SELECT u.id, nullif(trim(u.email), '')
  FROM auth.users u
  WHERE p_phone_digits IS NOT NULL
    AND length(p_phone_digits) >= 8
    -- Stored as +201234567890, typed as 01234567890. Compare digits only, and match on the
    -- national tail so a country prefix on either side does not break recovery.
    AND regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') <> ''
    AND (
      regexp_replace(u.phone, '\D', '', 'g') LIKE '%' || p_phone_digits
      OR p_phone_digits LIKE '%' || regexp_replace(u.phone, '\D', '', 'g')
    )
  ORDER BY u.created_at
  LIMIT 1;
$fn$;

REVOKE ALL ON FUNCTION public.find_account_by_phone(text) FROM anon, authenticated, public;

COMMENT ON FUNCTION public.find_account_by_phone(text) IS
  'Phone -> account lookup for password recovery. Service role only: it reads auth.users and must never be callable from a browser.';


-- ---------------------------------------------------------------------------
-- Housekeeping: an approved token nobody used must stop working on its own.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_stale_password_resets()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_expired integer;
BEGIN
  UPDATE public.password_reset_requests
  SET status = 'EXPIRED',
      token_hash = NULL,          -- burn it, do not merely mark it
      updated_at = now()
  WHERE status = 'APPROVED'
    AND token_expires_at IS NOT NULL
    AND token_expires_at < now();

  GET DIAGNOSTICS v_expired = ROW_COUNT;

  -- A request nobody ever acted on is not evidence of anything after a week.
  UPDATE public.password_reset_requests
  SET status = 'EXPIRED', updated_at = now()
  WHERE status = 'PENDING'
    AND created_at < now() - interval '7 days';

  RETURN v_expired;
END;
$fn$;

REVOKE ALL ON FUNCTION public.expire_stale_password_resets() FROM anon, authenticated;


-- ---------------------------------------------------------------------------
-- Verification
--
--   -- No client role may touch either table.
--   SELECT grantee, table_name, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_name IN ('password_reset_requests','password_reset_audit')
--     AND grantee IN ('anon','authenticated');
--   -- expect: 0 rows
--
--   -- RLS on and no policies, so the default deny actually applies.
--   SELECT relname, relrowsecurity,
--          (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname) AS policies
--   FROM pg_class c
--   WHERE relname IN ('password_reset_requests','password_reset_audit');
--   -- expect: relrowsecurity = true, policies = 0
