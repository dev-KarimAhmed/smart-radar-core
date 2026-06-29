'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { dexieDb } from '@/lib/dexie-db';
import { ShieldCheck, User, MapPin, Phone, Car, Award, RefreshCw, Cpu, Database, ShieldAlert, Key, Clock, Wallet, Heart, AlertTriangle, Star, Sparkles, Shield } from 'lucide-react';

export function ProfileTab() {
  const { user, isCaptain, isPassenger, isSovereign, logout, loginAsMockUser } = useAuth();
  const { toast } = useToast();

  // local states for editing
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gov, setGov] = useState('');
  const [district, setDistrict] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // local states for vehicle (if Captain)
  const [make, setMake] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('');
  const [sideId, setSideId] = useState('');

  // Local storage diagnostic info
  const [favCount, setFavCount] = useState(0);
  const [systemUts, setSystemUts] = useState('');
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if we have a draft first to avoid state loss during tab switching
      const draftKey = `profile_draft_${user.uid}`;
      const savedDraftRaw = localStorage.getItem(draftKey);
      if (savedDraftRaw) {
        try {
          const draft = JSON.parse(savedDraftRaw);
          // Only restore if the draft actually contains differences from DB to avoid false positives
          const isDifferent = 
            (draft.name && draft.name !== (user.name || '')) ||
            (draft.phone && draft.phone !== (user.phone || '')) ||
            (draft.gov && draft.gov !== (user.governorate || '')) ||
            (draft.district && draft.district !== (user.district || '')) ||
            (isCaptain && (
              (draft.make && draft.make !== (user.vehicle?.make || '')) ||
              (draft.color && draft.color !== (user.vehicle?.color || '')) ||
              (draft.plate && draft.plate !== (user.vehicle?.plate || '')) ||
              (draft.year && draft.year !== (user.vehicle?.year?.toString() || '')) ||
              (draft.sideId && draft.sideId !== (user.vehicle?.sideId || ''))
            ));

          if (isDifferent) {
            setName(draft.name ?? '');
            setPhone(draft.phone ?? '');
            setGov(draft.gov ?? '');
            setDistrict(draft.district ?? '');
            if (isCaptain) {
              setMake(draft.make ?? '');
              setColor(draft.color ?? '');
              setPlate(draft.plate ?? '');
              setYear(draft.year ?? '');
              setSideId(draft.sideId ?? '');
            }
            setIsDraftRestored(true);
            return;
          }
        } catch (e) {
          console.error("Failed to parse draft:", e);
        }
      }

      setName(user.name || '');
      setPhone(user.phone || '');
      setGov(user.governorate || '');
      setDistrict(user.district || '');

      if (user.vehicle) {
        setMake(user.vehicle.make || '');
        setColor(user.vehicle.color || '');
        setPlate(user.vehicle.plate || '');
        setYear(user.vehicle.year?.toString() || '');
        setSideId(user.vehicle.sideId || '');
      }
    }
  }, [user, isCaptain]);

  // Auto-Save Draft on changes to avoid State Loss
  useEffect(() => {
    if (!user?.uid) return;
    const draftKey = `profile_draft_${user.uid}`;
    
    // Only save if we actually have values to prevent blanking out the database state on initial load
    if (!name && !phone && !gov && !district) return;

    // Check if the current state is different from the original database state
    const isDifferent = 
      name !== (user.name || '') ||
      phone !== (user.phone || '') ||
      gov !== (user.governorate || '') ||
      district !== (user.district || '') ||
      (isCaptain && (
        make !== (user.vehicle?.make || '') ||
        color !== (user.vehicle?.color || '') ||
        plate !== (user.vehicle?.plate || '') ||
        year !== (user.vehicle?.year?.toString() || '') ||
        sideId !== (user.vehicle?.sideId || '')
      ));

    if (isDifferent) {
      const draft = {
        name,
        phone,
        gov,
        district,
        make,
        color,
        plate,
        year,
        sideId
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } else {
      // If user restored original values manually, we can trash the draft safely
      localStorage.removeItem(draftKey);
      setIsDraftRestored(false);
    }
  }, [name, phone, gov, district, make, color, plate, year, sideId, user, isCaptain]);

  const discardDraft = useCallback(() => {
    if (!user) return;
    localStorage.removeItem(`profile_draft_${user.uid}`);
    setIsDraftRestored(false);
    
    setName(user.name || '');
    setPhone(user.phone || '');
    setGov(user.governorate || '');
    setDistrict(user.district || '');

    if (user.vehicle) {
      setMake(user.vehicle.make || '');
      setColor(user.vehicle.color || '');
      setPlate(user.vehicle.plate || '');
      setYear(user.vehicle.year?.toString() || '');
      setSideId(user.vehicle.sideId || '');
    } else {
      setMake('');
      setColor('');
      setPlate('');
      setYear('');
      setSideId('');
    }
    
    toast({
      title: '🗑️ تم إهمال المسودة',
      description: 'تم إرجاع حقول التعديل إلى القيم الموثقة في قاعدة البيانات.'
    });
  }, [user, toast]);

  // Load IndexedDB statistics to eliminate desync doubts
  const loadDiagnostics = useCallback(async () => {
    try {
      const count = await dexieDb.favoriteCaptains.count();
      setFavCount(count);
      setSystemUts(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    } catch (e) {
      console.warn("Failed to retrieve diagnostics:", e);
    }
  }, []);

  useEffect(() => {
    loadDiagnostics();
  }, [loadDiagnostics]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: '⚠️ خطأ في المدخلات',
        description: 'الرجاء إدخال الاسم الكامل القانوني.'
      });
      return;
    }

    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatePayload: any = {
        name: name.trim(),
        phone: phone.trim(),
        governorate: gov,
        district: district,
      };

      if (isCaptain) {
        updatePayload.vehicle = {
          make: make.trim(),
          color: color.trim(),
          plate: plate.trim(),
          year: year ? parseInt(year, 10) : 2023,
          sideId: sideId.trim()
        };
      }

      await setDoc(userRef, updatePayload, { merge: true });

      // Clear the draft upon successful save
      localStorage.removeItem(`profile_draft_${user.uid}`);
      setIsDraftRestored(false);

      // Update locally customized mock user properties to minimize state gaps
      if (import.meta.env.DEV) {
        const savedBypass = localStorage.getItem('sovereign_dev_bypass_user');
        if (savedBypass) {
          try {
            const parsed = JSON.parse(savedBypass);
            const nextBypass = { ...parsed, ...updatePayload };
            localStorage.setItem('sovereign_dev_bypass_user', JSON.stringify(nextBypass));
            loginAsMockUser(nextBypass);
          } catch (err) {
            // silent ignore
          }
        }
      }

      toast({
        title: '✅ تم مزامنة الهوية الدستورية',
        description: 'تم حقن وتحديث بياناتك في العقد الموحد بنجاح تام.'
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 20, 40]);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: '🚨 فشل الترقيع الرقمي',
        description: err?.message || 'تعذر الاتصال بقاعدة البيانات السيادية.'
      });
      // Pass the error to the forensic central handler
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTimeAlignment = () => {
    setSystemUts(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    toast({
      title: '⚡️ تم معايرة خط الوقت المتزامن',
      description: 'تم محاذاة مؤشرات الزمن مع الصندوق الأسود السيادي بنجاح.'
    });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30]);
    }
  };

  const currentDistricts = gov ? getDistrictsByGovernorate(gov) : [];

  const ratingValue = user?.rating !== undefined 
    ? user.rating 
    : (user?.ratingSum && user?.ratingCount ? user.ratingSum / user.ratingCount : 5.0);

  return (
    <div className="w-full max-w-xl mx-auto pb-24 text-right font-sans space-y-6" dir="rtl">
      {/* 1. بطاقة الهوية والتقييم العلوية */}
      <Card className="bg-[#050c05] border-emerald-900/40 text-white overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-400 animate-pulse" />
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold">
                {name ? name.substring(0, 1) : <User className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="text-lg font-black text-white">{name || 'مستخدم النبض السيادي'}</h2>
                <Badge variant="outline" className="text-[10px] mt-1 bg-[#0a1e0a] text-emerald-400 border-emerald-500/10">
                  {isSovereign ? 'قائد مشغل سيادي (مدير)' : isCaptain ? `فارس ميداني (كابتن)` : 'مسافر سيادي مستقر'}
                </Badge>
                <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                  {user?.serial_id && (
                    <span className="inline-flex items-center gap-1 bg-[#03231c] text-[#00ffcc] text-[9px] font-mono font-black px-2 py-0.5 rounded border border-emerald-500/30">
                      🧬 {user.serial_id}
                    </span>
                  )}
                  {isCaptain && (
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded border ${
                      user?.rank === 'Platinum' 
                        ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 border-slate-100 shadow-sm'
                        : user?.rank === 'Gold'
                        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-black border-amber-300 shadow-sm'
                        : user?.rank === 'Silver'
                        ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black border-gray-200 shadow-sm'
                        : 'bg-gradient-to-r from-orange-700 to-amber-950 text-white border-orange-600 shadow-sm'
                    }`}>
                      🛡️ رتبة {user?.rank || 'Bronze'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-left font-mono space-y-1">
              <span className="text-[9px] text-gray-500 block uppercase font-bold">رصيد الثقة الدستوري</span>
              <div className="flex items-center gap-1.5 justify-end bg-emerald-950/40 p-2.5 py-1 rounded-xl border border-emerald-500/10 text-emerald-400">
                <span className="text-sm font-extrabold">{ratingValue.toFixed(2)}</span>
                <span className="text-xs text-gray-500">/ 5.0</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-right border-t border-white/5 font-mono text-[11px] text-gray-400">
            <div className="bg-[#000]/30 p-2.5 rounded-xl border border-white/5 space-y-0.5">
              <span className="text-[9px] text-[#00ffcc] block mb-0.5">📍 النسيج الجغرافي المسجل:</span>
              <strong>{gov || 'غير محدد'} - {district || 'غير محدد'}</strong>
            </div>

            <div className="bg-[#000]/30 p-2.5 rounded-xl border border-white/5 space-y-0.5">
              <span className="text-[9px] text-emerald-500 block mb-0.5">🔐 الترقيم الذري السيادي:</span>
              <span className="text-[10px] text-emerald-400 font-bold block">{user?.serial_id || 'جاري التوليد...'}</span>
            </div>

            {isCaptain && (
              <>
                <div className="bg-[#000]/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[9px] text-amber-500 block mb-0.5">🏢 الارتباط والتبعية:</span>
                  <strong className="text-white text-[10px] block truncate">
                    {user?.affiliation?.name || user?.companyName || 'ناقل مستقل حُر'}
                  </strong>
                  <span className="text-[8px] text-gray-500 block">
                    {user?.affiliation?.type === 'office-taxi' ? 'مكتب تاكسي رسمي' : 'تطبيق ذكي مستقل'}
                  </span>
                </div>

                <div className="bg-[#000]/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[9px] text-red-500 block mb-0.5">⚠️ مؤشرات الإلغاء والمناعة:</span>
                  <div className="flex justify-between items-baseline text-[9px]">
                    <span className="text-[8px] text-gray-500">سجل الإلغاء المتتالي:</span>
                    <strong className="text-red-400">{user?.consecutiveCancellations || 0} / 3</strong>
                  </div>
                  <div className="flex justify-between items-baseline text-[9px]">
                    <span className="text-[8px] text-gray-500">درجة الثقة والمناعة:</span>
                    <strong className="text-emerald-400">{(user?.rating || 5.0).toFixed(1)}</strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 1.5. ملف البيانات الفنية والمهنية للناقل السيادي - يظهر للكباتن فقط */}
      {isCaptain && (
        <Card className="bg-[#030704]/95 border border-emerald-950 text-white overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-emerald-600 to-emerald-400" />
          <CardHeader className="pb-3 border-b border-white/5 bg-[#050D05]/50">
            <CardTitle className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              الملف الفني والترخيص المهني للناقل السيادي
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              مراجعة وتدقيق بيانات الترخيص، الساعات النشطة، والامتثال السلوكي المسجل على الحافة.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 font-mono text-[11px]">
            {/* أ. تفاصيل المركبة المسجلة */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                <Car className="h-4 w-4" /> رخصة ومواصفات المركبة المعتمدة
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[9px] text-gray-500 block">العلامة والموديل:</span>
                  <strong className="text-white text-xs">{user?.vehicle?.make || 'Toyota Hybrid / معلق'}</strong>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[9px] text-gray-500 block">لون المركبة المسجل:</span>
                  <strong className="text-white text-xs">{user?.vehicle?.color || 'فضي معدني'}</strong>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[9px] text-gray-500 block">رقم لوحة الترخيص:</span>
                  <strong className="text-emerald-400 text-xs font-bold tracking-wider">{user?.vehicle?.plate || '77-12345'}</strong>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[9px] text-gray-500 block">سنة الصنع الموثقة:</span>
                  <strong className="text-white text-xs">{user?.vehicle?.year || '2023'}</strong>
                </div>
              </div>
            </div>

            {/* ب. الجهة المشغلة وارتباط الأسطول */}
            <div className="bg-[#050D05]/20 p-3 rounded-xl border border-emerald-950/40 space-y-1">
              <span className="text-[9px] text-gray-500 block">الارتباط المؤسسي والجهة المظلية:</span>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white">{user?.affiliation?.name || user?.companyName || 'ناقل مستقل حُر (غير تابع لمكتب)'}</span>
                <Badge variant="outline" className="text-[9px] bg-emerald-950/60 text-emerald-400 border-emerald-500/20">
                  {user?.affiliation?.type === 'office-taxi' ? 'مكتب تاكسي رسمي' : 'تطبيق ذكي مستقل'}
                </Badge>
              </div>
            </div>

            {/* ج. أرصدة عبور الوقت والاشتراك المالي */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <h3 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <Wallet className="h-4 w-4" /> أرصدة عبور الوقت والمحفظة الرقمية
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1 text-center">
                  <span className="text-[8px] text-gray-500 block">رصيد الاشتراك الأساسي</span>
                  <div className="text-emerald-400 font-bold text-xs truncate">
                    {user?.paidHoursRemaining !== undefined 
                      ? `${Math.floor(user.paidHoursRemaining / 60)}س ${user.paidHoursRemaining % 60}د`
                      : '180س'}
                  </div>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1 text-center">
                  <span className="text-[8px] text-gray-500 block">بونص الرتبة السيادية</span>
                  <div className="text-amber-400 font-bold text-xs truncate">
                    {user?.bonusHoursRemaining !== undefined 
                      ? `${Math.floor(user.bonusHoursRemaining / 60)}س ${user.bonusHoursRemaining % 60}د`
                      : '120س'}
                  </div>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1 text-center">
                  <span className="text-[8px] text-gray-500 block">رصيد المحفظة الحر</span>
                  <div className="text-white font-bold text-xs truncate">
                    {(user?.walletBalanceJD || 0.00).toFixed(2)} د.أ
                  </div>
                </div>
              </div>
            </div>

            {/* د. مؤشرات المناعة والامتثال السلوكي */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <h3 className="text-xs font-black text-[#00ffcc] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> سجل الامتثال والمناعة السلوكية
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-gray-500 block">رصيد الدعم الشعبي (القلوب):</span>
                    <strong className="text-rose-400 text-xs">{user?.heartCount || 0} قلوب</strong>
                  </div>
                  <Heart className="h-5 w-5 text-rose-500 fill-rose-500/20" />
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-gray-500 block">المخالفات الميدانية النشطة:</span>
                    <strong className={`text-xs ${user?.penaltyCount ? 'text-red-400 font-black' : 'text-emerald-400'}`}>
                      {user?.penaltyCount || 0} جزاءات
                    </strong>
                  </div>
                  <AlertTriangle className={`h-5 w-5 ${user?.penaltyCount ? 'text-red-500 animate-bounce' : 'text-gray-600'}`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. استمارة تحيين وتعديل البيانات */}
      <Card className="bg-[#020502]/95 border border-emerald-950 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-extrabold text-[#00ffcc] flex items-center gap-2">
              <Key className="h-5 w-5 text-emerald-500" />
              تعديل الهوية واللائحة الترابية
            </CardTitle>
            {isDraftRestored && (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-950/20 text-amber-400 text-[10px] animate-pulse">
                ⏳ مسودة مستعادة
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs text-gray-400">
            يرجى تحديد المحافظة واللواء الميداني الأساسي بعناية لتزجية واستهداف الطلبات بدقة.
          </CardDescription>
          {isDraftRestored && (
            <div className="mt-2 p-2 bg-amber-950/25 border border-amber-500/20 rounded-lg text-[10px] text-amber-300 flex items-center justify-between">
              <span>⚠️ تم استعادة تعديلات قمت بإدخالها سابقاً ولم يتم حفظها مسبقاً.</span>
              <button 
                type="button" 
                onClick={discardDraft}
                className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                إهمال المسودة
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4 font-sans">
            <div className="space-y-1.5 text-right">
              <label className="text-xs text-gray-400 font-bold block">الاسم المعتمد القانوني:</label>
              <Input
                placeholder="أدخل اسمك كما بالهوية"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black/50 border-emerald-900/30 text-white rounded-xl text-right placeholder-gray-600 focus-visible:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs text-gray-400 font-bold block">رقم الاتصال الموثق:</label>
              <Input
                type="tel"
                placeholder="+96279..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-black/50 border-emerald-900/30 text-white rounded-xl text-right ltr"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3" dir="rtl">
              <div className="space-y-1.5 text-right">
                <label className="text-sm text-gray-400 font-bold block">المحافظة الأساسية:</label>
                <Select
                  value={gov}
                  onValueChange={(val) => {
                    setGov(val);
                    setDistrict('');
                  }}
                  required
                >
                  <SelectTrigger className="bg-black/50 border-emerald-900/30 text-white text-right rounded-xl h-11" dir="rtl">
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-950 border-emerald-900/30 text-white">
                    {jordanGovernorates.map((g) => (
                      <SelectItem key={g} value={g} className="text-right justify-end">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-sm text-gray-400 font-bold block">اللواء الميداني:</label>
                <Select
                  value={district}
                  onValueChange={(val) => setDistrict(val)}
                  disabled={!gov}
                  required
                >
                  <SelectTrigger className="bg-black/50 border-emerald-900/30 text-white text-right rounded-xl h-11" dir="rtl">
                    <SelectValue placeholder="اختر اللواء" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-950 border-emerald-900/30 text-white">
                    {currentDistricts.map((d) => (
                      <SelectItem key={d} value={d} className="text-right justify-end">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* تفاصيل المركبة إذا كان كابتن */}
            {isCaptain && (
              <div className="pt-4 border-t border-white/5 space-y-4">
                <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  تحيين مواصفات ولائحة المركبة
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs text-gray-400 font-bold block">نوع وموديل السيارة:</label>
                    <Input
                      placeholder="Toyota Corolla Hybrid..."
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="bg-black/50 border-emerald-900/30 text-white rounded-xl text-right"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-xs text-gray-400 font-bold block">لون المركبة:</label>
                    <Input
                      placeholder="أبيض / كحلي..."
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="bg-black/50 border-emerald-900/30 text-white rounded-xl text-right"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 text-right col-span-1">
                    <label className="text-[10px] text-gray-400 font-bold block truncate">رقم اللوحة القانوني:</label>
                    <Input
                      placeholder="77-12345"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      className="bg-black/50 border-emerald-900/30 text-white rounded-xl font-mono text-center h-10 text-xs px-2"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-right col-span-1">
                    <label className="text-[10px] text-gray-400 font-bold block truncate">لوحة الجانب (Side ID):</label>
                    <Input
                      placeholder="A-123"
                      value={sideId}
                      onChange={(e) => setSideId(e.target.value)}
                      className="bg-black/50 border-emerald-900/30 text-white rounded-xl font-mono text-center h-10 text-xs px-2"
                    />
                  </div>

                  <div className="space-y-1.5 text-right col-span-1">
                    <label className="text-[10px] text-gray-400 font-bold block truncate">سنة صنع المركبة:</label>
                    <Input
                      type="number"
                      placeholder="2023"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="bg-black/50 border-emerald-900/30 text-white rounded-xl text-center font-mono h-10 text-xs px-2"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isUpdating}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl tracking-tight shadow-md transition-all duration-300"
            >
              {isUpdating ? 'جاري الربط والمزامنة...' : 'مزامنة وحفظ التعديلات السيادية 🚀'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. مركز التشخيص وصفر كلفة ومزامنة الزمن السيادي */}
      <Card className="bg-[#050510]/40 border border-blue-900/20 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-extrabold text-blue-400 flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
            مركز تشخيص وحصانة الحافة (Edge Diagnostics)
          </CardTitle>
          <CardDescription className="text-[11px] text-gray-400">
            فحص أداء الحافة وسلامة النظام من تزييف الحقائق أو تباطؤ الإشارات الميدانية.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5 pb-5">
          <div className="grid grid-cols-2 gap-2.5 text-right font-mono text-[10px] sm:text-[11px]">
            <div className="bg-[#000]/40 p-3 rounded-lg border border-white/5 space-y-1 flex flex-col justify-between">
              <span className="text-[9px] text-[#00ffcc]/80 block">💾 الكباتن المخلدون بجهازك:</span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-gray-400 font-bold">بموجب Dexie DB</span>
                <strong className="text-sm text-[#00ffcc]">{favCount} ناقلين</strong>
              </div>
            </div>

            <div className="bg-[#000]/40 p-3 rounded-lg border border-white/5 space-y-1 flex flex-col justify-between">
              <span className="text-[9px] text-blue-400 block">📡 زمن الرادار المتزامن:</span>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleTimeAlignment}
                  className="p-1 px-2.5 bg-blue-950/40 hover:bg-blue-900/30 text-blue-400 border border-blue-500/25 rounded-md text-[9px] cursor-pointer transition-all active:scale-95"
                >
                  <RefreshCw className="h-2.5 w-2.5 inline ml-1 animate-spin-slow" /> معايرة
                </button>
                <strong className="text-[10px] text-blue-400 block max-w-24 text-left truncate" title={systemUts}>
                  {systemUts ? systemUts.split(' ')[1] || systemUts : 'نشط'}
                </strong>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-950/10 border border-blue-900/15 text-[11px] leading-relaxed text-gray-400 text-right">
            💡 <strong>ميثاق صفر عمولة ($0.00 Comm):</strong>
            <p className="mt-1">
              المنصة لا تستقطع فلسًا واحدًا من أجرة الكابتن أو من جيب الراكب. يتم تمويل الخوادم والإنترنت سياديًا من عائدات المساحات الإعلانية الموجهة التي يتم بثها في المشهد الخلفي للهاتف.
            </p>
          </div>

          <Button
            type="button"
            onClick={logout}
            variant="destructive"
            className="w-full h-11 bg-red-950/40 text-red-400 border border-red-500/15 hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
          >
            الشطب الفوري للجلسة وتسجيل الخروج ⚠️
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
