'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Trash2, 
  RefreshCw, 
  DollarSign, 
  PlusCircle, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Loader2, 
  TrendingUp, 
  UserPlus, 
  Search,
  Filter
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

export interface Delegate {
  id: string;
  name: string;
  phone: string;
  referralCode: string; // كود الإحالة الذكي
  referredCount: number; // إجمالي الإحالات
  deletionRate: number; // نسبة الحذف (%)
  revivalRate: number; // نسبة إعادة الإحياء (%)
  pendingDues: number; // المستحقات المتبقية
  dueDate: string; // تاريخ الاستحقاق بعد 30 يوماً
  status: 'active' | 'suspended';
  createdAt: string;
}

export function DelegatesManagementTab() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('وادي السير');
  const [referralCountInit, setReferralCountInit] = useState('0');

  // Load delegates in realtime from Firestore (or fallback to presets if empty)
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'delegates'), (snapshot) => {
      if (snapshot.empty) {
        // Seeding / Mock presets representing Jordanian/Iraqi system
        const defaultDelegates: Delegate[] = [
          {
            id: 'delegate-1',
            name: 'علاء الحموري دير غبار',
            phone: '0795544332',
            referralCode: 'JO-AMMAN-GHUBAR-7',
            referredCount: 38,
            deletionRate: 5.2,
            revivalRate: 88.5,
            pendingDues: 120.00,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now (pending within 30 days)
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 'delegate-2',
            name: 'أبو طارق العراقي الكرادة',
            phone: '0770112233',
            referralCode: 'IQ-BAGHDAD-KARRADA-9',
            referredCount: 64,
            deletionRate: 2.1,
            revivalRate: 94.2,
            pendingDues: 245.50,
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // overdue (35 days ago, outstanding!)
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 'delegate-3',
            name: 'يزن القحطاني صويلح',
            phone: '0780445566',
            referralCode: 'JO-SWAILEH-08',
            referredCount: 14,
            deletionRate: 14.3, // High deletion rate warning!
            revivalRate: 45.0,
            pendingDues: 40.00,
            dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ];
        
        setDelegates(defaultDelegates);
      } else {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Delegate));
        setDelegates(list);
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore error loading delegates:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: 'تم النسخ السيادي',
      description: `تم كود إحالة المندوب الأصلي (${code}) إلى الحافظة بنجاح.`
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    // Generate unique code based on input
    const regionCode = district === 'وادي السير' ? 'WADI-SEER' : 'HQ';
    const randomSuffix = Math.floor(Math.random() * 90) + 10;
    const generatedCode = `JO-${regionCode}-${name.split(' ')[0].toUpperCase()}-${randomSuffix}`;

    const newDelegate: Omit<Delegate, 'id'> = {
      name,
      phone,
      referralCode: generatedCode,
      referredCount: parseInt(referralCountInit) || 0,
      deletionRate: 0,
      revivalRate: 100,
      pendingDues: (parseInt(referralCountInit) || 0) * 5.0, // e.g. 5 JDs / DL for referrals
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days lock
      status: 'active',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'delegates'), newDelegate);
      toast({
        title: 'تم غرس المندوب الميداني',
        description: `تم ربط المندوب "${name}" بكود إحالة ذكي بنجاح.`
      });
      // Reset form
      setName('');
      setPhone('');
      setReferralCountInit('0');
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'فشل الفعالية السحابية',
        description: 'حدث خطأ أثناء الاتصال ونقل ملف المندوب.'
      });
    }
  };

  const toggleStatus = async (id: string, currentStatus: 'active' | 'suspended') => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      if (id.startsWith('delegate-')) {
        // Update local state directly for mock items
        setDelegates(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
      } else {
        await updateDoc(doc(db, 'delegates', id), { status: newStatus });
      }
      toast({
        title: 'تغيير رتبة الاعتماد الميداني',
        description: `المندوب الآن في حالة: ${newStatus === 'active' ? 'معتمد ومفعّل ●' : 'مجمّد وموقوف !'}`
      });
    } catch (e) {
      console.error(e);
    }
  };

  const processPayout = async (id: string) => {
    try {
      if (id.startsWith('delegate-')) {
        setDelegates(prev => prev.map(d => d.id === id ? { ...d, pendingDues: 0 } : d));
      } else {
        await updateDoc(doc(db, 'delegates', id), { pendingDues: 0 });
      }
      toast({
        title: 'براءة ذمة مالية سيادية',
        description: 'تم تفريغ وتسوية المستحقات وصرف العوائد نقداً للمندوب.'
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Aggregated stats
  const totalReferred = delegates.reduce((acc, d) => acc + d.referredCount, 0);
  const avgDeletion = delegates.length ? Number((delegates.reduce((acc, d) => acc + d.deletionRate, 0) / delegates.length).toFixed(1)) : 0;
  const avgRevival = delegates.length ? Number((delegates.reduce((acc, d) => acc + d.revivalRate, 0) / delegates.length).toFixed(1)) : 0;
  const totalDuesOverdue = delegates
    .filter(d => new Date(d.dueDate) < new Date() && d.pendingDues > 0)
    .reduce((acc, d) => acc + d.pendingDues, 0);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            فيلق جيش المندوبين السيادي (Delegates Army Core)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans">
            الشبكة اللامركزية للتسويق الميداني وتوسيع رقعة الكباتن في المحافظات والألوية الأردنية والعراقية.
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1 mt-2 text-xs h-9 rounded-xl"
        >
          {isAdding ? 'إغلاق اللوحة' : 'أضف مندوب معتمد +'}
        </Button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#091B09]/40 border-emerald-950/40 p-4">
          <CardHeader className="p-0 pb-1">
            <CardDescription className="text-[10px] text-zinc-400 font-bold">إجمالي مجندي الأسطول</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-black text-emerald-400 font-mono">{totalReferred} كابتن</p>
            <span className="text-[9px] text-muted-foreground">ثمرة النواة الميدانية للمناديب</span>
          </CardContent>
        </Card>

        <Card className="bg-[#091B09]/40 border-emerald-950/40 p-4">
          <CardHeader className="p-0 pb-1">
            <CardDescription className="text-[10px] text-zinc-400 font-bold">نسبة الحذف (الانسحاب)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-black text-red-400 font-mono">{avgDeletion}%</p>
            <span className="text-[9px] text-muted-foreground">الكباتن الذين حذفوا التطبيق</span>
          </CardContent>
        </Card>

        <Card className="bg-[#091B09]/40 border-emerald-950/40 p-4">
          <CardHeader className="p-0 pb-1">
            <CardDescription className="text-[10px] text-zinc-400 font-bold">معدل إعادة الإحياء</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-black text-blue-400 font-mono">{avgRevival}%</p>
            <span className="text-[9px] text-zinc-500 font-semibold">تفعيل الرادارات المعطلة مجدداً</span>
          </CardContent>
        </Card>

        <Card className="bg-[#091B09]/40 border-emerald-950/40 p-4">
          <CardHeader className="p-0 pb-1">
            <CardDescription className="text-[10px] text-zinc-400 font-bold">مستحقات معلقة (&gt; 30 يوماً)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-black text-amber-500 font-mono">{totalDuesOverdue.toFixed(2)} د.أ</p>
            <span className="text-[9px] text-muted-foreground">أرصدة تجاوزت قفل التدقيق السلوكي</span>
          </CardContent>
        </Card>
      </div>

      {/* Add New Delegate Drawer/Panel */}
      {isAdding && (
        <Card className="bg-[#000d00] border-emerald-500/30 p-5 mt-4 animate-in slide-in-from-top duration-300">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base font-black text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              تجنيد مندوب معتمد جديد
            </CardTitle>
            <CardDescription className="text-xs">
              سيتم إنشاء كود إحالة فريد لتعقّب نشاط وحساب عوائد المندوب تلقائياً.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddDelegate} className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="del-name" className="text-xs text-zinc-450">اسم المندوب الرباعي</Label>
                <Input 
                  id="del-name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="مثال: يوسف مأمون بني ملحم"
                  className="bg-black/60 border-emerald-950/45 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="del-phone" className="text-xs text-zinc-450">رقم الهاتف النشط</Label>
                <Input 
                  id="del-phone" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="مثال: 0797744111"
                  className="bg-black/60 border-emerald-950/45 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="del-region" className="text-xs text-zinc-450">لواء السيادة والمركز جغرافياً</Label>
                <select 
                  id="del-region" 
                  value={district} 
                  onChange={e => setDistrict(e.target.value)} 
                  className="w-full h-10 mt-1 rounded bg-black border border-emerald-900 text-white px-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="وادي السير">وادي السير (عمان)</option>
                  <option value="الجامعة">لواء الجامعة (عمان)</option>
                  <option value="قصبة عمان">قصبة عمان (عمان)</option>
                  <option value="الكرادة">الكرادة (بغداد العراق)</option>
                </select>
              </div>

              <div className="space-y-1 font-mono">
                <Label htmlFor="del-count" className="text-xs text-zinc-450">إحالات سابقة مقيدة</Label>
                <Input 
                  id="del-count" 
                  type="number" 
                  value={referralCountInit} 
                  onChange={e => setReferralCountInit(e.target.value)} 
                  className="bg-black/60 border-emerald-950/45 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="h-9 hover:bg-white/5 text-xs text-neutral-400">إلغاء الأمر</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 text-xs rouned-xl">إنشاء العقد وتجهيز الكود 🔒</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Table for Delegate Army */}
      <Card className="bg-[#091B09]/20 border-emerald-950/30">
        <CardHeader className="pb-3 border-b border-emerald-950/20">
          <CardTitle className="text-base font-black text-white">القيادة العامة وقوات الانتشار الميداني</CardTitle>
          <CardDescription className="text-xs">
            رصد الكود الذكي، فحص جودة الانتساب (تتبع نسب الحذف وإعادة الإحياء وتسييل المستحقات المعلقة بعد فترة الـ 30 يوماً).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : delegates.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-black/40 border-b border-emerald-950/30">
                  <TableRow>
                    <TableHead className="text-right text-gray-400 text-xs py-3">المندوب</TableHead>
                    <TableHead className="text-right text-gray-400 text-xs">كود الإحالة الذكي</TableHead>
                    <TableHead className="text-right text-gray-400 text-xs">الكباتن</TableHead>
                    <TableHead className="text-right text-gray-400 text-xs">نسبة الحذف</TableHead>
                    <TableHead className="text-right text-gray-400 text-xs">إعادة الإحياء</TableHead>
                    <TableHead className="text-right text-gray-400 text-xs">مستحقات معلقة (&gt;30 يوم)</TableHead>
                    <TableHead className="text-right text-gray-400 text-xs">حالة النشاط</TableHead>
                    <TableHead className="text-left text-gray-400 text-xs p-3">السيادة والإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delegates.map((del) => {
                    const isOverdue = new Date(del.dueDate) < new Date();
                    
                    return (
                      <TableRow key={del.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="align-middle py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 rounded-full border border-emerald-500/20 bg-emerald-950/30">
                              <AvatarFallback className="text-emerald-400 font-bold text-xs uppercase">
                                {del.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-black text-white leading-tight capitalize">{del.name}</p>
                              <span className="text-[10px] text-zinc-500 font-mono">{del.phone}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="align-middle">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="font-mono text-[10px] bg-black/60 border-emerald-800 text-white p-1 select-all cursor-pointer">
                              {del.referralCode}
                            </Badge>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleCopy(del.referralCode)} 
                              className="w-6 h-6 hover:bg-neutral-800"
                            >
                              {copiedCode === del.referralCode ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell className="align-middle font-bold text-xs font-mono text-zinc-300">
                          {del.referredCount} كابتن
                        </TableCell>

                        <TableCell className="align-middle font-mono">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px]",
                              del.deletionRate >= 10 
                                ? "text-red-400 border-red-500/40 bg-red-950/20" 
                                : "text-yellow-400 border-yellow-500/40 bg-yellow-950/20"
                            )}
                          >
                            {del.deletionRate}% 🗑️
                          </Badge>
                        </TableCell>

                        <TableCell className="align-middle font-mono">
                          <Badge 
                            variant="outline" 
                            className="text-[10px] text-blue-400 border-blue-500/40 bg-blue-950/20"
                          >
                            {del.revivalRate}% ⚡
                          </Badge>
                        </TableCell>

                        <TableCell className="align-middle font-mono">
                          <span className="text-zinc-300 text-xs font-bold block">{del.pendingDues} د.أ</span>
                          {del.pendingDues > 0 ? (
                            isOverdue ? (
                              <span className="text-[9px] text-red-400 font-bold block bg-red-950/10 px-1 py-0.5 rounded w-max mt-0.5 animate-pulse">
                                ⚠️ تجاوزت 30 يوماً
                              </span>
                            ) : (
                              <span className="text-[9px] text-zinc-500 block mt-0.5">
                                مقفل ومجمد حتى: {del.dueDate}
                              </span>
                            )
                          ) : (
                            <span className="text-[9px] text-emerald-400 font-bold text-xs block">
                              مصفّر ✓
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="align-middle">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px]", 
                              del.status === 'active' 
                                ? "text-emerald-400 border-emerald-500 bg-emerald-950/20" 
                                : "text-amber-500 border-amber-500 bg-amber-950/20"
                            )}
                          >
                            {del.status === 'active' ? 'معتمد ●' : 'موقوف مؤقتاً ||'}
                          </Badge>
                        </TableCell>

                        <TableCell className="align-middle text-left p-3">
                          <div className="flex items-center justify-end gap-2">
                            {/* Payout reward button if dues are payable after 30 days approval check */}
                            {del.pendingDues > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => processPayout(del.id)}
                                className="h-7 border-emerald-500/30 hover:bg-emerald-950/40 text-[10px] font-bold text-emerald-400 rounded-lg"
                              >
                                <DollarSign className="w-3 h-3 ml-0.5" />
                                تسييل وصرف العوائد
                              </Button>
                            )}

                            {/* Suspension toggle */}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => toggleStatus(del.id, del.status)}
                              className="h-7 border-white/5 hover:bg-neutral-800 text-[10px] rounded-lg text-neutral-350"
                            >
                              {del.status === 'active' ? 'تجميد المعتمد' : 'تفعيل المعتمد'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-xs py-10">لا يوجد مناديب معتمدين مسجلين في النظام بعد.</p>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}
