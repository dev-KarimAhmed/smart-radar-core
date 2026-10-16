'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Users, Search, Star, MapPin, Calendar, Loader2, ShieldCheck, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface RiderRow {
  id: string;
  full_name: string;
  phone: string;
  governorate: string;
  district: string;
  rating: number;
  created_at: string;
}

const styles = {
  header: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4",
  searchContainer: "relative w-full sm:w-72",
  searchInput: "bg-black/60 border-white/10 text-white pl-3 pr-9 h-9 text-xs rounded-xl focus:border-[#14B8A6]",
  searchIcon: "absolute right-3 top-2.5 h-4 w-4 text-slate-400",
  tableCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/90 overflow-hidden",
  tableHead: "border-b border-white/10 bg-black/40 text-slate-300 text-xs font-bold",
  tableRow: "border-b border-white/5 transition hover:bg-white/[0.02]",
  avatar: "flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 text-xs",
  ratingBadge: "inline-flex items-center gap-1 font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-xs",
} as const;

export function RidersManagementPanel() {
  const t = useTranslations('adminRiders');
  const [riders, setRiders] = useState<RiderRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRiders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, governorate, district, rating, created_at')
        .in('role', ['rider', 'RIDER'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formatted: RiderRow[] = (data || []).map((r: any) => ({
        id: String(r.id),
        full_name: r.full_name || 'راكب غير مسمّى',
        phone: r.phone || '-',
        governorate: r.governorate || 'عمّان',
        district: r.district || 'الجامعة',
        rating: Number(r.rating) || 5.0,
        created_at: r.created_at || new Date().toISOString(),
      }));

      setRiders(formatted);
    } catch (err) {
      console.warn('[Riders Panel] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRiders();
  }, [fetchRiders]);

  const filteredRiders = riders.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.full_name.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.governorate.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="border-white/10 bg-[#0B0F19]/90 text-right text-white" dir="rtl">
      <CardHeader>
        <div className={styles.header}>
          <div>
            <CardTitle className="text-lg font-black text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              {t('title')}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              {t('subtitle')} ({riders.length} {t('registered')})
            </CardDescription>
          </div>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={styles.searchInput}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin ml-2 text-cyan-400" />
            <span>جاري استدعاء بيانات الركاب...</span>
          </div>
        ) : filteredRiders.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <ShieldCheck className="mx-auto h-10 w-10 text-slate-600 mb-2" />
            <p className="font-bold">{t('empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className={styles.tableHead}>
                <tr>
                  <th className="p-3.5">{t('table.identity')}</th>
                  <th className="p-3.5">{t('table.phone')}</th>
                  <th className="p-3.5">{t('table.location')}</th>
                  <th className="p-3.5">{t('table.trustRating')}</th>
                  <th className="p-3.5">{t('table.joinedAt')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRiders.map((rider) => (
                  <tr key={rider.id} className={styles.tableRow}>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={styles.avatar}>
                          {rider.full_name.substring(0, 1)}
                        </div>
                        <span className="font-bold text-white">{rider.full_name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-500" />
                        {rider.phone}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <MapPin className="h-3 w-3 text-[#14B8A6]" />
                        {rider.governorate} - {rider.district}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={styles.ratingBadge}>
                        <Star className="h-3 w-3 fill-amber-400" />
                        {rider.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {new Date(rider.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

