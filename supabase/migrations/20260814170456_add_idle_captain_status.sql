-- Add the normal offline/idle state to the existing captain status enum.
-- Existing values are ACTIVE and BANNED; BANNED must never be used as a
-- normal offline state.

begin;

alter type public.user_status
  add value if not exists 'IDLE';

notify pgrst, 'reload schema';

commit;
