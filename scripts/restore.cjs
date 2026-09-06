const fs = require('fs');

const dTxPath = 'src/features/captain/hooks/use-driver-transactions.ts';
let dTx = fs.readFileSync(dTxPath, 'utf8');

if (!dTx.includes('useTranslations')) {
  dTx = dTx.replace(
    'import type { Trip, User } from \'@/core/types\';',
    'import type { Trip, User } from \'@/core/types\';\nimport { useTranslations } from \'next-intl\';'
  );
}
if (!dTx.includes('const t = useTranslations(\'transactions\');')) {
  dTx = dTx.replace(
    '  const { toast } = useToast();',
    '  const { toast } = useToast();\n  const t = useTranslations(\'transactions\');'
  );
}

dTx = dTx.replace(
  '              toast({\n                title: \'تم إلغاء الرحلة\',\n                description: \'قام الراكب بإلغاء هذه الرحلة.\',\n              });',
  '              toast({\n                title: t(\'cancelledTitle\'),\n                description: t(\'cancelledByRiderDesc\'),\n              });'
);

dTx = dTx.replace(
  '        toast({\n          title: \'تم إلغاء الرحلة\',\n          description: \'تم إلغاء الرحلة بنجاح.\',\n        });',
  '        toast({\n          title: t(\'cancelledTitle\'),\n          description: t(\'cancelledSuccessfullyDesc\'),\n        });'
);

const target1 = `    return () => {
      void channel.unsubscribe();
    };
  }, [activeRequest?.id, cleanUpAndReset]);`;

const replacement1 = `    const intervalId = setInterval(async () => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('id', activeRequest.id)
        .maybeSingle();

      if (error || !data) return;

      const status = String(data.status || '').toUpperCase();
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        if (status === 'CANCELLED') {
          toast({
            title: t('cancelledTitle'),
            description: t('cancelledByRiderDesc'),
          });
        }
        cleanUpAndReset();
      }
    }, 10000);

    return () => {
      clearInterval(intervalId);
      void channel.unsubscribe();
    };
  }, [activeRequest?.id, cleanUpAndReset, t, toast]);`;

dTx = dTx.replace(target1, replacement1);
fs.writeFileSync(dTxPath, dTx);

const dRadarPath = 'src/features/captain/hooks/use-driver-radar.ts';
let dRadar = fs.readFileSync(dRadarPath, 'utf8');

const targetRadarVars = `  const [radarLockMessage, setRadarLockMessage] = useState('');`;
const replacementRadarVars = `  const [radarLockMessage, setRadarLockMessage] = useState('');
  const previousRequestIdsRef = useRef<Set<string>>(new Set());`;

dRadar = dRadar.replace(targetRadarVars, replacementRadarVars);

const targetRadarSound = `    const formatted = data.map(mapRideRequestToTrip).filter((t): t is Trip => t !== null);
    setRawRequests(formatted);
    setRadarLockMessage('');`;

const replacementRadarSound = `    const formatted = data.map(mapRideRequestToTrip).filter((t): t is Trip => t !== null);
    setRawRequests(formatted);
    setRadarLockMessage('');

    // Play notification sound for new requests
    const newRequestIds = new Set(formatted.map(r => r.id));
    let hasNewRequest = false;
    newRequestIds.forEach(id => {
      if (!previousRequestIdsRef.current.has(id)) {
        hasNewRequest = true;
      }
    });

    if (hasNewRequest && formatted.length > 0) {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.warn('Could not play notification sound:', e));
      } catch (e) {
        // Ignore errors in environments where Audio is not supported
      }
    }
    previousRequestIdsRef.current = newRequestIds;`;

dRadar = dRadar.replace(targetRadarSound, replacementRadarSound);
fs.writeFileSync(dRadarPath, dRadar);
console.log('Done restoring');
