
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ChevronRight, Briefcase, Car, ShieldCheck, AlertTriangle, CalendarDays, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function OperationalDataPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    make: '',
    year: '',
    color: '',
    plate: '',
    insuranceExpiry: '',
    affiliationType: 'smart-app',
    affiliationName: '',
    silencePreference: 'neutral'
  });

  // Pre-fill existing data if available
  useEffect(() => {
    if (user && user.role === 'driver') {
      const driver = user as any;
      setFormData({
        make: driver.vehicle?.make || '',
        year: driver.vehicle?.year?.toString() || '',
        color: driver.vehicle?.color || '',
        plate: driver.vehicle?.plate || '',
        insuranceExpiry: driver.vehicle?.insuranceExpiry || '',
        affiliationType: driver.affiliation?.type || 'smart-app',
        affiliationName: driver.affiliation?.name || '',
        silencePreference: driver.silencePreference || 'neutral'
      });
    }
  }, [user]);

  // Anti-Fraud & Save Logic
  const handleSave = async () => {
    if (!user || user.role !== 'driver') return;
    setError(null);
    setSuccess(false);

    // Basic Validation
    if (!formData.plate || !formData.year || !formData.make || !formData.insuranceExpiry) {
      setError('يرجى تعبئة الحقول الأساسية (المركبة، الموديل، اللوحة، التأمين).');
      return;
    }

    setLoading(true);

    try {
      // 1. UNIQUE PLATE PROTOCOL (Zero-Cost Read limited to specific plate)
      const plateQuery = query(
        collection(db, 'users'), 
        where('vehicle.plate', '==', formData.plate.trim())
      );
      const querySnapshot = await getDocs(plateQuery);
      
      const isDuplicate = querySnapshot.docs.some(d => d.id !== user.uid);
      
      if (isDuplicate) {
        setError('انذار سيادي: رقم اللوحة هذا مسجل لمركبة أخرى في الأسطول!');
        setLoading(false);
        return;
      }

      // 2. Update Firestore Document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        vehicle: {
          make: formData.make.trim(),
          year: parseInt(formData.year),
          color: formData.color.trim(),
          plate: formData.plate.trim(),
          insuranceExpiry: formData.insuranceExpiry
        },
        affiliation: {
          type: formData.affiliationType,
          name: formData.affiliationName.trim() || 'كابتن رادار'
        },
        silencePreference: formData.silencePreference
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Sovereign Error updating operational data:', err);
      setError('حدث خطأ أثناء تحديث البيانات. حاول مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'driver') {
    return (
      <div className="min-h-[100dvh] bg-[#050D05] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050D05] text-white font-sans selection:bg-emerald-500/30 pb-10">
      
      {/* Sovereign Header */}
      <header className="sticky top-0 z-40 bg-[#091B09]/95 backdrop-blur-md border-b border-emerald-900/50 shadow-md">
        <div className="flex items-center justify-between px-4 py-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-emerald-400 hover:bg-emerald-950/50 rounded-full">
            <ChevronRight className="w-7 h-7" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-widest text-white">البيانات التشغيلية</h1>
            <Briefcase className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl shadow-inner">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            البيانات التشغيلية تعكس <strong className="text-emerald-400">هويتك الميدانية</strong>. رقم اللوحة الفريد وحالة التأمين تساهم في تحديد رتبتك السيادية وموثوقيتك أمام الركاب.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400 text-sm font-bold animate-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-emerald-400 text-sm font-bold animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>تم تشفير وحفظ البيانات التشغيلية بنجاح.</p>
          </div>
        )}

        {/* Operational Form */}
        <Card className="bg-[#091B09]/40 border-emerald-900/50 shadow-lg">
          <CardContent className="p-5 space-y-5">
            
            {/* Vehicle Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 border-b border-white/10 pb-2">
                <Car className="w-5 h-5" />
                <h2 className="font-bold tracking-wide">بيانات المركبة</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-bold uppercase">الشركة المصنعة</label>
                  <Input 
                    placeholder="مثال: تويوتا" 
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                    className="bg-black/50 border-emerald-900/50 text-white focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-bold uppercase">سنة الصنع (الموديل)</label>
                  <Input 
                    type="number"
                    placeholder="2020" 
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="bg-black/50 border-emerald-900/50 text-white focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-bold uppercase">لون المركبة</label>
                  <Input 
                    placeholder="أبيض" 
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="bg-black/50 border-emerald-900/50 text-white focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-emerald-400 font-bold uppercase drop-shadow-md">رقم اللوحة (فريد)</label>
                  <Input 
                    placeholder="12-34567" 
                    value={formData.plate}
                    onChange={(e) => setFormData({...formData, plate: e.target.value})}
                    className="bg-emerald-950/20 border-emerald-500/50 text-white font-mono tracking-widest focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="flex items-center gap-2 text-xs text-[#FFB067] font-bold uppercase drop-shadow-md">
                  <CalendarDays className="w-4 h-4" /> انتهاء التأمين الإلزامي
                </label>
                <Input 
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => setFormData({...formData, insuranceExpiry: e.target.value})}
                  className="bg-[#4A2E15]/20 border-[#FFB067]/40 text-white focus-visible:ring-[#FFB067] block w-full appearance-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* Affiliation Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-emerald-400 border-b border-white/10 pb-2">
                <Briefcase className="w-5 h-5" />
                <h2 className="font-bold tracking-wide">التبعية والترخيص</h2>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-bold uppercase">نوع التشغيل</label>
                <select 
                  value={formData.affiliationType}
                  onChange={(e) => setFormData({...formData, affiliationType: e.target.value})}
                  className="w-full h-10 px-3 rounded-md bg-black/50 border border-emerald-900/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="smart-app">تطبيق ذكي مرخص</option>
                  <option value="office-taxi">تكسي أصفر / مكتب</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-bold uppercase">اسم الشركة / المكتب (اختياري)</label>
                <Input 
                  placeholder="اسم مكتب التكسي أو التطبيق" 
                  value={formData.affiliationName}
                  onChange={(e) => setFormData({...formData, affiliationName: e.target.value})}
                  className="bg-black/50 border-emerald-900/50 text-white focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-white/5 mt-4">
              <label className="text-xs text-emerald-400 font-bold uppercase drop-shadow-md">بروتوكول الصمت (تفضيل الرحلة)</label>
              <select 
                value={formData.silencePreference}
                onChange={(e) => setFormData({...formData, silencePreference: e.target.value})}
                className="w-full h-10 px-3 rounded-md bg-black/50 border border-emerald-900/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="neutral">محايد (حسب رغبة الراكب)</option>
                <option value="silent">صامت 🔇 (أفضل الهدوء التام)</option>
                <option value="chatty">مرحب بالحديث 💬</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Submit Action */}
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg tracking-widest rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'اعتماد البيانات التشغيلية'}
        </Button>

      </main>
    </div>
  );
}
