
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AdvertiserPortal } from './dashboard/advertiser-portal';
import {
  LogOut,
  PanelRight,
  RadioTower,
  Settings,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Megaphone,
  Shield
} from 'lucide-react';
import { AppSidebar } from './app-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRiderOperations } from '@/hooks/use-rider-operations';
import { DriverPricingCard } from './dashboard/driver-pricing-card';
import { trackSovereignError } from '@/lib/error-tracker';

function PulseIndicator() {
  const { user } = useAuth();
  const driverOps = useDriverOperations();
  const { pulseData, loadingPulse } = driverOps || { pulseData: [], loadingPulse: false };
  
  if (loadingPulse) return <Loader2 className="w-5 h-5 animate-spin text-white/50" />;
  if (!user?.district || !pulseData) return null;

  const currentPulse = pulseData.find(p => p.id === user.district);
  const trend = currentPulse?.trend || 'balanced';
  
  const pulseMap = {
      'high_demand': { icon: TrendingUp, text: 'طلب عالٍ', className: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/50' },
      'high_supply': { icon: TrendingDown, text: 'منافسة شديدة', className: 'text-red-400 bg-red-950/50 border-red-500/50' },
      'balanced': { icon: Minus, text: 'سوق مستقر', className: 'text-gray-400 bg-gray-950/50 border-gray-500/50' },
  };

  const pulseInfo = pulseMap[trend as 'high_demand' | 'high_supply' | 'balanced'] || pulseMap['balanced'];

  const Icon = pulseInfo.icon;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold", pulseInfo.className)}>
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{pulseInfo.text}</span>
    </div>
  );
}

function RiderCabin() {
    const riderOps = useRiderOperations();
    const { tripStatus, openRequestModal } = riderOps || { tripStatus: 'idle' };
    const cabinStyle = 'bg-background/95 border-b border-white/10';

    return (
        <div className={cn("flex h-16 items-center justify-between px-2 md:px-4 transition-all duration-500", cabinStyle)}>
            <div className="w-10"></div>
            {tripStatus === 'idle' && openRequestModal && (
                <Button onClick={openRequestModal} className="animate-pulse-neon bg-primary hover:bg-primary/80 text-white px-6 h-10 rounded-full font-bold tracking-wide">
                    <span className="mr-2 hidden sm:inline">إطلاق نداء</span>
                    اطلب مركبة
                </Button>
            )}
            <div className="w-10"></div>
        </div>
    );
}

