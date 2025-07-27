'use client';

import React from 'react';
import { MultiTokenTradingInterface } from '@/components/trading/multi-token-interface';

export default function MultiTradingPage() {
  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🪙 Multi-Token Trading
          </h1>
          <p className="text-gray-600">
            Stellar testnetinde 13 farklı token ile otomatik alım-satım
          </p>
        </div>

        <MultiTokenTradingInterface />
      </div>
    </div>
  );
}