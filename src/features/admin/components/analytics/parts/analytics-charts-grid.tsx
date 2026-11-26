'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, Activity, PieChart as PieIcon } from 'lucide-react';
import type {
  AnalyticsTimelinePoint,
  RegionAnalyticsItem,
  StatusSliceItem,
} from '@/features/admin/types/admin-analytics';

interface AnalyticsChartsGridProps {
  timeline: AnalyticsTimelinePoint[];
  chartRegions: RegionAnalyticsItem[];
  tripStatusDistribution: StatusSliceItem[];
  captainStatusDistribution: StatusSliceItem[];
  isArabic: boolean;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#090F1C',
  border: '1px solid rgba(20, 184, 166, 0.35)',
  borderRadius: '12px',
  color: '#f8fafc',
  fontSize: '12px',
};

function StatusDonutCard({
  title,
  items,
  isArabic,
}: {
  title: string;
  items: StatusSliceItem[];
  isArabic: boolean;
}) {
  const total = items.reduce((acc, i) => acc + i.value, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/95 p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-[#14F5D5]" />
          <h4 className="text-xs sm:text-sm font-black text-white">{title}</h4>
        </div>
        <span className="font-mono text-xs font-bold text-slate-400">
          {isArabic ? `الإجمالي: ${total}` : `Total: ${total}`}
        </span>
      </div>

      {total === 0 ? (
        <div className="flex h-52 items-center justify-center text-xs text-slate-400">
          {isArabic ? 'لا توجد بيانات كافية ضمن هذا الفلتر' : 'No data in current filter'}
        </div>
      ) : (
        <div className="h-52 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items.filter((i) => i.value > 0)}
                dataKey="value"
                nameKey={isArabic ? 'nameAr' : 'nameEn'}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={72}
                paddingAngle={3}
              >
                {items
                  .filter((i) => i.value > 0)
                  .map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function AnalyticsChartsGrid({
  timeline,
  chartRegions,
  tripStatusDistribution,
  captainStatusDistribution,
  isArabic,
}: AnalyticsChartsGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Regional Bar Chart */}
        <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/95 p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#14F5D5]" />
            <h3 className="text-xs sm:text-sm font-black text-white">
              {isArabic ? 'مقارنة المناطق: السائقين والمستخدمين والرحلات' : 'Regional Comparison: Captains, Riders & Trips'}
            </h3>
          </div>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRegions} margin={{ top: 10, right: 12, left: -12, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="nameAr" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="captains" name={isArabic ? 'السائقين' : 'Captains'} fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="riders" name={isArabic ? 'المستخدمين' : 'Riders'} fill="#06b6d4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="trips" name={isArabic ? 'الرحلات' : 'Trips'} fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Trend Area Chart */}
        <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/95 p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-black text-white">
              {isArabic ? 'المسار الزمني للنشاط والتسجيلات' : 'Activity & Registrations Timeline'}
            </h3>
          </div>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 12, left: -12, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="trips" name={isArabic ? 'الرحلات' : 'Trips'} stroke="#14F5D5" fill="rgba(20, 245, 213, 0.18)" strokeWidth={2} />
                <Area type="monotone" dataKey="riders" name={isArabic ? 'مستخدمين جدد' : 'New Riders'} stroke="#38bdf8" fill="rgba(56, 189, 248, 0.15)" strokeWidth={2} />
                <Area type="monotone" dataKey="captains" name={isArabic ? 'سائقين جدد' : 'New Captains'} stroke="#10b981" fill="rgba(16, 185, 129, 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusDonutCard
          title={isArabic ? 'توزيع حالات الرحلات' : 'Trips Status Breakdown'}
          items={tripStatusDistribution}
          isArabic={isArabic}
        />
        <StatusDonutCard
          title={isArabic ? 'توزيع حالات السائقين' : 'Captains Status Breakdown'}
          items={captainStatusDistribution}
          isArabic={isArabic}
        />
      </div>
    </div>
  );
}
