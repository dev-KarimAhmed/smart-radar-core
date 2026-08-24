'use client';

import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';
import { saveCaptainPricing, type CaptainPricingSaveResult } from '../services/captain-pricing';

/**
 * Gates the mandatory price-per-km popup. It appears in exactly three cases:
 * the very first time a captain uses the dashboard (`price_per_km`/
 * `flag_fall_fee` are null until they set them), whenever their live GPS
 * country no longer matches their registered one (the currency changes, so
 * the price they set no longer means the same thing), and every time they
 * go back online (call `notifyWentOnline` right after a successful manual
 * "go online" toggle) — NOT on every page reload, and NOT when a trip
 * finishes and status returns to "active" from "busy". This deliberately
 * does not infer the online transition from watching `driverStatus`: that
 * state starts at a synchronous default ('idle') and only resolves to its
 * real persisted value asynchronously, so a reload while already active
 * looks identical to a genuine idle-to-active transition — tying this to
 * the actual toggle action is the only way to tell them apart.
 */
export function usePricePerKmSetup(user: User | null, isInDifferentCountry = false) {
  const [pricePerKm, setPricePerKm] = React.useState<number | null>(null);
  const [flagFallFee, setFlagFallFee] = React.useState<number | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [pendingReconfirm, setPendingReconfirm] = React.useState(false);

  React.useEffect(() => {
    if (!user?.uid) {
      setIsLoaded(false);
      return;
    }

    let active = true;
    setIsLoaded(false);

    async function loadPricing() {
      try {
        const { data, error } = await supabase
          .from('captain_profiles')
          .select('price_per_km, flag_fall_fee')
          .eq('id', user!.uid)
          .maybeSingle();
        if (!active) return;
        if (error) throw error;
        setPricePerKm(typeof data?.price_per_km === 'number' ? data.price_per_km : null);
        setFlagFallFee(typeof data?.flag_fall_fee === 'number' ? data.flag_fall_fee : null);
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Captain price-per-km load]', error);
      } finally {
        if (active) setIsLoaded(true);
      }
    }

    void loadPricing();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const notifyWentOnline = React.useCallback(() => {
    setPendingReconfirm(true);
  }, []);

  const savePricing = React.useCallback(async (price: number, flagFall: number): Promise<CaptainPricingSaveResult> => {
    if (!user?.uid) return { ok: false };
    const result = await saveCaptainPricing(supabase, price, flagFall);
    if (!result.ok) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Captain price-per-km save]', result.errorCode);
      return result;
    }
    setPricePerKm(price);
    setFlagFallFee(flagFall);
    setPendingReconfirm(false);
    return result;
  }, [user?.uid]);

  return {
    needsPriceSetup: isLoaded && (pricePerKm === null || flagFallFee === null || isInDifferentCountry || pendingReconfirm),
    currentPricePerKm: pricePerKm,
    currentFlagFallFee: flagFallFee,
    notifyWentOnline,
    savePricing,
  };
}
