'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { handleAdAction } from '@/lib/utils';

export function SovereignAdBanner() {
  const { user, promoData } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  const adList = useMemo(() => {
    if (!promoData || !user) return [];
    const ads = user.role === 'driver' ? promoData.driverAds : promoData.riderAds;
    return Array.isArray(ads) ? ads : [];
  }, [user, promoData]);

  useEffect(() => {
    if (adList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % adList.length);
    }, 4000); // Rotate every 4 seconds
    
    return () => clearInterval(timer);
  }, [adList.length]);

  if (!adList || adList.length === 0) {
    return null; // Or a default banner
  }

  const currentAd = adList[currentIndex];
  
  // A simple color cycler
  const colors = ["bg-blue-950 border-blue-500", "bg-slate-900 border-slate-500", "bg-emerald-950 border-emerald-500"];
  const adColor = colors[currentIndex % colors.length];

  return (
    <div className={`w-full p-3 rounded-lg border shadow-lg transition-all duration-500 ease-in-out ${adColor} bg-opacity-90 backdrop-blur-sm relative z-0 flex items-center justify-between overflow-hidden mb-2 mt-2`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />
      
      <p className="text-sm font-medium text-white z-10 w-2/3 truncate">
        {currentAd.title || 'Welcome to Radar'}
      </p>
      
      {currentAd.buttonText && (
        <button 
          onClick={() => handleAdAction(currentAd.actionUrl)}
          disabled={!currentAd.actionUrl}
          className="z-10 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-1.5 px-3 rounded border border-white/20 transition-colors disabled:opacity-50"
        >
          {currentAd.buttonText}
        </button>
      )}
    </div>
  );
}
