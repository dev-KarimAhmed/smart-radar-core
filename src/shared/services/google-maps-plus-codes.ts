export interface ParsedMapLocation {
  lat: number;
  lng: number;
}

export function isValidLocation(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export const PLUS_CODE_ALPHABET = '23456789CFGHJMPQRVWX';

export function decodePlusCode(code: string): ParsedMapLocation | null {
  const clean = code.trim().toUpperCase().replace('+', '');
  let lat = -90;
  let lng = -180;
  let latRes = 20;
  let lngRes = 20;
  const len = Math.min(clean.length, 10);
  for (let i = 0; i < len; i += 2) {
    const r = PLUS_CODE_ALPHABET.indexOf(clean[i]);
    const c = PLUS_CODE_ALPHABET.indexOf(clean[i + 1]);
    if (r === -1 || c === -1) return null;
    lat += r * latRes;
    lng += c * lngRes;
    latRes /= 20;
    lngRes /= 20;
  }
  const resultLat = lat + latRes * 10;
  const resultLng = lng + lngRes * 10;
  return isValidLocation(resultLat, resultLng) ? { lat: resultLat, lng: resultLng } : null;
}

export function recoverNearestPlusCode(
  shortCode: string,
  refLat: number,
  refLng: number
): ParsedMapLocation | null {
  const clean = shortCode.trim().toUpperCase();
  const plusIdx = clean.indexOf('+');
  if (plusIdx === -1) return null;
  if (plusIdx >= 8) {
    return decodePlusCode(clean);
  }
  const prefixLen = 8 - plusIdx;
  if (prefixLen !== 4 && prefixLen !== 6 && prefixLen !== 2) return null;

  const step = prefixLen === 4 ? 1.0 : prefixLen === 6 ? 0.05 : 20.0;
  let best: ParsedMapLocation | null = null;
  let bestDist = Infinity;

  for (let dLat = -1; dLat <= 1; dLat++) {
    for (let dLng = -1; dLng <= 1; dLng++) {
      const candLat = refLat + dLat * step;
      const candLng = refLng + dLng * step;
      let cLat = candLat + 90;
      let cLng = candLng + 180;
      let prefix = '';
      let gLat = 20;
      let gLng = 20;
      for (let i = 0; i < prefixLen / 2; i++) {
        const lDigit = Math.floor(cLat / gLat);
        const lnDigit = Math.floor(cLng / gLng);
        cLat -= lDigit * gLat;
        cLng -= lnDigit * gLng;
        if (lDigit < 0 || lDigit >= 20 || lnDigit < 0 || lnDigit >= 20) continue;
        prefix += PLUS_CODE_ALPHABET[lDigit] + PLUS_CODE_ALPHABET[lnDigit];
        gLat /= 20;
        gLng /= 20;
      }
      if (prefix.length !== prefixLen) continue;
      const full = prefix + clean;
      const decoded = decodePlusCode(full);
      if (!decoded) continue;
      const dist = (decoded.lat - refLat) ** 2 + (decoded.lng - refLng) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = decoded;
      }
    }
  }
  return best;
}

export function extractPlusCode(text: string): string | null {
  const match = text.match(/\b([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4})\b/i);
  return match ? match[1].toUpperCase() : null;
}

export function resolvePlusCodeLocation(
  codeOrText: string,
  referenceLocation?: ParsedMapLocation
): ParsedMapLocation | null {
  const code = extractPlusCode(codeOrText) || codeOrText.trim().toUpperCase();
  const plusIdx = code.indexOf('+');
  if (plusIdx === -1) return null;
  if (plusIdx >= 8) {
    return decodePlusCode(code);
  }
  if (referenceLocation && isValidLocation(referenceLocation.lat, referenceLocation.lng)) {
    return recoverNearestPlusCode(code, referenceLocation.lat, referenceLocation.lng);
  }
  return null;
}
