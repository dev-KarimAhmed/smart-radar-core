'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, PlusCircle, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { AdInput } from '@/core/types';
import { styles } from './ads-management-styles';
import { getAdFormSchema } from './ad-form-schema';
import { AdFormGeoPicker } from './ad-form-geo-picker';

interface AdFormProps {
  onFinish: (data: AdInput) => Promise<boolean>;
  isProcessing: boolean;
}

export function AdForm({ onFinish, isProcessing }: AdFormProps) {
  const tAuto = useTranslations('auto');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('adminTab.adsManagement');

  const formSchema = useMemo(() => getAdFormSchema(t), [t]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { role: 'all', targetImpressions: 10000, buttonText: t('form.placeholders.buttonText') },
  });

  const selectedGov = watch('geo.governorate');

  const onSubmit = async (data: any) => {
    const formattedData = {
      ...data,
      targetGovernorate: data.geo?.governorate || tAuto('key_20a48924'),
      targetDistrict: data.geo?.district || '',
      endDate: format(data.endDate, 'yyyy-MM-dd'),
    };
    const success = await onFinish(formattedData as AdInput);
    if (success) setOpen(false);
  };

  const onError = (formErrors: any) => {
    console.error('AdForm validation errors:', formErrors);
    let errorMessage = t('form.fillRequired');
    if (formErrors.title) errorMessage += `${t('form.titleField')}${formErrors.title.message}\n`;
    if (formErrors.description) errorMessage += `${t('form.descField')}${formErrors.description.message}\n`;
    if (formErrors.posterUrl) errorMessage += `${t('form.posterUrlField')}${formErrors.posterUrl.message}\n`;
    if (formErrors.actionUrl) errorMessage += `${t('form.actionUrlField')}${formErrors.actionUrl.message}\n`;
    if (formErrors.endDate) errorMessage += t('form.endDateActive');

    toast({
      variant: 'destructive',
      title: t('form.rejectTitle'),
      description: errorMessage,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className={styles.style90_1} />
          {t('form.launchNewBtn')}
        </Button>
      </DialogTrigger>
      <DialogContent className={styles.style94_2}>
        <DialogHeader>
          <DialogTitle>{t('form.dialogTitle')}</DialogTitle>
          <DialogDescription>{t('form.dialogDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit, onError)} className={styles.style99_3}>
          <Input placeholder={t('form.placeholders.title')} {...register('title')} />
          {errors.title && <p className={styles.style101_4}>{errors.title.message}</p>}

          <Input placeholder={t('form.placeholders.desc')} {...register('description')} />
          {errors.description && <p className={styles.style104_5}>{errors.description.message}</p>}

          <div className={styles.style106_6}>
            <Input placeholder={t('form.placeholders.posterUrl')} {...register('posterUrl')} dir="ltr" />
            <Input placeholder={t('form.placeholders.actionUrl')} {...register('actionUrl')} dir="ltr" />
          </div>
          {(errors.posterUrl || errors.actionUrl) && (
            <p className={styles.style110_7}>{errors.posterUrl?.message || errors.actionUrl?.message}</p>
          )}

          <Input placeholder={t('form.placeholders.buttonText')} {...register('buttonText')} />
          {errors.buttonText && <p className={styles.style113_8}>{errors.buttonText.message}</p>}

          <Separator className={styles.style115_9} />

          <div className={styles.style117_10}>
            <div className={styles.style118_11}>
              <Label>{t('form.targetSectorLabel')}</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('form.sectors.all')}</SelectItem>
                      <SelectItem value="rider">{t('form.sectors.rider')}</SelectItem>
                      <SelectItem value="driver">{t('form.sectors.driver')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className={styles.style135_12}>
              <Label>{t('form.impressionsLabel')}</Label>
              <Input type="number" step="1000" {...register('targetImpressions')} />
              {errors.targetImpressions && <p className={styles.style138_13}>{errors.targetImpressions.message}</p>}
            </div>
          </div>

          <AdFormGeoPicker control={control} selectedGov={selectedGov} t={t} />

          <div className={styles.style171_17}>
            <Label>{t('form.endDateLabel')}</Label>
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(styles.style179_18, !field.value && styles.style179_19)}
                    >
                      <CalendarIcon className={styles.style180_20} />
                      {field.value ? format(field.value, 'PPP') : <span>{t('form.chooseDate')}</span>}
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
                setValue('title', t('form.magicFill.title'), opts);
                setValue('description', t('form.magicFill.desc'), opts);
                setValue(
                  'posterUrl',
                  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000',
                  opts
                );
                setValue('actionUrl', 'https://wa.me/962790000000', opts);
                setValue('buttonText', t('form.magicFill.btnText'), opts);
                setValue('targetImpressions', 15000, opts);
                setValue('endDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), opts);
                setValue('geo.governorate', tAuto('key_20a48924'), opts);
                toast({
                  title: t('form.magicFill.toastTitle'),
                  description: t('form.magicFill.toastDesc'),
                });
              }}
              className={styles.style212_24}
            >
              {t('form.magicFill.btn')}
            </Button>
            <div className={styles.style216_25}>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  {t('form.cancelBtn')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && <Loader2 className={styles.style219_26} />}
                {t('form.submitBtn')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
