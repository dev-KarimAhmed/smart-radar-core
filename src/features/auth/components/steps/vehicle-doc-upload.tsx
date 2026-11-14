'use client';

import React from 'react';
import { styles } from './vehicle-step.styles';

interface VehicleDocUploadProps {
  verificationDoc?: string;
  onDocUploaded: (base64: string) => void;
  compressing: boolean;
  setCompressing: (c: boolean) => void;
  tAuto: (key: string) => string;
}

export function VehicleDocUpload({
  verificationDoc,
  onDocUploaded,
  compressing,
  setCompressing,
  tAuto,
}: VehicleDocUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.4);
        onDocUploaded(compressedBase64);
        setCompressing(false);

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.style230_28}>
      <label className={styles.style231_29}>{tAuto('key_dcb56e26')}</label>
      <div className={styles.style234_30}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.style239_31}
        />
        {verificationDoc ? (
          <div className={styles.style242_32}>
            <span className={styles.style243_33}>{tAuto('key_bfaaf7e3')}</span>
            <span className={styles.style244_34}>🛡️</span>
          </div>
        ) : compressing ? (
          <span className={styles.style247_35}>{tAuto('key_724eadce')}</span>
        ) : (
          <div className={styles.style249_36}>
            <span className={styles.style250_37}>{tAuto('key_d174be37')}</span>
            <span className={styles.style251_38}>{tAuto('key_b5d786bc')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
