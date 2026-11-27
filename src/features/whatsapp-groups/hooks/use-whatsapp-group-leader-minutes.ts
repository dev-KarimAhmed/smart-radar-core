'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { WhatsAppGroupCurrentMembership, WhatsAppGroupLeaderMinutes, WhatsAppGroupSessionPort } from '../types';
import { formatOperationalDuration, type DurationUnitLabels } from '../services/whatsapp-group-formatting';
import { getMyWhatsAppGroupMembership, leaveWhatsAppGroup } from '../services/whatsapp-group-membership';
import { getMyWhatsAppGroupLeaderMinutes } from '../services/whatsapp-group-qualified-minutes';
import { clearPendingWhatsAppGroupCode } from '../services/whatsapp-group-storage';

export interface UseWhatsAppGroupLeaderMinutesDeps {
  sessionPort?: Pick<WhatsAppGroupSessionPort, 'getSession'> & Partial<Pick<WhatsAppGroupSessionPort, 'onAuthStateChange'>>;
  fetchLeaderMinutes?: typeof getMyWhatsAppGroupLeaderMinutes;
  fetchCurrentMembership?: typeof getMyWhatsAppGroupMembership;
  leaveGroup?: typeof leaveWhatsAppGroup;
}

const defaultLeaderSessionPort: WhatsAppGroupSessionPort = {
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),
};
const DEFAULT_DURATION_LABELS: DurationUnitLabels = { hoursUnit: 'h', minutesUnit: 'm', secondsUnit: 's' };

export interface LeaderLinkFormattedItem {
  groupId: string; groupCode: string; groupName: string; status: 'ACTIVE' | 'INACTIVE';
  currentMonthFormatted: string; totalQualifiedFormatted: string;
}

export interface UseWhatsAppGroupLeaderMinutesResult {
  data: WhatsAppGroupLeaderMinutes | null;
  membership: WhatsAppGroupCurrentMembership | null;
  leaderLinks: LeaderLinkFormattedItem[];
  loading: boolean;
  currentMonthFormatted: string;
  totalQualifiedFormatted: string;
  confirmingLeave: boolean;
  isLeaving: boolean;
  leaveError: boolean;
  leftGroupNotice: boolean;
  requestLeave: () => void;
  cancelLeave: () => void;
  confirmLeave: () => Promise<void>;
}

