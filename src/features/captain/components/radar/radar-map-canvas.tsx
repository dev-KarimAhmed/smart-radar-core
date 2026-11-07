import React from 'react';
import { cn } from '@/lib/utils';
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

      {/* Full-width Map Top Banner per User Request */}
      <div
        className={cn(
          "pointer-events-none absolute top-2.5 sm:top-3.5 inset-x-2.5 sm:inset-x-4 z-20 flex items-center justify-center rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xl backdrop-blur-md select-none transition-all duration-300",
          radarLockMessage
            ? "border-amber-500/40 bg-[#06101E]/95 text-amber-300"
            : isActive
              ? "border-teal-500/40 bg-[#06101E]/95 text-[#14F5D5]"
              : "border-slate-700/60 bg-[#06101E]/95 text-slate-400"
        )}
      >
        <span className="text-xs sm:text-sm font-black tracking-wide text-center">
          {radarLockMessage ||
            (isActive
              ? language === 'ar'
                ? 'انت داخل نطاق الطلبات بالمحيط'
                : 'You are within order broadcast perimeter'
              : copy.offline)}
        </span>

        {/* Top-Right Label: رادار الكابتن المعلن */}
        <span className="absolute end-3 sm:end-4 text-[10px] sm:text-xs font-bold text-slate-400 select-none">
          {copy.title}
        </span>
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
