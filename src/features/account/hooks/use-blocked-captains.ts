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
      // 1. Try sovereign RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_blocked_users');

      if (!rpcError && Array.isArray(rpcData)) {
        const formatted: BlockedCaptainItem[] = rpcData.map((row: any) => ({
          id: row.id,
          name: row.name || t('blockedCaptain'),
          phone: row.phone || '',
          rating: Number(row.rating || 5),
          serialId: row.serial_id || '',
        }));
        setBlockedCaptains(formatted);
        return;
      }

      // 2. Resilient fallback to direct table query
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

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, rating, serial_id')
        .in('id', blockedIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      // Map over blockedIds so no blocked captain is dropped if their profile is missing/delayed
      const formatted: BlockedCaptainItem[] = blockedIds.map((id: string) => {
        const prof = profileMap.get(id);
        return {
          id,
          name: prof?.full_name || t('blockedCaptain'),
          phone: prof?.phone || '',
          rating: Number(prof?.rating || 5),
          serialId: prof?.serial_id || '',
        };
      });

      setBlockedCaptains(formatted);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[BlockedCaptains] Fetch error:', err);
    } finally {
      setIsLoadingBlocks(false);
    }
  }, [user?.uid, t]);

  // Initial fetch and Realtime changes listener
  useEffect(() => {
    void fetchBlockedCaptains();

    if (!user?.uid) return;

    // Realtime Postgres changes on user_blocks
    const channelName = `realtime-blocked-captains-${user.uid}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_blocks',
        },
        () => {
          void fetchBlockedCaptains();
        }
      )
      .subscribe();

    // Custom local events for zero-delay refresh
    const handleLocalUpdate = () => void fetchBlockedCaptains();
    window.addEventListener('radar-user-blocked', handleLocalUpdate);
    window.addEventListener('radar-user-unblocked', handleLocalUpdate);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener('radar-user-blocked', handleLocalUpdate);
      window.removeEventListener('radar-user-unblocked', handleLocalUpdate);
    };
  }, [fetchBlockedCaptains, user?.uid]);

  const handleBlockCaptain = async (captainId: string) => {
    if (!user?.uid || !captainId) return;
    try {
      const { error } = await supabase.rpc('block_user', { p_blocked_id: captainId });
      if (error) {
        const { error: insertError } = await supabase.from('user_blocks').insert({
          blocker_id: user.uid,
          blocked_id: captainId,
        });
        if (insertError) throw insertError;
      }

      toast({
        title: t('blockSuccessTitle') || 'تم حظر السائق',
        description: t('blockSuccessDesc') || 'لن تظهر عروض هذا السائق في رادارك مجدداً.',
      });

      window.dispatchEvent(new CustomEvent('radar-user-blocked', { detail: { captainId } }));
      await fetchBlockedCaptains();
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') console.error('[BlockedCaptains] Block error:', err);
      toast({
        title: t('error'),
        description: err?.message || (t('blockError') || 'حدث خطأ أثناء حظر السائق.'),
        variant: 'destructive',
      });
    }
  };

  const handleUnblockCaptain = async (captainId: string) => {
    if (!user?.uid) return;
    try {
      const { error } = await supabase.rpc('unblock_user', { p_blocked_id: captainId });
      if (error) {
        const { error: deleteError } = await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', user.uid)
          .eq('blocked_id', captainId);
        if (deleteError) throw deleteError;
      }

      toast({
        title: t('unblockSuccessTitle'),
        description: t('unblockSuccessDesc'),
      });

      window.dispatchEvent(new CustomEvent('radar-user-unblocked', { detail: { captainId } }));
      await fetchBlockedCaptains();
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') console.error('[BlockedCaptains] Unblock error:', err);
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
    handleBlockCaptain,
    handleUnblockCaptain,
    refreshBlockedCaptains: fetchBlockedCaptains,
    t,
  };
}
