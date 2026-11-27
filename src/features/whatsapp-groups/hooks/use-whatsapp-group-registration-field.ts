'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  isValidWhatsAppGroupCodeFormat,
  normalizeWhatsAppGroupCode,
} from '../constants';
import {
  clearPendingWhatsAppGroupCode,
  getPendingWhatsAppGroupCode,
  readQueryWhatsAppGroupCode,
  storePendingWhatsAppGroupCode,
} from '../services/whatsapp-group-storage';

export interface UseWhatsAppGroupRegistrationFieldResult {
  groupCode: string;
  capturedFromLink: boolean;
  hasFormatError: boolean;
  handleChange: (nextValue: string) => void;
}

export function useWhatsAppGroupRegistrationField(): UseWhatsAppGroupRegistrationFieldResult {
  const [groupCode, setGroupCode] = useState('');
  const [capturedFromLink, setCapturedFromLink] = useState(false);

  useEffect(() => {
    const initial = readQueryWhatsAppGroupCode() || getPendingWhatsAppGroupCode() || '';
    if (initial) {
      setGroupCode(initial);
      setCapturedFromLink(true);
    }
  }, []);

  const hasFormatError = useMemo(() => {
    const trimmed = normalizeWhatsAppGroupCode(groupCode);
    return trimmed.length > 0 && !isValidWhatsAppGroupCodeFormat(trimmed);
  }, [groupCode]);

  const handleChange = useCallback((nextValue: string) => {
    setGroupCode(nextValue);
    setCapturedFromLink(false);
    const clean = normalizeWhatsAppGroupCode(nextValue);
    if (!clean) {
      clearPendingWhatsAppGroupCode();
      return;
    }
    if (isValidWhatsAppGroupCodeFormat(clean)) {
      storePendingWhatsAppGroupCode(clean);
    } else {
      clearPendingWhatsAppGroupCode();
    }
  }, []);

  return {
    groupCode,
    capturedFromLink,
    hasFormatError,
    handleChange,
  };
}
