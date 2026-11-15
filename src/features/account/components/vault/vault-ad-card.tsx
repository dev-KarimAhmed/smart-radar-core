import React from 'react';
import Image from 'next/image';
import { MessageCircle, Phone, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { vaultStyles as styles, USER_VAULT_LIFETIME_MS } from './vault-styles';

export interface VaultAdCardProps {
  ad: any;
  isArabic: boolean;
  tAuto: (key: string, values?: Record<string, any>) => string;
  onDelete: (adId: string) => void;
  onExtend: (adId: string) => void;
  onZeroClickAction: (actionType: 'call' | 'whatsapp', contactNumber: string, title?: string) => void;
}

export function VaultAdCard({
  ad,
  isArabic,
  tAuto,
  onDelete,
  onExtend,
  onZeroClickAction,
}: VaultAdCardProps) {
  const savedTime = ad.savedAtTimestamp || Date.now();
  const daysLeft = Math.ceil(
    (savedTime + USER_VAULT_LIFETIME_MS - Date.now()) / (24 * 60 * 60 * 1000)
  );

  return (
    <div className={styles.style153_20}>
      {/* Visual Cover row */}
      <div className={styles.style156_21}>
        <div className={styles.style157_22}>
          <Image
            src={ad.content?.posterUrl || ad.bannerUrl || 'https://via.placeholder.com/150'}
            alt={ad.content?.title || ad.title || 'Ad'}
            className={styles.style161_23}
            width={64}
            height={64}
            unoptimized
          />
        </div>
        <div className={cn(styles.style165_24, isArabic ? styles.style165_25 : styles.style165_26)}>
          <h4 className={styles.style166_27}>{ad.content?.title || ad.title}</h4>
          <p className={styles.style169_28}>{ad.content?.description || ad.description}</p>
          <div className={styles.style172_29}>
            <span className={styles.style173_30}>
              {tAuto('vaultTab_area')}: {ad.targetDistrict || tAuto('vaultTab_unknownArea')}
            </span>
          </div>
        </div>

        <button
          onClick={() => onDelete(ad.id)}
          className={styles.style181_31}
          title={tAuto('vaultTab_deleteTitle')}
        >
          <Trash2 className={styles.style184_32} />
        </button>
      </div>

      {/* Expiration warning and storage controls */}
      <div className={styles.style189_33}>
        <span className={styles.style190_34}>
          {tAuto('vaultTab_savedFor')}:{' '}
          <strong className={daysLeft > 7 ? styles.style191_35 : styles.style191_36}>
            {daysLeft > 0 ? tAuto('vaultTab_daysLeft', { days: daysLeft }) : tAuto('vaultTab_expiresToday')}
          </strong>
        </span>
        <button onClick={() => onExtend(ad.id)} className={styles.style197_37}>
          {tAuto('vaultTab_extend')}
        </button>
      </div>

      {/* Direct Connect Buttons */}
      <div className={styles.style204_38}>
        <button
          onClick={() =>
            onZeroClickAction(
              'whatsapp',
              ad.whatsapp || ad.advertiserData?.whatsapp || '962790000000',
              ad.content?.title || ad.title
            )
          }
          className={styles.style213_39}
        >
          <MessageCircle className={styles.style215_40} />
          <span>{tAuto('vaultTab_whatsapp')}</span>
        </button>

        <button
          onClick={() =>
            onZeroClickAction(
              'call',
              ad.phone || ad.advertiserData?.phone || '0790000000',
              ad.content?.title || ad.title
            )
          }
          className={styles.style227_41}
        >
          <Phone className={styles.style229_42} />
          <span>{tAuto('vaultTab_call')}</span>
        </button>
      </div>
    </div>
  );
}
