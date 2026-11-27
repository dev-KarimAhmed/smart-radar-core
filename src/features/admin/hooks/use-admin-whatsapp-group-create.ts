'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  AdminWhatsAppGroupsApiError,
  defaultAdminWhatsAppGroupsGateway,
  type AdminWhatsAppGroupsGateway,
} from '@/features/admin/lib/whatsapp-groups-admin-api';
import {
  buildWhatsAppGroupShareUrl,
  isValidWhatsAppGroupCodeFormat,
  type AdminCaptainLookupItem,
  type AdminWhatsAppGeoOption,
} from '@/features/whatsapp-groups/contract';

export interface CreateModalCaptainOption extends AdminCaptainLookupItem {
  zoneLabel: string;
  existingLinksCount: number;
}

export interface UseAdminWhatsAppGroupCreateParams {
  captains: AdminCaptainLookupItem[];
  leaderGroupCounts?: Readonly<Record<string, number>>;
  governorateOptions?: AdminWhatsAppGeoOption[];
  districtOptions?: AdminWhatsAppGeoOption[];
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void>;
  gateway?: Pick<AdminWhatsAppGroupsGateway, 'createGroup'>;
}

export interface UseAdminWhatsAppGroupCreateResult {
  groupName: string;
  groupCode: string;
  captainSearch: string;
  selectedCaptainId: string;
  submitting: boolean;
  codeFormatInvalid: boolean;
  previewSharePath: string;
  totalMatchingCaptains: number;
  filteredCaptains: CreateModalCaptainOption[];
  selectedCaptain: CreateModalCaptainOption | null;
  setGroupName: (value: string) => void;
  setGroupCode: (value: string) => void;
  setCaptainSearch: (value: string) => void;
  setSelectedCaptainId: (value: string) => void;
  handleOpenChange: (open: boolean) => void;
  handleClose: () => void;
  handleCreate: () => Promise<void>;
}

const MAX_VISIBLE_CAPTAINS = 30;

function normalizeGroupNameInput(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function useAdminWhatsAppGroupCreate({
  captains,
  leaderGroupCounts,
  governorateOptions,
  districtOptions,
  onOpenChange,
  onCreated,
  gateway = defaultAdminWhatsAppGroupsGateway,
}: UseAdminWhatsAppGroupCreateParams): UseAdminWhatsAppGroupCreateResult {
  const t = useTranslations('adminWhatsappGroups');
  const { toast } = useToast();

  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [captainSearch, setCaptainSearch] = useState('');
  const [selectedCaptainId, setSelectedCaptainId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      submittingRef.current = false;
    };
  }, []);

  const govNameMap = useMemo(() => new Map((governorateOptions || []).map((g) => [g.id, g.name])), [governorateOptions]);
  const distNameMap = useMemo(() => new Map((districtOptions || []).map((d) => [d.id, d.name])), [districtOptions]);

  const enrichedCaptains = useMemo<CreateModalCaptainOption[]>(() => {
    return captains.map((cap) => {
      const gov = (cap.governorateId != null ? govNameMap.get(String(cap.governorateId)) : '') || cap.governorateName || '';
      const dist = (cap.districtId != null ? distNameMap.get(String(cap.districtId)) : '') || cap.districtName || '';
      return {
        ...cap,
        zoneLabel: [gov, dist].filter(Boolean).join(' • '),
        existingLinksCount: leaderGroupCounts?.[cap.id] ?? 0,
      };
    });
  }, [captains, distNameMap, govNameMap, leaderGroupCounts]);

  const matchingCaptains = useMemo(() => {
    const q = captainSearch.trim().toLowerCase();
    if (!q) return enrichedCaptains;
    return enrichedCaptains.filter(
      (c) => c.fullName.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || c.zoneLabel.toLowerCase().includes(q),
    );
  }, [captainSearch, enrichedCaptains]);

  const totalMatchingCaptains = matchingCaptains.length;
  const filteredCaptains = useMemo(() => matchingCaptains.slice(0, MAX_VISIBLE_CAPTAINS), [matchingCaptains]);
  const selectedCaptain = useMemo(() => enrichedCaptains.find((c) => c.id === selectedCaptainId) || null, [enrichedCaptains, selectedCaptainId]);

  const trimmedCode = groupCode.trim();
  const codeFormatInvalid = Boolean(trimmedCode && !isValidWhatsAppGroupCodeFormat(trimmedCode));
  const previewSharePath = trimmedCode && !codeFormatInvalid ? buildWhatsAppGroupShareUrl(trimmedCode, '') : '';

  const resetDraft = useCallback(() => {
    setGroupName('');
    setGroupCode('');
    setCaptainSearch('');
    setSelectedCaptainId('');
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && submittingRef.current) return;
      if (!nextOpen) resetDraft();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetDraft],
  );

  const handleClose = useCallback(() => handleOpenChange(false), [handleOpenChange]);

  const resolveLocalizedError = useCallback(
    (err: unknown): string => {
      const code = err instanceof AdminWhatsAppGroupsApiError ? err.errorCode : undefined;
      if (code === 'DUPLICATE_CODE') return t('errDuplicateCode');
      if (code === 'INVALID_GROUP_CODE') return t('invalidCodeDesc');
      if (code === 'CAPTAIN_INELIGIBLE') return t('errCaptainIneligible');
      if (code === 'CAPTAIN_NOT_FOUND') return t('errCaptainNotFound');
      if (code === 'SCHEMA_NOT_READY') return t('schemaNotReadyTitle');
      if (code === 'INVALID_GROUP_NAME') return t('validationErrorDesc');
      return err instanceof Error && err.message ? err.message : t('errorTitle');
    },
    [t],
  );

  const handleCreate = useCallback(async () => {
    if (submittingRef.current) return;
    const cleanName = normalizeGroupNameInput(groupName);
    const cleanCode = groupCode.trim();
    if (cleanName.length < 2 || cleanName.length > 120 || !selectedCaptainId) {
      toast({ variant: 'destructive', title: t('validationErrorTitle'), description: t('validationErrorDesc') });
      return;
    }
    if (cleanCode && !isValidWhatsAppGroupCodeFormat(cleanCode)) {
      toast({ variant: 'destructive', title: t('validationErrorTitle'), description: t('invalidCodeDesc') });
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const created = await gateway.createGroup(
        { groupName: cleanName, groupCode: cleanCode || undefined, leaderCaptainId: selectedCaptainId },
        t('errorTitle'),
      );
      if (!isMountedRef.current) return;
      const createdCode = created?.groupCode || cleanCode;
      toast({
        title: t('createSuccessTitle'),
        description: createdCode ? t('createSuccessWithCode', { code: createdCode }) : undefined,
      });
      resetDraft();
      onOpenChange(false);
      await onCreated();
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      toast({ variant: 'destructive', title: t('errorTitle'), description: resolveLocalizedError(err) });
    } finally {
      submittingRef.current = false;
      if (isMountedRef.current) setSubmitting(false);
    }
  }, [gateway, groupCode, groupName, onCreated, onOpenChange, resetDraft, resolveLocalizedError, selectedCaptainId, t, toast]);

  return {
    groupName, groupCode, captainSearch, selectedCaptainId, submitting, codeFormatInvalid, previewSharePath,
    totalMatchingCaptains, filteredCaptains, selectedCaptain,
    setGroupName, setGroupCode, setCaptainSearch, setSelectedCaptainId, handleOpenChange, handleClose, handleCreate,
  };
}
