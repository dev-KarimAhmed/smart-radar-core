'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function NetworkIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
        setIsOffline(false);
        document.body.classList.remove('grayscale', 'contrast-125');
    };
    const handleOffline = () => {
        setIsOffline(true);
        document.body.classList.add('grayscale', 'contrast-125');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) handleOffline();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.body.classList.remove('grayscale', 'contrast-125');
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground text-[10px] font-bold py-1 px-4 flex items-center justify-center gap-2 z-[9999] shadow-md">
      <WifiOff className="h-3 w-3 animate-pulse" />
      أنت الآن في وضع عدم الاتصال - البيانات معروضة من الذاكرة المحلية
    </div>
  );
}
