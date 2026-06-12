import React from 'react';

interface RadarLogoProps {
  className?: string;
  glow?: boolean;
}

export function RadarLogo({ className = "h-12 w-12", glow = true }: RadarLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${glow ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.45)]' : ''}`}>
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Concentric Radar Rings */}
        <circle cx="50" cy="50" r="45" stroke="#00f3ff" strokeOpacity="0.1" strokeWidth="1" />
        <circle cx="50" cy="50" r="36" stroke="#10b981" strokeOpacity="0.2" strokeWidth="0.75" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="26" stroke="#00f3ff" strokeOpacity="0.25" strokeWidth="1" />
        <circle cx="50" cy="50" r="15" stroke="#10b981" strokeOpacity="0.3" strokeWidth="0.75" />

        {/* Dynamic ECG/Heartbeat Pulse Line (Sovereign Nabd) */}
        <path 
          d="M15,50 L35,50 L41,20 L47,75 L52,38 L56,58 L61,50 L85,50" 
          stroke="#00f3ff" 
          strokeWidth="3.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />

        {/* Animated Radar Sweep Line */}
        <line x1="50" y1="50" x2="81" y2="19" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round">
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 50 50" 
            to="360 50 50" 
            dur="3.2s" 
            repeatCount="indefinite" 
          />
        </line>

        {/* Target Detections (Concentric blinking pulse indicators) */}
        <circle cx="28" cy="34" r="2.5" fill="#10b981" opacity="0.6">
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="72" cy="68" r="3" fill="#00f3ff" opacity="0.75">
          <animate attributeName="opacity" values="0.1;1;0.1" dur="1.6s" repeatCount="indefinite" />
        </circle>

        {/* Central Core Signal Anchor with Ping effect */}
        <circle cx="50" cy="50" r="5" fill="#00f3ff" fillOpacity="0.4" />
        <circle cx="50" cy="50" r="2.5" fill="#00f3ff" />
      </svg>
    </div>
  );
}

export default RadarLogo;
