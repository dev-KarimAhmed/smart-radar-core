import React from 'react';
import type { Trip } from '@/core/types';
import type { CaptainCancelCooldownState } from '../../services/captain-cancel-cooldown';
import { RecenterMapButton } from '@/shared/components/map/recenter-map-button';
import { styles } from './radar-map.styles';
import {
  CarMarkerIcon,
  fallbackRequestPosition,
} from './radar-map.helpers';
import type { RadarCopyType } from './radar-copy';

interface RadarMapCanvasProps {
  language: 'ar' | 'en';
  isActive: boolean;
  radarLockMessage?: string;
  cancelCooldown?: CaptainCancelCooldownState;
  totalMinutes: number;
  isMapReady: boolean;
  mapIssue: boolean;
  requests: Trip[];
  copy: RadarCopyType;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  onSelectRequest: (request: Trip) => void;
  onRecenter: () => void;
}

export function RadarMapCanvas({
  language,
  isActive,
  radarLockMessage,
  cancelCooldown,
  totalMinutes,
  isMapReady,
  mapIssue,
  requests,
  copy,
  mapContainerRef,
  onSelectRequest,
  onRecenter,
}: RadarMapCanvasProps) {
  return (
    <div className={styles.style145_2}>
      <div className={styles.style146_3} />
      <div className={styles.style147_4}>
        <div className={styles.style148_5}>
          <CarMarkerIcon />
        </div>
        {requests.slice(0, 9).map((request, index) => (
          <button
            key={request.id}
            type="button"
            onClick={() => onSelectRequest(request)}
            className={styles.style156_6}
            style={fallbackRequestPosition(index)}
          >
            R
          </button>
        ))}
      </div>
      <div className={styles.style163_7}>
        <div ref={mapContainerRef} className={styles.style164_8} />
      </div>
      <div className={styles.style166_9} />

      {/* Floating Center Banner per Page 8: انت داخل نطاق الطلبات بالمحيط */}
      {radarLockMessage ? (
        <div className="pointer-events-none absolute top-3 sm:top-4 inset-x-0 mx-auto w-fit max-w-[85%] z-20 flex items-center justify-center rounded-xl sm:rounded-2xl border border-amber-500/40 bg-[#06101E]/95 px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-amber-300 shadow-2xl backdrop-blur-md select-none animate-in fade-in duration-300">
          <span>{radarLockMessage}</span>
        </div>
      ) : isActive ? (
        <div className="pointer-events-none absolute top-3 sm:top-4 inset-x-0 mx-auto w-fit max-w-[85%] z-20 flex items-center justify-center rounded-xl sm:rounded-2xl border border-teal-500/40 bg-[#06101E]/95 px-8 sm:px-14 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-[#14F5D5] shadow-2xl backdrop-blur-md select-none animate-in fade-in duration-300">
          <span>{language === 'ar' ? 'انت داخل نطاق الطلبات بالمحيط' : 'You are within order broadcast perimeter'}</span>
        </div>
      ) : (
        <div className="pointer-events-none absolute top-3 sm:top-4 inset-x-0 mx-auto w-fit max-w-[85%] z-20 flex items-center justify-center rounded-xl sm:rounded-2xl border border-slate-700/60 bg-[#06101E]/95 px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-slate-400 shadow-2xl backdrop-blur-md select-none animate-in fade-in duration-300">
          <span>{copy.offline}</span>
        </div>
      )}

      {/* Top-Right Label: رادار الكابتن المعلن */}
      <div className="pointer-events-none absolute top-3 sm:top-4 end-3 sm:end-4 z-20 text-[11px] sm:text-xs font-bold text-slate-300/80 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 backdrop-blur-sm select-none">
        <span>{copy.title}</span>
      </div>

      {(!isMapReady || mapIssue) && (
        <div className={styles.style182_16}>
          <p className={styles.style183_17}>{mapIssue ? copy.mapIssue : copy.mapLoading}</p>
          <p className={styles.style184_18}>{copy.mapHint}</p>
          <p className={styles.style185_19}>{copy.radarFallback}</p>
        </div>
      )}

      <RecenterMapButton
        onClick={onRecenter}
        className={styles.style192_20}
        ariaLabel={copy.recenter}
      />
    </div>
  );
}
