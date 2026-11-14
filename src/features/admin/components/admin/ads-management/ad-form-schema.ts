import { z } from 'zod';

export const getAdFormSchema = (t: any) =>
  z.object({
    title: z.string().min(5, t('schema.titleMin')),
    description: z.string().min(10, t('schema.descMin')),
    posterUrl: z.string().url(t('schema.posterUrlValid')),
    actionUrl: z.string().url(t('schema.actionUrlValid')),
    buttonText: z.string().min(2, t('schema.buttonTextMin')),
    role: z.enum(['driver', 'rider', 'all']),
    targetImpressions: z.coerce.number().min(1000, t('schema.targetImpressionsMin')),
    endDate: z.date({ required_error: t('schema.endDateRequired') }),
    geo: z
      .object({
        governorate: z.string().optional(),
        district: z.string().optional(),
      })
      .optional(),
  });