function DriverCabin() {
    const driverOps = useDriverOperations();
    const { driverStatus, toggleDriverStatus, toggleRequestList } = driverOps || { driverStatus: 'idle' };
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const getCabinStyle = () => {
        switch (driverStatus) {
            case 'active': return 'bg-primary text-primary-foreground border-b border-primary/50 shadow-lg shadow-primary/20';
            case 'busy':
            case 'rating': return 'bg-[hsl(var(--busy))] text-black border-b border-[hsl(var(--busy))]/50 shadow-lg';
            default: return 'bg-background/95 border-b border-white/10';
        }
    };

    const isDriverBusy = driverStatus === 'busy' || driverStatus === 'rating';

    return (
        <>
            <div className={cn("flex h-16 items-center justify-between px-2 md:px-4 transition-all duration-500", getCabinStyle())}>
                <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-full backdrop-blur-sm">
                    {toggleDriverStatus && (
                        <Switch
                            id="driver-status-switch"
                            checked={driverStatus === 'active'}
                            onCheckedChange={(checked) => toggleDriverStatus(checked ? 'active' : 'idle')}
                            disabled={isDriverBusy}
                            className="data-[state=checked]:bg-white"
                        />
                    )}
                    <Label htmlFor="driver-status-switch" className="font-bold text-sm px-2 cursor-pointer">
                        {driverStatus === 'active' ? 'نشط' : (isDriverBusy ? 'بمهمة' : 'خامل')}
                    </Label>
                </div>

                <PulseIndicator />

                <div className="flex items-center gap-1 sm:gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-10 px-3 text-xs font-black bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#00ffcc] border border-[#10b981]/20 rounded-full flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-captain-dashboard'))}
                    >
                        <Shield className="h-4 w-4 text-[#00ffcc] animate-pulse" />
                        <span className="inline">قمرة العمليات 🛡️</span>
                    </Button>
                    {toggleRequestList && (
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-black/20" onClick={() => toggleRequestList(true)}>
                            <RadioTower className="h-5 w-5" />
                            <span className="sr-only">Open Radar</span>
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-black/20" onClick={() => setIsSettingsOpen(true)}>
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Open Settings</span>
                    </Button>
                </div>
            </div>
            {isSettingsOpen && (
                <DriverPricingCard
                    mode="setup"
                    onConfirm={() => setIsSettingsOpen(false)}
                    onCancel={() => setIsSettingsOpen(false)}
                />
            )}
        </>
    );
}

function SovereignCabin() {
    const { isCaptain, isPassenger } = useAuth();
    if (isCaptain) return <DriverCabin />;
    if (isPassenger) return <RiderCabin />;
    return null;
}

export function AppHeader() {
  const { user, logout, isCaptain, isPassenger } = useAuth();
  const { toast } = useToast();
  const [isAdvertiserOpen, setIsAdvertiserOpen] = useState(false);
  
  const getInitials = (name: string = '') => {
    const names = name.split(' ');
    if (names.length > 1) return (names[0][0] || '') + (names[1][0] || '');
    return name.substring(0, 2);
  };
  
  const getRoleName = (role: string | undefined) => {
    switch (role) {
      case 'rider': return 'مسافر';
      case 'driver': return 'كابتن سيادي';
      case 'admin': return 'قيادة عليا';
      case 'advertiser': return 'معلن سيادي';
      default: return '';
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col shadow-xl">
      
      <header className="flex h-16 items-center justify-between px-4 bg-black border-b border-white/10">
        
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10">
              <PanelRight className="h-6 w-6" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 sm:max-w-xs border-white/10 bg-black/95 w-[288px]">
            <VisuallyHidden>
              <SheetTitle>القائمة</SheetTitle>
              <SheetDescription>قائمة التحكم</SheetDescription>
            </VisuallyHidden>
            <AppSidebar />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-4">
             <Button 
               size="icon" 
               variant="ghost" 
               className="h-10 w-10 text-white/70 hover:bg-white/10 relative"
               onClick={() => toast({ title: 'النبضات والتنبيهات الملاحة', description: 'لا توجد نبضات أو رسائل سيادية جديدة حالياً.' })}
             >
               <Bell className="h-5 w-5" />
             </Button>
           <UserMenu user={user} logout={logout} getInitials={getInitials} getRoleName={getRoleName} />
        </div>
      </header>

      {user && (isCaptain || isPassenger) && <SovereignCabin />}
    </div>
  );
}

function UserMenu({ user, logout, getInitials, getRoleName }: any) {
  const { toast } = useToast();
  const [isAdvertiserOpen, setIsAdvertiserOpen] = useState(false);

  const handleOpenAdvertiser = () => {
    if (user?.role !== 'advertiser') {
      trackSovereignError(new Error('SECURITY_BREACH: Unauthorized attempt to open advertiser portal as non-advertiser'), { role: user?.role, userId: user?.uid });
      return;
    }
    if (!user.commercialRegister || !user.companyName || !user.adLicense) {
      toast({
        variant: 'destructive',
        title: 'البيانات التجارية غير مكتملة ⚠️',
        description: 'يرجى مراجعة إدارة السيادة وإكمال التسجيل المهني لتفعيل البوابة.'
      });
      return;
    }
    setIsAdvertiserOpen(true);
  };

  useEffect(() => {
    const handleOpen = () => {
      handleOpenAdvertiser();
    };
    window.addEventListener('open-advertiser-portal', handleOpen);
    return () => window.removeEventListener('open-advertiser-portal', handleOpen);
  }, [user]);

  if (!user) return <div className="w-10 h-10" />;
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 shadow-sm hover:scale-105 transition-transform">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarFallback className="bg-black/50 text-white font-bold">{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-58 bg-black/95 text-white border-white/10 text-right" align="end" forceMount>
          <DropdownMenuLabel className="font-normal text-right">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none capitalize">{user?.name}</p>
              <p className="text-xs leading-none text-white/50">{getRoleName(user?.role)}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          
          {user?.role === 'advertiser' && (
            <>
              <DropdownMenuItem 
                onClick={handleOpenAdvertiser}
                className="hover:bg-emerald-950/40 focus:bg-emerald-950/40 cursor-pointer flex items-center justify-between gap-2 p-2"
              >
                <Megaphone className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-xs text-emerald-400">بوابة المعلن السيادية 📣</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
            </>
          )}
          
          <DropdownMenuItem onClick={logout} className="text-destructive hover:bg-destructive/20 focus:bg-destructive/20 cursor-pointer flex items-center justify-between p-2">
            <LogOut className="h-4 w-4" /> <span>تسجيل الخروج</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {user?.role === 'advertiser' && (
        <Dialog open={isAdvertiserOpen} onOpenChange={setIsAdvertiserOpen}>
          <DialogContent className="max-w-xl max-h-[85vh] bg-black border border-emerald-500/30 p-0 text-white overflow-y-auto rounded-3xl">
            <VisuallyHidden>
              <DialogTitle>بوابة المعلن</DialogTitle>
            </VisuallyHidden>
            <AdvertiserPortal onClose={() => setIsAdvertiserOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
