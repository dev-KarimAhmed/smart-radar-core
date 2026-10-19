'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export interface BlockedRiderItem {
  id: string;
  name: string;
  phone: string;
  rating: number;
  serialId: string;
}

export function useBlockedRiders(language: 'ar' | 'en' = 'ar') {
  const { user } = useAuth();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [blockedRiders, setBlockedRiders] = useState<BlockedRiderItem[]>([]);
  const [confirmingUnblockId, setConfirmingUnblockId] = useState<string | null>(null);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  const fetchBlockedRiders = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoadingBlocks(true);
    try {
      // 1. Try sovereign RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_blocked_users');

      if (!rpcError && Array.isArray(rpcData)) {
        const formatted: BlockedRiderItem[] = rpcData.map((row: any) => ({
          id: row.id,
          name: row.name || (isArabic ? 'مستخدم محظور' : 'Blocked Rider'),
          phone: row.phone || '',
          rating: Number(row.rating || 5),
          serialId: row.serial_id || '',
        }));
        setBlockedRiders(formatted);
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
        setBlockedRiders([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, rating, serial_id')
        .in('id', blockedIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      // Map over blockedIds so no blocked user is dropped if their profile is missing/delayed
      const formatted: BlockedRiderItem[] = blockedIds.map((id: string) => {
        const prof = profileMap.get(id);
        return {
          id,
          name: prof?.full_name || (isArabic ? 'مستخدم محظور' : 'Blocked Rider'),
          phone: prof?.phone || '',
          rating: Number(prof?.rating || 5),
          serialId: prof?.serial_id || '',
        };
      });

      setBlockedRiders(formatted);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[BlockedRiders] Fetch error:', err);
    } finally {
      setIsLoadingBlocks(false);
    }
  }, [user?.uid, isArabic]);

  // Initial fetch and Realtime changes listener
  useEffect(() => {
    void fetchBlockedRiders();

    if (!user?.uid) return;

    // Realtime Postgres changes on user_blocks
    const channelName = `realtime-blocked-riders-${user.uid}-${Math.random().toString(36).slice(2, 8)}`;
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
          void fetchBlockedRiders();
        }
      )
      .subscribe();

    // Custom local events for zero-delay refresh
    const handleLocalUpdate = () => void fetchBlockedRiders();
    window.addEventListener('radar-user-blocked', handleLocalUpdate);
    window.addEventListener('radar-user-unblocked', handleLocalUpdate);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener('radar-user-blocked', handleLocalUpdate);
      window.removeEventListener('radar-user-unblocked', handleLocalUpdate);
    };
  }, [fetchBlockedRiders, user?.uid]);

  const handleBlockRider = async (riderId: string) => {
    if (!user?.uid || !riderId) return;
    try {
      const { error } = await supabase.rpc('block_user', { p_blocked_id: riderId });
      if (error) {
        // Fallback to direct insert
        const { error: insertError } = await supabase.from('user_blocks').insert({
          blocker_id: user.uid,
          blocked_id: riderId,
        });
        if (insertError) throw insertError;
      }

      toast({
        title: isArabic ? 'تم حظر المستخدم' : 'Rider Blocked',
        description: isArabic ? 'لن تظهر طلبات هذا المستخدم في رادارك مجدداً.' : 'Rider requests will no longer appear on your radar.',
      });

      window.dispatchEvent(new CustomEvent('radar-user-blocked', { detail: { riderId } }));
      await fetchBlockedRiders();
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') console.error('[BlockedRiders] Block error:', err);
      toast({
        title: isArabic ? 'تعذر حظر المستخدم' : 'Failed to block',
        description: err?.message || (isArabic ? 'حدث خطأ أثناء حظر المستخدم.' : 'An error occurred while blocking.'),
        variant: 'destructive',
      });
    }
  };

  const handleUnblockRider = async (riderId: string) => {
    if (!user?.uid) return;
    try {
      const { error } = await supabase.rpc('unblock_user', { p_blocked_id: riderId });
      if (error) {
        // Fallback to direct delete
        const { error: deleteError } = await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', user.uid)
          .eq('blocked_id', riderId);
        if (deleteError) throw deleteError;
      }

      toast({
        title: isArabic ? 'تم إلغاء الحظر' : 'Unblock Successful',
        description: isArabic ? 'تم إلغاء حظر هذا المستخدم بنجاح وستظهر طلباته على رادارك.' : 'Rider unblocked successfully.',
      });

      window.dispatchEvent(new CustomEvent('radar-user-unblocked', { detail: { riderId } }));
      await fetchBlockedRiders();
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') console.error('[BlockedRiders] Unblock error:', err);
      toast({
        title: isArabic ? 'تعذر إلغاء الحظر' : 'Failed to unblock',
        description: isArabic ? 'حدث خطأ غير متوقع أثناء إلغاء الحظر.' : 'An error occurred while unblocking.',
        variant: 'destructive',
      });
    }
  };

  return {
    blockedRiders,
    isLoadingBlocks,
    confirmingUnblockId,
    setConfirmingUnblockId,
    handleBlockRider,
    handleUnblockRider,
    refreshBlockedRiders: fetchBlockedRiders,
  };
}
