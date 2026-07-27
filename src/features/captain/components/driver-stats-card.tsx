'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Star, Heart } from 'lucide-react';
import type { User } from '@/core/types';
import { getRankTheme } from '@/core/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const styles = {
  style16_1: "bg-[#0F172A]/90 border-white/[0.06] shadow-lg",
  style17_2: "p-5 grid grid-cols-3 gap-4 divide-x divide-white/[0.06] divide-x-reverse text-center animate-in fade-in",
  style18_3: "space-y-1",
  style19_4: "text-xs text-[#14B8A6]/70 font-bold uppercase tracking-widest",
  style20_5: "flex items-center justify-center gap-1 text-[#14B8A6]",
  style21_6: "text-xl font-black",
  style22_7: "w-4 h-4 fill-[#14B8A6] text-[#14B8A6]",
  style25_8: "space-y-1",
  style26_9: "text-[9px] text-[#14b8a6] font-bold uppercase tracking-widest",
  style27_10: "flex items-center justify-center gap-1 text-[#14b8a6]",
  style28_11: "text-sm font-black font-mono",
  style29_12: "relative flex h-1.5 w-1.5 align-middle",
  style30_13: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14b8a6] opacity-75",
  style31_14: "relative inline-flex rounded-full h-1.5 w-1.5 bg-[#14b8a6]",
  style35_15: "space-y-1",
  style36_16: "text-xs text-[#14B8A6]/70 font-bold uppercase tracking-widest",
  style37_17: "flex items-center justify-center pt-0.5",
  style38_18: "text-xs font-black shadow-sm px-2.5 py-0.5",
  style38_19: "bg-[#0F172A]",
} as const;



export function DriverStatsCard({ user }: { user: User }) {
 // تم بتر مستمعات النشاط من هنا وحذف الملف (Protocol 16)
 const rankTheme = getRankTheme(user.rank);

 return (
 <Card className={styles.style16_1}>
 <CardContent className={styles.style17_2}>
 <div className={styles.style18_3}>
 <p className={styles.style19_4}>التقييم</p>
 <div className={styles.style20_5}>
 <span className={styles.style21_6}>{user.rating?.toFixed(1) || '5.0'}</span>
 <Star className={styles.style22_7} />
 </div>
 </div>
 <div className={styles.style25_8}>
 <p className={styles.style26_9}>معدل قبول الطلبات</p>
 <div className={styles.style27_10}>
 <span className={styles.style28_11}>98% ●</span>
 <span className={styles.style29_12}>
 <span className={styles.style30_13}></span>
 <span className={styles.style31_14}></span>
 </span>
 </div>
 </div>
 <div className={styles.style35_15}>
 <p className={styles.style36_16}>رتبة السائق</p>
 <div className={styles.style37_17}>
 <Badge variant="outline" className={cn(styles.style38_18, rankTheme.border, rankTheme.color, styles.style38_19)}>
 {rankTheme.label}
 </Badge>
 </div>
 </div>
 </CardContent>
 </Card>
 );
}
