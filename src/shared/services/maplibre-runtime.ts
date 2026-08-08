import maplibregl from 'maplibre-gl';

export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
export const RTL_TEXT_PLUGIN_URL = 'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js';

// Keep the map usable when GPS permission is denied / no location prop is
// supplied yet. The active Egypt-first flow uses Cairo as its local visual
// fallback until a live fix arrives.
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
