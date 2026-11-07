import React from 'react';
import { Clock } from 'lucide-react';
import type { Trip } from '@/core/types';
import type { CaptainCancelCooldownState } from '../../services/captain-cancel-cooldown';
import { formatSecondsToMMSS } from '../../services/captain-cancel-cooldown';
import { cn } from '@/lib/utils';
import { RecenterMapButton } from '@/shared/components/map/recenter-map-button';
import { styles } from './radar-map.styles';
import {
  CarMarkerIcon,
  fallbackRequestPosition,
  formatMinutes,
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
      {isActive && !radarLockMessage && (
        <div className="pointer-events-none absolute top-3 inset-x-0 mx-auto w-fit z-20 flex items-center justify-center gap-2 rounded-full border border-teal-500/40 bg-[#06101E]/90 px-4 py-1.5 text-xs font-black text-[#14F5D5] shadow-xl backdrop-blur-md select-none animate-in fade-in duration-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F5D5] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14F5D5]" />
          </span>
          <span>{language === 'ar' ? 'انت داخل نطاق الطلبات بالمحيط' : 'You are within order broadcast perimeter'}</span>
        </div>
      )}

      <div className={styles.style168_10}>
        <div>
          <p className={styles.style170_11}>{copy.title}</p>
          <p className={styles.style171_12}>{isActive && !radarLockMessage ? copy.online : copy.offline}</p>
        </div>
        <div className={styles.style173_13}>
          <span className={styles.style174_14}>
            <Clock className={styles.style175_15} />
            {radarLockMessage
              ? copy.locked
              : language === 'ar'
                ? `رصيد الانتشار: ${formatMinutes(totalMinutes, language)} - أنت داخل نطاق الطلبات بالمحيط`
                : `Broadcast Quota: ${formatMinutes(totalMinutes, language)} - Within perimeter`}
          </span>
        </div>
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
