import React from 'react';

export default function NonceWatchLogo({ className = 'w-10 h-10', glowing = true }) {
  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="nwNavyGradComp" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="50%" stopColor="#1C2541" />
            <stop offset="100%" stopColor="#0A1128" />
          </linearGradient>

          <linearGradient id="nwPulseGradComp" x1="10" y1="60" x2="110" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#2563EB" />
            <stop offset="75%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <linearGradient id="nwRingGradComp" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.3" />
          </linearGradient>

          {glowing && (
            <filter id="nwGlowComp" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>

        {/* Base Container */}
        <rect
          x="6"
          y="6"
          width="108"
          height="108"
          rx="26"
          fill="url(#nwNavyGradComp)"
          stroke="url(#nwRingGradComp)"
          strokeWidth="2.5"
        />

        {/* Radar & Sequence Grid */}
        <circle cx="60" cy="60" r="42" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="60" cy="60" r="26" stroke="#334155" strokeWidth="1" opacity="0.4" />
        <line x1="60" y1="18" x2="60" y2="102" stroke="#334155" strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />
        <line x1="18" y1="60" x2="102" y2="60" stroke="#334155" strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />

        {/* Nonce Pillars */}
        <rect x="28" y="32" width="7" height="56" rx="3.5" fill="#FFFFFF" />
        <rect x="85" y="32" width="7" height="56" rx="3.5" fill="#FFFFFF" />

        {/* Diagonal Oscilloscope Nonce Pulse */}
        <path
          d="M 32 36 L 50 56 L 57 44 L 63 76 L 70 64 L 88 84"
          stroke="url(#nwPulseGradComp)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={glowing ? 'url(#nwGlowComp)' : undefined}
        />

        {/* Sequence Verification Nodes */}
        <circle cx="32" cy="36" r="4.5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="57" cy="44" r="3.5" fill="#60A5FA" />
        <circle cx="63" cy="76" r="3.5" fill="#38BDF8" />
        <circle cx="88" cy="84" r="4.5" fill="#22C55E" stroke="#FFFFFF" strokeWidth="1.5" />

        {/* Center Reticle */}
        <circle cx="60" cy="60" r="2.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
