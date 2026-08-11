'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ShieldCheck, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { RiderMachineScreen } from '../state/rider-state-machine';
import type { CaptainPresencePoint } from '../services/rider-server-marketplace';
import type { RiderLocation, RiderLocationUpdate } from './rider-map';
import { NavButton } from './rider-view-primitives';

const RiderMap = dynamic(() => import('./rider-map').then((m) => m.RiderMap), { ssr: false });

const styles = {
  shell: "relative h-[calc(100vh-120px)] w-full overflow-hidden text-white lg:h-screen lg:min-h-screen lg:overflow-hidden lg:bg-transparent",
  shellInner: "relative h-full w-full lg:block lg:max-w-none",
  mapLayer: "hidden lg:block lg:absolute lg:inset-0 lg:z-0",
  map: "h-full w-full lg:rounded-none lg:border-0",
  aside: "absolute bottom-0 start-0 end-0 z-10 w-full max-h-full overflow-hidden flex flex-col rounded-t-[32px] rounded-b-none border-t border-white/10 bg-[#0A0F1D]/80 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:absolute lg:bottom-6 lg:start-auto lg:end-6 lg:top-6 lg:z-40 lg:w-[420px] lg:rounded-[28px] lg:border lg:border-white/10 lg:bg-[#0A0F1D]/80 lg:shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:backdrop-blur-xl lg:max-h-none lg:rounded-b-[28px] lg:overflow-hidden",
  topBar: "relative z-50 flex items-center justify-between rounded-t-[32px] border-b border-white/5 bg-slate-900/40 px-4 py-3 backdrop-blur-md lg:rounded-t-[28px] lg:px-5",
  topBarSpacer: "w-9",
  dragHandle: "w-12 h-1.5 bg-slate-500/40 rounded-full",
  closeButton: "h-9 w-9 flex items-center justify-center rounded-full bg-slate-800 border border-white/20 text-white shadow-md active:scale-95 cursor-pointer hover:bg-slate-700 transition-colors",
  closeIcon: "h-4 w-4 stroke-[3]",
  scrollArea: "flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-3 lg:p-5",
  panelHeaderCard: "rounded-2xl border border-white/5 bg-white/5 p-4 shadow-xl shadow-black/20 backdrop-blur",
  panelHeaderCardHidden: "hidden",
  panelHeaderRow: "mb-3 flex items-center justify-between sm:mb-4",
  panelEyebrow: "text-[11px] font-black text-[#14F5D5] tracking-wider",
  panelTitle: "text-xl font-bold text-white mt-0.5",
  panelShieldIcon: "h-7 w-7 text-[#14F5D5]",
  navRow: "grid grid-cols-3 gap-2 lg:hidden",
} as const;

export interface RiderShellFrameProps {
  isArabic: boolean;
  screen: RiderMachineScreen;
  dispatch: (action: { type: 'RETURN_TO_MAP' | 'OPEN_PURGE_LEDGER' | 'OPEN_FAVORITE_CAPTAINS' }) => void;
  activeTripCaptainId: string | null;
  captainLocations: CaptainPresencePoint[];
  destinationFlyToTarget: RiderLocation | null;
  fallbackLocation: RiderLocation;
  onDestinationChange: (location: RiderLocation) => void;
  onDestinationMoveStart: () => void;
  onLocationChange: (payload: RiderLocationUpdate) => void;
  onCloseOrCancel: () => void;
  children: React.ReactNode;
}

/** The persistent shell: the background map plus the sliding panel's top bar and tab row. */
export function RiderShellFrame({
  isArabic,
  screen,
  dispatch,
  activeTripCaptainId,
  captainLocations,
  destinationFlyToTarget,
  fallbackLocation,
  onDestinationChange,
  onDestinationMoveStart,
  onLocationChange,
  onCloseOrCancel,
  children,
}: RiderShellFrameProps) {
  const t = useTranslations('riderView');

  return (
    <div className={styles.shell} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.shellInner}>
        <div className={styles.mapLayer}>
          <RiderMap
            activeTripCaptainId={activeTripCaptainId}
            captainLocations={captainLocations}
            className={styles.map}
            destinationFlyToTarget={screen === 'DESTINATION_SELECTION' ? destinationFlyToTarget : null}
            fallbackLocation={fallbackLocation}
            showDestinationPin={screen === 'DESTINATION_SELECTION'}
            onDestinationChange={onDestinationChange}
            onDestinationMoveStart={onDestinationMoveStart}
            onLocationChange={onLocationChange}
          />
        </div>

        <aside className={styles.aside}>
          <div className={styles.topBar}>
            <div className={styles.topBarSpacer} />
            <div className={styles.dragHandle} />
            <button
              type="button"
              onClick={onCloseOrCancel}
              className={styles.closeButton}
              aria-label={t('destination.closeDestination')}
            >
              <X className={styles.closeIcon} />
            </button>
          </div>

          <div className={styles.scrollArea}>
            <div className={cn(styles.panelHeaderCard, screen === 'DESTINATION_SELECTION' && styles.panelHeaderCardHidden)}>
              <div className={styles.panelHeaderRow}>
                <div>
                  <p className={styles.panelEyebrow}>{t('panel.eyebrow')}</p>
                  <h1 className={styles.panelTitle}>{t('panel.title')}</h1>
                </div>
                <ShieldCheck className={styles.panelShieldIcon} />
              </div>

              <div className={styles.navRow}>
                <NavButton active={screen === 'IDLE_MAP'} onClick={() => dispatch({ type: 'RETURN_TO_MAP' })}>
                  {t('panel.mapTab')}
                </NavButton>
                <NavButton active={screen === 'PURGE_LEDGER'} onClick={() => dispatch({ type: 'OPEN_PURGE_LEDGER' })}>
                  {t('panel.tripsTab')}
                </NavButton>
                <NavButton active={screen === 'FAVORITE_CAPTAINS'} onClick={() => dispatch({ type: 'OPEN_FAVORITE_CAPTAINS' })}>
                  {t('panel.savedTab')}
                </NavButton>
              </div>
            </div>

            {children}
          </div>
        </aside>
      </div>
    </div>
  );
}
