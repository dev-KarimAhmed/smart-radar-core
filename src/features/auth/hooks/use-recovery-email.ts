'use client';

import React from 'react';

import { supabase } from '@/lib/supabase-client';
import { setRecoveryEmail } from '../services/password-recovery';

export type RecoveryEmailStatus = 'loading' | 'missing' | 'set' | 'pending';

/**
 * The recovery email on the signed-in account.
 *
 * Lives on the Supabase auth user, not on public.profiles — it is an auth credential, not
 * profile data, and it is the single thing that decides whether a locked-out user can help
 * themselves or has to go through an admin who can then set their password.
 *
 * The catch worth knowing: a NEW address does not take effect until the owner clicks the
 * confirmation Supabase mails them. Until then the account still has the old address (or
 * none), so reporting a plain "saved" would leave someone believing recovery works when it
 * does not. That is what the 'pending' status is for.
 */
export function useRecoveryEmail() {
  const [status, setStatus] = React.useState<RecoveryEmailStatus>('loading');
  const [currentEmail, setCurrentEmail] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const email = String(data.user?.email || '').trim();
    setCurrentEmail(email);
    setStatus(email ? 'set' : 'missing');
    return email;
  }, []);

  React.useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const email = String(data.user?.email || '').trim();
      setCurrentEmail(email);
      setStatus(email ? 'set' : 'missing');
    });
    return () => { active = false; };
  }, []);

  const save = React.useCallback(async (email: string) => {
    setIsSaving(true);
    try {
      await setRecoveryEmail(email);
      setStatus('pending');
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { status, currentEmail, isSaving, save, refresh };
}
