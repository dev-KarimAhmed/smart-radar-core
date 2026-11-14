import { useState, useCallback, useEffect } from 'react';
import { dexieDb } from '@/lib/dexie-db';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/core/types';

interface UseHistorySovereignLogsProps {
  user: User | null;
  isCaptain: boolean;
  t: (key: string) => string;
}

export function useHistorySovereignLogs({ user, isCaptain, t }: UseHistorySovereignLogsProps) {
  const [sovereignLogs, setSovereignLogs] = useState<any[]>([]);
  const { toast } = useToast();

  const loadSovereignLogs = useCallback(async () => {
    if (!user?.uid || !isCaptain) return;
    try {
      const logs = await dexieDb.captainSovereignLogs
        .where('captainId')
        .equals(user.uid)
        .reverse()
        .sortBy('timestamp');
      setSovereignLogs(logs);
    } catch (e) {
      console.error('Failed to load captain sovereign logs from Dexie:', e);
    }
  }, [user?.uid, isCaptain]);

  const clearSovereignLogs = useCallback(async () => {
    if (!user?.uid) return;
    try {
      await dexieDb.captainSovereignLogs
        .where('captainId')
        .equals(user.uid)
        .delete();
      setSovereignLogs([]);
      toast({
        title: t('logsClearedTitle'),
        description: t('logsClearedDesc'),
      });
    } catch (err) {
      console.error('Failed to clear sovereign logs:', err);
    }
  }, [user?.uid, t, toast]);

  useEffect(() => {
    if (isCaptain) {
      void loadSovereignLogs();
    }

    const handleLogAdded = () => {
      if (isCaptain) {
        void loadSovereignLogs();
      }
    };

    window.addEventListener('sovereign-log-added', handleLogAdded);
    return () => {
      window.removeEventListener('sovereign-log-added', handleLogAdded);
    };
  }, [isCaptain, loadSovereignLogs]);

  return {
    sovereignLogs,
    loadSovereignLogs,
    clearSovereignLogs,
  };
}
