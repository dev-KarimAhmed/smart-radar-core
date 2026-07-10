"use client";

import React, { useState } from 'react';
import { Star, AlertOctagon, Heart, Navigation, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  captainId: string;
  reviewerId: string;
  supabase: any;
  onSuccess: () => void;
}

export function RatingModal({
  isOpen,
  onClose,
  tripId,
  captainId,
  reviewerId,
  supabase,
  onSuccess,
}: RatingModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [comment, setComment] = useState('');

  const [vehicle, setVehicle] = useState({
    cleanliness: false,
    ac: false,
    comfort: false,
    quietness: false,
    safety: false,
  });

  const [captain, setCaptain] = useState({
    behavior: false,
    driving: false,
    punctuality: false,
    routing: false,
    communication: false,
  });

  const handleToggleVehicle = (key: keyof typeof vehicle) => {
    setVehicle((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleCaptain = (key: keyof typeof captain) => {
    setCaptain((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const detailedStarsPayload = {
        vehicle: {
          cleanliness: vehicle.cleanliness ? 1 : 0,
          ac: vehicle.ac ? 1 : 0,
          comfort: vehicle.comfort ? 1 : 0,
          quietness: vehicle.quietness ? 1 : 0,
          safety: vehicle.safety ? 1 : 0,
        },
        captain: {
          behavior: captain.behavior ? 1 : 0,
          driving: captain.driving ? 1 : 0,
          punctuality: captain.punctuality ? 1 : 0,
          routing: captain.routing ? 1 : 0,
          communication: captain.communication ? 1 : 0,
        },
      };

      const { error } = await supabase.from('reviews').insert({
        trip_id: tripId,
        reviewer_id: reviewerId,
        reviewee_id: captainId,
        detailed_stars: detailedStarsPayload,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'تم إرسال التقييم بنجاح',
        description: 'شكراً لك على تقييم رحلتك معنا ومساعدتنا في تحسين الخدمة.',
      });

      onSuccess();
    } catch (err: any) {
      console.error('[Rating Modal] Submit rating error:', err);
      toast({
        variant: 'destructive',
        title: 'فشل في حفظ التقييم',
        description: err.message || 'حدث خطأ غير متوقع أثناء حفظ تقييمك.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockDriver = async () => {
    setIsBlocking(true);
    try {
      const { error } = await supabase.from('user_blocks').insert({
        blocker_id: reviewerId,
        blocked_id: captainId,
      });

      if (error) throw error;

      toast({
        title: 'تم حظر السائق بنجاح',
        description: 'لن تظهر لك رحلات أو عروض من هذا السائق مجدداً.',
      });

      onSuccess();
    } catch (err: any) {
      console.error('[Rating Modal] Block driver error:', err);
      toast({
        variant: 'destructive',
        title: 'تعذر إتمام الحظر',
        description: err.message || 'حدث خطأ غير متوقع أثناء حظر الكابتن.',
      });
    } finally {
      setIsBlocking(false);
    }
  };

  const vehicleCriteria = [
    { key: 'cleanliness' as const, label: 'نظافة الصالون' },
    { key: 'ac' as const, label: 'عمل التكييف بقوة' },
    { key: 'comfort' as const, label: 'راحة المقاعد' },
    { key: 'quietness' as const, label: 'هدوء المركبة' },
    { key: 'safety' as const, label: 'سلامة السيارة وأحزمة الأمان' },
  ];

  const captainCriteria = [
    { key: 'behavior' as const, label: 'الاحترام والأسلوب' },
    { key: 'driving' as const, label: 'القيادة الآمنة والالتزام بالسرعة' },
    { key: 'punctuality' as const, label: 'الالتزام بموقع الركوب والوقت' },
    { key: 'routing' as const, label: 'اختيار مسار ذكي بدون زحام' },
    { key: 'communication' as const, label: 'التجاوب والتواصل الاحترافي' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/[0.06] bg-[#0A0F1D]/95 backdrop-blur-xl text-white sm:max-w-md w-[95%] rounded-3xl p-6" dir="rtl">
        <DialogHeader className="text-right flex flex-row items-center justify-between pb-2 border-b border-white/5">
          <div>
            <DialogTitle className="text-xl font-black text-white">قيّم الرحلة</DialogTitle>
            <DialogDescription className="text-gray-400 mt-1">يساعدنا تقييمك على تحسين الخدمة.</DialogDescription>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Row A: Vehicle Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-white pr-1">تقييم المركبة والسيارة</Label>
            <div className="grid grid-cols-5 gap-2 bg-white/5 border border-white/10 rounded-2xl p-3.5">
              {vehicleCriteria.map((item) => {
                const isActive = vehicle[item.key];
                return (
                  <div key={item.key} className="flex flex-col items-center justify-start text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleVehicle(item.key)}
                      className="p-1 cursor-pointer transition-transform duration-200 active:scale-90"
                    >
                      <Star
                        className={`h-8 w-8 transition-all duration-300 ${
                          isActive
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                            : 'text-slate-600/40 fill-none'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] text-slate-400 mt-2 font-medium leading-tight max-w-[64px] line-clamp-3">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row B: Captain Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-white pr-1">تقييم الكابتن والسائق</Label>
            <div className="grid grid-cols-5 gap-2 bg-white/5 border border-white/10 rounded-2xl p-3.5">
              {captainCriteria.map((item) => {
                const isActive = captain[item.key];
                return (
                  <div key={item.key} className="flex flex-col items-center justify-start text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleCaptain(item.key)}
                      className="p-1 cursor-pointer transition-transform duration-200 active:scale-90"
                    >
                      <Star
                        className={`h-8 w-8 transition-all duration-300 ${
                          isActive
                            ? 'text-[#14B8A6] fill-[#14B8A6] drop-shadow-[0_0_8px_rgba(20,245,213,0.6)]'
                            : 'text-slate-600/40 fill-none'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] text-slate-400 mt-2 font-medium leading-tight max-w-[64px] line-clamp-3">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comment Textbox */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-white pr-1">ملاحظات إضافية (اختياري)</Label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب رأيك في الكابتن والرحلة..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl p-3 text-sm focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] focus:outline-none resize-none backdrop-blur-sm transition-all"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {/* Submit Rating Button */}
          <Button
            className="h-12 w-full bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0A0F1D] font-black text-base rounded-xl transition-all"
            disabled={isSubmitting || isBlocking}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'جاري إرسال التقييم...' : 'إرسال التقييم'}
          </Button>

          {/* Block Button */}
          <button
            type="button"
            disabled={isSubmitting || isBlocking}
            onClick={handleBlockDriver}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl py-3 w-full text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <AlertOctagon className="h-4 w-4" />
            {isBlocking ? 'جاري حظر السائق...' : 'حظر هذا السائق وعدم التعامل معه مجدداً'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
