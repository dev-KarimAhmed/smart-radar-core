
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
import { AdDisplayCard } from '@/features/ads/ad-display/contract';

const styles = {
  style90_1: "ml-2",
  style94_2: "sm:max-w-2xl max-h-[90vh] overflow-y-auto",
  style99_3: "space-y-4",
  style101_4: "text-red-500 text-xs",
  style104_5: "text-red-500 text-xs",
  style106_6: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  style110_7: "text-red-500 text-xs",
  style113_8: "text-red-500 text-xs",
  style115_9: "my-4 bg-white/10",
  style117_10: "grid grid-cols-1 sm:grid-cols-2 gap-4 items-start",
  style118_11: "space-y-2",
  style135_12: "space-y-2",
  style138_13: "text-red-500 text-xs",
  style142_14: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  style143_15: "space-y-2",
  style156_16: "space-y-2",
  style171_17: "space-y-2",
  style179_18: "w-full justify-start text-left font-normal",
  style179_19: "text-muted-foreground",
  style180_20: "ml-2 h-4 w-4",
  style184_21: "w-auto p-0",
  style190_22: "text-red-500 text-xs",
  style193_23: "flex flex-col sm:flex-row gap-2 justify-between",
  style212_24: "border-[#00ffcc]/30 text-[#00ffcc] hover:bg-[#00ffcc]/10 font-black text-xs",
  style216_25: "flex gap-2",
  style219_26: "animate-spin ml-2",
  style255_27: "bg-[#091B09]/50 border-emerald-950/40 overflow-hidden flex flex-col transition-all",
  style256_28: "opacity-65",
  style257_29: "border-red-500/50",
  style258_30: "border-blue-500/40 relative shadow-inner",
  style260_31: "pb-3 text-right",
  style261_32: "flex justify-between items-start gap-2",
  style262_33: "flex flex-col text-right min-w-0 flex-1",
  style263_34: "text-white text-base truncate font-black leading-tight text-right",
  style265_35: "text-[10px] text-emerald-400 font-mono tracking-wider mt-1 text-right block",
  style271_36: "text-emerald-400 border-emerald-500/50 bg-emerald-950/20",
  style272_37: "text-yellow-400 border-yellow-500/50 bg-yellow-950/20",
  style273_38: "text-blue-400 border-blue-500/50 bg-blue-950/20",
  style279_39: "flex items-center gap-4 text-[11px] pt-1 text-right",
  style280_40: "flex items-center gap-1",
  style281_41: "w-3.5 h-3.5",
  style281_42: "w-3.5 h-3.5",
  style281_43: "w-3.5 h-3.5",
  style284_44: "flex items-center gap-1 font-bold",
  style285_45: "w-3.5 h-3.5 text-emerald-400",
  style291_46: "px-4 pb-4",
  style297_47: "h-[260px] cursor-default rounded-[28px]",
  style301_48: "space-y-4 text-sm flex-grow text-right",
  style303_49: "text-[10px] text-muted-foreground uppercase font-black font-sans",
  style304_50: "flex items-center gap-2 mt-1",
  style305_51: "h-2 flex-1 bg-black/40",
  style306_52: "text-xs font-bold font-mono text-emerald-400",
  style310_53: "grid grid-cols-2 gap-2 text-center",
  style311_54: "bg-black/40 p-2 text-center rounded-xl border border-white/5",
  style312_55: "text-[10px] text-muted-foreground flex items-center justify-center gap-1 font-black uppercase",
  style312_56: "w-3.5 h-3.5 text-emerald-400",
  style313_57: "font-bold text-xs text-white mt-1 font-mono",
  style315_58: "bg-black/40 p-2 text-center rounded-xl border border-white/5",
  style316_59: "text-[10px] text-muted-foreground flex items-center justify-center gap-1 font-black uppercase",
  style316_60: "w-3.5 h-3.5 text-blue-400",
  style317_61: "font-bold text-xs text-blue-400 mt-1 font-mono",
  style322_62: "bg-black/40 p-2.5 rounded-xl border border-white/5 text-[9px] font-mono text-gray-400 space-y-1",
  style323_63: "flex justify-between items-center",
  style325_64: "text-white hover:underline truncate max-w-[120px] text-left",
  style327_65: "flex justify-between items-center",
  style329_66: "text-white text-left",
  style333_67: "text-[11px] text-center text-muted-foreground font-mono",
  style339_68: "bg-black/40 p-2 grid grid-cols-2 gap-2 border-t border-white/5",
  style347_69: "h-8 font-bold text-[10px] border-white/5 hover:bg-emerald-950/20",
  style349_70: "ml-1 w-3.5 h-3.5 text-amber-500",
  style349_71: "ml-1 w-3.5 h-3.5 text-emerald-500",
  style358_72: "h-8 font-bold text-[10px] border-white/5 hover:bg-emerald-950/20",
  style358_73: "border-blue-500/40 text-blue-400 bg-blue-950/20",
  style360_74: "ml-1 w-3.5 h-3.5 text-blue-400",
  style369_75: "h-8 font-bold text-[10px] border-white/5 hover:border-emerald-500/30",
  style371_76: "ml-1 w-3.5 h-3.5 text-emerald-400",
  style378_77: "h-8 font-bold text-[10px]",
  style379_78: "ml-1 w-3.5 h-3.5",
  style383_79: "bg-black text-white border-white/10 text-right font-sans",
  style385_80: "text-right font-black",
  style386_81: "text-right text-gray-400 text-xs leading-normal",
  style390_82: "flex gap-2",
  style391_83: "bg-white/10 border-white/10",
  style392_84: "bg-red-600 hover:bg-red-500 text-white font-bold",
  style407_85: "space-y-8",
  style408_86: "flex justify-between items-center",
  style409_87: "text-right",
  style410_88: "text-2xl font-black text-white",
  style411_89: "text-muted-foreground text-xs font-sans mt-0.5",
  style417_90: "w-8 h-8 animate-spin text-emerald-500 mx-auto",
  style419_91: "grid md:grid-cols-2 lg:grid-cols-3 gap-6",
  style432_92: "text-muted-foreground text-center py-10 text-sm",
} as const;



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
 <PlusCircle className={styles.style90_1}/>
 إطلاق حملة جديدة
 </Button>
 </DialogTrigger>
 <DialogContent className={styles.style94_2}>
 <DialogHeader>
 <DialogTitle>منصة الإضافة الإعلاني</DialogTitle>
 <DialogDescription>أدخل بيانات الحملة الجديدة لعرضها في قسم الإعلانات.</DialogDescription>
 </DialogHeader>
 <form onSubmit={handleSubmit(onSubmit, onError)} className={styles.style99_3}>
 <Input placeholder="عنوان الحملة الجذاب" {...register('title')} />
 {errors.title && <p className={styles.style101_4}>{errors.title.message}</p>}

 <Input placeholder="وصف موجز للحملة" {...register('description')} />
 {errors.description && <p className={styles.style104_5}>{errors.description.message}</p>}

 <div className={styles.style106_6}>
 <Input placeholder="رابط صورة البوستر (URL)" {...register('posterUrl')} dir="ltr" />
 <Input placeholder="رابط الإجراء (URL)" {...register('actionUrl')} dir="ltr" />
 </div>
 {(errors.posterUrl || errors.actionUrl) && <p className={styles.style110_7}>{errors.posterUrl?.message || errors.actionUrl?.message}</p>}

 <Input placeholder="النص على زر الإجراء (مثال: اطلب الآن)" {...register('buttonText')} />
 {errors.buttonText && <p className={styles.style113_8}>{errors.buttonText.message}</p>}

 <Separator className={styles.style115_9} />

 <div className={styles.style117_10}>
 <div className={styles.style118_11}>
 <Label>القطاع المستهدف</Label>
 <Controller
 control={control}
 name="role"
 render={({ field }) => (
 <Select onValueChange={field.onChange} defaultValue={field.value}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">الجميع</SelectItem>
 <SelectItem value="rider">الركاب فقط</SelectItem>
 <SelectItem value="driver">السائقون فقط</SelectItem>
 </SelectContent>
 </Select>
 )}
 />
 </div>
 <div className={styles.style135_12}>
 <Label>السعة (مرات الظهور)</Label>
 <Input type="number" step="1000" {...register('targetImpressions')} />
 {errors.targetImpressions && <p className={styles.style138_13}>{errors.targetImpressions.message}</p>}
 </div>
 </div>

 <div className={styles.style142_14}>
 <div className={styles.style143_15}>
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
 <div className={styles.style156_16}>
 <Label>المنطقة (اختياري)</Label>
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

 <div className={styles.style171_17}>
 <Label>تاريخ انتهاء الحملة</Label>
 <Controller
 control={control}
 name="endDate"
 render={({ field }) => (
 <Popover>
 <PopoverTrigger asChild>
 <Button variant={"outline"} className={cn(styles.style179_18, !field.value && styles.style179_19)}>
 <CalendarIcon className={styles.style180_20} />
 {field.value ? format(field.value, "PPP") : <span>اختر تاريخاً</span>}
 </Button>
 </PopoverTrigger>
 <PopoverContent className={styles.style184_21}>
 <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
 </PopoverContent>
 </Popover>
 )}
 />
 {errors.endDate && <p className={styles.style190_22}>{errors.endDate.message?.toString()}</p>}
 </div>

 <DialogFooter className={styles.style193_23}>
 <Button
 type="button"
 variant="outline"
 onClick={() => {
 const opts = { shouldValidate: true, shouldDirty: true };
 setValue('title', 'حملة النسر الذهبي للمحروقات', opts);
 setValue('description', 'احصل على خصومات تصل إلى 15% على الصيانة والوقود.', opts);
 setValue('posterUrl', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000', opts);
 setValue('actionUrl', 'https://wa.me/962790000000', opts);
 setValue('buttonText', 'اطلب كرت الخصم الفوري 🚀', opts);
 setValue('targetImpressions', 15000, opts);
 setValue('endDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), opts);
 setValue('geo.governorate', 'عمان', opts);
 toast({
 title: "✨ تم التعبئة التلقائية للنموذج",
 description: "تم ملء الحقول بنجاح. يمكنك الضغط على 'إطلاق الحملة' الآن."
 });
 }}
 className={styles.style212_24}
 >
 🪄 تعبئة تلقائية سريعة
 </Button>
 <div className={styles.style216_25}>
 <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
 <Button type="submit" disabled={isProcessing}>
 {isProcessing && <Loader2 className={styles.style219_26} />}
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
 styles.style255_27,
 (isPaused || isFrozen) && styles.style256_28,
 isExpired && styles.style257_29,
 isFrozen && styles.style258_30
 )}>
 <CardHeader className={styles.style260_31} dir="rtl">
 <div className={styles.style261_32}>
 <div className={styles.style262_33}>
 <CardTitle className={styles.style263_34}>{ad.content?.title || ad.title}</CardTitle>
 {ad.serial_id && (
 <span className={styles.style265_35}>🧬 {ad.serial_id}</span>
 )}
 </div>
 <Badge
 variant={isExpired ? 'destructive' : isFrozen ? 'secondary' : 'outline'}
 className={cn(
 isActive && !isExpired && styles.style271_36,
 isPaused && styles.style272_37,
 isFrozen && styles.style273_38
 )}
 >
 {isExpired ? 'منتهية' : isFrozen ? 'مجمّد ❄️' : (isActive ? 'نشط ●' : 'معلّق ||')}
 </Badge>
 </div>
 <CardDescription className={styles.style279_39}>
 <span className={styles.style280_40}>
 {ad.role === 'all' ? <Users className={styles.style281_41}/> : ad.role === 'driver' ? <Car className={styles.style281_42}/> : <Users className={styles.style281_43}/>}
 {ad.role === 'all' ? 'الجميع' : ad.role === 'driver' ? 'السائقون' : 'الركاب'}
 </span>
 <span className={styles.style284_44}>
 <MapPin className={styles.style285_45}/>
 {ad.targetDistrict ? `المنطقة: ${ad.targetDistrict}` : ad.targetGovernorate || 'عمان'}
 </span>
 </CardDescription>
 </CardHeader>

 <div className={styles.style291_46}>
 <AdDisplayCard
 ad={ad}
 showHeart={false}
 badgeText="إعلان قريب"
 ctaText={(ad as any).action?.buttonText || (ad as any).buttonText || 'عرض التفاصيل'}
 className={styles.style297_47}
 />
 </div>

 <CardContent className={styles.style301_48} dir="rtl">
 <div>
 <Label className={styles.style303_49}>نسبة استهلاك السعة</Label>
 <div className={styles.style304_50}>
 <Progress value={consumption} className={styles.style305_51} indicatorClassName={consumption > 85 ? "bg-destructive" : "bg-emerald-500"} />
 <span className={styles.style306_52}>{consumption.toFixed(0)}%</span>
 </div>
 </div>

 <div className={styles.style310_53}>
 <div className={styles.style311_54}>
 <p className={styles.style312_55}><Eye className={styles.style312_56} /> الظهور </p>
 <p className={styles.style313_57}>{(ad.currentImpressions || 0).toLocaleString()} / {(ad.targetImpressions || 0).toLocaleString()}</p>
 </div>
 <div className={styles.style315_58}>
 <p className={styles.style316_59}><MousePointerClick className={styles.style316_60} /> النقرات</p>
 <p className={styles.style317_61}>{(ad.clicksCount || 0).toLocaleString()}</p>
 </div>
 </div>

 {/* Visibility credentials of deep smart links */}
 <div className={styles.style322_62}>
 <div className={styles.style323_63}>
 <span>رابط الواتساب:</span>
 <span className={styles.style325_64}>{ad.whatsapp || 'N/A'}</span>
 </div>
 <div className={styles.style327_65}>
 <span>خط الهاتف السريع:</span>
 <span className={styles.style329_66}>{ad.phone || 'N/A'}</span>
 </div>
 </div>

 <div className={styles.style333_67}>
 ينتهي تاريخ الصلاحية في: {ad.endDate ? format(new Date(ad.endDate), "dd/MM/yyyy") : 'N/A'}
 </div>
 </CardContent>

 {/* 🛡️ 4 absolute sovereign buttons grid panel (المادة 7) */}
 <CardFooter className={styles.style339_68} dir="rtl">

 {/* Sovereign 1: Pause / Resume Campaign */}
 <Button
 variant="outline"
 size="sm"
 onClick={() => onToggle(ad.id, ad.status)}
 disabled={isFrozen}
 className={styles.style347_69}
 >
 {isActive ? <PauseCircle className={styles.style349_70}/> : <PlayCircle className={styles.style349_71}/>}
 {isActive ? 'تعليق' : 'تفعيل'}
 </Button>

 {/* Sovereign 2: Freeze contract limits */}
 <Button
 variant="outline"
 size="sm"
 onClick={() => onFreeze(ad.id, isFrozen)}
 className={cn(styles.style358_72, isFrozen && styles.style358_73)}
 >
 <Snowflake className={styles.style360_74} />
 {isFrozen ? 'فك التجمد' : 'تجميد العقد'}
 </Button>

 {/* Sovereign 3: Extend contract (+5k impressions & 30 days) */}
 <Button
 variant="outline"
 size="sm"
 onClick={() => onExtend(ad.id, 5000, 30)}
 className={styles.style369_75}
 >
 <Clock className={styles.style371_76} />
 تمديد المدى
 </Button>

 {/* Sovereign 4: Sovereign Delete with Audited Confirmation */}
 <AlertDialog>
 <AlertDialogTrigger asChild>
 <Button variant="destructive" size="sm" className={styles.style378_77}>
 <Trash2 className={styles.style379_78}/>
 أرشفة
 </Button>
 </AlertDialogTrigger>
 <AlertDialogContent className={styles.style383_79} dir="rtl">
 <AlertDialogHeader>
 <AlertDialogTitle className={styles.style385_80}>هل أنت متأكد من أرشفة هذه الحملة؟</AlertDialogTitle>
 <AlertDialogDescription className={styles.style386_81}>
 سيتم شطب وحجب الحملة بصفة نهائية ولا رجعة فيها وإلغاء الرادار المخصص لوجهات الانتشار في الميدان.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter className={styles.style390_82}>
 <AlertDialogCancel className={styles.style391_83}>تراجع وإلغاء</AlertDialogCancel>
 <AlertDialogAction onClick={() => onDelete(ad.id)} className={styles.style392_84}>نعم، تدمير وأرشفة</AlertDialogAction>
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
 <div className={styles.style407_85} dir="rtl">
 <div className={styles.style408_86}>
 <div className={styles.style409_87}>
 <h2 className={styles.style410_88}>إدارة الإعلانات</h2>
 <p className={styles.style411_89}>مسرح متكامل ممتد على عرض شاشات الركاب خاضع لإدارة المراقبة المطلقة.</p>
 </div>
 <AdForm onFinish={createAd} isProcessing={isProcessing} />
 </div>

 {isLoading ? (
 <Loader2 className={styles.style417_90} />
 ) : ads.length > 0 ? (
 <div className={styles.style419_91}>
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
 <p className={styles.style432_92}>لا توجد حملات إعلانية نشطة حالياً. أنشئ إعلاناً جديداً للبدء.</p>
 )}

 </div>
 );
}
