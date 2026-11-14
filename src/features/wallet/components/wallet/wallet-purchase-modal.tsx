import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { styles } from './wallet-styles';
import { WalletCopy } from './wallet-types';

interface WalletPurchaseModalProps {
  purchasingPackage: 'basic' | 'pro' | null;
  loading: boolean;
  onConfirm: (pkg: 'basic' | 'pro') => void;
  onCancel: () => void;
  copy: Pick<WalletCopy, 'confirmPackagePurchase' | 'confirmPackageDescription' | 'confirmPurchase' | 'back'>;
}

export function WalletPurchaseModal({
  purchasingPackage,
  loading,
  onConfirm,
  onCancel,
  copy,
}: WalletPurchaseModalProps) {
  return (
    <AnimatePresence>
      {purchasingPackage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={styles.style210_51}
        >
          <div className={styles.style212_52}>
            <h3 className={styles.style213_53}>
              <CheckCircle2 className={styles.style214_54} />
              {copy.confirmPackagePurchase}
            </h3>
            <p className={styles.style217_55}>
              {copy.confirmPackageDescription}
            </p>

            <div className={styles.style221_56}>
              <Button
                onClick={() => onConfirm(purchasingPackage)}
                disabled={loading}
                className={styles.style225_57}
              >
                {loading ? <RefreshCw className={styles.style227_58} /> : copy.confirmPurchase}
              </Button>
              <Button
                onClick={onCancel}
                disabled={loading}
                variant="outline"
                className={styles.style233_59}
              >
                {copy.back}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
