import React from 'react';
import { Car, ExternalLink, MapPin, Phone, RefreshCw, User } from 'lucide-react';
import { styles } from './track-styles';
import type { TrackLocationCoords } from './track-types';

interface TrackDetailsSidebarProps {
  isArabic: boolean;
  tripStatus: string;
  captainName: string;
  vehicle: string;
  plate: string;
  destination: string;
  lastUpdated: string;
  coords: TrackLocationCoords | null;
  captainPhone: string;
}

export function TrackDetailsSidebar({
  isArabic,
  tripStatus,
  captainName,
  vehicle,
  plate,
  destination,
  lastUpdated,
  coords,
  captainPhone,
}: TrackDetailsSidebarProps) {
  const mapsUrl = coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : null;
  const safeDialPhone = captainPhone ? captainPhone.replace(/[^+\d]/g, '') : '';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Car className={styles.iconTeal} />
              <span>{isArabic ? 'بيانات الرحلة والمركبة' : 'Trip & Vehicle Details'}</span>
            </h2>
            <span className={styles.cardBadge}>{tripStatus}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}><User className={styles.iconSm} /> {isArabic ? 'الكابتن' : 'Captain'}</span>
            <span className={styles.infoValue}>{captainName}</span>
          </div>

          {vehicle && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}><Car className={styles.iconSm} /> {isArabic ? 'نوع المركبة' : 'Vehicle'}</span>
              <span className={styles.infoValue}>{vehicle}</span>
            </div>
          )}

          {plate && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{isArabic ? '🏷️ رقم اللوحة' : '🏷️ Plate Number'}</span>
              <span className={styles.plateValue}>{plate}</span>
            </div>
          )}

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}><MapPin className={styles.iconPinAmber} /> {isArabic ? 'الوجهة' : 'Destination'}</span>
            <span className={styles.infoValue}>{destination}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}><RefreshCw className={styles.iconEmerald} /> {isArabic ? 'آخر تحديث' : 'Last Update'}</span>
            <span className={styles.lastUpdateValue}>{lastUpdated}</span>
          </div>
        </div>

        <div className={styles.actionGrid}>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapsBtn}>
              <ExternalLink className={styles.iconMd} />
              <span>{isArabic ? 'فتح في خرائط Google' : 'Open in Google Maps'}</span>
            </a>
          )}

          {safeDialPhone ? (
            <a href={`tel:${safeDialPhone}`} className={styles.callCaptainBtn}>
              <Phone className={styles.iconCallEmerald} />
              <span>{isArabic ? 'اتصال بالسائق' : 'Call Captain'}</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (navigator.clipboard) void navigator.clipboard.writeText(window.location.href);
              }}
              className={styles.callCaptainBtn}
            >
              <span>{isArabic ? 'نسخ رابط التتبع' : 'Copy Tracking Link'}</span>
            </button>
          )}
        </div>
      </div>

      <p className={styles.footerNote}>
        {isArabic ? 'نظام رادار بينكم (bynkcom) الملاحي السيادي · جميع الحقوق محفوظة' : 'Bynkcom Sovereign Navigation Radar System · All Rights Reserved'}
      </p>
    </aside>
  );
}
