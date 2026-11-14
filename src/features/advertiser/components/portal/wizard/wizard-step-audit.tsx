import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';
import { WizardCopyType } from './wizard-copy';

interface WizardStepAuditProps {
  t: WizardCopyType;
  auditProgress: number;
  auditLogs: string[];
  isSimulatingAudit: boolean;
  auditApproved: boolean;
  district: string;
  onReset: () => void;
}

export function WizardStepAudit({
  t,
  auditProgress,
  auditLogs,
  isSimulatingAudit,
  auditApproved,
  district,
  onReset,
}: WizardStepAuditProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h4 className="text-xs font-black text-white">
              {t.auditEngineHeader}
            </h4>
          </div>
          <span className="text-xs font-mono font-black text-emerald-400">
            {auditProgress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${auditProgress}%` }}
          />
        </div>

        {/* Audit Logs */}
        <div className="rounded-xl border border-white/5 bg-black/80 p-3 space-y-1.5 font-mono text-[11px]">
          {auditLogs.map((log, index) => (
            <p key={index} className="text-emerald-300/90 leading-relaxed">
              {log}
            </p>
          ))}
          {isSimulatingAudit && (
            <div className="flex items-center gap-2 text-slate-400 pt-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span>{t.auditRunning}</span>
            </div>
          )}
        </div>

        {auditApproved && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-center space-y-2">
            <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-black text-white">
              {t.auditSuccessTitle}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.auditSuccessDesc(district)}
            </p>
            <div className="pt-2">
              <Button
                type="button"
                onClick={onReset}
                className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs"
              >
                {t.backToDashboard}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
