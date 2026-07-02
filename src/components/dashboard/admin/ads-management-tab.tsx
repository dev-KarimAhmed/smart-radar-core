
'use client';

import React, { useState, useMemo } from 'react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Loader2, PlusCircle, CalendarIcon, Users, Car, MapPin, Eye, MousePointerClick, PauseCircle, PlayCircle, Trash2, Snowflake, Clock } from 'lucide-react';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AdInput, SovereignAd } from '@/core/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AdDisplayCard } from '../ad-display-card';


const adFormSchema = z.object({
  title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل.'),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل.'),
  posterUrl: z.string().url('يجب أن يكون رابط صورة صالح.'),
  actionUrl: z.string().url('يجب أن يكون رابط إجراء صالح.'),
  buttonText: z.string().min(2, 'نص الزر قصير جداً.'),
  role: z.enum(['driver', 'rider', 'all']),
  targetImpressions: z.coerce.number().min(1000, 'الحد الأدنى للمشاهدات هو 1000.'),
  endDate: z.date({ required_error: 'تاريخ الانتهاء مطلوب.'}),
  geo: z.object({
    governorate: z.string().optional(),
    district: z.string().optional(),
  }).optional(),
});


function AdForm({ onFinish, isProcessing }: { onFinish: (data: AdInput) => Promise<boolean>, isProcessing: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<AdInput>({
    resolver: zodResolver(adFormSchema),
    defaultValues: { role: 'all', targetImpressions: 10000, buttonText: 'احجز مقعدك الآن 🚀' },
  });
  
  const selectedGov = watch('geo.governorate');
  const districts = useMemo(() => selectedGov ? getDistrictsByGovernorate(selectedGov) : [], [selectedGov]);

  const onSubmit = async (data: any) => {
    // Map nested geo object directly to the flat fields that useAdminAds expects
    const formattedData = {
      ...data,
      targetGovernorate: data.geo?.governorate || 'عمان',
      targetDistrict: data.geo?.district || '',
      endDate: format(data.endDate, 'yyyy-MM-dd')
    };
    const success = await onFinish(formattedData as AdInput);
    if (success) setOpen(false);
  };

  const onError = (formErrors: any) => {
    console.error("AdForm validation errors:", formErrors);
    let errorMessage = "يرجى ملء جميع الحقول المطلوبة بشكل صحيح.\n";
    if (formErrors.title) errorMessage += `- العنوان: ${formErrors.title.message}\n`;
    if (formErrors.description) errorMessage += `- الوصف: ${formErrors.description.message}\n`;
    if (formErrors.posterUrl) errorMessage += `- رابط البوستر: ${formErrors.posterUrl.message}\n`;
    if (formErrors.actionUrl) errorMessage += `- رابط الإجراء: ${formErrors.actionUrl.message}\n`;
    if (formErrors.endDate) errorMessage += `- تاريخ الانتهاء مطلوب ونشط.\n`;
    
    toast({
      variant: 'destructive',
      title: '⚠️ رفض استكمال الاستمارة',
      description: errorMessage
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="ml-2"/>
          إطلاق حملة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>منصة الحقن الإعلاني</DialogTitle>
          <DialogDescription>أدخل بيانات الحملة الجديدة لضخها في "نهر الإعلانات" فوراً.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
          <Input placeholder="عنوان الحملة الجذاب" {...register('title')} />
          {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
          
          <Input placeholder="وصف موجز للحملة" {...register('description')} />
          {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input placeholder="رابط صورة البوستر (URL)" {...register('posterUrl')} dir="ltr" />
            <Input placeholder="رابط الإجراء (URL)" {...register('actionUrl')} dir="ltr" />
          </div>
          {(errors.posterUrl || errors.actionUrl) && <p className="text-red-500 text-xs">{errors.posterUrl?.message || errors.actionUrl?.message}</p>}

          <Input placeholder="النص على زر الإجراء (مثال: اطلب الآن)" {...register('buttonText')} />
          {errors.buttonText && <p className="text-red-500 text-xs">{errors.buttonText.message}</p>}
          
          <Separator className="my-4 bg-white/10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
             <div className="space-y-2">
                <Label>القطاع المستهدف</Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الجميع</SelectItem>
                        <SelectItem value="rider">المسافرون فقط</SelectItem>
                        <SelectItem value="driver">الكباتن فقط</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
             </div>
             <div className="space-y-2">
                <Label>السعة (مرات الظهور)</Label>
                <Input type="number" step="1000" {...register('targetImpressions')} />
                {errors.targetImpressions && <p className="text-red-500 text-xs">{errors.targetImpressions.message}</p>}
             </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المحافظة (اختياري)</Label>
              <Controller
                  control={control}
                  name="geo.governorate"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="كل المحافظات" /></SelectTrigger>
                      <SelectContent>{jordanGovernorates.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
            </div>
             <div className="space-y-2">
              <Label>اللواء (اختياري)</Label>
              <Controller
                  control={control}
                  name="geo.district"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedGov}>
                      <SelectTrigger><SelectValue placeholder="كل الألوية" /></SelectTrigger>
                      <SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
            </div>
          </div>

          <div className="space-y-2">
             <Label>تاريخ انتهاء الحملة</Label>
              <Controller
                control={control}
                name="endDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>اختر تاريخاً</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.endDate && <p className="text-red-500 text-xs">{errors.endDate.message?.toString()}</p>}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const opts = { shouldValidate: true, shouldDirty: true };
                setValue('title', 'حملة النسر الذهبي للمحروقات', opts);
                setValue('description', 'احصل على خصومات حافلات النهر بخصم يصل إلى 15% على الغيار والوقود المعتمد.', opts);
                setValue('posterUrl', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000', opts);
                setValue('actionUrl', 'https://wa.me/962790000000', opts);
                setValue('buttonText', 'اطلب كرت الخصم الفوري 🚀', opts);
                setValue('targetImpressions', 15000, opts);
                setValue('endDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), opts);
                setValue('geo.governorate', 'عمان', opts);
                toast({
                  title: "✨ تم التعبئة التلقائية للنموذج",
                  description: "تم ملء كافة الحقول بنجاح وبسرعة سيادية. يمكنك الضغط على 'إطلاق الحملة' الآن."
                });
              }}
              className="border-[#00ffcc]/30 text-[#00ffcc] hover:bg-[#00ffcc]/10 font-black text-xs"
            >
              🪄 تعبئة تلقائية سريعة
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && <Loader2 className="animate-spin ml-2" />}
                إطلاق الحملة
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdCampaignCard({ 
  ad, 
  onToggle, 
  onDelete, 
  onFreeze, 
  onExtend 
}: { 
  ad: SovereignAd, 
  onToggle: (id: string, status: string) => void, 
  onDelete: (id: string) => void,
  onFreeze: (id: string, isFrozen: boolean) => void,
  onExtend: (id: string, extraImpressions: number, extraDays: number) => void
}) {
  const currentImpressions = ad.currentImpressions || 0;
  const targetImpressions = ad.targetImpressions || 1;
  const consumption = (currentImpressions / targetImpressions) * 100;
  const isExpired = ad.endDate ? new Date(ad.endDate) < new Date() : false;
  
  const statusLower = (ad.status || '').toLowerCase();
  const isFrozen = statusLower === 'frozen';
  const isActive = statusLower === 'active';
  const isPaused = statusLower === 'paused';
  
  return (
    <Card className={cn(
        "bg-[#091B09]/50 border-emerald-950/40 overflow-hidden flex flex-col transition-all",
        (isPaused || isFrozen) && 'opacity-65',
        isExpired && 'border-red-500/50',
        isFrozen && 'border-blue-500/40 relative shadow-inner'
    )}>
      <CardHeader className="pb-3 text-right" dir="rtl">
        <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col text-right min-w-0 flex-1">
              <CardTitle className="text-white text-base truncate font-black leading-tight text-right">{ad.content?.title || ad.title}</CardTitle>
              {ad.serial_id && (
                <span className="text-[10px] text-emerald-400 font-mono tracking-wider mt-1 text-right block">🧬 {ad.serial_id}</span>
              )}
            </div>
            <Badge 
              variant={isExpired ? 'destructive' : isFrozen ? 'secondary' : 'outline'} 
              className={cn(
                isActive && !isExpired && 'text-emerald-400 border-emerald-500/50 bg-emerald-950/20', 
                isPaused && 'text-yellow-400 border-yellow-500/50 bg-yellow-950/20',
                isFrozen && 'text-blue-400 border-blue-500/50 bg-blue-950/20'
              )}
            >
              {isExpired ? 'منتهية' : isFrozen ? 'مجمّد ❄️' : (isActive ? 'نشط ●' : 'معلّق ||')}
            </Badge>
        </div>
        <CardDescription className="flex items-center gap-4 text-[11px] pt-1 text-right">
          <span className="flex items-center gap-1">
            {ad.role === 'all' ? <Users className="w-3.5 h-3.5"/> : ad.role === 'driver' ? <Car className="w-3.5 h-3.5"/> : <Users className="w-3.5 h-3.5"/>}
            {ad.role === 'all' ? 'الجميع' : ad.role === 'driver' ? 'الكباتن' : 'المسافرون'}
          </span>
          <span className="flex items-center gap-1 font-bold">
            <MapPin className="w-3.5 h-3.5 text-emerald-400"/>
            {ad.targetDistrict ? `لواء: ${ad.targetDistrict}` : ad.targetGovernorate || 'عمان'}
          </span>
        </CardDescription>
      </CardHeader>

      <div className="px-4 pb-4">
        <AdDisplayCard
          ad={ad}
          showHeart={false}
          badgeText="نبض ميداني"
          ctaText={(ad as any).action?.buttonText || (ad as any).buttonText || 'عرض التفاصيل'}
          className="h-[260px] cursor-default rounded-[28px]"
        />
      </div>
      
      <CardContent className="space-y-4 text-sm flex-grow text-right" dir="rtl">
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase font-black font-sans">نسبة استهلاك السعة</Label>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={consumption} className="h-2 flex-1 bg-black/40" indicatorClassName={consumption > 85 ? "bg-destructive" : "bg-emerald-500"} />
            <span className="text-xs font-bold font-mono text-emerald-400">{consumption.toFixed(0)}%</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-black/40 p-2 text-center rounded-xl border border-white/5">
                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 font-black uppercase"><Eye className="w-3.5 h-3.5 text-emerald-400" /> الظهور </p>
                <p className="font-bold text-xs text-white mt-1 font-mono">{(ad.currentImpressions || 0).toLocaleString()} / {(ad.targetImpressions || 0).toLocaleString()}</p>
            </div>
             <div className="bg-black/40 p-2 text-center rounded-xl border border-white/5">
                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 font-black uppercase"><MousePointerClick className="w-3.5 h-3.5 text-blue-400" /> النقرات</p>
                <p className="font-bold text-xs text-blue-400 mt-1 font-mono">{(ad.clicksCount || 0).toLocaleString()}</p>
            </div>
        </div>

        {/* Visibility credentials of deep smart links */}
        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 text-[9px] font-mono text-gray-400 space-y-1">
          <div className="flex justify-between items-center">
            <span>رابط الواتساب:</span>
            <span className="text-white hover:underline truncate max-w-[120px] text-left">{ad.whatsapp || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>خط الهاتف السريع:</span>
            <span className="text-white text-left">{ad.phone || 'N/A'}</span>
          </div>
        </div>

        <div className="text-[11px] text-center text-muted-foreground font-mono">
            ينتهي تاريخ الصلاحية في: {ad.endDate ? format(new Date(ad.endDate), "dd/MM/yyyy") : 'N/A'}
        </div>
      </CardContent>

      {/* 🛡️ 4 absolute sovereign buttons grid panel (المادة 7) */}
      <CardFooter className="bg-black/40 p-2 grid grid-cols-2 gap-2 border-t border-white/5" dir="rtl">
         
         {/* Sovereign 1: Pause / Resume Campaign */}
         <Button 
           variant="outline" 
           size="sm" 
           onClick={() => onToggle(ad.id, ad.status)} 
           disabled={isFrozen}
           className="h-8 font-bold text-[10px] border-white/5 hover:bg-emerald-950/20"
         >
            {isActive ? <PauseCircle className="ml-1 w-3.5 h-3.5 text-amber-500"/> : <PlayCircle className="ml-1 w-3.5 h-3.5 text-emerald-500"/>}
            {isActive ? 'تعليق' : 'تفعيل'}
         </Button>

         {/* Sovereign 2: Freeze contract limits */}
         <Button 
           variant="outline" 
           size="sm" 
           onClick={() => onFreeze(ad.id, isFrozen)}
           className={cn("h-8 font-bold text-[10px] border-white/5 hover:bg-emerald-950/20", isFrozen && "border-blue-500/40 text-blue-400 bg-blue-950/20")}
         >
            <Snowflake className="ml-1 w-3.5 h-3.5 text-blue-400" />
            {isFrozen ? 'فك التجمد' : 'تجميد العقد'}
         </Button>

         {/* Sovereign 3: Extend contract (+5k impressions & 30 days) */}
         <Button 
           variant="outline" 
           size="sm" 
           onClick={() => onExtend(ad.id, 5000, 30)}
           className="h-8 font-bold text-[10px] border-white/5 hover:border-emerald-500/30"
         >
            <Clock className="ml-1 w-3.5 h-3.5 text-emerald-400" />
            تمديد المدى
         </Button>

         {/* Sovereign 4: Sovereign Delete with Audited Confirmation */}
         <AlertDialog>
           <AlertDialogTrigger asChild>
               <Button variant="destructive" size="sm" className="h-8 font-bold text-[10px]">
                   <Trash2 className="ml-1 w-3.5 h-3.5"/>
                   أرشفة
               </Button>
           </AlertDialogTrigger>
           <AlertDialogContent className="bg-black text-white border-white/10 text-right font-sans" dir="rtl">
               <AlertDialogHeader>
                   <AlertDialogTitle className="text-right font-black">هل أنت متأكد من أرشفة هذه الحملة؟</AlertDialogTitle>
                   <AlertDialogDescription className="text-right text-gray-400 text-xs leading-normal">
                       سيتم شطب وحجب الحملة بصفة نهائية ولا رجعة فيها وإلغاء الرادار المخصص لوجهات الانتشار في الميدان.
                   </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter className="flex gap-2">
                   <AlertDialogCancel className="bg-white/10 border-white/10">تراجع وإلغاء</AlertDialogCancel>
                   <AlertDialogAction onClick={() => onDelete(ad.id)} className="bg-red-600 hover:bg-red-500 text-white font-bold">نعم، تدمير وأرشفة</AlertDialogAction>
               </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>

      </CardFooter>
    </Card>
  );
}


export function AdsManagementTab() {
  const { ads, isLoading, isProcessing, createAd, toggleAdStatus, deleteAd, freezeAd, extendAd } = useAdminAds();

  return (
    <div className="space-y-8" dir="rtl">
       <div className="flex justify-between items-center">
            <div className="text-right">
                <h2 className="text-2xl font-black text-white">برج مراقبة الإعلانات والنبض السيادي</h2>
                <p className="text-muted-foreground text-xs font-sans mt-0.5">مسرح متكامل ممتد على عرض شاشات الركاب خاضع لسيادة المراقبة المطلقة.</p>
            </div>
            <AdForm onFinish={createAd} isProcessing={isProcessing} />
       </div>

      {isLoading ? (
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
      ) : ads.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.filter(ad => (ad.status as string) !== 'archived').map((ad) => (
                <AdCampaignCard 
                  key={ad.id} 
                  ad={ad} 
                  onToggle={toggleAdStatus} 
                  onDelete={deleteAd} 
                  onFreeze={freezeAd}
                  onExtend={extendAd} 
                />
              ))}
          </div>
      ) : (
          <p className="text-muted-foreground text-center py-10 text-sm">لا توجد حملات إعلانية نشطة حالياً. اذهب لبوابة المعلن السيادية أو أنشئ إعلاناً جديداً.</p>
      )}

    </div>
  );
}
