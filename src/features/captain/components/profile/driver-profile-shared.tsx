import React from 'react';
import { useTranslations } from 'next-intl';
import { Check, Pencil, X } from 'lucide-react';

export const styles = {
  style244_1: "mx-auto max-w-5xl space-y-5 text-white",
  style245_2: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-6",
  style246_3: "flex items-center gap-3",
  style247_4: "grid h-11 w-11 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10",
  style248_5: "h-5 w-5 animate-spin text-[#14B8A6]",
  style251_6: "text-sm font-black text-[#14B8A6]",
  style254_7: "mt-1 text-sm text-slate-400",
  style261_8: "mt-6 grid gap-3 md:grid-cols-2",
  style263_9: "h-20 animate-pulse rounded-2xl border border-slate-800 bg-white/[0.04]",
  style273_10: "mx-auto max-w-5xl space-y-5 text-white",
  style274_11: "rounded-3xl border border-red-500/25 bg-[#05080f] p-6",
  style275_12: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
  style277_13: "text-sm font-black text-red-200",
  style280_14: "mt-2 text-sm leading-6 text-slate-400",
  style289_15: "rounded-2xl bg-[#14B8A6] px-5 py-3 font-black text-[#06111f]",
  style300_16: "mx-auto max-w-5xl space-y-5 text-white",
  style301_17: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style302_18: "flex flex-col gap-5 md:flex-row md:items-center md:justify-between",
  style304_19: "text-xs font-black text-[#14B8A6]",
  style305_20: "mt-1 text-2xl font-black",
  style306_21: "mt-2 text-sm text-slate-400",
  style307_22: "mt-4 inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3 py-1.5 text-xs font-black text-[#14F5D5]",
  style308_23: "h-3.5 w-3.5 fill-[#14F5D5]",
  style312_24: "relative grid h-32 w-32 place-items-center rounded-full",
  style313_25: "grid h-24 w-24 place-items-center rounded-full bg-[#05080f]",
  style314_26: "text-center",
  style315_27: "mx-auto h-5 w-5 fill-emerald-300 text-emerald-300",
  style316_28: "mt-1 text-2xl font-black",
  style323_29: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style324_30: "flex items-center gap-2 text-emerald-300",
  style325_31: "h-5 w-5",
  style326_32: "font-black",
  style328_33: "mt-4 grid gap-3 md:grid-cols-2",
  style329_34: "space-y-2",
  style330_35: "text-xs font-bold text-slate-400",
  style335_36: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style338_37: "space-y-2",
  style339_38: "text-xs font-bold text-slate-400",
  style344_39: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style347_40: "space-y-2",
  style348_41: "text-xs font-bold text-slate-400",
  style353_42: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style356_43: "space-y-2",
  style357_44: "text-xs font-bold text-slate-400",
  style362_45: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style365_46: "space-y-2",
  style366_47: "text-xs font-bold text-slate-400",
  style371_48: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style374_49: "space-y-2",
  style375_50: "text-xs font-bold text-slate-400",
  style381_51: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style385_52: "mt-4 flex flex-col gap-3 sm:flex-row",
  style390_53: "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f]",
  style392_54: "h-5 w-5",
  style401_55: "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f] disabled:opacity-60",
  style403_56: "h-5 w-5",
  style410_57: "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 font-black text-white hover:bg-white/10 disabled:opacity-60",
  style412_58: "h-5 w-5",
  style421_59: "inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-600/15 px-5 py-4 font-black text-red-100 hover:bg-red-600/25",
  style423_60: "h-5 w-5",
  style430_61: "grid gap-5 lg:grid-cols-2",
  style431_62: "h-5 w-5",
  style439_63: "h-5 w-5",
  style447_64: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style448_65: "flex items-center gap-2 text-emerald-300",
  style449_66: "h-5 w-5",
  style450_67: "font-black",
  style452_68: "mt-2 text-sm leading-6 text-slate-400",
  style460_69: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style461_70: "flex items-center gap-2 text-emerald-300",
  style463_71: "font-black",
  style465_72: "mt-4 space-y-3",
  style472_73: "min-w-0 rounded-2xl border border-slate-800 bg-black/45 px-4 py-3",
  style473_74: "text-xs font-bold text-emerald-400",
  style474_75: "mt-1 truncate font-black text-white",
  editableField: "flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-black/45 px-4 py-3",
  editableFieldBody: "min-w-0 flex-1",
  editPencilButton: "grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20",
  editPencilIcon: "h-3.5 w-3.5",
  editableFieldEditingWrap: "block",
  editableFieldEditingRow: "mb-1.5 flex items-start justify-between gap-2",
  editableFieldEditingLabel: "text-xs font-bold text-emerald-400",
  editableFieldLabelGroup: "min-w-0 flex-1",
  editableFieldHelper: "mt-1 text-[11px] leading-relaxed text-slate-400 font-normal",
  editActionGroup: "flex shrink-0 items-center gap-1.5 pt-0.5",
  editSaveButton: "flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40",
  editCancelButton: "flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-2.5 text-[11px] font-bold text-rose-300 transition hover:bg-rose-500/30 disabled:cursor-wait disabled:opacity-60",
  editSaveIcon: "h-3.5 w-3.5",
  editActionText: "whitespace-nowrap",
  recoveryEmailBlock: "border-t border-white/5 py-3",
  editingInput: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400",
  tariffError: "mt-3 text-sm font-bold text-rose-400",
  tariffSectionHeader: "mt-6 flex items-center gap-2 border-t border-white/5 pt-5 text-emerald-300",
  tariffSectionHint: "mt-2 text-xs leading-5 text-slate-500",
} as const;

