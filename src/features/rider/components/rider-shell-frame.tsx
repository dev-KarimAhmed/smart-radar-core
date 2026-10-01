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
  aside: "absolute bottom-0 start-0 end-0 z-10 w-full max-h-full overflow-hidden flex flex-col rounded-t-[32px] rounded-b-none border-t border-[#14B8A6]/20 bg-[#060A14] shadow-[0_-12px_35px_rgba(0,0,0,0.7)] lg:absolute lg:bottom-6 lg:start-auto lg:end-6 lg:top-6 lg:z-40 lg:w-[420px] lg:rounded-[28px] lg:border lg:border-[#14B8A6]/20 lg:bg-[#060A14] lg:shadow-[0_30px_100px_rgba(0,0,0,0.6)] lg:max-h-none lg:rounded-b-[28px] lg:overflow-hidden",
  topBar: "relative z-50 flex items-center justify-between rounded-t-[32px] border-b border-[#14B8A6]/15 bg-[#04070F] px-4 py-3 lg:rounded-t-[28px] lg:px-5",
  topBarSpacer: "w-9",
  dragHandle: "w-12 h-1.5 bg-[#14B8A6]/25 rounded-full transition-colors",
  closeButton: "h-9 w-9 flex items-center justify-center rounded-full bg-[#0B1322] border border-[#14B8A6]/30 text-[#14F5D5] shadow-md shadow-black/40 active:scale-95 cursor-pointer hover:bg-[#14B8A6]/20 hover:border-[#14F5D5]/50 transition-all",
  closeIcon: "h-4 w-4 stroke-[3]",
  scrollArea: "flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-3 lg:p-5",
  panelHeaderCard: "hidden lg:block rounded-2xl border border-[#14B8A6]/20 bg-[#0B1322] p-4 shadow-xl shadow-black/30",
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
  const isRideFlowActive = screen === 'DESTINATION_SELECTION' || screen === 'RECEIVING_OFFERS' || screen === 'TRIP_ACTIVE';

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
            {!isRideFlowActive ? (
              <div className={styles.panelHeaderCard}>
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
            ) : null}

            {children}
          </div>
        </aside>
      </div>
    </div>
  );
}
