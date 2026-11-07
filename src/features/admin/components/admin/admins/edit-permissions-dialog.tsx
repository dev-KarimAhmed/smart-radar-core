'use client';

import React from 'react';
import { Sliders, Crown, Shield, Check, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ADMIN_SECTORS, ALL_SECTOR_IDS, AdminSectorId } from '@/features/admin/lib/admin-permissions';
import type { AdminProfile } from './admins-types';

interface EditPermissionsDialogProps {
  editPermissionsTarget: AdminProfile | null;
  onClose: () => void;
  editRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
  setEditRank: (rank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN') => void;
  editSectors: AdminSectorId[];
  setEditSectors: React.Dispatch<React.SetStateAction<AdminSectorId[]>>;
  savingPermissions: boolean;
  onSave: () => Promise<void>;
  direction: 'rtl' | 'ltr';
  isArabic: boolean;
  t: (key: string) => string;
}

export function EditPermissionsDialog({
  editPermissionsTarget,
  onClose,
  editRank,
  setEditRank,
  editSectors,
  setEditSectors,
  savingPermissions,
  onSave,
  direction,
  isArabic,
  t,
}: EditPermissionsDialogProps) {
  return (
    <Dialog open={!!editPermissionsTarget} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg bg-[#0B0F19] border border-teal-500/30 text-white shadow-2xl rounded-2xl p-6"
        dir={direction}
      >
        <DialogHeader className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
          <div className="flex items-center gap-2 text-teal-400">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
              <Sliders className="w-5 h-5 text-teal-400" />
            </div>
            <DialogTitle className="text-base font-black text-white">
              {isArabic ? 'تعديل صلاحيات القطاعات والرتبة' : 'Edit Sector Permissions & Rank'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-xs">
            {isArabic
              ? 'تحكم في أزرار القطاعات المصرح لهذا المشرف بالوصول إليها وإدارتها في لوحة التحكم.'
              : 'Control which sector buttons this supervisor is authorized to access and manage.'}
          </DialogDescription>
        </DialogHeader>

        {editPermissionsTarget && (
          <div className="space-y-4 my-2">
            {/* Target Admin Card */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white text-sm">{editPermissionsTarget.full_name}</p>
                <p className="font-mono text-slate-400 text-[11px]" dir="ltr">
                  {editPermissionsTarget.phone}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  editPermissionsTarget.admin_rank === 'GENERAL_ADMIN'
                    ? 'border-amber-500/40 text-amber-300'
                    : 'border-cyan-500/40 text-cyan-300'
                }
              >
                {editPermissionsTarget.admin_rank === 'GENERAL_ADMIN' ? t('generalAdmin') : t('assistantAdmin')}
              </Badge>
            </div>

            {/* Rank Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">{t('adminRankLabel')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditRank('ASSISTANT_ADMIN')}
                  className={cn(
                    "p-2.5 rounded-xl border text-start transition flex items-center gap-2 cursor-pointer",
                    editRank === 'ASSISTANT_ADMIN'
                      ? "bg-cyan-500/15 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/40"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-xs font-bold">{t('assistantAdmin')}</p>
                    <p className="text-[10px] text-slate-400">{isArabic ? 'صلاحيات قطاعية محددة' : 'Custom sectors'}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditRank('GENERAL_ADMIN');
                    setEditSectors([...ALL_SECTOR_IDS]);
                  }}
                  className={cn(
                    "p-2.5 rounded-xl border text-start transition flex items-center gap-2 cursor-pointer",
                    editRank === 'GENERAL_ADMIN'
                      ? "bg-amber-500/15 border-amber-500 text-amber-200 ring-1 ring-amber-500/40"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold">{t('generalAdmin')}</p>
                    <p className="text-[10px] text-slate-400">{isArabic ? 'كامل القطاعات' : 'Full access'}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Sector Permissions Checklist */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300">
                  {isArabic ? 'صلاحيات أزرار القطاعات:' : 'Sector Permissions:'}
                </label>
                {editRank === 'ASSISTANT_ADMIN' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditSectors([...ALL_SECTOR_IDS])}
                      className="text-[10px] text-teal-400 hover:text-teal-300 font-bold transition cursor-pointer"
                    >
                      {isArabic ? 'تحديد الكل' : 'Select All'}
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setEditSectors([])}
                      className="text-[10px] text-slate-400 hover:text-slate-300 font-bold transition cursor-pointer"
                    >
                      {isArabic ? 'إلغاء التحديد' : 'Deselect All'}
                    </button>
                  </div>
                )}
              </div>

              {editRank === 'GENERAL_ADMIN' ? (
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {isArabic
                      ? 'المشرف العام يملك وصولاً سيادياً كاملاً لجميع القطاعات تلقائياً.'
                      : 'General Admin has full sovereign access to all sectors automatically.'}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {ADMIN_SECTORS.map((sector) => {
                    const isChecked = editSectors.includes(sector.id as AdminSectorId);
                    return (
                      <button
                        key={sector.id}
                        type="button"
                        onClick={() => {
                          setEditSectors((prev) =>
                            isChecked
                              ? prev.filter((id) => id !== sector.id)
                              : [...prev, sector.id as AdminSectorId]
                          );
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-start transition flex items-center justify-between gap-2 cursor-pointer",
                          isChecked
                            ? "bg-teal-500/15 border-teal-500/50 text-white shadow-sm ring-1 ring-teal-500/30"
                            : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                              isChecked
                                ? "bg-[#14B8A6] border-[#14B8A6] text-[#0B0F19]"
                                : "border-white/20 bg-black/40"
                            )}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-bold">
                            {isArabic ? sector.labelAr : sector.labelEn}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-mono",
                            isChecked ? "border-teal-500/40 text-teal-300" : "border-white/10 text-slate-500"
                          )}
                        >
                          {sector.id}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:justify-start pt-3 border-t border-white/10">
          <Button
            type="button"
            onClick={onSave}
            disabled={savingPermissions || !editPermissionsTarget}
            className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm h-10 rounded-xl transition-all shadow-lg shadow-teal-950/40 cursor-pointer"
          >
            {savingPermissions ? (
              <>
                <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                {t('saving')}
              </>
            ) : (
              <>
                <ShieldCheck className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                <span>{isArabic ? 'حفظ الصلاحيات' : 'Save Permissions'}</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={savingPermissions}
            className="border-white/10 text-slate-300 hover:bg-white/5 h-10 rounded-xl text-xs cursor-pointer"
          >
            {t('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