export function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className={styles.style460_69}>
      <div className={styles.style461_70}>
        {icon}
        <h2 className={styles.style463_71}>{title}</h2>
      </div>
      <div className={styles.style465_72}>{children}</div>
    </div>
  );
}

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.style472_73}>
      <p className={styles.style473_74}>{label}</p>
      {/* dir="auto" so a Latin value truncates from its own tail instead of the RTL page's. */}
      <p dir="auto" className={styles.style474_75}>{value}</p>
    </div>
  );
}

export function EditableField({
  label,
  helper,
  value,
  originalValue,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  children,
}: {
  label: string;
  helper?: string;
  value: string;
  originalValue: string;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const fieldActions = useTranslations('captainProfile');

  if (isEditing) {
    const isChanged = value !== originalValue;
    return (
      <label
        className={styles.editableFieldEditingWrap}
        onBlur={(event) => {
          if (!isChanged && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
            onCancel();
          }
        }}
      >
        <div className={styles.editableFieldEditingRow}>
          <div className={styles.editableFieldLabelGroup}>
            <span className={styles.editableFieldEditingLabel}>{label}</span>
            {helper ? <p className={styles.editableFieldHelper}>{helper}</p> : null}
          </div>
          {/* Always rendered while editing, disabled until something actually changes.
              Previously the whole group only appeared once the value differed, so opening a
              field showed no save control at all and there was nothing to tell the captain
              their edit needed saving. Both buttons also carried aria-label={label}, which
              announced them identically — "Save" and "Cancel" were indistinguishable to a
              screen reader. */}
          <div className={styles.editActionGroup}>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || !isChanged}
              className={styles.editSaveButton}
            >
              <Check className={styles.editSaveIcon} />
              <span className={styles.editActionText}>{fieldActions('saveChanges')}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className={styles.editCancelButton}
            >
              <X className={styles.editSaveIcon} />
              <span className={styles.editActionText}>{fieldActions('cancelChanges')}</span>
            </button>
          </div>
        </div>
        {children}
      </label>
    );
  }

  return (
    <div className={styles.editableField}>
      <div className={styles.editableFieldBody}>
        <p className={styles.style473_74}>{label}</p>
        {/* dir="auto" so a Latin value truncates from its own tail instead of the RTL page's. */}
        <p dir="auto" className={styles.style474_75}>{value}</p>
        {helper ? <p className={styles.editableFieldHelper}>{helper}</p> : null}
      </div>
      <button type="button" onClick={onEdit} aria-label={label} className={styles.editPencilButton}>
        <Pencil className={styles.editPencilIcon} />
      </button>
    </div>
  );
}
