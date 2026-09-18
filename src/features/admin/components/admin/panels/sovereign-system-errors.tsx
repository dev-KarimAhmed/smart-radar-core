'use client';

import React, { useState, useMemo } from 'react';
import { ShieldAlert, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SOVEREIGN_ERR_DICTIONARY, SovereignErrorDefinition } from '@/core/config/sovereign-errors';

export function SovereignSystemErrors() {
  const [errorSearch, setErrorSearch] = useState('');
  const [errorCategory, setErrorCategory] = useState<string>('ALL');
  const [expandedErrorCode, setExpandedErrorCode] = useState<string | null>(null);

  const filteredErrors = useMemo(() => {
    const allErrors = Object.values(SOVEREIGN_ERR_DICTIONARY) as SovereignErrorDefinition[];
    return allErrors.filter((err: SovereignErrorDefinition) => {
      const matchesCategory = errorCategory === 'ALL' || err.code.startsWith(errorCategory);
      const matchesSearch =
        err.code.toLowerCase().includes(errorSearch.toLowerCase()) ||
        err.name.toLowerCase().includes(errorSearch.toLowerCase()) ||
        err.description.toLowerCase().includes(errorSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [errorSearch, errorCategory]);

  return (
    <div className="space-y-4 rounded-3xl border border-red-500/20 bg-[#05080F] p-5 text-white shadow-2xl" dir="rtl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">مستكشف الأخطاء الجنائية والسيادية</h2>
            <p className="text-xs text-slate-400">قمرة المراقبة الإدارية لفحص وتحليل رموز الأخطاء التشغيلية للنظام</p>
          </div>
        </div>
        <Badge variant="outline" className="border-red-500/40 bg-red-950/40 text-red-300 font-mono text-xs">
          ADMIN_FORENSICS
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={errorSearch}
            onChange={(e) => setErrorSearch(e.target.value)}
            placeholder="بحث برمز الخطأ أو الوصف..."
            className="h-10 pr-9 rounded-xl border-white/10 bg-black/50 text-xs font-bold text-white placeholder-slate-500"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'RAD', 'H3', 'OSRM', 'GEO', 'VAL'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setErrorCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                errorCategory === cat
                  ? 'bg-red-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {filteredErrors.map((err: SovereignErrorDefinition) => {
          const isExpanded = expandedErrorCode === err.code;
          return (
            <div
              key={err.code}
              onClick={() => setExpandedErrorCode(isExpanded ? null : err.code)}
              className="p-3 rounded-xl border border-white/5 bg-black/40 hover:border-white/20 transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs text-red-400">{err.code}</span>
                <span className="text-xs font-bold text-white">{err.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{err.description}</p>
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-300 font-mono space-y-1 bg-white/[0.02] p-2 rounded-lg">
                  <p>الإجراء الموصى به: التحقق من سجل التدقيق ومراجعة الاتصال الحافة.</p>
                  <p>مستوى الخطورة: حاسم (CRITICAL)</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
