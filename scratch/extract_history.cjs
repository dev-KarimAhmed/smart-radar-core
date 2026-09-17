const fs = require('fs');

const content = fs.readFileSync('src/features/account/components/history-tab.tsx', 'utf8');
const lines = content.split('\n');

let out = `import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { supabase } from '@/lib/supabase-client';

export const styles = {
`;

let inStyles = false;
let inUtils = false;
let stylesEnd = 0;
let utilsEnd = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const styles = {')) {
    inStyles = true;
    continue;
  }
  if (inStyles) {
    if (lines[i].includes('} as const;')) {
      inStyles = false;
      stylesEnd = i;
      out += '} as const;\n\n';
    } else {
      out += lines[i] + '\n';
    }
  }
  
  if (lines[i].includes('interface HistoricalTrip {')) {
    inUtils = true;
  }
  if (inUtils) {
    out += lines[i] + '\n';
    if (lines[i].includes('const CAPTAIN_CRITERIA_LABELS_EN: Record<string, string> = {')) {
      inUtils = false;
      for (let j = i + 1; j < i + 10; j++) {
        out += lines[j] + '\n';
        if (lines[j].includes('};')) {
          utilsEnd = j;
          break;
        }
      }
    }
  }
}

out = out.replace(/function /g, 'export function ')
  .replace(/const HISTORY_TTL_MS/g, 'export const HISTORY_TTL_MS')
  .replace(/const UNAVAILABLE_AR/g, 'export const UNAVAILABLE_AR')
  .replace(/const LOCAL_RIDER_AR/g, 'export const LOCAL_RIDER_AR')
  .replace(/const LOCAL_LOCATION_AR/g, 'export const LOCAL_LOCATION_AR')
  .replace(/const VEHICLE_CRITERIA_LABELS/g, 'export const VEHICLE_CRITERIA_LABELS')
  .replace(/const CAPTAIN_CRITERIA_LABELS/g, 'export const CAPTAIN_CRITERIA_LABELS')
  .replace(/export function HistorySkeleton/g, 'function HistorySkeleton');

fs.mkdirSync('src/features/account/components/history-tab', { recursive: true });
fs.writeFileSync('src/features/account/components/history-tab/history-shared.ts', out);
console.log('Created history-shared.ts with ' + out.length + ' chars');
