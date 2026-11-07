'use client';

import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { AdminProfile } from './admins-types';

interface DeleteAdminDialogProps {
  deleteTarget: AdminProfile | null;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  deleting: boolean;
  direction: 'rtl' | 'ltr';
  isArabic: boolean;
  t: (key: string) => string;
}

export function DeleteAdminDialog({
  deleteTarget,
  onClose,
  onConfirmDelete,
  deleting,
  direction,
  isArabic,
  t,
}: DeleteAdminDialogProps) {
  return (
    <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md bg-[#0B0F19] border border-rose-500/30 text-white shadow-2xl rounded-2xl"
        dir={direction}
      >
        <DialogHeader className={cn("space-y-2", isArabic ? "text-right" : "text-left")}>
          <div className="flex items-center gap-2.5 text-rose-400">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <DialogTitle className="text-lg font-black text-white">
              {t('deleteConfirmTitle')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-xs leading-relaxed">
            {t('deleteConfirmDesc')}
          </DialogDescription>
        </DialogHeader>

        {deleteTarget && (
          <div
            className={cn(
              "my-2 p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5 text-xs",
              isArabic ? "text-right" : "text-left"
            )}
          >
            <p className="text-slate-400 font-medium">{t('targetAdminInfo')}</p>
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-white">{deleteTarget.full_name}</span>
              <span className="font-mono text-slate-300" dir="ltr">
                {deleteTarget.phone}
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-slate-400 text-[11px]">
              <span>{t('rankLabel')}</span>
              <span
                className={
                  deleteTarget.admin_rank === 'GENERAL_ADMIN'
                    ? 'text-amber-300 font-bold'
                    : 'text-cyan-300 font-bold'
                }
              >
                {deleteTarget.admin_rank === 'GENERAL_ADMIN' ? t('generalAdmin') : t('assistantAdmin')}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:justify-start pt-3 border-t border-white/10">
          <Button
            type="button"
            onClick={onConfirmDelete}
            disabled={deleting}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm h-10 rounded-xl transition-all shadow-lg shadow-rose-950/40"
          >
            {deleting ? (
              <>
                <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                {t('deleting')}
              </>
            ) : (
              <>
                <Trash2 className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                {t('confirmDelete')}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="border-white/10 text-slate-300 hover:bg-white/5 h-10 rounded-xl text-xs"
          >
            {t('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
