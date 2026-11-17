import React from 'react';

// Official BOT Chain Logo (sourced directly from https://www.botchain.ai/logo.png)
const OFFICIAL_BOTCHAIN_LOGO_DATA_URL = 'data:image/png;base64,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';

export default function BotChainLogo({ className = 'w-5 h-5', alt = 'BOT Chain Official Logo' }) {
  return (
    <img
      src="/botchain-logo.png"
      onError={(e) => {
        // Fallback to inline base64 if static serving differs
        if (e.currentTarget.src !== OFFICIAL_BOTCHAIN_LOGO_DATA_URL) {
          e.currentTarget.src = OFFICIAL_BOTCHAIN_LOGO_DATA_URL;
        }
      }}
      alt={alt}
      className={`inline-block object-contain flex-shrink-0 ${className}`}
      loading="eager"
    />
  );
}
