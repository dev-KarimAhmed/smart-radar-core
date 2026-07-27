'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSovereignControls } from '@/hooks/use-sovereign-controls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2, ShieldCheck, Fuel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSovereignErrorMessage } from '@/core/constants/error-dictionary';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const styles = {
  style43_1: "max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500",
  style44_2: "flex items-start gap-3 p-3 bg-red-950/20 border border-red-500/20 rounded-xl",
  style45_3: "w-5 h-5 text-red-500 mt-0.5",
  style46_4: "text-xs text-gray-400 font-medium",
  style50_5: "p-3 bg-red-950/50 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400 text-sm font-bold animate-in slide-in-from-top-2",
  style51_6: "w-5 h-5 shrink-0",
  style56_7: "bg-[#091B09]/50 border-emerald-900/30",
  style58_8: "text-white flex items-center gap-2",
  style59_9: "w-5 h-5 text-emerald-400",
  style63_10: "space-y-5",
  style64_11: "grid grid-cols-2 gap-4",
  style66_12: "bg-[#050D05] border-emerald-900/50",
  style70_13: "bg-[#050D05] border-emerald-900/50",
  style74_14: "bg-[#050D05] border-emerald-900/50 text-emerald-400 text-lg font-mono",
  style75_15: "w-full h-12 bg-emerald-600 hover:bg-emerald-500 font-bold",
  style76_16: "animate-spin",
} as const;


export function FuelIndexPanel() {
  const { toast } = useToast();
  const { updateFuelIndex, isProcessing } = useSovereignControls();

  const [error, setError] = useState<string | null>(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [price, setPrice] = useState('');

  const districts = useMemo(() =>
    selectedGovernorate ? getDistrictsByGovernorate(selectedGovernorate) : [],
    [selectedGovernorate]
  );

  useEffect(() => {
    setSelectedDistrict('');
  }, [selectedGovernorate]);

  const handleUpdate = async () => {
    if (!selectedDistrict || !price || Number(price) <= 0) {
      setError('يرجى اختيار المنطقة وإدخال سعر وقود صالح.');
      return;
    }
    setError(null);
    await updateFuelIndex(selectedDistrict, Number(price));
    setPrice(''); // Reset after submission
  };

  return (
    <div className={styles.style43_1}>
      <div className={styles.style44_2}>
        <ShieldCheck className={styles.style45_3} />
        <p className={styles.style46_4}>تحذير : أي تغيير هنا يضبط "الحد الأدنى القاتل" للتسعيرة في الميدان فوراً.</p>
      </div>

       {error && (
        <div className={styles.style50_5}>
          <AlertTriangle className={styles.style51_6} />
          <p>{error}</p>
        </div>
      )}

      <Card className={styles.style56_7}>
        <CardHeader>
            <CardTitle className={styles.style58_8}>
                <Fuel className={styles.style59_9}/>
                ضبط مؤشر الوقود الإقليمي
            </CardTitle>
        </CardHeader>
        <CardContent className={styles.style63_10}>
          <div className={styles.style64_11}>
            <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
              <SelectTrigger className={styles.style66_12}><SelectValue placeholder="المحافظة" /></SelectTrigger>
              <SelectContent>{jordanGovernorates.map(gov => <SelectItem key={gov} value={gov}>{gov}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedGovernorate}>
              <SelectTrigger className={styles.style70_13}><SelectValue placeholder="المنطقة" /></SelectTrigger>
              <SelectContent>{districts.map(dist => <SelectItem key={dist} value={dist}>{dist}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input type="number" placeholder="سعر اللتر (دينار)" value={price} onChange={e => setPrice(e.target.value)} className={styles.style74_14} />
          <Button onClick={handleUpdate} disabled={isProcessing || !selectedDistrict || !price} className={styles.style75_15}>
            {isProcessing ? <Loader2 className={styles.style76_16} /> : 'اعتماد المؤشر وتفعيل الدرع'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
