'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { useTranslations } from 'next-intl';
import { Tv, Sparkles, Gauge, ChevronDown, Check, Play, Pause } from 'lucide-react';
import { CAPTAIN_ADS_CONFIG, type AdDisplayMode, type RiverSpeed } from '@/features/captain/config/captain-ads-config';

const styles = {
  triggerButton: "h-8 px-2.5 text-xs font-black bg-[#0C1425] hover:bg-[#152038] text-white border border-[#00ffcc]/30 hover:border-[#00ffcc] rounded-full flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_12px_rgba(0,255,204,0.15)] active:scale-95 shrink-0",
  pulseWrapper: "relative flex h-2 w-2",
  pulsePingGreen: "absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#00ffcc] animate-ping",
  pulsePingAmber: "absolute inline-flex h-full w-full rounded-full opacity-75 bg-amber-400 animate-ping",
  pulseDotGreen: "relative inline-flex rounded-full h-2 w-2 bg-[#00ffcc]",
  pulseDotAmber: "relative inline-flex rounded-full h-2 w-2 bg-amber-400",
  buttonContent: "flex items-center gap-1.5 font-bold",
  tvIcon: "w-3.5 h-3.5 text-[#00ffcc]",
  labelText: "text-white text-[11px] font-sans",
  modeBadge: "text-[10px] text-[#00ffcc] font-mono hidden sm:inline",
  chevronIcon: "w-3.5 h-3.5 text-gray-400",
  menuContent: "w-64 bg-[#070D19]/95 backdrop-blur-xl text-white border border-[#00ffcc]/30 shadow-2xl rounded-2xl p-2 text-right z-[120]",
  menuHeader: "text-xs font-black text-gray-300 flex items-center justify-between pb-1",
  sparklesBadge: "flex items-center gap-1.5 text-[#00ffcc]",
  sparklesIcon: "w-3.5 h-3.5",
  statusBadge: "text-[9px] font-mono text-gray-400",
  separator: "bg-white/10 my-1",
  sectionBox: "py-1",
  sectionTitle: "text-[10px] text-gray-400 font-bold block px-2 mb-1",
  itemActiveRiver: "flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs font-bold transition-all bg-gradient-to-r from-teal-500/20 to-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/40",
  itemInactive: "flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs font-bold transition-all hover:bg-white/5 text-gray-300",
  itemActiveJump: "flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs font-bold transition-all mt-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40",
  checkIconRiver: "w-3.5 h-3.5 text-[#00ffcc]",
  checkIconJump: "w-3.5 h-3.5 text-amber-300",
  speedHeader: "text-[10px] text-gray-400 font-bold px-2 mb-1 flex items-center gap-1",
  speedIcon: "w-3 h-3 text-[#00ffcc]",
  speedGrid: "grid grid-cols-3 gap-1 px-1",
  speedBtnActive: "py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer bg-[#00ffcc] text-black shadow-[0_0_8px_rgba(0,255,204,0.4)]",
  speedBtnInactive: "py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer bg-white/5 hover:bg-white/10 text-gray-300",
  pauseToggleBtn: "w-full mt-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-200",
  pauseIcon: "w-3.5 h-3.5 text-amber-400",
  playIcon: "w-3.5 h-3.5 text-[#00ffcc]",
} as const;

interface CaptainAdHeaderMenuProps {
  isArabic?: boolean;
}

