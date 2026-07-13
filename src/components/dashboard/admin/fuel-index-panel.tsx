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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
        <ShieldCheck className="w-5 h-5 text-red-500 mt-0.5" />
        <p className="text-xs text-gray-400 font-medium">تحذير : أي تغيير هنا يضبط "الحد الأدنى القاتل" للتسعيرة في الميدان فوراً.</p>
      </div>

       {error && (
        <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400 text-sm font-bold animate-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card className="bg-radar-forest/50 border-emerald-900/30">
        <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-emerald-400"/>
                ضبط مؤشر الوقود الإقليمي
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
              <SelectTrigger className="bg-radar-forest border-emerald-900/50"><SelectValue placeholder="المحافظة" /></SelectTrigger>
              <SelectContent>{jordanGovernorates.map(gov => <SelectItem key={gov} value={gov}>{gov}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedGovernorate}>
              <SelectTrigger className="bg-radar-forest border-emerald-900/50"><SelectValue placeholder="المنطقة" /></SelectTrigger>
              <SelectContent>{districts.map(dist => <SelectItem key={dist} value={dist}>{dist}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input type="number" placeholder="سعر اللتر (دينار)" value={price} onChange={e => setPrice(e.target.value)} className="bg-radar-forest border-emerald-900/50 text-emerald-400 text-lg font-mono" />
          <Button onClick={handleUpdate} disabled={isProcessing || !selectedDistrict || !price} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 font-bold">
            {isProcessing ? <Loader2 className="animate-spin" /> : 'اعتماد المؤشر وتفعيل الدرع'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
