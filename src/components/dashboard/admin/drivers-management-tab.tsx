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
import { getRankTheme } from '@/lib/theme-utils';
import { useSovereignFleet } from '@/hooks/use-sovereign-fleet'; // 🔗 حقن الخطاف السيادي

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
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin mr-3" />
        <span>جاري استدعاء الأسطول السيادي...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-destructive">
        <ShieldAlert className="w-10 h-10 mb-4" />
        <span className="font-bold">{error}</span>
      </div>
    );
  }
  
  if (drivers.length === 0) {
    return (
       <div className="text-center text-muted-foreground py-20">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-200">لا يوجد كباتن في الأسطول</h3>
          <p className="mt-1 text-sm text-gray-500">لم يقم أي كابتن بالتسجيل في المنصة بعد.</p>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>برج المراقبة السيادي</CardTitle>
        <CardDescription>
          نظرة مباشرة وحية على أداء وهويات جميع الكباتن في الأسطول.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الهوية</TableHead>
              <TableHead className="text-center">الرتبة السيادية</TableHead>
              <TableHead className="text-center">الأداء (النجوم)</TableHead>
              <TableHead className="text-center">نبض الولاء</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver: any) => {
              const rankTheme = getRankTheme(driver.rank);
              return (
                <TableRow key={driver.uid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={driver.avatar} alt={driver.name} />
                        <AvatarFallback>{driver.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{driver.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn('font-bold', rankTheme.bg, rankTheme.color, rankTheme.border)}>
                      {rankTheme.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold">{(driver.rating || 0).toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                       <Heart className="w-4 h-4 text-red-500 fill-red-500/70" />
                       <span className="font-bold">{driver.heartCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                     <div className="flex items-center justify-end gap-2">
                        <span className="capitalize">{driver.status || 'unknown'}</span>
                        <div className={cn('w-2.5 h-2.5 rounded-full animate-pulse', getStatusIndicator(driver.status))} />
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