export function CaptainAdHeaderMenu({ isArabic = true }: CaptainAdHeaderMenuProps) {
  const t = useTranslations('captainAds');
  const [displayMode, setDisplayMode] = useState<AdDisplayMode>(CAPTAIN_ADS_CONFIG.DEFAULT_DISPLAY_MODE);
  const [speed, setSpeed] = useState<RiverSpeed>(CAPTAIN_ADS_CONFIG.DEFAULT_SPEED);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // استرجاع الإعدادات ومزامنة المستمعين مع الذاكرة المحلية
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.DISPLAY_MODE) as AdDisplayMode;
      if (savedMode === 'jump' || savedMode === 'river') setDisplayMode(savedMode);

      const savedSpeed = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.STREAM_SPEED) as RiverSpeed;
      if (savedSpeed && (savedSpeed === 'slow' || savedSpeed === 'normal' || savedSpeed === 'fast')) {
        setSpeed(savedSpeed);
      }

      const savedPaused = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.IS_PAUSED);
      if (savedPaused !== null) {
        setIsPaused(savedPaused === 'true');
      }
    } catch {
      // Ignored for SSR or restricted access
    }

    const onMode = () => {
      const mode = (localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.DISPLAY_MODE) as AdDisplayMode) || 'river';
      setDisplayMode(mode);
    };

    const onSpeed = () => {
      const sp = (localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.STREAM_SPEED) as RiverSpeed) || 'normal';
      setSpeed(sp);
    };

    const onPause = (e: any) => {
      if (e?.detail?.isPaused !== undefined) {
        setIsPaused(Boolean(e.detail.isPaused));
      }
    };

    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.DISPLAY_MODE_CHANGED, onMode);
    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.STREAM_SPEED_CHANGED, onSpeed);
    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.PAUSE_CHANGED, onPause);

    return () => {
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.DISPLAY_MODE_CHANGED, onMode);
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.STREAM_SPEED_CHANGED, onSpeed);
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.PAUSE_CHANGED, onPause);
    };
  }, []);

  const changeDisplayMode = useCallback((newMode: AdDisplayMode) => {
    setDisplayMode(newMode);
    localStorage.setItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.DISPLAY_MODE, newMode);
    window.dispatchEvent(new Event(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.DISPLAY_MODE_CHANGED));
  }, []);

  const changeSpeed = useCallback((newSpeed: RiverSpeed) => {
    setSpeed(newSpeed);
    localStorage.setItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.STREAM_SPEED, newSpeed);
    window.dispatchEvent(new Event(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.STREAM_SPEED_CHANGED));
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      localStorage.setItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.IS_PAUSED, String(next));
      window.dispatchEvent(
        new CustomEvent(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.PAUSE_CHANGED, {
          detail: { isPaused: next },
        })
      );
      return next;
    });
  }, []);

  const speedOptions = [
    { id: 'slow', label: t('speedSlowLabel') },
    { id: 'normal', label: t('speedNormalLabel') },
    { id: 'fast', label: t('speedFastLabel') },
  ];

  return (
    <DropdownMenu dir={isArabic ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={styles.triggerButton}
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          {/* وميض النبض الأخضر/البرتقالي التفاعلي بحسب حالة النهر */}
          {/* <span className={styles.pulseWrapper}>
            <span className={isPaused ? styles.pulsePingAmber : styles.pulsePingGreen} />
            <span className={isPaused ? styles.pulseDotAmber : styles.pulseDotGreen} />
          </span> */}

          <span className={styles.buttonContent}>
            <span className={styles.labelText}>
              {t('viewOptions')}
            </span>
          </span>

          <ChevronDown className={styles.chevronIcon} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={styles.menuContent}
        align="start"
      >
        <DropdownMenuLabel className={styles.menuHeader}>
          <span className={styles.sparklesBadge}>
            <Sparkles className={styles.sparklesIcon} />
            <span>{t('controlsHeader')}</span>
          </span>
          <span className={styles.statusBadge}>
            {isPaused ? t('statusPausedBadge') : t('statusActiveBadge')}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className={styles.separator} />

        {/* خيار التبديل بين النهر المتدفق والقفز الإعلاني */}
        <div className={styles.sectionBox}>
          <span className={styles.sectionTitle}>
            {t('displayModeLabel')}
          </span>
          <DropdownMenuItem
            onClick={() => changeDisplayMode('river')}
            className={displayMode === 'river' ? styles.itemActiveRiver : styles.itemInactive}
          >
            <span>{t('riverModeTitle')}</span>
            {displayMode === 'river' && <Check className={styles.checkIconRiver} />}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => changeDisplayMode('jump')}
            className={displayMode === 'jump' ? styles.itemActiveJump : styles.itemInactive}
          >
            <span>{t('jumpModeTitle')}</span>
            {displayMode === 'jump' && <Check className={styles.checkIconJump} />}
          </DropdownMenuItem>
        </div>

        {/* سرعة التدفق: بطيء (95s)، متزن (60s)، سريع (32s) */}
        {displayMode === 'river' && (
          <div className={styles.sectionBox}>
            <span className={styles.speedHeader}>
              <Gauge className={styles.speedIcon} />
              <span>{t('streamSpeedLabel')}</span>
            </span>

            <div className={styles.speedGrid}>
              {speedOptions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => changeSpeed(s.id as RiverSpeed)}
                  className={speed === s.id ? styles.speedBtnActive : styles.speedBtnInactive}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
