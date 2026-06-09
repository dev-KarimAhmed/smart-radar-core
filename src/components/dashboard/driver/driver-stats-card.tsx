'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Star, Heart } from 'lucide-react';
import type { User } from '@/core/types';
import { getRankTheme } from '@/lib/theme-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function DriverStatsCard({ user }: { user: User }) {
  // تم بتر مستمعات النبض من هنا وتطهير الملف (Protocol 16)
  const rankTheme = getRankTheme(user.rank);
  
  return (
    <Card className="bg-[#050D05] border-emerald-900/40 shadow-lg">
      <CardContent className="p-5 grid grid-cols-3 gap-4 divide-x divide-emerald-900/30 divide-x-reverse text-center animate-in fade-in">
        <div className="space-y-1">
          <p className="text-xs text-emerald-500/70 font-bold uppercase tracking-widest">التقييم</p>
          <div className="flex items-center justify-center gap-1 text-emerald-400">
            <span className="text-xl font-black">{user.rating?.toFixed(1) || '5.0'}</span>
            <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-emerald-500/70 font-bold uppercase tracking-widest">الالتحاف الميداني</p>
          <div className="flex items-center justify-center gap-1 text-red-500">
            <span className="text-xl font-black">{user.heartCount || 0}</span>
            <Heart className="w-4 h-4 fill-red-505 text-red-500" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-emerald-500/70 font-bold uppercase tracking-widest">الرتبة السيادية</p>
          <div className="flex items-center justify-center pt-0.5">
            <Badge variant="outline" className={cn("text-xs font-black shadow-sm px-2.5 py-0.5", rankTheme.border, rankTheme.color, "bg-[#050D05]")}>
              {rankTheme.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