export function useWhatsAppGroupLeaderMinutes(
  isCaptain: boolean,
  userId?: string | null,
  durationLabels?: DurationUnitLabels,
  deps?: UseWhatsAppGroupLeaderMinutesDeps,
): UseWhatsAppGroupLeaderMinutesResult {
  const sessionPort = deps?.sessionPort ?? defaultLeaderSessionPort;
  const fetchLeaderMinutes = deps?.fetchLeaderMinutes ?? getMyWhatsAppGroupLeaderMinutes;
  const fetchCurrentMembership = deps?.fetchCurrentMembership ?? getMyWhatsAppGroupMembership;
  const leaveGroup = deps?.leaveGroup ?? leaveWhatsAppGroup;

  const [data, setData] = useState<WhatsAppGroupLeaderMinutes | null>(null);
  const [membership, setMembership] = useState<WhatsAppGroupCurrentMembership | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState(false);
  const [leftGroupNotice, setLeftGroupNotice] = useState(false);

  const isMountedRef = useRef(true);
  const leavingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let needsRetryOnOnline = false;
    let lastLoadedUid: string | null = null;

    const loadGroupState = async (knownUid?: string | null) => {
      setLoading(true);
      try {
        let activeUid = knownUid ?? null;
        if (!activeUid) {
          const { data: sessionData } = await sessionPort.getSession();
          if (cancelled) return;
          activeUid = sessionData?.session?.user?.id ?? null;
        }
        if (!activeUid) {
          needsRetryOnOnline = false;
          lastLoadedUid = null;
          setData(null);
          setMembership(null);
          setConfirmingLeave(false);
          setLeftGroupNotice(false);
          return;
        }

        const leaderPromise = isCaptain ? fetchLeaderMinutes() : Promise.resolve(null);
        const memberPromise = fetchCurrentMembership(activeUid);
        const [leaderSettled, memberSettled] = await Promise.allSettled([leaderPromise, memberPromise]);
        if (cancelled) return;

        let hadError = false;
        if (leaderSettled.status === 'fulfilled') {
          const res = leaderSettled.value;
          setData(res && res.isGroupLeader ? res : null);
        } else {
          hadError = true;
          setData(null);
        }

        if (memberSettled.status === 'fulfilled') {
          setMembership(memberSettled.value);
          if (memberSettled.value) {
            setLeftGroupNotice(false);
          }
        } else {
          hadError = true;
          setMembership(null);
        }

        needsRetryOnOnline = hadError;
        lastLoadedUid = activeUid;
      } catch (_err: unknown) {
        needsRetryOnOnline = true;
        if (!cancelled) {
          setData(null);
          setMembership(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const handleOnline = () => {
      if (!cancelled && needsRetryOnOnline) {
        void loadGroupState();
      }
    };

    const authSub = sessionPort.onAuthStateChange?.((_event, session) => {
      if (cancelled) return;
      const nextUid = session?.user?.id ?? null;
      if (!nextUid) {
        lastLoadedUid = null;
        setData(null);
        setMembership(null);
        setConfirmingLeave(false);
        setLeaveError(false);
        setLeftGroupNotice(false);
        return;
      }
      if (nextUid !== lastLoadedUid) {
        setConfirmingLeave(false);
        setLeaveError(false);
        setLeftGroupNotice(false);
        void loadGroupState(nextUid);
      }
    });

    void loadGroupState();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    return () => {
      cancelled = true;
      authSub?.data?.subscription?.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
    };
  }, [isCaptain, userId, sessionPort, fetchLeaderMinutes, fetchCurrentMembership]);

  const hoursUnit = durationLabels?.hoursUnit ?? DEFAULT_DURATION_LABELS.hoursUnit;
  const minutesUnit = durationLabels?.minutesUnit ?? DEFAULT_DURATION_LABELS.minutesUnit;
  const secondsUnit = durationLabels?.secondsUnit ?? DEFAULT_DURATION_LABELS.secondsUnit;

  const leaderLinks = useMemo<LeaderLinkFormattedItem[]>(() => {
    if (!data?.isGroupLeader || !Array.isArray(data.links) || data.links.length === 0) return [];
    const labels = { hoursUnit, minutesUnit, secondsUnit };
    return data.links.map((link) => ({
      groupId: link.groupId,
      groupCode: link.groupCode,
      groupName: link.groupName,
      status: link.status,
      currentMonthFormatted: formatOperationalDuration(link.currentMonthSeconds, labels),
      totalQualifiedFormatted: formatOperationalDuration(link.totalQualifiedSeconds, labels),
    }));
  }, [data, hoursUnit, minutesUnit, secondsUnit]);

  const currentMonthFormatted = useMemo(() => {
    if (!data?.isGroupLeader) return '';
    return formatOperationalDuration(data.currentMonthSeconds, { hoursUnit, minutesUnit, secondsUnit });
  }, [data, hoursUnit, minutesUnit, secondsUnit]);

  const totalQualifiedFormatted = useMemo(() => {
    if (!data?.isGroupLeader) return '';
    return formatOperationalDuration(data.totalQualifiedSeconds, { hoursUnit, minutesUnit, secondsUnit });
  }, [data, hoursUnit, minutesUnit, secondsUnit]);

  const requestLeave = useCallback(() => {
    if (leavingRef.current) return;
    setLeaveError(false); setConfirmingLeave(true);
  }, []);

  const cancelLeave = useCallback(() => {
    if (leavingRef.current) return;
    setLeaveError(false); setConfirmingLeave(false);
  }, []);

  const confirmLeave = useCallback(async () => {
    if (leavingRef.current) return;
    leavingRef.current = true; setIsLeaving(true); setLeaveError(false);
    try {
      const result = await leaveGroup();
      if (!isMountedRef.current) return;
      if (result.success && (result.status === 'LEFT_GROUP' || result.status === 'NO_ACTIVE_MEMBERSHIP')) {
        clearPendingWhatsAppGroupCode();
        setMembership(null); setConfirmingLeave(false); setLeftGroupNotice(true);
      } else {
        setLeaveError(true);
      }
    } catch (_err: unknown) {
      if (isMountedRef.current) setLeaveError(true);
    } finally {
      leavingRef.current = false;
      if (isMountedRef.current) setIsLeaving(false);
    }
  }, [leaveGroup]);

  return {
    data, membership, leaderLinks, loading, currentMonthFormatted, totalQualifiedFormatted,
    confirmingLeave, isLeaving, leaveError, leftGroupNotice,
    requestLeave, cancelLeave, confirmLeave,
  };
}
