'use client';

import React from 'react';
import type { User as DriverUser } from '@/core/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, Heart, ShieldAlert, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRankTheme } from '@/core/utils';
import { useSovereignFleet } from '@/hooks/use-sovereign-fleet';

const styles = {
  style44_1: "flex items-center justify-center py-20 text-muted-foreground",
  style45_2: "w-10 h-10 animate-spin mr-3",
  style53_3: "flex flex-col items-center justify-center py-20 text-destructive",
  style54_4: "w-10 h-10 mb-4",
  style55_5: "font-bold",
  style62_6: "text-center text-muted-foreground py-20",
  style63_7: "mx-auto h-12 w-12 text-gray-400",
  style64_8: "mt-2 text-sm font-medium text-gray-200",
  style65_9: "mt-1 text-sm text-gray-500",
  style83_10: "text-center",
  style84_11: "text-center",
  style85_12: "text-center",
  style86_13: "text-right",
  style95_14: "flex items-center gap-3",
  style100_15: "font-medium",
  style103_16: "text-center",
  style104_17: "font-bold",
  style108_18: "text-center",
  style109_19: "flex items-center justify-center gap-1",
  style110_20: "w-4 h-4 text-yellow-400 fill-yellow-400",
  style111_21: "font-bold",
  style114_22: "text-center",
  style115_23: "flex items-center justify-center gap-1.5",
  style116_24: "w-4 h-4 text-red-500 fill-red-500/70",
  style117_25: "font-bold",
  style120_26: "text-right",
  style121_27: "flex items-center justify-end gap-2",
  style122_28: "capitalize",
  style123_29: "w-2.5 h-2.5 rounded-full animate-pulse",
} as const;
 // 🔗 إضافة الخطاف

const getStatusIndicator = (status?: string) => {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'busy':
    case 'rating': return 'bg-yellow-500';
    case 'idle': return 'bg-gray-500';
    default: return 'bg-gray-700';
  }
};


export function DriversManagementTab() {
  // 🏛️ استدعاء العصب المركزي للأسطول (SSOT)
  const { drivers, loading, error } = useSovereignFleet();

  if (loading) {
    return (
      <div className={styles.style44_1}>
        <Loader2 className={styles.style45_2} />
        <span>جاري استدعاء الأسطول ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.style53_3}>
        <ShieldAlert className={styles.style54_4} />
        <span className={styles.style55_5}>{error}</span>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
       <div className={styles.style62_6}>
          <Users className={styles.style63_7} />
          <h3 className={styles.style64_8}>لا يوجد سائقين في الأسطول</h3>
          <p className={styles.style65_9}>لم يقم أي سائق بالتسجيل في المنصة بعد.</p>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>برج المراقبة </CardTitle>
        <CardDescription>
          نظرة مباشرة وحية على أداء وهويات جميع السائقون في الأسطول.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الهوية</TableHead>
              <TableHead className={styles.style83_10}>الرتبة </TableHead>
              <TableHead className={styles.style84_11}>الأداء (النجوم)</TableHead>
              <TableHead className={styles.style85_12}>نشاط الولاء</TableHead>
              <TableHead className={styles.style86_13}>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver: any) => {
              const rankTheme = getRankTheme(driver.rank);
              return (
                <TableRow key={driver.uid}>
                  <TableCell>
                    <div className={styles.style95_14}>
                      <Avatar>
                        <AvatarImage src={driver.avatar} alt={driver.name} />
                        <AvatarFallback>{driver.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className={styles.style100_15}>{driver.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className={styles.style103_16}>
                    <Badge variant="outline" className={cn(styles.style104_17, rankTheme.bg, rankTheme.color, rankTheme.border)}>
                      {rankTheme.label}
                    </Badge>
                  </TableCell>
                  <TableCell className={styles.style108_18}>
                    <div className={styles.style109_19}>
                      <Star className={styles.style110_20} />
                      <span className={styles.style111_21}>{(driver.rating || 0).toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell className={styles.style114_22}>
                    <div className={styles.style115_23}>
                       <Heart className={styles.style116_24} />
                       <span className={styles.style117_25}>{driver.heartCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className={styles.style120_26}>
                     <div className={styles.style121_27}>
                        <span className={styles.style122_28}>{driver.status || 'unknown'}</span>
                        <div className={cn(styles.style123_29, getStatusIndicator(driver.status))} />
                     </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
