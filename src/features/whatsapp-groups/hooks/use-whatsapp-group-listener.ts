'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import type { WhatsAppGroupSessionPort } from '../types';
import {
  confirmWhatsAppGroupSwitch,
  joinWhatsAppGroupByCode,
} from '../services/whatsapp-group-membership';
import {
  capturePendingWhatsAppGroupFromUrl,
  clearPendingWhatsAppGroupCode,
  getPendingWhatsAppGroupCode,
  readQueryWhatsAppGroupCode,
  removeWhatsAppGroupParamFromUrl,
} from '../services/whatsapp-group-storage';

export interface UseWhatsAppGroupListenerDeps {
  sessionPort?: WhatsAppGroupSessionPort;
  joinByCode?: typeof joinWhatsAppGroupByCode;
  confirmSwitch?: typeof confirmWhatsAppGroupSwitch;
}

const defaultSessionPort: WhatsAppGroupSessionPort = {
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),
};

export interface WhatsAppGroupSwitchDialogState {
  open: boolean;
  currentGroupName: string;
  currentGroupCode: string;
  targetGroupName: string;
  targetGroupCode: string;
}

const EMPTY_SWITCH_STATE: WhatsAppGroupSwitchDialogState = {
  open: false,
  currentGroupName: '',
  currentGroupCode: '',
  targetGroupName: '',
  targetGroupCode: '',
};

export function useWhatsAppGroupListener(deps?: UseWhatsAppGroupListenerDeps) {
  const sessionPort = deps?.sessionPort ?? defaultSessionPort;
  const joinByCode = deps?.joinByCode ?? joinWhatsAppGroupByCode;
  const confirmSwitch = deps?.confirmSwitch ?? confirmWhatsAppGroupSwitch;
  const { user, isCaptain, isPassenger } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('whatsappGroupFlow');
  const [switchDialogState, setSwitchDialogState] =
    useState<WhatsAppGroupSwitchDialogState>(EMPTY_SWITCH_STATE);
  const [isConfirming, setIsConfirming] = useState(false);
  const [sessionTokenReady, setSessionTokenReady] = useState(false);
  const inFlightCodeRef = useRef<string | null>(null);
  const isSwitchOpenRef = useRef(false);
  const isConfirmingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    capturePendingWhatsAppGroupFromUrl();
    return () => {
      isMountedRef.current = false;
      inFlightCodeRef.current = null;
      isSwitchOpenRef.current = false;
      isConfirmingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.uid || (!isCaptain && !isPassenger)) {
      setSessionTokenReady(false);
      return;
    }

    let cancelled = false;
    void sessionPort.getSession().then(({ data }) => {
      if (!cancelled) {
        setSessionTokenReady(Boolean(data.session?.access_token));
      }
    });

    const { data: authListener } = sessionPort.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setSessionTokenReady(Boolean(session?.access_token));
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [user?.uid, isCaptain, isPassenger, sessionPort]);

  const processPendingCode = useCallback(async () => {
    if (!user?.uid || (!isCaptain && !isPassenger) || !sessionTokenReady) return;
    const pendingCode = readQueryWhatsAppGroupCode() || getPendingWhatsAppGroupCode();
    if (!pendingCode || isSwitchOpenRef.current || inFlightCodeRef.current === pendingCode) return;

    inFlightCodeRef.current = pendingCode;
    try {
      const result = await joinByCode(pendingCode);
      if (!isMountedRef.current) return;

      if (result.status === 'AUTHENTICATION_REQUIRED') {
        return;
      }

      if (result.status === 'SWITCH_CONFIRMATION_REQUIRED') {
        isSwitchOpenRef.current = true;
        setSwitchDialogState({
          open: true,
          currentGroupName: result.currentGroupName || result.currentGroupCode || '',
          currentGroupCode: result.currentGroupCode || '',
          targetGroupName: result.targetGroupName || result.targetGroupCode || pendingCode,
          targetGroupCode: result.targetGroupCode || pendingCode,
        });
        return;
      }

      clearPendingWhatsAppGroupCode();
      removeWhatsAppGroupParamFromUrl();

      const resolvedName = result.groupName || result.groupCode || pendingCode;
      if (result.status === 'JOINED') {
        toast({
          title: t('joinedTitle'),
          description: t('joinedDesc', { groupName: resolvedName }),
        });
      } else if (result.status === 'ALREADY_MEMBER') {
        toast({
          title: t('alreadyMemberTitle'),
          description: t('alreadyMemberDesc', { groupName: resolvedName }),
        });
      } else if (result.status === 'GROUP_NOT_FOUND' || result.status === 'MISSING_GROUP_CODE') {
        toast({
          variant: 'destructive',
          title: t('groupNotFoundTitle'),
          description: t('groupNotFoundDesc'),
        });
      } else if (
        result.status === 'ACCOUNT_RESTRICTED' ||
        result.status === 'INELIGIBLE_ACCOUNT_ROLE' ||
        result.status === 'PROFILE_NOT_FOUND'
      ) {
        toast({
          variant: 'destructive',
          title: t('restrictedTitle'),
          description: t('restrictedDesc'),
        });
      }
    } catch {
      if (!isMountedRef.current) return;
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorDesc'),
      });
    } finally {
      inFlightCodeRef.current = null;
    }
  }, [user?.uid, isCaptain, isPassenger, sessionTokenReady, joinByCode, t, toast]);

  useEffect(() => {
    void processPendingCode();
    if (typeof window === 'undefined') return;
    const handleOnline = () => { void processPendingCode(); };
    const handleResume = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      capturePendingWhatsAppGroupFromUrl();
      void processPendingCode();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('popstate', handleResume);
    document.addEventListener('visibilitychange', handleResume);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('popstate', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, [processPendingCode]);

  const handleConfirmSwitch = useCallback(
    async (confirm: boolean) => {
      if (isConfirmingRef.current || isConfirming || !switchDialogState.open) return;
      const targetCode = switchDialogState.targetGroupCode;
      const targetName = switchDialogState.targetGroupName;
      const currentName = switchDialogState.currentGroupName;

      isConfirmingRef.current = true;
      setIsConfirming(true);
      try {
        const result = await confirmSwitch(targetCode, confirm);
        clearPendingWhatsAppGroupCode();
        removeWhatsAppGroupParamFromUrl();
        isSwitchOpenRef.current = false;
        if (!isMountedRef.current) return;
        setSwitchDialogState(EMPTY_SWITCH_STATE);

        if (result.status === 'SWITCHED_GROUP') {
          toast({
            title: t('switchedTitle'),
            description: t('switchedDesc', { groupName: result.groupName || targetName }),
          });
        } else if (result.status === 'KEPT_CURRENT_GROUP') {
          toast({
            title: t('keptTitle'),
            description: t('keptDesc', { groupName: currentName }),
          });
        } else if (!result.success) {
          toast({
            variant: 'destructive',
            title: t('errorTitle'),
            description: t('errorDesc'),
          });
        }
      } catch {
        if (!isMountedRef.current) return;
        toast({
          variant: 'destructive',
          title: t('errorTitle'),
          description: t('errorDesc'),
        });
      } finally {
        isConfirmingRef.current = false;
        inFlightCodeRef.current = null;
        if (isMountedRef.current) {
          setIsConfirming(false);
        }
      }
    },
    [confirmSwitch, isConfirming, switchDialogState, t, toast],
  );

  return {
    switchDialogState,
    isConfirming,
    handleConfirmSwitch,
  };
}
