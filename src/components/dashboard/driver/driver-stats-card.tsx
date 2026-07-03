'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Star, Heart } from 'lucide-react';
import type { User } from '@/core/types';
import { getRankTheme } from '@/core/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function DriverStatsCard({ user }: { user: User }) {
 // تم بتر مستمعات النشاط من هنا وحذف الملف (Protocol 16)
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
 <p className="text-[9px] text-[#14b8a6] font-bold uppercase tracking-widest">معدل قبول الطلبات</p>
 <div className="flex items-center justify-center gap-1 text-[#14b8a6]">
 <span className="text-sm font-black font-mono">98% ●</span>
 <span className="relative flex h-1.5 w-1.5 align-middle">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14b8a6] opacity-75"></span>
 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#14b8a6]"></span>
 </span>
 </div>
 </div>
 <div className="space-y-1">
 <p className="text-xs text-emerald-500/70 font-bold uppercase tracking-widest">رتبة السائق</p>
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
