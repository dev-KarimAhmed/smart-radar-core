const MAX_WIDTH = 250;
const MAX_HEIGHT = 250;
const JPEG_QUALITY = 0.4;

/**
 * Compresses a license/document image client-side (canvas resize + JPEG re-encode)
 * so it can be stored as a small base64 string with zero upload/storage cost.
 */
export function compressLicenseImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('تعذر قراءة الصورة'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
