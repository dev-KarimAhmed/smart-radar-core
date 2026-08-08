'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, ExternalLink, Loader2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { useDestinationMapPicker } from '../hooks/use-destination-map-picker';
import type { RiderLocation, RiderLocationUpdate } from './rider-map';

const RiderMap = dynamic(() => import('./rider-map').then((m) => m.RiderMap), { ssr: false });

const styles = {
  dialogContent: "max-w-3xl border border-[#14B8A6]/25 bg-[#0B0F19] text-white shadow-2xl",
  dialogTitle: "text-sm font-black text-white",
  searchForm: "mb-3 flex gap-2",
  searchInputWrapper: "relative min-w-0 flex-1",
  searchIcon: "pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14B8A6]",
  searchInput: "h-11 w-full rounded-xl border border-white/10 bg-black/40 pe-4 ps-10 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-[#14B8A6]/60",
  searchButton: "flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-4 text-xs font-black text-[#031315] transition hover:bg-[#2DD4BF] disabled:cursor-not-allowed disabled:opacity-50",
  searchButtonIcon: "h-4 w-4",
  loadingIcon: "h-4 w-4 animate-spin",
  embedWrapper: "h-[70vh] max-h-[560px] w-full overflow-hidden rounded-2xl border border-[#14B8A6]/25 bg-[#0F172A]",
  embedFrame: "h-full w-full border-0",
  footer: "mt-3 flex flex-col gap-2 sm:flex-row",
  copyButton: "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/35 text-xs font-black text-slate-200 transition hover:bg-black/50",
  confirmButton: "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] text-xs font-black text-[#031315] transition hover:bg-[#2DD4BF]",
  btnIcon: "h-4 w-4",
} as const;

export interface DestinationMapPickerDialogProps {
  isArabic: boolean;
  mapPicker: ReturnType<typeof useDestinationMapPicker>;
  riderLocation: RiderLocation;
  onLocationChange: (payload: RiderLocationUpdate) => void;
}

export function DestinationMapPickerDialog({ isArabic, mapPicker, riderLocation, onLocationChange }: DestinationMapPickerDialogProps) {
  const locationCopy = useTranslations('location');

  return (
    <Dialog
      open={mapPicker.isMapPickerOpen}
      onOpenChange={(open) => {
        if (!open) mapPicker.handleCloseSearchMapEmbed();
      }}
    >
      <DialogContent className={styles.dialogContent} dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className={styles.dialogTitle}>
            {locationCopy('step_search_title')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={mapPicker.handleModalMapSearch} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="search"
              value={mapPicker.modalSearchQuery}
              onChange={(event) => mapPicker.setModalSearchQuery(event.target.value)}
              placeholder={locationCopy('modal_search_placeholder')}
              className={styles.searchInput}
            />
          </div>
          <button
            type="submit"
            disabled={mapPicker.modalSearchQuery.trim().length < 2 || mapPicker.isModalSearchLoading}
            className={styles.searchButton}
          >
            {mapPicker.isModalSearchLoading ? (
              <Loader2 className={styles.loadingIcon} />
            ) : (
              <Search className={styles.searchButtonIcon} />
            )}
            <span>{locationCopy('modal_search_button')}</span>
          </button>
        </form>
        <div className={styles.embedWrapper}>
          <RiderMap
            showDestinationPin
            className={styles.embedFrame}
            destinationFlyToTarget={mapPicker.modalPinLocation}
            fallbackLocation={mapPicker.modalPinLocation || riderLocation}
            onDestinationChange={mapPicker.handleModalPinChange}
            onLocationChange={onLocationChange}
          />
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            onClick={mapPicker.handleCopyModalLocationLink}
            className={styles.copyButton}
          >
            <ExternalLink className={styles.btnIcon} />
            <span>{locationCopy('show_copied_link')}</span>
          </button>
          <button
            type="button"
            onClick={mapPicker.handleConfirmModalLocation}
            className={styles.confirmButton}
          >
            <CheckCircle2 className={styles.btnIcon} />
            <span>{locationCopy('btn_confirm_and_calculate')}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
