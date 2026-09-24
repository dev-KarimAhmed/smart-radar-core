'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

export interface BlockedCaptainItem {
  id: string;
  name: string;
  phone: string;
  rating: number;
  serialId: string;
}

export function useBlockedCaptains() {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('profileTab');

  const [blockedCaptains, setBlockedCaptains] = useState<BlockedCaptainItem[]>([]);
  const [confirmingUnblockId, setConfirmingUnblockId] = useState<string | null>(null);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  const fetchBlockedCaptains = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoadingBlocks(true);
    try {
      const { data: blocks, error: blocksError } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.uid);

      if (blocksError) throw blocksError;

      const blockedIds = (blocks || []).map((b: any) => b.blocked_id);
      if (blockedIds.length === 0) {
        setBlockedCaptains([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, rating, serial_id')
        .in('id', blockedIds);

      if (profilesError) throw profilesError;

      const formatted: BlockedCaptainItem[] = (profiles || []).map((prof: any) => ({
        id: prof.id,
        name: prof.full_name || t('blockedCaptain'),
        phone: prof.phone || '',
        rating: Number(prof.rating || 5),
        serialId: prof.serial_id || '',
      }));
      setBlockedCaptains(formatted);
    } catch (err) {
      console.error('[BlockedCaptains] Fetch blocked captains error:', err);
    } finally {
      setIsLoadingBlocks(false);
    }
  }, [user?.uid, t]);

  useEffect(() => {
    void fetchBlockedCaptains();
  }, [fetchBlockedCaptains]);

  const handleUnblockCaptain = async (captainId: string) => {
    if (!user?.uid) return;
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.uid)
        .eq('blocked_id', captainId);

      if (error) throw error;

      toast({
        title: t('unblockSuccessTitle'),
        description: t('unblockSuccessDesc'),
      });

      await fetchBlockedCaptains();
    } catch (err: any) {
      console.error('[BlockedCaptains] Unblock error:', err);
      toast({
        title: t('error'),
        description: t('unblockError'),
        variant: 'destructive',
      });
    }
  };

  return {
    blockedCaptains,
    isLoadingBlocks,
    confirmingUnblockId,
    setConfirmingUnblockId,
    handleUnblockCaptain,
    refreshBlockedCaptains: fetchBlockedCaptains,
    t,
  };
}

