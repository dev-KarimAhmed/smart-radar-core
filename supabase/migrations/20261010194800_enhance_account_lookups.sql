CREATE OR REPLACE FUNCTION public.find_account_by_phone(p_phone_digits text)
RETURNS TABLE (user_id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id, coalesce(nullif(trim(u.email), ''), nullif(trim(u.raw_user_meta_data->>'email'), ''))
  FROM auth.users u
  WHERE p_phone_digits IS NOT NULL
    AND length(p_phone_digits) >= 8
    AND regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') <> ''
    AND (
      regexp_replace(u.phone, '\D', '', 'g') LIKE '%' || p_phone_digits
      OR p_phone_digits LIKE '%' || regexp_replace(u.phone, '\D', '', 'g')
    )
  ORDER BY u.created_at
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.find_account_by_email(p_email text)
RETURNS TABLE (user_id uuid, phone text, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id, u.phone, coalesce(nullif(trim(u.email), ''), nullif(trim(u.raw_user_meta_data->>'email'), ''))
  FROM auth.users u
  WHERE p_email IS NOT NULL
    AND (
      lower(trim(u.email)) = lower(trim(p_email))
      OR lower(trim(u.raw_user_meta_data->>'email')) = lower(trim(p_email))
    )
  ORDER BY u.created_at
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_account_by_phone(text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.find_account_by_phone(text) TO service_role;

REVOKE ALL ON FUNCTION public.find_account_by_email(text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.find_account_by_email(text) TO service_role;
