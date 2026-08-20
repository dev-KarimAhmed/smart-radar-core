import maplibregl from 'maplibre-gl';

export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
export const RTL_TEXT_PLUGIN_URL = 'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js';

// Absolute last-resort map center — used only when GPS, the account's own
// country default, and any district/profile anchor are all unavailable.
// Callers should prefer a country-aware center (see
// `getCountryDefaultCenter` in `@/shared/hooks/use-country-config`) before
// falling all the way back to this.
export const DEFAULT_MAP_CENTER = { lat: 30.0444, lng: 31.2357 };

let rtlPluginRequested = false;

export function ensureRtlTextPlugin() {
  if (rtlPluginRequested || typeof window === 'undefined') return;
  rtlPluginRequested = true;

  try {
    const status = maplibregl.getRTLTextPluginStatus?.();
    if (status === 'loaded' || status === 'loading') return;
    maplibregl.setRTLTextPlugin(RTL_TEXT_PLUGIN_URL, true);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.warn('MapLibre RTL text plugin was not loaded:', error);
  }
}
